import { AppConfig } from '../model/ConfigFetcher';

export function setColors(config: AppConfig) {
  if (config.color == undefined) return;

  if (config.color.primary)
    document.documentElement.style.setProperty('--color-primary', config.color.primary);

  if (config.color.primaryHighlighted)
    document.documentElement.style.setProperty(
      '--color-primary-highlighted',
      config.color.primaryHighlighted,
    );
}
