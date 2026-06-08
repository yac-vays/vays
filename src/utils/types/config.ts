type HexColor = `#${string}`;

/** Which pane(s) the side-by-side entity editor shows. */
export type EditorLayout = 'form' | 'yaml' | 'both';

/**
 * The interface of the application config as it is retreived from the frontend.
 */
export interface AppConfig {
  title: string;
  logo: string;
  color?: {
    primary: HexColor;
    primaryHighlighted: HexColor;
  };
  production: boolean;
  /**
   * The editor layout shown the first time a user opens an entity. Once the user
   * changes it, their choice (persisted in local storage) takes precedence.
   * Defaults to `form`.
   */
  defaultEditorLayout?: EditorLayout;
  oidcConf: {
    server: string;
    clientID: string;
    redirectURI: string;
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
