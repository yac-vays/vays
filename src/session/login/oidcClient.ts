import * as client from 'openid-client';
import { AppConfig } from '../../utils/types/config';

/**
 * The openid-client configuration for the SPA client, from the provider's
 * discovery document. Shared by the login (code exchange) and the token
 * renewal (and the logout) so all talk to the provider the same way.
 */
export function discoverClient(appconf: AppConfig): Promise<client.Configuration> {
  // A SPA is a public client: it has no secret and authenticates with its
  // client_id only (`None`), protected by PKCE.
  return client.discovery(
    new URL(appconf.oidcConf.server),
    appconf.oidcConf.clientID,
    undefined,
    client.None(),
  );
}

/** The scopes requested at the login. */
export function oidcScope(appconf: AppConfig): string {
  return appconf.oidcConf.scope ?? 'openid email';
}

/** The scopes a token response granted: absent means as requested (RFC 6749 5.1). */
export function grantedScope(tokens: { scope?: string }, requested: string): string {
  return tokens.scope || requested;
}
