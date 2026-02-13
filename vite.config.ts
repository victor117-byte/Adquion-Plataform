import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ['.ngrok.io'],
    proxy: {
      '/api': {
        target: mode === 'test' ? 'https://sat-backend.ngrok.io' : 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        headers: mode === 'test' ? { 'ngrok-skip-browser-warning': 'true' } : {},
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
