import { AppConfig } from '../model/ConfigFetcher';

export function generateCSP(config: AppConfig) {
  const cspMetaTag = document.createElement('meta');
  cspMetaTag.httpEquiv = 'Content-Security-Policy';

  let urls = config.backends.map((v) => v.url).join(' ');
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
