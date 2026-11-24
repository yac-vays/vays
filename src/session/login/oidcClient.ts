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
