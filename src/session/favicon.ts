import { asImageSource } from '../utils/imageUtils';
import { AppConfig } from '../utils/types/config';

/**
 * Point the browser-tab favicon at the configured image. `config.favicon` may
 * be inline SVG markup, a `data:` URI, a same-origin path, or an absolute URL
 * whose origin is allow-listed in the CSP (see `generateCSP`). When unset, the
 * built-in default declared in `index.html` (the project favicon) is kept.
 *
 * Safari ignores favicon changes made from JavaScript. For it, the container
 * entrypoint already serves the configured icon (except absolute URLs) at the
 * static `/favicon.svg` from `index.html` (see `misc/favicon.js`); this runtime
 * switch covers the dev server and absolute URLs in the other browsers.
 */
export function setFavicon(config: AppConfig) {
  if (!config.favicon) return;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link == null) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = asImageSource(config.favicon);
}
