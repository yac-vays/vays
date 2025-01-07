import { defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { readFileSync } from 'fs'
// https://vitejs.dev/config/
// https://stackoverflow.com/questions/69417788/vite-https-on-localhost
// https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
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
      key: readFileSync('cert/private-key.pem'),
      cert: readFileSync('cert/certificate.pem')
    }
  }
  
});