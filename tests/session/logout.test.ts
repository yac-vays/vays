/**
 * Logout: the local session always ends; revoking the refresh token and the
 * provider's end-session redirect (`oidcConf.endSession`) are best effort.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const discovery = vi.fn();
const tokenRevocation = vi.fn();
const buildEndSessionUrl = vi.fn();
const None = vi.fn(() => 'none-auth');

vi.mock('openid-client', () => ({
  discovery: (...args: unknown[]) => discovery(...args),
  tokenRevocation: (...args: unknown[]) => tokenRevocation(...args),
  buildEndSessionUrl: (...args: unknown[]) => buildEndSessionUrl(...args),
  None: () => None(),
}));

const oidcConf: { server: string; clientID: string; endSession?: boolean } = {
  server: 'https://idp.example.com/.well-known/openid-configuration',
  clientID: 'vays',
};
vi.mock('../../src/model/config', () => {
  const conf = { oidcConf, backends: [] };
  return { getConfig: async () => conf, getCachedConfig: () => conf };
});
vi.mock('../../src/utils/logger', () => ({ logError: vi.fn() }));

const { logOut } = await import('../../src/session/login/loginProcess');
const iLocalStorage = (await import('../../src/session/persistent/LocalStorage')).default;

let metadata: Record<string, string>;
const replace = vi.fn();
const originalLocation = window.location;

function signIn(withRefreshToken = true) {
  iLocalStorage.setToken('Bearer the.id.token');
  iLocalStorage.setIsLoggedIn(true);
  if (withRefreshToken) iLocalStorage.setRefreshToken('the-refresh-token');
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  metadata = {
    revocation_endpoint: 'https://idp.example.com/revoke',
    end_session_endpoint: 'https://idp.example.com/logout',
  };
  oidcConf.endSession = undefined;
  discovery.mockReset().mockImplementation(async () => ({ serverMetadata: () => metadata }));
  tokenRevocation.mockReset().mockResolvedValue(undefined);
  buildEndSessionUrl
    .mockReset()
    .mockImplementation(
      (_c, p: Record<string, string>) =>
        new URL('https://idp.example.com/logout?' + new URLSearchParams(p).toString()),
    );
  replace.mockReset();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { host: 'vays.example.com', replace },
  });
});
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  vi.useRealTimers();
});

/** `logOut` guards against double clicks per page load: use a fresh module. */
async function freshLogOut() {
  return (await import('../../src/session/login/loginProcess')).logOut;
}

describe('logOut', () => {
  it('is a public client: discovery without a client secret', async () => {
    signIn();
    await logOut();
    expect(discovery).toHaveBeenCalledWith(expect.any(URL), 'vays', undefined, 'none-auth');
  });

  it('revokes the refresh token, clears the session and reloads the home page', async () => {
    signIn();
    await (
      await freshLogOut()
    )();
    expect(tokenRevocation).toHaveBeenCalledWith(expect.anything(), 'the-refresh-token', {
      token_type_hint: 'refresh_token',
    });
    expect(iLocalStorage.getToken()).toBeUndefined();
    expect(iLocalStorage.getRefreshToken()).toBeUndefined();
    expect(buildEndSessionUrl).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledExactlyOnceWith('/');
  });

  it('does not ask the provider anything without a refresh token', async () => {
    signIn(false);
    await (
      await freshLogOut()
    )();
    expect(discovery).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledExactlyOnceWith('/');
  });

  it('skips the revocation if the provider has no revocation endpoint', async () => {
    delete metadata.revocation_endpoint;
    signIn();
    await (
      await freshLogOut()
    )();
    expect(tokenRevocation).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledExactlyOnceWith('/');
  });

  it.each([
    ['discovery fails', () => discovery.mockRejectedValue(new Error('down'))],
    ['revocation fails', () => tokenRevocation.mockRejectedValue(new Error('nope'))],
  ])('still logs out locally when %s', async (_name, arrange) => {
    arrange();
    signIn();
    await (
      await freshLogOut()
    )();
    expect(iLocalStorage.getToken()).toBeUndefined();
    expect(replace).toHaveBeenCalledExactlyOnceWith('/');
  });

  it('does not wait for a hanging provider', async () => {
    vi.useFakeTimers();
    discovery.mockImplementation(() => new Promise(() => {}));
    signIn();
    const done = (await freshLogOut())();
    // the session is gone right away, not only after the timeout
    expect(iLocalStorage.getToken()).toBeUndefined();
    expect(replace).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    await done;
    expect(replace).toHaveBeenCalledExactlyOnceWith('/');
  });

  describe('with oidcConf.endSession', () => {
    beforeEach(() => {
      oidcConf.endSession = true;
    });

    it('redirects to the end-session endpoint after the revocation', async () => {
      signIn();
      await (
        await freshLogOut()
      )();
      expect(tokenRevocation).toHaveBeenCalled();
      expect(buildEndSessionUrl).toHaveBeenCalledWith(expect.anything(), {
        post_logout_redirect_uri: 'https://vays.example.com/',
        id_token_hint: 'the.id.token',
      });
      expect(iLocalStorage.getToken()).toBeUndefined();
      expect(replace).toHaveBeenCalledTimes(1);
      const target = new URL(replace.mock.calls[0][0]);
      expect(target.origin + target.pathname).toBe('https://idp.example.com/logout');
      expect(target.searchParams.get('id_token_hint')).toBe('the.id.token');
    });

    it('still redirects there when the revocation hangs', async () => {
      vi.useFakeTimers();
      tokenRevocation.mockImplementation(() => new Promise(() => {}));
      signIn();
      const done = (await freshLogOut())();
      await vi.advanceTimersByTimeAsync(3000);
      await done;
      expect(String(replace.mock.calls[0][0])).toContain('https://idp.example.com/logout');
    });

    it('falls back to the plain reload if the provider has no end-session endpoint', async () => {
      delete metadata.end_session_endpoint;
      signIn();
      await (
        await freshLogOut()
      )();
      expect(buildEndSessionUrl).not.toHaveBeenCalled();
      expect(replace).toHaveBeenCalledExactlyOnceWith('/');
    });
  });
});
