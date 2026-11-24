/*
 * The Content-Security-Policy of the app, derived from the app config.
 *
 * Shared by the app (`csp.ts`, applied as a <meta> tag at runtime) and the
 * container start (`misc/csp.js`, sent as a response header with index.html):
 * a browser enforces both, so they must be the same policy. Keep this file
 * free of dependencies and of browser / Node APIs (no `URL`, no `window`): it
 * also runs in the njs CLI of the nginx image.
 */

/** The origin (`scheme://host[:port]`) of an absolute http(s) URL, else ''. */
function httpOrigin(url) {
  if (typeof url != 'string') return '';
  const match = /^(https?:\/\/)([^/?#\\@\s]+)/i.exec(url.trim());
  return match ? (match[1] + match[2]).toLowerCase() : '';
}

/**
 * @param config the app config (`config.json`)
 * @returns the policy as a single line
 */
function buildCspPolicy(config) {
  const backends = (config.backends || []).map((b) => b.url).filter((u) => typeof u == 'string');
  const oidc = httpOrigin(config.oidcConf && config.oidcConf.server);

  // The logo and favicon are loaded as images; if either is an absolute URL,
  // its origin must be allow-listed for img-src (paths of the app itself,
  // data: URIs and inline SVG are already covered and contribute nothing).
  const branding = [config.logo, config.favicon].map(httpOrigin).filter((o) => o != '');

  const sources = (list) => list.filter((s) => s != '').join(' ');
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    'img-src ' + sources(["'self'"].concat(backends, branding, ['data:'])),
    'connect-src ' + sources(["'self'"].concat(backends, [oidc])),
    "font-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ]
    .map((directive) => directive + ';')
    .join(' ');
}

export default buildCspPolicy;
