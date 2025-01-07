/**
 * Model component that serves the configuration of the GUI.
 * The configuration is of type AppConfig.
 */

import { Nullable } from '../utils/typeUtils';

/**
 * Local cache for the configuration. The configuration is only fetched once
 * from the frontend server during the lifespan of the web application.
 */
let config: Nullable<AppConfig> = null;

/**
 * Local cache mapping the UID of the YAC backend to the URL. This
 * is done in a seperate, more efficient structure since this is expected to be a common
 * operation. Note that the UID is how YAC backends are referenced in the URL.
 */
let backendURLTable: Map<string, string> = new Map();

/**
 * The interface of the application config as it is retreived from the frontend.
 */
export interface AppConfig {
  title: string;
  logo: string;
  color: string;
  oidcConf: {
    server: string;
    clientID: string;
    redirectURI: string;
  };
  backends: YACBackend[];
}

/**
 * Object describing a YAC backend as it is described by the app config.
 */
export interface YACBackend {
  name: string;
  title: string;
  icon: string;
  url: string;
}

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
      config = (await resp.json()) as AppConfig;
      for (let yacbackend of config.backends) {
        backendURLTable.set(yacbackend.name, yacbackend.url);
      }

      return config;
    }
    return null;
  }
  return config;
}

/**
 * Get the YAC URL. This operation is assumed to be called more frequently.
 * @param backendUID The UID of the backend.
 * @returns The URL of the referenced backend. If not known, will return undefined.
 */
export function getYACURL(backendName: string): string | undefined {
  return backendURLTable.get(backendName);
}
