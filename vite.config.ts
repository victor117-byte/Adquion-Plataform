import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const PROXY_TARGET = {
  test: 'http://localhost:3000',
  development: 'https://api.adquion.com',
  production: 'https://api.adquion.com',
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const target = PROXY_TARGET[mode as keyof typeof PROXY_TARGET] ?? 'https://api.adquion.com';
  const isLocal = mode === 'test';

  return {
  base: '/',
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
        secure: !isLocal,
      }
    }
  },
  // Preview server
  preview: {
    host: "::",
    port: 4173,
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
        secure: !isLocal,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
