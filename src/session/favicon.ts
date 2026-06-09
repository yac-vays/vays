import { asImageSource } from '../utils/imageUtils';
import { AppConfig } from '../utils/types/config';

/**
 * Point the browser-tab favicon at the configured image. `config.favicon` may
 * be inline SVG markup, a `data:` URI, a same-origin path, or an absolute URL
 * whose origin is allow-listed in the CSP (see `generateCSP`). When unset, the
 * built-in default declared in `index.html` (the project favicon) is kept.
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
  // Let the browser infer the image type (svg/png/ico) from the resource
  // instead of forcing the svg+xml type declared in index.html.
  link.removeAttribute('type');
}
