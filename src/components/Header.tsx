import { BarChart3, ChevronDown, Building2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Características", href: "/#features" },
  { label: "Gratis", href: "/#apoyo" },
  { label: "Comentarios", href: "/comentarios" },
];

export const Header = () => {
  const { user, logout, switchOrganization } = useAuth();

  const hasMultipleOrgs = user && user.organizaciones && user.organizaciones.length > 1;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-line bg-surface/95 backdrop-blur-lg">
      <div className="container mx-auto flex h-20 items-center justify-between px-3 sm:px-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand transition-transform group-hover:scale-110">
            <BarChart3 className="h-4.5 w-4.5 text-brand-foreground" />
          </span>
          <span className="font-display text-xl font-extrabold text-ink">Adquion</span>
        </Link>

        {!user && (
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) =>
              link.href.startsWith("/#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <>
              {/* Selector de Organización */}
              {hasMultipleOrgs ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-lg border-2 border-ink/15 text-ink hover:bg-surface-alt"
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="max-w-[120px] truncate">
                        {user.organizacionActiva?.nombre || 'Organización'}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Cambiar organización</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.organizaciones.map((org) => (
                      <DropdownMenuItem
                        key={org.database}
                        onClick={() => switchOrganization(org.database)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{org.nombre}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {org.rol}
                          </span>
                        </div>
                        {user.organizacionActiva?.database === org.database && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-ink">{user.nombre}</span>
                  <span className="text-xs text-ink-muted">
                    {user.organizacionActiva?.nombre}
                  </span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-ink-muted hover:bg-surface-alt hover:text-ink"
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-xs font-semibold text-ink hover:bg-surface-alt sm:px-4 sm:text-sm"
                >
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button
                  size="sm"
                  className="rounded-lg bg-brand px-3 text-xs font-bold text-brand-foreground shadow-none hover:bg-brand-hover sm:px-4 sm:text-sm"
                >
                  Comenzar gratis
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
