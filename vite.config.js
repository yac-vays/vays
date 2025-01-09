import { defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { readFileSync, existsSync } from 'fs'
// https://vitejs.dev/config/
// https://stackoverflow.com/questions/69417788/vite-https-on-localhost
// https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener

function getCertificate(path) {
  return existsSync(path) ? readFileSync(path) : '';
}
export default defineConfig({
  plugins: [react()],
//   build: {
//     rollupOptions: {
//       external: ['monaco-editor']  // Monaco can be loaded externally to avoid bundling
//     }
//   }
// ,
  server:{

    host: '127.0.0.1',
    port: 5173,
    https: {
      key: getCertificate('cert/private-key.pem'),
      cert: getCertificate('cert/certificate.pem')
    }
  }
  
});
