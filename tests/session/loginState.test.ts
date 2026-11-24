/**
 * The PKCE verifier and nonce of a login in progress are kept per tab and
 * removed once the code has been exchanged.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AppConfig } from '../../src/utils/types/config';

const authorizationCodeGrant = vi.fn();
vi.mock('openid-client', () => ({
  discovery: vi.fn(async () => ({})),
  None: vi.fn(),
  randomPKCECodeVerifier: () => 'the-verifier',
  calculatePKCECodeChallenge: async () => 'the-challenge',
  randomNonce: () => 'the-nonce',
  buildAuthorizationUrl: () => new URL('https://idp.example.com/auth'),
  authorizationCodeGrant: (...args: unknown[]) => authorizationCodeGrant(...args),
}));
vi.mock('../../src/model/identity', () => ({ loadIdentity: vi.fn() }));
vi.mock('../../src/utils/logger', () => ({ logError: vi.fn() }));

const { startAuthentication, finalizeAuthentication } =
  await import('../../src/session/login/loginProcess');

const CONF = {
  oidcConf: { server: 'https://idp.example.com/.well-known/openid-configuration', clientID: 'c' },
  backends: [],
} as unknown as AppConfig;
const originalLocation = window.location;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  authorizationCodeGrant.mockReset();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      href: 'https://vays.example.com/',
      host: 'vays.example.com',
      replace: vi.fn(),
    },
  });
});
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

it('keeps the login state in the session storage and removes it after the exchange', async () => {
  await startAuthentication(CONF);
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(1);

  authorizationCodeGrant.mockResolvedValueOnce({});
  await finalizeAuthentication(CONF);
  expect(authorizationCodeGrant.mock.calls[0][2]).toMatchObject({
    pkceCodeVerifier: 'the-verifier',
    expectedNonce: 'the-nonce',
  });
  expect(sessionStorage.length).toBe(0);
});

it('fails without a login in progress', async () => {
  expect(await finalizeAuthentication(CONF)).toBe(false);
  expect(authorizationCodeGrant).not.toHaveBeenCalled();
});
