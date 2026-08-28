import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "contacto@converso.mx";

const columns = [
  {
    title: "Producto",
    links: [
      { label: "Características", to: "/#features" },
      { label: "Gratis", to: "/#apoyo" },
      { label: "Dashboard", to: "/main" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Comentarios", to: "/comentarios" },
      { label: "Contacto", to: `mailto:${CONTACT_EMAIL}` },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-line bg-surface px-4 py-14">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                <BarChart3 className="h-4.5 w-4.5 text-brand-foreground" />
              </span>
              <span className="font-display text-xl font-extrabold text-ink">Adquion</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
              Automatización fiscal para empresas, negocios y personas que trabajan por su
              cuenta. Descarga SAT, notificaciones y reportes en tiempo real — gratis
              durante el lanzamiento.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to.startsWith("mailto:") ? (
                      <a
                        href={l.to}
                        className="text-sm text-ink-muted transition-colors hover:text-brand"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.to}
                        className="text-sm text-ink-muted transition-colors hover:text-brand"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-sm text-ink-muted">
            © {new Date().getFullYear()} Adquion. Todos los derechos reservados.
          </p>
          <p className="text-sm text-ink-muted">Hecho en México</p>
        </div>
      </div>
    </footer>
  );
};
