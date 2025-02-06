import { AppConfig } from '../utils/types/config';

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

  const urls = config.backends.map((v) => v.url).join(' ');
  const urlsAndOIDC = urls + ' ' + new URL(config.oidcConf.server).hostname;

  cspMetaTag.content = `default-src 'self'; 
    script-src 'self' 'unsafe-eval'; 
    style-src 'self' 'unsafe-inline'; 
    img-src 'self' ${urls} data:;
    connect-src 'self' ${urlsAndOIDC};
    font-src 'self';
    object-src 'none';
    frame-src 'none';
    base-uri 'none';
    form-action 'none';`;

  // Append it to the <head>
  document.head.appendChild(cspMetaTag);
}
