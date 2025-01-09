import * as client from 'openid-client';

import promptSync from 'prompt-sync';
const prompt = promptSync();

// Prerequisites

// server, clientid into config
let server = new URL('https://access.ethz.ch/spa1/.well-known/openid-configuration'); // Authorization server's Issuer Identifier URL
let clientId = 'isginfYAChuman';
let clientSecret = '';
/**
 * Value used in the authorization request as redirect_uri pre-registered at the
 * Authorization Server.
 */
let redirect_uri = 'https://127.0.0.1:5173/oauth2-redirect'; // "https://api.oskiosk-test.inf.ethz.ch/docs/oauth2-redirect" // https://127.0.0.1:5173/oauth2-redirect

// End of prerequisites

let config = await client.discovery(server, clientId, clientSecret);
console.log(config);
let code_challenge_method = 'S256';
/**
 * The following (code_verifier and potentially nonce) MUST be generated for
 * every redirect to the authorization_endpoint. You must store the
 * code_verifier and nonce in the end-user session such that it can be recovered
 * as the user gets redirected from the authorization server back to your
 * application.
 */
let code_verifier = client.randomPKCECodeVerifier();
let code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
let nonce;

{
  // redirect user to as.authorization_endpoint
  let parameters = {
    redirect_uri,
    scope: 'openid email',
    code_challenge,
    code_challenge_method,
  };

  /**
   * We cannot be sure the AS supports PKCE so we're going to use nonce too. Use
   * of PKCE is backwards compatible even if the AS doesn't support it which is
   * why we're using it regardless.
   */
  if (!config.serverMetadata().supportsPKCE()) {
    nonce = client.randomNonce();
    parameters.nonce = nonce;
  }

  let redirectTo = client.buildAuthorizationUrl(config, parameters);

  console.log('redirecting to', redirectTo.href);
  // now redirect the user to redirectTo.href
}

// one eternity later, the user lands back on the redirect_uri
// Authorization Code Grant
let sub;
let access_token;
{
  let currentUrl = new URL(prompt('What is the URL?')); //"https://127.0.0.1:5173/oauth2-redirect?code=ga2ti-btzey7pdkpyvyoab2okbuumvtq") //getCurrentUrl()
  let tokens = await client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: code_verifier,
    expectedNonce: nonce,
    idTokenExpected: true,
  });

  console.log('Token Endpoint Response', tokens);
  ({ access_token } = tokens);
  let claims = tokens.claims();
  console.log('ID Token Claims', claims);
  ({ sub } = claims);
}
