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

export function enableDarkMode() {
  document.documentElement.style.setProperty('--color-plainfont', '#FFFFFF');
  document.documentElement.style.setProperty('--color-plainfont-inv', '#000000');
  document.documentElement.style.setProperty('--color-reducedfont', '#AEB7C0');
}

export function disableDarkMode() {
  document.documentElement.style.setProperty('--color-plainfont', '#000000');
  document.documentElement.style.setProperty('--color-plainfont-inv', '#FFFFFF');
  document.documentElement.style.setProperty('--color-reducedfont', '#64748B');
}
