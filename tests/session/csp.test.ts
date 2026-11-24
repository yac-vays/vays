/**
 * The CSP is delivered twice with the same content: by the app as a <meta> tag
 * (csp.ts) and by the container as a response header (misc/csp.js). Both call
 * `buildCspPolicy`, which therefore must not need anything but the config.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { generateCSP } from '../../src/session/csp';
import buildCspPolicy from '../../src/session/cspPolicy.js';
import { AppConfig } from '../../src/utils/types/config';

const CONFIG = {
  title: 'Test',
  oidcConf: {
    server: 'https://IdP.example.com:8443/realm/.well-known/openid-configuration',
    clientID: 'c',
  },
  backends: [
    { name: 'a', title: 'A', icon: '', url: 'https://yac-a.example.com' },
    { name: 'b', title: 'B', icon: '', url: 'https://yac-b.example.com/api' },
  ],
} as unknown as AppConfig;

afterEach(() => {
  document.head.querySelectorAll('meta[http-equiv]').forEach((m) => m.remove());
});

describe('buildCspPolicy', () => {
  it('allows the backends and the OIDC provider, nothing else', () => {
    expect(buildCspPolicy(CONFIG)).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' https://yac-a.example.com https://yac-b.example.com/api data:; " +
        "connect-src 'self' https://yac-a.example.com https://yac-b.example.com/api https://idp.example.com:8443; " +
        "font-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none';",
    );
  });

  it('allow-lists the origin of an absolute logo / favicon URL for images only', () => {
    const policy = buildCspPolicy({
      ...CONFIG,
      logo: 'https://cdn.example.org/brand/logo.svg?v=1',
      favicon: '/branding/favicon.png',
    });
    expect(policy).toContain(
      "img-src 'self' https://yac-a.example.com https://yac-b.example.com/api https://cdn.example.org data:;",
    );
    expect(policy.match(/cdn\.example\.org/g)).toHaveLength(1);
  });

  it('ignores inline SVG, data: URIs and other schemes in the branding', () => {
    const plain = buildCspPolicy(CONFIG);
    for (const value of [
      '<svg xmlns="http://www.w3.org/2000/svg"/>',
      'data:image/png;base64,AAAA',
      'javascript:alert(1)',
      '//x.example',
    ]) {
      expect(buildCspPolicy({ ...CONFIG, logo: value, favicon: value })).toBe(plain);
    }
  });

  it('is a single line', () => {
    expect(buildCspPolicy(CONFIG)).not.toMatch(/[\r\n]/);
  });
});

describe('generateCSP', () => {
  it('applies exactly that policy as a <meta> tag', () => {
    generateCSP(CONFIG);
    const meta = document.head.querySelector('meta[http-equiv="Content-Security-Policy"]');
    expect(meta?.getAttribute('content')).toBe(buildCspPolicy(CONFIG));
  });
});
