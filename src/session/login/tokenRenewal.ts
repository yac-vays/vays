/**
 * Keeps the (possibly very short-lived) id-token fresh with the refresh token
 * from the login, so the user is not sent back to the login every few minutes.
 *
 * The backends validate id-tokens, so a renewal only counts if the token
 * endpoint answers with a new `id_token` (the access token may be opaque and is
 * never used). Whenever renewal is impossible (no refresh token, no `id_token`
 * in the answer, refresh token expired or revoked) the session ends when the
 * id-token expires, exactly as without renewal.
 *
 * All tabs share the tokens in localStorage; a Web Lock makes sure only one of
 * them renews at a time — with refresh-token rotation, two tabs redeeming the
 * same refresh token could get the whole session revoked.
 */

import { jwtDecode } from 'jwt-decode';
import * as client from 'openid-client';
import { getConfig } from '../../model/config';
import { logError } from '../../utils/logger';
import { Nullable } from '../../utils/types/typeUtils';
import iLocalStorage from '../persistent/LocalStorage';
import { discoverClient } from './oidcClient';
import { getTokenFromStorage, userIsLoggedIn } from './tokenHandling';

/** Renew this many seconds before expiry (at most a quarter of the lifetime). */
const RENEW_BEFORE_S = 60;
/** Wait before retrying after a renewal failed for a transient reason. */
const RETRY_MS = 30_000;
const LOCK_NAME = 'vays-token-renewal';
/** OAuth error codes (RFC 6749 5.2 / 4.1.2.1) worth retrying. */
const TRANSIENT_OAUTH_ERRORS = ['server_error', 'temporarily_unavailable'];
/** setTimeout fires immediately for delays beyond a signed 32-bit int. */
const MAX_DELAY_MS = 2 ** 31 - 1;

let discovery: Nullable<Promise<client.Configuration>> = null;
let pending: Nullable<Promise<boolean>> = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;

/** Seconds until the token should be renewed (negative: overdue). */
function secondsUntilRenewal(token: string | undefined): number {
  if (!token) return -Infinity;
  try {
    const { exp, iat } = jwtDecode(token.replace(/^Bearer /, ''));
    if (!exp) return Infinity;
    const lifetime = iat ? exp - iat : RENEW_BEFORE_S * 4;
    const margin = Math.min(RENEW_BEFORE_S, lifetime / 4);
    return exp - margin - Date.now() / 1000;
  } catch {
    return -Infinity;
  }
}

function getDiscovery(): Promise<client.Configuration> {
  if (discovery == null) {
    discovery = getConfig().then((conf) => {
      if (conf == null) throw new Error('No app config');
      return discoverClient(conf);
    });
    // Do not cache a failed discovery (e.g. offline): retry next time.
    discovery.catch(() => (discovery = null));
  }
  return discovery;
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(LOCK_NAME, fn);
  }
  return fn();
}

async function doRenew(): Promise<boolean> {
  if (!userIsLoggedIn()) return false;
  // Another tab may have renewed while this one waited for the lock.
  if (secondsUntilRenewal(getTokenFromStorage()) > 0) return true;

  const refreshToken = iLocalStorage.getRefreshToken();
  if (!refreshToken) return false;

  let tokens: client.TokenEndpointResponse;
  try {
    tokens = await client.refreshTokenGrant(await getDiscovery(), refreshToken);
  } catch (e) {
    if (e instanceof client.ResponseBodyError) {
      logError(
        `Token renewal rejected by the OIDC provider: ${e.error} (${e.error_description ?? ''})`,
        'renewToken',
      );
      // The provider's answer will not change on a retry (invalid_grant:
      // refresh token expired/revoked/rotated away; invalid_scope or
      // invalid_client: client misconfiguration): stop trying. Only its own
      // transient errors are retried.
      if (!TRANSIENT_OAUTH_ERRORS.includes(e.error)) iLocalStorage.clearRefreshToken();
    } else {
      // Network failure, provider unreachable, ...: retried later.
      logError(`Token renewal failed: ${e}`, 'renewToken');
    }
    return false;
  }

  // Signed out (or in again) while the request was in flight.
  if (!userIsLoggedIn() || iLocalStorage.getRefreshToken() !== refreshToken) return false;

  if (tokens.refresh_token) iLocalStorage.setRefreshToken(tokens.refresh_token);
  if (!tokens.id_token) {
    logError(
      'Token renewal returned no id_token: renewal is not possible with this OIDC client.',
      'renewToken',
    );
    iLocalStorage.clearRefreshToken();
    return false;
  }
  iLocalStorage.setToken(`Bearer ${tokens.id_token}`);
  return true;
}

/**
 * Renew the id-token if it is due. Resolves to whether a usable token is in
 * storage afterwards. Concurrent calls share one renewal.
 */
export function renewToken(): Promise<boolean> {
  pending ??= withLock(doRenew).finally(() => {
    pending = null;
  });
  return pending;
}

function schedule(minDelayMs: number = 0) {
  clearTimeout(timer);
  if (!userIsLoggedIn() || !iLocalStorage.getRefreshToken()) return;

  const delayMs = Math.min(
    MAX_DELAY_MS,
    Math.max(minDelayMs, secondsUntilRenewal(getTokenFromStorage()) * 1000),
  );
  timer = setTimeout(async () => {
    const ok = await renewToken();
    schedule(ok ? 0 : RETRY_MS);
  }, delayMs);
}

/**
 * Start renewing in the background: shortly before each expiry, after a
 * sign-in, when another tab stored a new token and when the tab becomes
 * visible again (background tabs' timers are throttled). Idempotent.
 */
export function startTokenRenewal() {
  if (!started) {
    started = true;
    window.addEventListener('sign-in', () => schedule());
    window.addEventListener('storage', (e) => {
      if (e.key === 'token' || e.key === 'refreshToken') schedule();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') schedule();
    });
  }
  schedule();
}
