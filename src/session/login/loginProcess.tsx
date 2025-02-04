import * as client from 'openid-client';

import { AppConfig } from '../../utils/types/config';
import { Nullable } from '../../utils/types/typeUtils';
import { navigateToURL } from '../../controller/global/url';
import iSessionStorage from '../storage/SessionStorage';
import { showError } from '../../controller/local/notification';
import { jwtDecode } from 'jwt-decode';

export interface AuthDiscConfig {
  nonce: string;
  clientID: string;
  code_verifier: string;
}
const LS_CONFIG_KEY = 'OIDC_DS_CONF';

export async function performDiscovery(appconf: AppConfig): Promise<Nullable<URL>> {
  const config = await client.discovery(
    new URL(appconf.oidcConf.server),
    appconf.oidcConf.clientID,
    appconf.oidcConf.clientID,
  );

  const code_challenge_method = 'S256';
  /**
   * The following (code_verifier and potentially nonce) MUST be generated for
   * every redirect to the authorization_endpoint. You must store the
   * code_verifier and nonce in the end-user session such that it can be recovered
   * as the user gets redirected from the authorization server back to your
   * application.
   */
  const code_verifier = client.randomPKCECodeVerifier();
  const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
  let nonce: string;
  {
    // redirect user to as.authorization_endpoint
    const parameters = {
      /**
       * Value used in the authorization request as redirect_uri pre-registered at the
       * Authorization Server.
       */
      redirect_uri: appconf.oidcConf.redirectURI,
      scope: 'openid email',
      code_challenge,
      code_challenge_method,
      nonce: '',
    };

    /**
     * We cannot be sure the AS supports PKCE so we're going to use nonce too. Use
     * of PKCE is backwards compatible even if the AS doesn't support it which is
     * why we're using it regardless.
     */
    if (!config.serverMetadata().supportsPKCE()) {
      nonce = client.randomNonce();
      parameters.nonce = nonce;
    } else {
      console.error('THIS SHOULD WORK - Server does not support PKCE.');
      return null;
    }
    const redirURL = client.buildAuthorizationUrl(config, parameters);
    localStorage.setItem(
      LS_CONFIG_KEY,
      JSON.stringify({
        clientID: appconf.oidcConf.clientID,
        nonce: nonce,
        code_verifier: code_verifier,
      }),
    );
    return redirURL;
  }
}

export async function getToken(appconf: AppConfig): Promise<boolean> {
  const configString = localStorage.getItem(LS_CONFIG_KEY);
  if (configString == null) return false;
  const config: AuthDiscConfig = JSON.parse(configString);
  console.log(config);

  let id_token: string | undefined;

  const currentUrl = new URL(window.location.href);
  console.log(window.location.href);
  const tokens = await client.authorizationCodeGrant(
    await client.discovery(
      new URL(appconf.oidcConf.server),
      appconf.oidcConf.clientID,
      appconf.oidcConf.clientID,
    ),

    currentUrl,
    {
      pkceCodeVerifier: config.code_verifier,
      expectedNonce: config.nonce,
      idTokenExpected: true,
    },
  );

  // eslint-disable-next-line prefer-const
  ({ id_token } = tokens);
  if (id_token == undefined) return false;
  // let claims = tokens.claims();
  // console.log('ID Token Claims', claims);
  // ({ sub } = claims);

  setTokenCookie(id_token, appconf);
  window.dispatchEvent(new Event('sign-in'));
  //iSessionStorage.setMostRecentURL('');
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setTokenCookie(token: string, appconf: AppConfig) {
  /**
   * Follows best practices written here:
   * https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
   *
   * - Include max lifetime 1 day = 60*60*24 seconds = 86400 seconds
   * - only transmit over secure channel
   * ${token}
   */
  // for (const be of appconf.backends) {
  //   document.cookie = `authorization=Bearer ABCDLOL; max-age=500; SameSite=Strict; Domain=${window.location.href}; Secure`;
  // }
  // console.log(window.location.hostname);
  // document.cookie = `authorization=Bearer ABCDLOL; max-age=500; SameSite=None; Domain=api.oskiosk-test.inf.ethz.ch; Secure`;

  // TODO: Move to cookie... for another URL.....
  iSessionStorage.setToken(`Bearer ${token}`);
}

export function getTokenFromStorage() {
  return iSessionStorage.getToken();
}

export function requestFailedNoAuth() {
  // iSessionStorage.setIsLoggedIn(false);
  const url = new URL(window.location.href);
  // note that pathname of window.location does not include the query string or the index...
  console.log(window.location.href.startsWith('/'));
  console.log(url.href.substring(url.origin.length, url.href.length));
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
    console.log('SETTING THE PATH to ' + localPath);
    iSessionStorage.setMostRecentURL(localPath);
    return;
  }

  if (tokenExpired(iSessionStorage.getToken() ?? null) || !iSessionStorage.isLoggedIn()) {
    iSessionStorage.setIsLoggedIn(false);
    navigateToURL('/');
  }
  //
}

export function logOut() {
  iSessionStorage.setToken('');
  iSessionStorage.setIsLoggedIn(false);
  window.dispatchEvent(new Event('sign-out'));
}

export function getUserName(): string {
  if (!iSessionStorage.isLoggedIn) return 'Not Logged In';

  const { givenName, surname, name, mail } = jwtDecode(iSessionStorage.getToken() ?? '') as any;

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
