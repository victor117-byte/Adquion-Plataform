import { KeyRound, DownloadCloud, BellRing, LayoutDashboard } from "lucide-react";

const steps = [
  {
    icon: KeyRound,
    title: "1. Conecta tu RFC",
    description:
      "Ingresa tus credenciales del SAT una sola vez. Quedan cifradas — Adquion las usa solo para trabajar en tu nombre.",
  },
  {
    icon: DownloadCloud,
    title: "2. Adquion trabaja por ti",
    description:
      "Todos los días entra al SAT y descarga tus CFDI, constancias y opiniones de cumplimiento nuevas, sin que muevas un dedo.",
  },
  {
    icon: BellRing,
    title: "3. Te avisamos a tiempo",
    description:
      "Recibes una notificación por WhatsApp o correo antes de cada fecha límite, o si algo necesita tu atención.",
  },
  {
    icon: LayoutDashboard,
    title: "4. Revisa tu panel",
    description:
      "Todo tu historial fiscal queda organizado y buscable, con reportes listos para exportar cuando los necesites.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="bg-surface-alt px-4 py-20 sm:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Cómo funciona
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl">
            De tus credenciales del SAT a un panel siempre al día
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            No hay que instalar nada ni copiar archivos a mano. Conectas tu RFC una vez y
            Adquion se encarga del resto, todos los días.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[var(--shadow-flat)]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
