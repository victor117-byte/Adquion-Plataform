import { Check, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const plans = [
  {
    name: "Basic",
    price: "$0",
    priceReal: null,
    period: "/mes",
    description: "Perfecto para comenzar",
    features: [
      "Límite de 50 archivos",
      "1 Ejecución de automatización (SAT)",
      "Acceso solo a Dashboard",
      "Acceso seguro",
      "Archivos de aclaración del contador",
    ],
    cta: "Comenzar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Gratis",
    priceReal: "$49",
    period: "/mes",
    description: "Para contadores profesionales",
    features: [
      "1 GB de almacenamiento",
      "5 usuarios (Contadores)",
      "Reportes de clientes",
      "Dashboard completo",
      "Auto-refresh (Automatización)",
      "3 ejecuciones programadas por día",
      "Notificaciones (WhatsApp / Email)",
      "30 clientes",
      "Integraciones (SAT)",
    ],
    cta: "Comenzar gratis",
    highlighted: true,
  },
  {
    name: "Business",
    price: "Gratis",
    priceReal: "$99",
    period: "/mes",
    description: "Para equipos en crecimiento",
    features: [
      "7 GB de almacenamiento",
      "10 usuarios (Contadores)",
      "Reportes de clientes",
      "Dashboard con KPI Contadores",
      "Auto-refresh (Automatización)",
      "3 ejecuciones programadas por día",
      "Notificaciones (WhatsApp / Email)",
      "150 clientes",
      "Integraciones (SAT)",
      "Agente personalizado",
    ],
    cta: "Comenzar gratis",
    highlighted: false,
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="bg-surface-alt px-4 py-20 sm:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Planes
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Precios simples y transparentes
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Elige el plan que mejor se adapte a tu despacho. Puedes cambiarlo cuando quieras.
          </p>
        </div>

        {/* Banner de lanzamiento */}
        <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3">
          <Rocket className="h-5 w-5 shrink-0 text-brand" />
          <p className="text-sm text-ink">
            <span className="font-bold">Lanzamiento gratuito</span> — todos los planes son
            gratuitos durante el periodo de lanzamiento.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex h-full flex-col rounded-2xl bg-surface p-7 transition-all duration-300 ${
                plan.highlighted
                  ? "border-2 border-brand shadow-[var(--shadow-flat)] md:-mt-4 md:pb-9"
                  : "border border-line hover:border-ink/25"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-7 rounded-md bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-foreground">
                  Más popular
                </span>
              )}

              <h3 className="font-display text-xl font-bold text-ink">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink-muted">{plan.description}</p>

              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-4xl font-extrabold text-ink">
                  {plan.price}
                </span>
                {plan.price !== "Gratis" && (
                  <span className="pb-1 text-sm text-ink-muted">{plan.period}</span>
                )}
                {plan.priceReal && (
                  <span className="pb-1.5 text-sm text-ink-muted line-through">
                    {plan.priceReal}
                    {plan.period}
                  </span>
                )}
              </div>

              <Link to="/auth?mode=signup" className="mt-6 block">
                <Button
                  size="lg"
                  className={`w-full rounded-lg text-base font-bold shadow-none ${
                    plan.highlighted
                      ? "bg-brand text-brand-foreground hover:bg-brand-hover"
                      : "border-2 border-ink/15 bg-transparent text-ink hover:bg-surface-alt"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>

              <ul className="mt-7 space-y-3 border-t border-line pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                    <span className="text-sm text-ink">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-muted">
          Puedes registrarte sin tarjeta de crédito. Los precios reales se comunicarán con
          anticipación.
        </p>
      </div>
    </section>
  );
};
