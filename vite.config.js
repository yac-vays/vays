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
  server: {
    host: '127.0.0.1',
    port: 5173,
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
