/**
 * The user shown in the UI is the backend-resolved identity (YAC `GET /me`):
 *  - loadIdentity fetches /me from the first backend once, stores it and
 *    announces it; the getters then prefer it over the token claims;
 *  - concurrent loads share one request, loaded/signed-out is a no-op;
 *  - failures and responses that arrive for an outdated session store nothing,
 *    the getters keep falling back to the token claims.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const BACKEND = 'https://yac.example.com';

vi.mock('../../src/controller/global/notification', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));
vi.mock('../../src/model/config', () => {
  const conf = { backends: [{ name: 'a', title: 'A', icon: '', url: BACKEND }] };
  return { getConfig: async () => conf, getCachedConfig: () => conf };
});

const { IDENTITY_EVENT, loadIdentity } = await import('../../src/model/identity');
const { getUserEmail, getUserLogin, getUserName } =
  await import('../../src/session/login/tokenHandling');
const iLocalStorage = (await import('../../src/session/persistent/LocalStorage')).default;

/** Unsigned JWT (jwt-decode does not verify signatures), valid for an hour. */
function jwt(claims: object): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `Bearer ${btoa(JSON.stringify({ alg: 'none' }))}.${btoa(JSON.stringify({ exp, ...claims }))}.sig`;
}

const ME = {
  name: 'mamanuel',
  full_name: 'Manuel Example',
  email: 'manuel@example.com',
  token: {},
};

function meResponse(status: number = 200, body: object = ME): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function signIn(claims: object = { sub: 'opaque-sub', name: 'mamanuel' }) {
  iLocalStorage.setToken(jwt(claims));
  iLocalStorage.setIsLoggedIn(true);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  fetchMock = vi.fn(async () => meResponse());
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

describe('loadIdentity', () => {
  it('fetches /me from the first backend and the getters prefer it', async () => {
    signIn();
    const announced = vi.fn();
    window.addEventListener(IDENTITY_EVENT, announced);

    // Before: guessed from the claims (no username claim -> opaque sub).
    expect(getUserLogin()).toBe('opaque-sub');

    await loadIdentity();
    window.removeEventListener(IDENTITY_EVENT, announced);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`${BACKEND}/me`);
    expect(announced).toHaveBeenCalledTimes(1);
    expect(getUserLogin()).toBe('mamanuel');
    expect(getUserName()).toBe('Manuel Example');
    expect(getUserEmail()).toBe('manuel@example.com');
    // Only the three identity fields are kept, not the token claims.
    expect(iLocalStorage.getIdentity()).toEqual({
      name: 'mamanuel',
      full_name: 'Manuel Example',
      email: 'manuel@example.com',
    });
  });

  it('shares one request between concurrent calls and is a no-op once loaded', async () => {
    signIn();
    await Promise.all([loadIdentity(), loadIdentity(), loadIdentity()]);
    await loadIdentity();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does nothing when signed out', async () => {
    await loadIdentity();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUserName()).toBe('Not Logged In');
  });

  it('keeps the claim fallback when /me fails, and retries on the next call', async () => {
    signIn({ sub: 'opaque-sub', givenName: 'Manuel', surname: 'Claims', mail: 'm@claims' });
    fetchMock.mockResolvedValueOnce(meResponse(500, { detail: 'boom' }));

    await loadIdentity();
    expect(iLocalStorage.getIdentity()).toBeUndefined();
    expect(getUserName()).toBe('Manuel Claims');
    expect(getUserEmail()).toBe('m@claims');

    await loadIdentity();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getUserName()).toBe('Manuel Example');
  });

  it('ignores a malformed /me body', async () => {
    signIn();
    fetchMock.mockResolvedValueOnce(meResponse(200, { name: 42 }));
    await loadIdentity();
    expect(iLocalStorage.getIdentity()).toBeUndefined();
  });

  it('never attaches an in-flight answer to a different session', async () => {
    signIn();
    let answer!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (answer = resolve)));

    const loading = loadIdentity();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // Someone else signs in on this browser while /me is in flight.
    signIn({ sub: 'other' });
    answer(meResponse());
    await loading;

    expect(iLocalStorage.getIdentity()).toBeUndefined();
  });

  it('keeps an in-flight answer across a token renewal (same user)', async () => {
    signIn();
    let answer!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (answer = resolve)));

    const loading = loadIdentity();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // The id-token is renewed meanwhile: new token, same `sub`.
    signIn({ sub: 'opaque-sub', name: 'mamanuel', renewed: true });
    answer(meResponse());
    await loading;

    expect(iLocalStorage.getIdentity()?.name).toBe('mamanuel');
  });

  it('is wiped on logout together with the token', async () => {
    signIn();
    await loadIdentity();
    iLocalStorage.clearSession();
    expect(iLocalStorage.getIdentity()).toBeUndefined();
  });
});
