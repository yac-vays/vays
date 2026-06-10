import * as client from 'openid-client';

import { navigateToURL } from '../../controller/global/url';
import { logError } from '../../utils/logger';
import { AppConfig } from '../../utils/types/config';
import { AuthDiscConfig } from '../../utils/types/internal/request';
import { Nullable } from '../../utils/types/typeUtils';
import { joinUrl } from '../../utils/urlUtils';
import iLocalStorage from '../persistent/LocalStorage';
import { setUserLoggedIn } from './tokenHandling';

const LS_CONFIG_KEY = 'OIDC_DS_CONF';

export async function startAuthentication(appconf: AppConfig) {
  const resp = await performDiscovery(appconf);
  if (resp == null) {
    navigateToURL('/error-page');
    return;
  }
  window.location.replace(resp.href);
}

async function performDiscovery(appconf: AppConfig): Promise<Nullable<URL>> {
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
  // redirect user to as.authorization_endpoint
  const parameters: Record<string, string> = {
    /**
     * Value used in the authorization request as redirect_uri pre-registered at the
     * Authorization Server.
     */
    redirect_uri: joinUrl(`https://${window.location.host}`, 'oauth2-redirect'),
    scope: 'openid email',
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

export async function finalizeAuthentication(appconf: AppConfig): Promise<boolean> {
  const configString = localStorage.getItem(LS_CONFIG_KEY);
  localStorage.setItem(LS_CONFIG_KEY, '');
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
    const tokens = await client.authorizationCodeGrant(
      await client.discovery(
        new URL(appconf.oidcConf.server),
        appconf.oidcConf.clientID,
        appconf.oidcConf.clientID,
      ),

      currentUrl,
      {
        pkceCodeVerifier: config.code_verifier,
        ...(config.nonce ? { expectedNonce: config.nonce } : {}),
        idTokenExpected: true,
      },
    );

    const { id_token } = tokens;
    if (id_token == undefined) return false;

    storeToken(id_token);
    setUserLoggedIn(true);
    window.dispatchEvent(new Event('sign-in'));
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
  }
}

export function logOut() {
  // Wipe everything except the persisted UI preferences, then do a *full page
  // reload* to the home page. A hard reload (rather than a client-side
  // navigation) is what makes it look and feel like a real logout: all
  // in-memory state — caches and rendered UI such as the sidebar submenus and
  // fetched lists — is thrown away and the app boots fresh into the logged-out
  // home page. (The token is stored in localStorage and is removed by
  // clearSession() below, so the reload genuinely deauthenticates.)
  iLocalStorage.clearSession();
  window.location.replace('/');
}
