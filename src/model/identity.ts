/**
 * Model component that resolves the signed-in user via the backend: YAC's
 * `GET /me` returns the user after its own claim mapping (`auth.oidc.jwt`), so
 * VAYS needs no knowledge of the OIDC provider's claims. Fetched once per login
 * from the first configured backend and kept next to the token.
 */

import { jwtDecode } from 'jwt-decode';
import { getTokenFromStorage, userIsLoggedIn } from '../session/login/tokenHandling';
import iLocalStorage from '../session/persistent/LocalStorage';
import { sendRequest } from '../utils/authRequest';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { getConfig } from './config';

/** Dispatched on `window` once a freshly fetched identity has been stored. */
export const IDENTITY_EVENT = 'identity-changed';

let pending: Nullable<Promise<void>> = null;

/** The `sub` of the stored token: identifies the session's user. */
function tokenSubject(): string | undefined {
  try {
    return jwtDecode(getTokenFromStorage()?.replace(/^Bearer /, '') ?? '').sub;
  } catch {
    return undefined;
  }
}

/**
 * Make sure the identity of the signed-in user is loaded. A no-op when signed
 * out or already loaded; concurrent calls share one request. On failure the
 * user getters keep falling back to the token claims and the next call (e.g.
 * the next page load) retries.
 */
export function loadIdentity(): Promise<void> {
  if (!userIsLoggedIn() || iLocalStorage.getIdentity()) return Promise.resolve();
  pending ??= fetchIdentity().finally(() => {
    pending = null;
  });
  return pending;
}

async function fetchIdentity(): Promise<void> {
  const backend = (await getConfig())?.backends?.[0];
  if (!backend?.url) return;

  const subject = tokenSubject();
  const resp = await sendRequest(joinUrl(backend.url, '/me'));
  if (resp?.status !== 200) return;

  let body: unknown;
  try {
    body = await resp.json();
  } catch {
    return;
  }
  const { name, full_name, email } = (body ?? {}) as Record<string, unknown>;
  if (typeof name !== 'string' || typeof full_name !== 'string' || typeof email !== 'string') {
    return;
  }
  // A logout or another user's login may have happened while the request was
  // in flight: never attach this identity to a different (or no) user. (A
  // token renewal in the meantime is fine: same user.)
  if (!userIsLoggedIn() || subject === undefined || tokenSubject() !== subject) return;

  iLocalStorage.setIdentity({ name, full_name, email });
  window.dispatchEvent(new Event(IDENTITY_EVENT));
}
