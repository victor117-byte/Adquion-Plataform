import { useCallback, useEffect, useRef, useState } from "react";

interface VersionInfo {
  version: string;
  commit: string;
  builtAt: string;
}

const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos

/**
 * Compara el commit con el que se compiló el bundle actual (inyectado en
 * build time vía vite.config.ts) contra /version.json en vivo. Si el
 * commit del servidor cambió, significa que hubo un deploy nuevo mientras
 * el usuario tenía la SPA abierta — sin esto, sus chunks JS pueden dejar
 * de existir en el próximo redeploy y romper la navegación.
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<VersionInfo | null>(null);
  const checking = useRef(false);

  const checkVersion = useCallback(async () => {
    if (checking.current || updateAvailable) return;
    checking.current = true;
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data: VersionInfo = await response.json();
      if (data.commit && data.commit !== __APP_COMMIT__) {
        setLatestVersion(data);
        setUpdateAvailable(true);
      }
    } catch {
      // Silencioso: un fallo de red al revisar la versión no debe molestar al usuario
    } finally {
      checking.current = false;
    }
  }, [updateAvailable]);

  useEffect(() => {
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkVersion();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [checkVersion]);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    updateAvailable,
    latestVersion,
    reload,
    currentVersion: __APP_VERSION__,
    currentCommit: __APP_COMMIT__,
    currentBuiltAt: __APP_BUILT_AT__,
  };
}
