import { AppConfig } from '../utils/types/config';

/**
 * The origin to allow-list for a branding asset URL, or '' when none is needed.
 * Same-origin paths and `data:` URIs are already covered by `'self'` / `data:`,
 * so they contribute nothing; only cross-origin absolute URLs return an origin.
 */
function externalOrigin(url: string | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url, window.location.origin);
    if ((u.protocol === 'http:' || u.protocol === 'https:') && u.origin !== window.location.origin) {
      return u.origin;
    }
  } catch {
    // Not an absolute/relative URL we can resolve (e.g. a data: URI) — nothing to add.
  }
  return '';
}

/**
 * Apply the CSP. Note this is not the entire policy!
 * In the index.html file, there are default rules, like:
 *
 *  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
 * which forces the website to use HTTPS to connect to first and thirdparty resources.
 * @param config
 */
export function generateCSP(config: AppConfig) {
  const cspMetaTag = document.createElement('meta');
  cspMetaTag.httpEquiv = 'Content-Security-Policy';

  const yacURLs = config.backends.map((v) => v.url).join(' ');
  const yacURLSandOIDC = yacURLs + ' ' + new URL(config.oidcConf.server).hostname;

  // The logo and favicon are loaded as images; if either lives on another
  // origin it must be allow-listed for img-src (same-origin paths and data:
  // URIs are already covered and contribute nothing here).
  const brandingSources = [config.logo, config.favicon]
    .map(externalOrigin)
    .filter((s) => s !== '')
    .join(' ');

  cspMetaTag.content = `default-src 'self';
    script-src 'self' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' ${yacURLs} ${brandingSources} data:;
    connect-src 'self' ${yacURLSandOIDC};
    font-src 'self';
    object-src 'none';
    frame-src 'none';
    base-uri 'none';
    form-action 'none';`;

  // Append it to the <head>
  document.head.appendChild(cspMetaTag);
}
