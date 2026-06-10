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
  if (iSessionStorage.getMostRecentURL() === undefined) {
    iSessionStorage.setMostRecentURL(localPath);
    return;
  }

  if (tokenExpired(getTokenFromStorage() ?? null) || !userIsLoggedIn()) {
    setUserLoggedIn(false);
    if (title) {
      showError(title, msg ?? '');
    } else {
      showError('Please sign in again.', 'Your session has expired.');
    }
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
  const { exp } = jwtDecode(token);
  if (!exp) return false;
  const currentTime = new Date().getTime() / 1000;

  return currentTime > exp;
}
