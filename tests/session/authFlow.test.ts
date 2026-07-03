/**
 * Auth-failure handling:
 *  - not signed in => backend rejections route silently into the login flow
 *    (the user is already on the login page; a "Not authenticated" toast —
 *    FastAPI's fixed wording for requests without credentials, sent as 403 —
 *    tells them nothing new);
 *  - signed in + token expired => exactly ONE friendly re-login toast for a
 *    whole burst of parallel 401s, sign-out event, redirect to the login page;
 *  - signed in + locally-valid token rejected by the backend => a warning
 *    toast (clock skew / revocation must not be swallowed), no logout;
 *  - sendRequest short-circuits doomed requests once the token is expired.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const showError = vi.fn();
const navigateToURL = vi.fn();

vi.mock('../../src/controller/global/notification', () => ({
  showError: (...args: unknown[]) => showError(...args),
  showSuccess: vi.fn(),
}));
vi.mock('../../src/controller/global/url', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  navigateToURL: (...args: unknown[]) => navigateToURL(...args),
}));

const { handleYacResponse } = await import('../../src/model/utils/handleYacResponse');
const { handleAuthFailed } = await import('../../src/session/login/tokenHandling');
const { sendRequest } = await import('../../src/utils/authRequest');
const iLocalStorage = (await import('../../src/session/persistent/LocalStorage')).default;

/** Unsigned JWT with the given `exp` (jwt-decode does not verify signatures). */
function jwt(exp: number): string {
  return `${btoa(JSON.stringify({ alg: 'none' }))}.${btoa(JSON.stringify({ exp }))}.sig`;
}

function yacResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const CTX = { errorTitle: 'Cannot fetch data' };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  showError.mockClear();
  navigateToURL.mockClear();
});
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('not signed in', () => {
  it("routes FastAPI's 403 'Not authenticated' silently into the login flow", async () => {
    iLocalStorage.setIsLoggedIn(false);
    const result = await handleYacResponse(yacResponse(403, { detail: 'Not authenticated' }), CTX);
    expect(result.kind).toBe('auth-expired');
    expect(showError).not.toHaveBeenCalled();
    expect(navigateToURL).toHaveBeenCalledWith('/');
  });

  it('handles a 401 silently as well', async () => {
    iLocalStorage.setIsLoggedIn(false);
    const result = await handleYacResponse(yacResponse(401, { title: 'Login Failed' }), CTX);
    expect(result.kind).toBe('auth-expired');
    expect(showError).not.toHaveBeenCalled();
  });
});

describe('signed in, token expired', () => {
  it('shows ONE friendly toast for a burst of 401s, signs out and redirects', async () => {
    iLocalStorage.setIsLoggedIn(true);
    iLocalStorage.setToken(jwt(1)); // expired in 1970
    const signOut = vi.fn();
    window.addEventListener('sign-out', signOut);

    // Three parallel requests all coming back 401:
    handleAuthFailed('Login Failed', 'Supplied authentication could not be validated');
    handleAuthFailed('Login Failed', 'Supplied authentication could not be validated');
    handleAuthFailed('Login Failed', 'Supplied authentication could not be validated');

    expect(showError).toHaveBeenCalledTimes(1);
    expect(showError).toHaveBeenCalledWith('Please sign in again.', 'Your session has expired.');
    expect(iLocalStorage.isLoggedIn()).toBe(false);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(navigateToURL).toHaveBeenCalledWith('/');
    window.removeEventListener('sign-out', signOut);
  });

  it('remembers the visited URL for the post-login redirect', () => {
    iLocalStorage.setIsLoggedIn(true);
    iLocalStorage.setToken(jwt(1));
    handleAuthFailed();
    expect(sessionStorage.getItem('eMostRecentURL')).toBeTruthy();
  });
});

describe('signed in, locally valid token rejected by the backend', () => {
  it('warns (clock skew / revocation) without signing out', () => {
    iLocalStorage.setIsLoggedIn(true);
    iLocalStorage.setToken(jwt(Math.floor(Date.now() / 1000) + 3600)); // valid 1h
    handleAuthFailed('Login Failed', 'Backend rejected the token');
    expect(showError).toHaveBeenCalledTimes(1);
    expect(showError).toHaveBeenCalledWith('Login Failed', 'Backend rejected the token');
    expect(iLocalStorage.isLoggedIn()).toBe(true);
    expect(navigateToURL).not.toHaveBeenCalled();
  });
});

describe('signed in, missing permission (real 403)', () => {
  it('shows the permission toast and stays signed in', async () => {
    iLocalStorage.setIsLoggedIn(true);
    iLocalStorage.setToken(jwt(Math.floor(Date.now() / 1000) + 3600));
    const result = await handleYacResponse(
      yacResponse(403, { title: 'Forbidden', message: 'Operation edit is not allowed' }),
      { ...CTX, backendTitle: 'Test' },
    );
    expect(result.kind).toBe('forbidden');
    expect(showError).toHaveBeenCalledTimes(1);
    expect(iLocalStorage.isLoggedIn()).toBe(true);
  });
});

describe('sendRequest with an expired token', () => {
  it('answers a synthetic 401 without hitting the network', async () => {
    iLocalStorage.setIsLoggedIn(true);
    iLocalStorage.setToken(jwt(1));
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const resp = await sendRequest('https://yac.example.com/entity/host', 'GET');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(resp?.status).toBe(401);
    expect((await resp?.json())?.title).toBe('Please sign in again.');
  });
});
