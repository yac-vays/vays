import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
//import basicSsl from '@vitejs/plugin-basic-ssl'
import { existsSync, readFileSync } from 'fs';
// https://vitejs.dev/config/
// https://stackoverflow.com/questions/69417788/vite-https-on-localhost
// https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener

function getCertificate(path) {
  return existsSync(path) ? readFileSync(path) : '';
}
export default defineConfig({
  plugins: [react()],
  build: { sourcemap: false },
  server:{
    host: '127.0.0.1',
    port: 5173,
    https: {
      key: getCertificate('cert/private-key.pem'),
      cert: getCertificate('cert/certificate.pem')
    }
  }
  
});
