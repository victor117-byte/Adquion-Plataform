import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const NGROK_BACKEND = 'https://sat-backend.ngrok.io';
const NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ['.ngrok.io'],
    proxy: {
      '/api': {
        target: mode === 'test' ? NGROK_BACKEND : 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        headers: mode === 'test' ? NGROK_HEADERS : {},
      }
    }
  },
  // Preview server: sirve el build de producción con proxy hacia ngrok
  preview: {
    host: "::",
    port: 4173,
    allowedHosts: ['.ngrok.io'],
    proxy: {
      '/api': {
        target: NGROK_BACKEND,
        changeOrigin: true,
        secure: false,
        headers: NGROK_HEADERS,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
