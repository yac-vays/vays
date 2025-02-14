/**
 * Model component that serves the configuration of the GUI.
 * The configuration is of type AppConfig.
 */

import { showError } from '../controller/global/notification';
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
    if (resp == null) return reportBadFrontend();

    if (resp?.status == 200) {
      try {
        config = validateConfig((await resp.json()) as AppConfig);
      } catch {
        return null;
      }

      return config;
    }
    return reportBadFrontend();
  }
  return config;
}

function reportBadFrontend(): null {
  showError('Config Not Available', 'Cannot fetch the config. Please contact the admin.');
  return null;
}

function validateConfig(config: AppConfig): Nullable<AppConfig> {
  try {
    for (const backend of config.backends) {
      if (new URL(backend.url).protocol !== 'https:') {
        showError(
          `Registered YAC backend ${backend.title} has bad protocol.`,
          'The backend URL provided uses a different protocol than HTTPS.',
        );
        return null;
      }
    }
  } catch {
    showError('Registered YAC backend has bad URL', 'The URL could not be parsed.');
    return null;
  }

  return config;
}
