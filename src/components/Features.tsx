import { FileText, Users, Bell, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: FileText,
    tone: "brand",
    title: "Automatización SAT",
    description:
      "Descarga programada de documentos fiscales todos los días, sin intervención manual.",
    points: ["Ejecuciones diarias", "CFDI y constancias", "Historial completo"],
  },
  {
    icon: Users,
    tone: "mint",
    title: "Multiempresa",
    description:
      "Administra hasta 150 contribuyentes con paneles individuales y KPIs en tiempo real — tu negocio, tus otras empresas, o los de tu equipo.",
    points: ["Perfiles por RFC", "Roles de equipo", "Reportes listos"],
  },
  {
    icon: Bell,
    tone: "ink",
    title: "Notificaciones automáticas",
    description:
      "Avisos por WhatsApp y correo para que nunca se te pase una fecha límite o un documento pendiente.",
    points: ["WhatsApp y Email", "Recordatorios", "Plantillas propias"],
  },
];

const toneClasses: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  mint: "bg-mint-soft text-mint",
  ink: "bg-surface-alt text-ink",
};

const stats = [
  { value: "150", label: "contribuyentes por cuenta" },
  { value: "3x", label: "ejecuciones diarias" },
  { value: "7 GB", label: "de almacenamiento" },
  { value: "24/7", label: "monitoreo activo" },
];

export const Features = () => {
  return (
    <section id="features" className="bg-surface px-4 py-20 sm:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Características
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Todo el trabajo repetitivo, resuelto
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Una sola plataforma para descargar, organizar y comunicar tu información
            fiscal — seas una empresa, un negocio o trabajes por tu cuenta.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[var(--shadow-flat)]"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${toneClasses[feature.tone]}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {feature.description}
                </p>
                <ul className="mt-5 space-y-2 border-t border-line pt-5">
                  {feature.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-ink">
                      <ArrowUpRight className="h-4 w-4 text-brand" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface px-6 py-7 text-center">
              <p className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
