import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const PROXY_TARGET = {
  test: 'http://localhost:3000',
  development: 'https://backend.adquion.com',
  production: 'https://backend.adquion.com',
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resuelve el commit actual: usa el que inyecta Vercel en build si está
// disponible, si no intenta git directamente (dev local), y si tampoco
// hay repo cae a "dev" para no romper el build.
function resolveCommit(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim();
  } catch {
    return 'dev';
  }
}

const appVersion = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')).version as string;
const appCommit = resolveCommit();
const appBuiltAt = new Date().toISOString();

// Se escribe en public/ para que quede servido como archivo estático tal
// cual (ej. /version.json) tanto en `vite dev` como en el build de Vercel;
// el hook useVersionCheck lo vuelve a pedir en runtime para detectar cuando
// el deploy vivo ya no coincide con el bundle que el usuario tiene cargado.
fs.writeFileSync(
  path.resolve(__dirname, 'public/version.json'),
  JSON.stringify({ version: appVersion, commit: appCommit, builtAt: appBuiltAt }, null, 2)
);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const target = PROXY_TARGET[mode as keyof typeof PROXY_TARGET] ?? 'https://backend.adquion.com';
  const isLocal = mode === 'test';

  return {
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_COMMIT__: JSON.stringify(appCommit),
    __APP_BUILT_AT__: JSON.stringify(appBuiltAt),
  },
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
