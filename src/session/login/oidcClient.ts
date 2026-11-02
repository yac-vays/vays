import * as client from 'openid-client';
import { AppConfig } from '../../utils/types/config';

/**
 * The openid-client configuration for the SPA client, from the provider's
 * discovery document. Shared by the login (code exchange) and the token
 * renewal so both talk to the token endpoint the same way.
 */
export function discoverClient(appconf: AppConfig): Promise<client.Configuration> {
  return client.discovery(
    new URL(appconf.oidcConf.server),
    appconf.oidcConf.clientID,
    appconf.oidcConf.clientID,
  );
}
