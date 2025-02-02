type HexColor = `#${string}`;
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
  oidcConf: {
    server: string;
    clientID: string;
    redirectURI: string;
  };
  backends: YACBackend[];
}/**
 * Object describing a YAC backend as it is described by the app config.
 */

export interface YACBackend {
  name: string;
  title: string;
  icon: string;
  url: string;
}

