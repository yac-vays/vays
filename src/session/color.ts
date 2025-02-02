import { AppConfig } from '../utils/types/config';

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
  document.documentElement.style.setProperty('--color-stroke', '#2E3A47');
}

export function disableDarkMode() {
  document.documentElement.style.setProperty('--color-plainfont', '#000000');
  document.documentElement.style.setProperty('--color-plainfont-inv', '#FFFFFF');
  document.documentElement.style.setProperty('--color-reducedfont', '#64748B');
  document.documentElement.style.setProperty('--color-stroke', '#E2E8F0');
}
