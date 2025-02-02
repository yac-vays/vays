/**
 * Model component that serves the configuration of the GUI.
 * The configuration is of type AppConfig.
 */

import { AppConfig } from '../utils/types/config';
import { Nullable } from '../utils/types/typeUtils';

/**
 * Local cache for the configuration. The configuration is only fetched once
 * from the frontend server during the lifespan of the web application.
 */
let config: Nullable<AppConfig> = null;

/**
 * Fetch the application configuration. Will cache the result, As such, the config is
 * fetched from the frontend exactly once during the lifespan of the webapp.
 *
 * @returns The application configuration.
 */
export async function getConfig(): Promise<Nullable<AppConfig>> {
  if (config == null) {
    // Lazy loading of the configuration

    const resp: Nullable<Response> = await fetch('/config.json').catch(() => null);
    if (resp == null) return null;

    if (resp?.status == 200) {
      try {
        config = (await resp.json()) as AppConfig;
      } catch {
        return null;
      }

      return config;
    }
    return null;
  }
  return config;
}
