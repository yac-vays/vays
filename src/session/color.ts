import { getCachedConfig } from '../model/config';
import { AppConfig, ThemeNeutrals } from '../utils/types/config';

/** A resolved neutral palette: CSS colour values (hex or e.g. color-mix(...)). */
type ResolvedNeutrals = Record<keyof Required<ThemeNeutrals>, string>;

/**
 * Built-in default neutral palettes — the yac-vays.github.io reference
 * branding. Any field can be overridden per deployment via
 * `config.color.light` / `config.color.dark`. These must stay in sync with the
 * `:root` defaults declared in `view/styles/style.css` (used before JS runs).
 *
 * The dark page background and stroke are *derived from the brand colour* (like
 * the component surfaces in style.css), so dark mode is a dark version of the
 * actual colour scheme rather than a fixed blue-grey.
 */
const LIGHT_DEFAULTS: ResolvedNeutrals = {
  font: '#000000',
  fontInverted: '#FFFFFF',
  fontReduced: '#64748B',
  stroke: '#E2E8F0',
  background: '#FFFFFF',
};
const DARK_DEFAULTS: ResolvedNeutrals = {
  font: '#FFFFFF',
  fontInverted: '#000000',
  fontReduced: '#AEB7C0',
  stroke: 'color-mix(in srgb, var(--color-primary) 20%, #2b2b2b)',
  background: 'color-mix(in srgb, var(--color-primary) 18%, #1c1c1c)',
};

function setVar(name: string, value?: string) {
  if (value) document.documentElement.style.setProperty(name, value);
}

/** Apply the mode-specific neutral colours, config overrides taking precedence. */
function applyNeutrals(defaults: ResolvedNeutrals, override?: ThemeNeutrals) {
  setVar('--color-plainfont', override?.font ?? defaults.font);
  setVar('--color-plainfont-inv', override?.fontInverted ?? defaults.fontInverted);
  setVar('--color-reducedfont', override?.fontReduced ?? defaults.fontReduced);
  setVar('--color-stroke', override?.stroke ?? defaults.stroke);
  setVar('--color-dyn-bg', override?.background ?? defaults.background);
}

/**
 * Apply the mode-independent colours from the config (primary palette, danger,
 * dark component surfaces). Omitted values keep the `:root` CSS defaults. The
 * primary opacities and the light page-tint derive from `--color-primary`
 * automatically (via `color-mix` in CSS), so they need not be set here.
 */
export function setColors(config: AppConfig) {
  const color = config.color;
  if (color == undefined) return;

  setVar('--color-primary', color.primary);
  setVar('--color-primary-highlighted', color.primaryHighlighted);
  setVar('--color-danger', color.danger);
  setVar('--color-box', color.box);
  setVar('--color-box-2', color.boxAlt);
  setVar('--color-box-input', color.boxInput);
  setVar('--color-box-stroke', color.boxStroke);
}

export function enableDarkMode() {
  applyNeutrals(DARK_DEFAULTS, getCachedConfig()?.color?.dark);
}

export function disableDarkMode() {
  applyNeutrals(LIGHT_DEFAULTS, getCachedConfig()?.color?.light);
}
