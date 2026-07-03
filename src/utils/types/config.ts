type HexColor = `#${string}`;

/** Which pane(s) the side-by-side entity editor shows. */
export type EditorLayout = 'form' | 'yaml' | 'both';

/**
 * Per-mode (light / dark) neutral colours: text, strokes and the page
 * background. Every field is optional and falls back to the built-in default
 * (the yac-vays.github.io reference branding).
 */
export interface ThemeNeutrals {
  /** Main text colour (`--color-plainfont`). */
  font?: HexColor;
  /** Text on a primary-coloured surface (`--color-plainfont-inv`). */
  fontInverted?: HexColor;
  /** Muted / secondary text (`--color-reducedfont`). */
  fontReduced?: HexColor;
  /** Border / divider colour (`--color-stroke`). */
  stroke?: HexColor;
  /** Page background (`--color-dyn-bg`). */
  background?: HexColor;
}

/**
 * Full theme colour configuration. All fields are optional; anything omitted
 * keeps the built-in default. Primary opacities and the light page-tint are
 * derived from `primary` automatically.
 */
export interface ColorConfig {
  /** Brand colour (sidebar, buttons, accents). */
  primary?: HexColor;
  /** Hover/active variant of the primary colour. */
  primaryHighlighted?: HexColor;
  /** Colour used for destructive actions and errors. */
  danger?: HexColor;
  /** Dark-mode component surface (`boxdark`). */
  box?: HexColor;
  /** Dark-mode rear/background surface (`boxdark-2`). */
  boxAlt?: HexColor;
  /** Dark-mode input / hover surface (`meta-4`, `form-input`). */
  boxInput?: HexColor;
  /** Dark-mode component border (`form-strokedark`). */
  boxStroke?: HexColor;
  /** Light-mode neutral overrides. */
  light?: ThemeNeutrals;
  /** Dark-mode neutral overrides. */
  dark?: ThemeNeutrals;
}

/**
 * The interface of the application config as it is retreived from the frontend.
 */
export interface AppConfig {
  title: string;
  /** URL of the sidebar logo image. Falls back to the built-in project logo. */
  logo?: string;
  /** URL of the browser-tab favicon. Falls back to the built-in project favicon. */
  favicon?: string;
  color?: ColorConfig;
  production: boolean;
  /**
   * The editor layout shown the first time a user opens an entity. Once the user
   * changes it, their choice (persisted in local storage) takes precedence.
   * Defaults to `both` (form + YAML side by side).
   */
  defaultEditorLayout?: EditorLayout;
  /**
   * Deployment-specific help text (markdown), shown at the top of the help
   * page (`/help`). Use it for pointers that only make sense for THIS
   * installation: who to contact, internal documentation, house rules.
   */
  helpText?: string;
  oidcConf: {
    server: string;
    clientID: string;
  };
  backends: YACBackend[];
} /**
 * Object describing a YAC backend as it is described by the app config.
 */

export interface YACBackend {
  name: string;
  title: string;
  icon: string;
  url: string;
}
