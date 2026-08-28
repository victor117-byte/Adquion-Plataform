import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { BarChart3, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-soft blur-3xl opacity-70" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -left-32 h-72 w-72 rounded-full bg-mint-soft blur-3xl opacity-70" />

      <div className="relative text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <BarChart3 className="h-4.5 w-4.5 text-brand-foreground" />
          </span>
          <span className="font-display text-xl font-extrabold text-ink">Adquion</span>
        </Link>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface-alt">
          <Compass className="h-7 w-7 text-brand" />
        </div>

        <p className="font-display text-7xl font-extrabold text-ink">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink">
          Esta página se perdió en el camino
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">
          La ruta <code className="rounded bg-surface-alt px-1.5 py-0.5 text-sm text-ink">{location.pathname}</code>{" "}
          no existe o fue movida. Revisa el enlace o vuelve al inicio.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/">
            <Button
              size="lg"
              className="rounded-lg bg-brand px-7 font-bold text-brand-foreground shadow-none hover:bg-brand-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
          <Link to="/main">
            <Button
              variant="outline"
              size="lg"
              className="rounded-lg border-2 border-ink/15 px-7 font-bold text-ink hover:bg-surface-alt"
            >
              Ir a mi cuenta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
