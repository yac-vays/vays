/**
 * Renewal of the short-lived id-token via the refresh token:
 *  - an expired token is renewed before a backend request goes out, the
 *    request then carries the new token (and the rotated refresh token is
 *    kept);
 *  - concurrent requests share one renewal; a token another tab already
 *    renewed is not renewed again;
 *  - no refresh token / no id_token in the answer / invalid_grant => no
 *    renewal, the usual "session expired" 401; any other provider
 *    rejection stops renewing too, transient errors keep the refresh token
 *    for a retry;
 *  - an answer arriving after logout is dropped;
 *  - the background timer renews shortly before expiry.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const BACKEND = 'https://yac.example.com';

const refreshTokenGrant = vi.fn();
class ResponseBodyError extends Error {
  constructor(
    public error: string,
    public error_description?: string,
  ) {
    super(error);
  }
}

vi.mock('openid-client', () => ({
  discovery: vi.fn(async () => ({})),
  refreshTokenGrant: (...args: unknown[]) => refreshTokenGrant(...args),
  ResponseBodyError,
}));
vi.mock('../../src/controller/global/notification', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));
vi.mock('../../src/model/config', () => {
  const conf = {
    oidcConf: { server: 'https://idp.example.com/.well-known/openid-configuration', clientID: 'c' },
    backends: [{ name: 'a', title: 'A', icon: '', url: BACKEND }],
  };
  return { getConfig: async () => conf, getCachedConfig: () => conf };
});

const { renewToken, startTokenRenewal } = await import('../../src/session/login/tokenRenewal');
const { sendRequest } = await import('../../src/utils/authRequest');
const iLocalStorage = (await import('../../src/session/persistent/LocalStorage')).default;

/** Unsigned id-token (jwt-decode does not verify), issued now, expiring in `ttl` s. */
function idToken(ttl: number, tag: string = 'x'): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload = { sub: 'user', iat, exp: iat + ttl, tag };
  return `${btoa(JSON.stringify({ alg: 'none' }))}.${btoa(JSON.stringify(payload))}.sig`;
}

function signIn(ttl: number, refreshToken: string | null = 'rt-1') {
  iLocalStorage.setToken(`Bearer ${idToken(ttl, 'old')}`);
  iLocalStorage.setIsLoggedIn(true);
  if (refreshToken) iLocalStorage.setRefreshToken(refreshToken);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  refreshTokenGrant.mockReset();
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

function sentAuthorization(): string | null {
  return new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization');
}

describe('renewal before a request', () => {
  it('renews an expired token and sends the request with the new one', async () => {
    signIn(-10);
    const fresh = idToken(300, 'new');
    refreshTokenGrant.mockResolvedValueOnce({ id_token: fresh, refresh_token: 'rt-2' });

    const resp = await sendRequest(`${BACKEND}/entity`);

    expect(refreshTokenGrant).toHaveBeenCalledTimes(1);
    expect(refreshTokenGrant.mock.calls[0][1]).toBe('rt-1');
    expect(resp?.status).toBe(200);
    expect(sentAuthorization()).toBe(`Bearer ${fresh}`);
    expect(iLocalStorage.getRefreshToken()).toBe('rt-2');
  });

  it('keeps the refresh token if the provider does not rotate it', async () => {
    signIn(-10);
    refreshTokenGrant.mockResolvedValueOnce({ id_token: idToken(300) });
    await renewToken();
    expect(iLocalStorage.getRefreshToken()).toBe('rt-1');
  });

  it('shares one renewal between parallel requests', async () => {
    signIn(-10);
    refreshTokenGrant.mockResolvedValueOnce({ id_token: idToken(300) });
    await Promise.all([1, 2, 3].map(() => sendRequest(`${BACKEND}/entity`)));
    expect(refreshTokenGrant).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not renew a token that is not due (e.g. another tab renewed it)', async () => {
    signIn(300);
    expect(await renewToken()).toBe(true);
    expect(refreshTokenGrant).not.toHaveBeenCalled();
  });
});

describe('renewal impossible => the session ends as before', () => {
  it('without a refresh token', async () => {
    signIn(-10, null);
    const resp = await sendRequest(`${BACKEND}/entity`);
    expect(refreshTokenGrant).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(resp?.status).toBe(401);
  });

  it('when the answer carries no id_token (and stops trying)', async () => {
    signIn(-10);
    refreshTokenGrant.mockResolvedValueOnce({ access_token: 'opaque', refresh_token: 'rt-2' });
    const resp = await sendRequest(`${BACKEND}/entity`);
    expect(resp?.status).toBe(401);
    expect(iLocalStorage.getRefreshToken()).toBeUndefined();
  });

  it('drops a dead refresh token (invalid_grant)', async () => {
    signIn(-10);
    refreshTokenGrant.mockRejectedValueOnce(new ResponseBodyError('invalid_grant'));
    expect(await renewToken()).toBe(false);
    expect(iLocalStorage.getRefreshToken()).toBeUndefined();
  });

  it('stops on other provider rejections (e.g. invalid_scope)', async () => {
    signIn(-10);
    refreshTokenGrant.mockRejectedValueOnce(
      new ResponseBodyError('invalid_scope', 'Unknown request scope detected.'),
    );
    expect(await renewToken()).toBe(false);
    expect(iLocalStorage.getRefreshToken()).toBeUndefined();
  });

  it("keeps the refresh token for a retry on the provider's transient errors", async () => {
    signIn(-10);
    refreshTokenGrant.mockRejectedValueOnce(new ResponseBodyError('temporarily_unavailable'));
    expect(await renewToken()).toBe(false);
    expect(iLocalStorage.getRefreshToken()).toBe('rt-1');
  });

  it('keeps the refresh token for a retry on transient errors', async () => {
    signIn(-10);
    refreshTokenGrant.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await renewToken()).toBe(false);
    expect(iLocalStorage.getRefreshToken()).toBe('rt-1');
  });

  it('drops an answer that arrives after logout', async () => {
    signIn(-10);
    let answer!: (v: object) => void;
    refreshTokenGrant.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));

    const renewing = renewToken();
    await vi.waitFor(() => expect(refreshTokenGrant).toHaveBeenCalledTimes(1));
    iLocalStorage.clearSession();
    answer({ id_token: idToken(300), refresh_token: 'rt-2' });

    expect(await renewing).toBe(false);
    expect(iLocalStorage.getToken()).toBeUndefined();
    expect(iLocalStorage.getRefreshToken()).toBeUndefined();
  });
});

describe('background renewal', () => {
  it('renews a 5-minute token one minute before it expires', async () => {
    vi.useFakeTimers();
    signIn(300);
    const fresh = idToken(600, 'new');
    refreshTokenGrant.mockResolvedValueOnce({ id_token: fresh });

    startTokenRenewal();
    await vi.advanceTimersByTimeAsync(235_000);
    expect(refreshTokenGrant).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(refreshTokenGrant).toHaveBeenCalledTimes(1);
    expect(iLocalStorage.getToken()).toBe(`Bearer ${fresh}`);
  });
});
