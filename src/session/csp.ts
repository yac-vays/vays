import { AppConfig } from '../utils/types/config';
import buildCspPolicy from './cspPolicy.js';

/**
 * Apply the CSP. Note this is not the entire policy!
 * In the index.html file, there are default rules, like:
 *
 *  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
 * which forces the website to use HTTPS to connect to first and thirdparty resources.
 *
 * The container image additionally sends the same policy as a response header
 * with index.html (see misc/csp.js), which covers the time before this runs.
 * The <meta> tag stays for everything served differently (e.g. the dev server).
 * @param config
 */
export function generateCSP(config: AppConfig) {
  const cspMetaTag = document.createElement('meta');
  cspMetaTag.httpEquiv = 'Content-Security-Policy';
  cspMetaTag.content = buildCspPolicy(config);

  // Append it to the <head>
  document.head.appendChild(cspMetaTag);
}
