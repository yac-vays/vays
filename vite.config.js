import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'fs';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
// https://stackoverflow.com/questions/69417788/vite-https-on-localhost
// https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener

// The dev server must run with HTTPS (OIDC providers reject http redirect
// URIs). If local certificates are present in cert/, use them; otherwise fall
// back to an auto-generated (self-signed) certificate via @vitejs/plugin-basic-ssl.
const hasLocalCerts = existsSync('cert/private-key.pem') && existsSync('cert/certificate.pem');

export default defineConfig({
  plugins: [react(), ...(hasLocalCerts ? [] : [basicSsl()])],
  build: { sourcemap: false },
  resolve: {
    // monaco-editor 0.53+ moved its public ESM specifiers from
    // `monaco-editor/esm/vs/*` to `monaco-editor/*`; the old specifiers no
    // longer pass its `exports` map, which Rolldown resolves strictly. Map the
    // legacy specifiers — used throughout src/ and by monaco-worker-manager
    // (monaco-yaml's worker glue) — straight onto the on-disk esm/vs tree
    // (absolute path, so the alias result needs no further resolution).
    alias: [
      {
        find: /^monaco-editor\/esm\/vs\//,
        replacement: new URL('./node_modules/monaco-editor/esm/vs/', import.meta.url).pathname,
      },
    ],
  },
  // Pre-bundle Monaco + monaco-yaml so the dev server serves them as a few
  // chunks instead of thousands of native-ESM module requests (otherwise the
  // first editor load takes tens of seconds).
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.api', 'monaco-yaml'],
  },
  server: {
    // Bind to 127.0.0.1 by default; run `npm run dev-network` (which passes
    // `--host 0.0.0.0`) to reach the dev server from another host over HTTPS.
    host: '127.0.0.1',
    port: 5173,
    // Accept the Host header sent when connecting by network IP/hostname, so
    // Vite's host check doesn't reject requests coming from other machines.
    allowedHosts: true,
    ...(hasLocalCerts
      ? {
          https: {
            key: readFileSync('cert/private-key.pem'),
            cert: readFileSync('cert/certificate.pem'),
          },
        }
      : {}),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTest.ts'],
  },
});
