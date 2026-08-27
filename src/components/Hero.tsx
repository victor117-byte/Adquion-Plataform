import { ArrowRight, Check, ShieldCheck, Zap, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const bullets = [
  "Sin tarjeta de crédito",
  "Configuración en minutos",
  "Datos cifrados",
];

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-surface pt-28 sm:pt-32 pb-16 sm:pb-24 px-4">
      {/* Formas suaves de fondo */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-soft blur-3xl opacity-70" />
      <div aria-hidden className="pointer-events-none absolute top-40 -left-32 h-72 w-72 rounded-full bg-mint-soft blur-3xl opacity-70" />

      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Columna de texto */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-alt px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Plataforma fiscal para contadores
            </span>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-[3.75rem]">
              Automatiza el trabajo fiscal
              <br className="hidden sm:block" />{" "}
              <span className="relative inline-block">
                <span className="relative z-10">que hoy haces a mano</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-sm bg-brand/25"
                />
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-muted lg:mx-0">
              Adquion descarga tus documentos del SAT, organiza declaraciones y avisa a tus
              clientes automáticamente. Todo desde un solo panel.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group w-full rounded-lg bg-brand px-7 text-base font-bold text-brand-foreground shadow-none hover:bg-brand-hover sm:w-auto"
                >
                  Comenzar gratis
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("pricing")}
                className="w-full rounded-lg border-2 border-ink/15 px-7 text-base font-bold text-ink hover:bg-surface-alt sm:w-auto"
              >
                Ver planes
              </Button>
            </div>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <Check className="h-4 w-4 text-mint" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup de producto */}
          <div className="relative">
            <div className="rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-flat)]">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-mint/60" />
              </div>
              <div className="rounded-xl bg-surface-alt p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm font-bold text-ink">Panel fiscal</p>
                    <p className="text-xs text-ink-muted">Actualizado hace 2 minutos</p>
                  </div>
                  <span className="rounded-md bg-mint-soft px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-mint">
                    En línea
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Clientes", value: "148", icon: FileText },
                    { label: "Descargas", value: "3.2k", icon: Zap },
                    { label: "Alertas", value: "12", icon: ShieldCheck },
                  ].map((k) => (
                    <div key={k.label} className="rounded-lg border border-line bg-surface p-3">
                      <k.icon className="mb-2 h-4 w-4 text-brand" />
                      <p className="font-display text-xl font-extrabold text-ink">{k.value}</p>
                      <p className="text-[11px] text-ink-muted">{k.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { name: "Declaración mensual — Julio", w: "w-[86%]" },
                    { name: "CFDI recibidos", w: "w-[64%]" },
                    { name: "Constancias SAT", w: "w-[42%]" },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="rounded-lg border border-line bg-surface px-3 py-2.5"
                    >
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">{row.name}</span>
                        <span className="text-ink-muted">OK</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-alt">
                        <div className={`h-1.5 rounded-full bg-brand ${row.w}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
