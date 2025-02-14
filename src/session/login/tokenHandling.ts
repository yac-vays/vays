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

export function handleAuthFailed() {
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
    navigateToURL('/');
  }
}

export function getUserName(): string {
  if (!userIsLoggedIn()) return 'Not Logged In';

  const { givenName, surname, name, mail } = jwtDecode(getTokenFromStorage() ?? '') as any;

  if (givenName && surname) {
    return givenName + ' ' + surname;
  } else if (mail) {
    return mail;
  }
  return name;
}

function tokenExpired(token: Nullable<string>): boolean {
  if (!token) return false;
  const { exp } = jwtDecode(token);
  if (!exp) return false;
  const currentTime = new Date().getTime() / 1000;

  return currentTime > exp;
}
