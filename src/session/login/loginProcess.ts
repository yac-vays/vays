import * as client from 'openid-client';

import { navigateToURL } from '../../controller/global/url';
import { getCachedConfig } from '../../model/config';
import { loadIdentity } from '../../model/identity';
import { logError } from '../../utils/logger';
import { AppConfig } from '../../utils/types/config';
import { AuthDiscConfig } from '../../utils/types/internal/request';
import { Nullable } from '../../utils/types/typeUtils';
import { joinUrl } from '../../utils/urlUtils';
import iLocalStorage from '../persistent/LocalStorage';
import { discoverClient } from './oidcClient';
import { setUserLoggedIn } from './tokenHandling';

/**
 * The PKCE verifier and nonce of the login in progress. In the session
 * storage: it survives the redirect to the provider, and logins started in
 * several tabs do not overwrite each other.
 */
const LOGIN_STATE_KEY = 'OIDC_DS_CONF';

export async function startAuthentication(appconf: AppConfig) {
  const resp = await performDiscovery(appconf);
  if (resp == null) {
    navigateToURL('/error-page');
    return;
  }
  window.location.replace(resp.href);
}

async function performDiscovery(appconf: AppConfig): Promise<Nullable<URL>> {
  const config = await discoverClient(appconf);

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
  // redirect user to as.authorization_endpoint
  const parameters: Record<string, string> = {
    /**
     * Value used in the authorization request as redirect_uri pre-registered at the
     * Authorization Server.
     */
    redirect_uri: joinUrl(`https://${window.location.host}`, 'oauth2-redirect'),
    scope: appconf.oidcConf.scope ?? 'openid email',
    code_challenge,
    code_challenge_method,
  };

  /**
   * We cannot be sure the AS supports PKCE so we're going to use nonce too. Use
   * of PKCE is backwards compatible even if the AS doesn't support it which is
   * why we're using it regardless.
   */
  const nonce = client.randomNonce();
  parameters.nonce = nonce;
  const redirURL = client.buildAuthorizationUrl(config, parameters);
  sessionStorage.setItem(
    LOGIN_STATE_KEY,
    JSON.stringify({
      clientID: appconf.oidcConf.clientID,
      nonce: nonce,
      code_verifier: code_verifier,
    }),
  );
  return redirURL;
}

export async function finalizeAuthentication(appconf: AppConfig): Promise<boolean> {
  const configString = sessionStorage.getItem(LOGIN_STATE_KEY);
  sessionStorage.removeItem(LOGIN_STATE_KEY);
  if (configString == null) return false;
  let config: AuthDiscConfig;
  try {
    config = JSON.parse(configString);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return false;
  }

  const currentUrl = new URL(window.location.href);
  try {
    const tokens = await client.authorizationCodeGrant(await discoverClient(appconf), currentUrl, {
      pkceCodeVerifier: config.code_verifier,
      ...(config.nonce ? { expectedNonce: config.nonce } : {}),
      idTokenExpected: true,
    });

    const { id_token } = tokens;
    if (id_token == undefined) return false;

    storeToken(id_token);
    // Lets the renewal (tokenRenewal.ts) keep the short-lived id-token fresh;
    // without one the session simply ends when the id-token expires.
    if (tokens.refresh_token) {
      iLocalStorage.setRefreshToken(tokens.refresh_token);
    } else {
      iLocalStorage.clearRefreshToken();
    }
    setUserLoggedIn(true);
    window.dispatchEvent(new Event('sign-in'));
    void loadIdentity();
    return true;
  } catch (e) {
    // openid-client throws here e.g. when the user cancelled at the IdP
    // (?error=access_denied), on a PKCE mismatch, or on a network failure.
    // Report failure so the caller can route to the error page instead of
    // leaving the user on an infinite loader.
    logError(`OIDC token exchange failed: ${e}`, 'finalizeAuthentication');
    return false;
  }
}

function storeToken(token: string) {
  // Making sure that the protocol on which VAYS is loaded is
  // HTTPS. Note that this needs seperate checking if all YAC URLS via https too.
  if (location.protocol === 'https:') {
    iLocalStorage.setToken(`Bearer ${token}`);
    // The identity belongs to the previous token (if any): load it anew.
    iLocalStorage.clearIdentity();
  }
}

/** Upper bound for everything the logout asks of the provider. */
const LOGOUT_PROVIDER_TIMEOUT_MS = 3000;

let loggingOut = false;

/**
 * End the session. Always ends the local one; what involves the provider is
 * best effort and bounded by a timeout, so a slow or failing provider can
 * never keep the user logged in:
 *
 *  - the refresh token is revoked (if the provider has a revocation endpoint),
 *    so a copy of it cannot renew the session any more;
 *  - with `oidcConf.endSession`, the browser then goes to the provider's
 *    `end_session_endpoint` to end the session there as well, and returns to
 *    the home page.
 */
export async function logOut(): Promise<void> {
  if (loggingOut) return;
  loggingOut = true;

  const appconf = getCachedConfig();
  const idToken = iLocalStorage.getToken()?.replace(/^Bearer /, '');
  const refreshToken = iLocalStorage.getRefreshToken();

  // Wipe everything except the persisted UI preferences first: from here on
  // this browser is logged out, whatever happens below.
  iLocalStorage.clearSession();

  let target = '/';
  if (appconf != null && (refreshToken || appconf.oidcConf.endSession)) {
    try {
      target = await withTimeout(
        endProviderSession(appconf, idToken, refreshToken),
        LOGOUT_PROVIDER_TIMEOUT_MS,
        '/',
      );
    } catch (e) {
      logError(`Logout at the OIDC provider failed: ${e}`, 'logOut');
    }
  }

  // A *full page load* (rather than a client-side navigation) is what makes it
  // look and feel like a real logout: all in-memory state — caches and
  // rendered UI such as the sidebar submenus and fetched lists — is thrown
  // away and the app boots fresh into the logged-out home page.
  window.location.replace(target);
}

/** Revoke the refresh token; returns where to send the browser afterwards. */
async function endProviderSession(
  appconf: AppConfig,
  idToken: string | undefined,
  refreshToken: string | undefined,
): Promise<string> {
  const config = await discoverClient(appconf);
  const metadata = config.serverMetadata();

  // The end-session URL is built first: it must not depend on the revocation.
  let target = '/';
  if (appconf.oidcConf.endSession && metadata.end_session_endpoint) {
    target = client.buildEndSessionUrl(config, {
      post_logout_redirect_uri: joinUrl(`https://${window.location.host}`, ''),
      ...(idToken ? { id_token_hint: idToken } : {}),
    }).href;
  }

  if (refreshToken && metadata.revocation_endpoint) {
    try {
      await withTimeout(
        client.tokenRevocation(config, refreshToken, { token_type_hint: 'refresh_token' }),
        LOGOUT_PROVIDER_TIMEOUT_MS - 500,
        undefined,
      );
    } catch (e) {
      logError(`Revoking the refresh token failed: ${e}`, 'logOut');
    }
  }
  return target;
}

/** `promise`, or `fallback` if it has not settled after `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
