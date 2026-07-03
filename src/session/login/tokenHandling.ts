import { jwtDecode } from 'jwt-decode';
import { showError } from '../../controller/global/notification';
import { navigateToURL } from '../../controller/global/url';
import { Nullable } from '../../utils/types/typeUtils';
import iLocalStorage from '../persistent/LocalStorage';
import iSessionStorage from '../storage/SessionStorage';

export function getTokenFromStorage() {
  return iLocalStorage.getToken();
}

export function userIsLoggedIn() {
  return iLocalStorage.isLoggedIn();
}

export function setUserLoggedIn(v: boolean) {
  iLocalStorage.setIsLoggedIn(v);
}

/**
 * Handle an HTTP 401 from a backend: the session is expired or invalid, so
 * route the user back into the login flow. (A 403 — valid session but missing
 * permission — must *not* end up here; it is reported as an error toast by the
 * model layer instead.)
 */
export function handleAuthFailed(
  title: string | undefined = undefined,
  msg: undefined | string = undefined,
) {
  const url = new URL(window.location.href);
  // note that pathname of window.location does not include the query string or the index...
  const localPath = window.location.href.startsWith('/')
    ? window.location.href
    : url.href.substring(url.origin.length, url.href.length);
  if (localPath.startsWith('/oauth2-redirect?code')) {
    // This must be either an authentication bug or misconfiguration on the oidc side.
    showError(
      'Internal Error: Code AUTH-SUCC-01',
      'Not all services are able to validate the token. Please report this to your admin.',
    );
    return;
  }
  // Remember where the user wanted to go, for the post-login redirect.
  if (iSessionStorage.getMostRecentURL() === undefined) {
    iSessionStorage.setMostRecentURL(localPath);
  }

  if (!userIsLoggedIn()) {
    // Never signed in — or a concurrent 401 already performed the sign-out
    // transition below. The user is on (or being routed to) the login page,
    // so a "not authenticated" toast would tell them nothing new.
    navigateToURL('/');
    return;
  }

  if (isStoredTokenExpired()) {
    // The signed-in -> expired transition: sign out and explain ONCE. Any
    // other in-flight 401s land in the silent branch above afterwards, so a
    // burst of parallel requests cannot stack up toasts.
    setUserLoggedIn(false);
    window.dispatchEvent(new Event('sign-out'));
    showError('Please sign in again.', 'Your session has expired.');
    navigateToURL('/');
    return;
  }

  // The token still looks valid locally, yet the backend rejected it (401):
  // clock skew, revocation or a backend misconfiguration. Do not silently
  // swallow it — tell the user what happened.
  showError(
    title ?? 'Authentication failed',
    msg ?? 'The backend rejected the session token. Try signing out and in again.',
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTokenClaims(): any {
  if (!userIsLoggedIn()) return {};
  try {
    return jwtDecode(getTokenFromStorage() ?? '');
  } catch {
    return {};
  }
}

export function getUserName(): string {
  if (!userIsLoggedIn()) return 'Not Logged In';

  const { givenName, surname, name, mail } = getTokenClaims();

  if (givenName && surname) {
    return givenName + ' ' + surname;
  } else if (mail) {
    return mail;
  }
  return name;
}

/** The user's email address from the token, or '' if none. */
export function getUserEmail(): string {
  const { mail, email } = getTokenClaims();
  return mail ?? email ?? '';
}

/** The user's login / short username from the token, or '' if none. */
export function getUserLogin(): string {
  const c = getTokenClaims();
  return c.username ?? c.preferred_username ?? c.uid ?? c.sub ?? '';
}

function tokenExpired(token: Nullable<string>): boolean {
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    if (!exp) return false;
    const currentTime = new Date().getTime() / 1000;
    return currentTime > exp;
  } catch {
    // A token we cannot even decode is as good as an expired one: the
    // backend will reject it, so treat it as expired and re-login.
    return true;
  }
}

/**
 * Whether the stored session token has (locally) passed its expiry. Used to
 * short-circuit doomed backend requests and to distinguish "session expired"
 * from "backend rejected a seemingly valid token" on a 401.
 */
export function isStoredTokenExpired(): boolean {
  return tokenExpired(getTokenFromStorage() ?? null);
}
