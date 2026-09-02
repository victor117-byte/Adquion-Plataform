/// <reference types="vite/client" />

// Inyectadas por vite.config.ts vía `define` a partir de package.json y
// del commit de build (VERCEL_GIT_COMMIT_SHA o `git rev-parse`).
declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_BUILT_AT__: string;
