/**
 * Model component that serves the configuration of the GUI.
 * The configuration is of type AppConfig.
 */

import { showError } from '../controller/global/notification';
import { AppConfig } from '../utils/types/config';
import { Nullable } from '../utils/types/typeUtils';

/** The configuration, once it was fetched successfully. */
let config: Nullable<AppConfig> = null;

/**
 * The application configuration (`/config.json`). A successful fetch is cached
 * for the lifespan of the app; a failed one shows a toast and returns null.
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
        showError(
          'Config Not Available',
          'The config.json file could not be parsed. Please contact the admin.',
        );
        return null;
      }

      return config;
    }
    return reportBadFrontend();
  }
  return config;
}

/**
 * The already-fetched config, synchronously. Returns `null` before the initial
 * {@link getConfig} has resolved (the app gates rendering on that, so by the time
 * pages mount this is populated).
 */
export function getCachedConfig(): Nullable<AppConfig> {
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

  // Ignore an invalid `defaultEditorLayout` rather than failing the whole config.
  if (
    config.defaultEditorLayout != null &&
    !['form', 'yaml', 'both'].includes(config.defaultEditorLayout)
  ) {
    config.defaultEditorLayout = undefined;
  }

  // Ignore a non-string `helpText` / `welcomeText` / `yamlComment` rather
  // than failing the whole config.
  if (config.helpText != null && typeof config.helpText !== 'string') {
    config.helpText = undefined;
  }
  if (config.welcomeText != null && typeof config.welcomeText !== 'string') {
    config.welcomeText = undefined;
  }
  if (config.yamlComment != null && typeof config.yamlComment !== 'string') {
    config.yamlComment = undefined;
  }

  return config;
}
