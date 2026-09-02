import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVersionCheck } from "@/hooks/use-version-check";

// Detecta cuando el bundle que el usuario tiene cargado quedó desactualizado
// tras un deploy en Vercel y lo invita a recargar. Sin esto, un usuario con
// la pestaña abierta puede quedarse con chunks JS que el siguiente deploy
// eliminó del servidor y terminar con errores de carga silenciosos.
export function UpdateBanner() {
  const { updateAvailable, reload } = useVersionCheck();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto z-50 sm:max-w-sm">
      <div className="flex items-center gap-3 rounded-xl border-2 border-primary/20 bg-background shadow-lg p-4">
        <div className="p-2 rounded-full bg-primary/10 shrink-0">
          <RefreshCw className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Hay una nueva versión disponible</p>
          <p className="text-xs text-muted-foreground">Recarga para actualizar la aplicación</p>
        </div>
        <Button size="sm" onClick={reload} className="shrink-0">
          Recargar
        </Button>
      </div>
    </div>
  );
}
