import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function firebaseSwPlugin() {
  return {
    name: 'firebase-sw-config',
    closeBundle() {
      const distSw = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(distSw)) {
        let content = fs.readFileSync(distSw, 'utf-8');
        const config = {
          apiKey: process.env.VITE_FIREBASE_API_KEY || 'placeholder',
          authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder',
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'placeholder',
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'placeholder',
          messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'placeholder',
          appId: process.env.VITE_FIREBASE_APP_ID || 'placeholder'
        };
        content = content.replace('__FIREBASE_CONFIG__', JSON.stringify(config));
        fs.writeFileSync(distSw, content);
      }
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    firebaseSwPlugin(),
  ],
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
