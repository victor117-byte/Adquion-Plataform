import { Check, Heart, MessageSquareHeart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const included = [
  "Descarga automática SAT: CFDI, constancias y opiniones de cumplimiento",
  "Hasta 150 contribuyentes por cuenta",
  "Hasta 10 usuarios / contadores por organización",
  "7 GB de almacenamiento de documentos",
  "Automatizaciones programadas todos los días",
  "Notificaciones por WhatsApp y correo",
  "Dashboard con KPIs y reportes por cliente",
  "Roles y permisos (administrador / contador)",
];

export const Pricing = () => {
  return (
    <section id="apoyo" className="bg-surface-alt px-4 py-20 sm:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Acceso
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Gratis mientras construimos esto juntos
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Adquion está en etapa temprana. Tienes acceso completo a la plataforma sin
            costo — sin letras chiquitas, sin límite de tiempo por ahora.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Todo incluido */}
          <div className="rounded-2xl border-2 border-brand bg-surface p-8 shadow-[var(--shadow-flat)] lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">Todo incluido</h3>
                <p className="mt-1 text-sm text-ink-muted">Un solo plan, sin costo</p>
              </div>
              <span className="font-display text-4xl font-extrabold text-ink">$0</span>
            </div>

            <Link to="/auth?mode=signup" className="mt-6 block">
              <Button
                size="lg"
                className="w-full rounded-lg bg-brand text-base font-bold text-brand-foreground shadow-none hover:bg-brand-hover"
              >
                Comenzar gratis
              </Button>
            </Link>

            <ul className="mt-7 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
              {included.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                  <span className="text-sm text-ink">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Apoya el proyecto */}
          <div className="flex flex-col rounded-2xl border border-line bg-surface p-8 lg:col-span-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="mt-6 font-display text-xl font-bold text-ink">
              ¿Te está sirviendo Adquion?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Este es un proyecto independiente que seguimos construyendo con el uso real
              de negocios como el tuyo. Cuéntanos qué te sirvió, qué falta, o si quieres
              apoyar el desarrollo.
            </p>

            <Link to="/comentarios" className="mt-6 block">
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-lg border-2 border-ink/15 font-bold text-ink hover:bg-surface-alt"
              >
                <MessageSquareHeart className="h-4 w-4" />
                Enviar un comentario
              </Button>
            </Link>

            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-line bg-surface-alt px-4 py-3">
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
              <p className="text-sm text-ink-muted">
                <span className="font-bold text-ink">Donaciones — muy pronto.</span> Si
                quieres apoyar el desarrollo desde ahora, dínoslo en tu comentario.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-ink-muted">
          Sin tarjeta de crédito. Cuando el proyecto crezca, avisaremos con anticipación
          antes de hacer cualquier cambio.
        </p>
      </div>
    </section>
  );
};
