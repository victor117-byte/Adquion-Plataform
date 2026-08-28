import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const included = [
  "Descarga automática SAT: CFDI, constancias y opiniones de cumplimiento",
  "Hasta 150 contribuyentes y 10 usuarios por organización",
  "7 GB de almacenamiento y automatizaciones diarias",
  "Notificaciones por WhatsApp y correo",
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow-flat)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">
          Tu cuenta ya está lista
        </h1>
        <p className="mt-3 text-ink-muted">
          Adquion es gratis mientras seguimos construyendo el proyecto. Ya tienes acceso
          completo, sin límites de tiempo ni tarjeta de crédito.
        </p>

        <ul className="mt-6 space-y-2.5 text-left">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
              <span className="text-sm text-ink">{item}</span>
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          className="mt-8 w-full rounded-lg bg-brand font-bold text-brand-foreground shadow-none hover:bg-brand-hover"
          onClick={() => navigate("/main")}
        >
          Ir a mi panel
        </Button>
      </div>
    </div>
  );
}
