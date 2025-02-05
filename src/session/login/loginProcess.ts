import * as client from 'openid-client';

import { AppConfig } from '../../utils/types/config';
import { Nullable } from '../../utils/types/typeUtils';
import { navigateToURL } from '../../controller/global/url';
import iLocalStorage from '../persistent/LocalStorage';
import { setUserLoggedIn } from './tokenHandling';
import { AuthDiscConfig } from '../../utils/types/internal/request';

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

export async function finalizeAuthentication(appconf: AppConfig): Promise<boolean> {
  const configString = localStorage.getItem(LS_CONFIG_KEY);
  localStorage.setItem(LS_CONFIG_KEY, '');
  if (configString == null) return false;
  let config: AuthDiscConfig;
  try {
    config = JSON.parse(configString);
  } catch (error) {
    return false;
  }

  let id_token: string | undefined;

  const currentUrl = new URL(window.location.href);
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

  storeToken(id_token);
  setUserLoggedIn(true);
  window.dispatchEvent(new Event('sign-in'));
  return true;
}

function storeToken(token: string) {
  // Making sure that the protocol on which VAYS is loaded is
  // HTTPS. Note that this needs seperate checking if all YAC URLS via https too.
  if (location.protocol === 'https:') {
    iLocalStorage.setToken(`Bearer ${token}`);
  }
}

export function logOut() {
  iLocalStorage.setToken('');
  setUserLoggedIn(false);
  window.dispatchEvent(new Event('sign-out'));
}
