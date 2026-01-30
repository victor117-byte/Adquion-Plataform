import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Zap,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  CreditCard,
  Building2,
  ChevronDown,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";

// Import section components
import { DashboardSection } from "@/components/main/DashboardSection";
import { UsersSection } from "@/components/main/UsersSection";
import { ContributorsSection } from "@/components/main/ContributorsSection";
import { DocumentsSection } from "@/components/main/DocumentsSection";
import { AutomationsSection } from "@/components/main/AutomationsSection";
import { NotificationsSection } from "@/components/main/NotificationsSection";
import { PowerBISection } from "@/components/main/PowerBISection";
import { SettingsSection } from "@/components/main/SettingsSection";
import { SubscriptionSection } from "@/components/main/SubscriptionSection";
import { FeedbackButton } from "@/components/FeedbackButton";

type SectionType = 'dashboard' | 'users' | 'contributors' | 'documents' | 'automations' | 'notifications' | 'powerbi' | 'settings' | 'subscription';

interface NavItem {
  id: SectionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  freeOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', icon: Users, adminOnly: true },
  { id: 'contributors', label: 'Contribuyentes', icon: UserCheck },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'automations', label: 'Automatizaciones', icon: Zap },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'powerbi', label: 'Reportes', icon: BarChart3 },
  { id: 'settings', label: 'Configuración', icon: Settings, adminOnly: true },
  { id: 'subscription', label: 'Planes', icon: CreditCard, freeOnly: true },
];

export default function Main() {
  const { user, logout, loading, switchOrganization } = useAuth();
  const { isFree, loading: subLoading, refresh: refreshSubscription } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasReportes, setHasReportes] = useState(false);
  const [checkingReportes, setCheckingReportes] = useState(true);

  const hasMultipleOrgs = user && user.organizaciones && user.organizaciones.length > 1;
  const currentDatabase = user?.organizacionActiva?.database;

  // Leer sección y parámetros de pago desde URL query params
  useEffect(() => {
    const sectionParam = searchParams.get('section') as SectionType | null;
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    // Cambiar a la sección indicada
    if (sectionParam && navItems.some(item => item.id === sectionParam)) {
      setActiveSection(sectionParam);
    }

    // Sincronizar suscripción después de pago exitoso
    if (success === 'true') {
      const syncSubscription = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || '/api';
          const response = await fetch(`${API_URL}/stripe/sync`, {
            method: 'POST',
            credentials: 'include'
          });
          const data = await response.json();

          if (data.success && data.data.synced) {
            toast({
              title: '¡Bienvenido al plan ' + data.data.plan_name + '!',
              description: 'Tu suscripción ha sido actualizada correctamente',
            });
            // Recargar datos de suscripción
            refreshSubscription();
          } else {
            toast({
              title: 'Pago exitoso',
              description: 'Tu suscripción ha sido procesada',
            });
            refreshSubscription();
          }
        } catch (error) {
          console.error('Error sincronizando suscripción:', error);
          toast({
            title: 'Pago exitoso',
            description: 'Tu suscripción ha sido actualizada',
          });
          refreshSubscription();
        }
      };
      syncSubscription();
    } else if (canceled === 'true') {
      toast({
        title: 'Pago cancelado',
        description: 'El proceso de pago fue cancelado',
        variant: 'destructive',
      });
    }

    // Limpiar todos los parámetros de la URL
    if (sectionParam || success || canceled) {
      searchParams.delete('section');
      searchParams.delete('success');
      searchParams.delete('canceled');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  useEffect(() => {
    // Verificar si hay reportes disponibles
    const checkReportes = async () => {
      if (!currentDatabase) {
        setCheckingReportes(false);
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(
          `${API_URL}/reportes`,
          { credentials: 'include' }
        );

        const result = await response.json();

        if (result.success && result.data.reportes && result.data.reportes.length > 0) {
          setHasReportes(true);
        } else {
          setHasReportes(false);
        }
      } catch (error) {
        console.error('Error verificando reportes:', error);
        setHasReportes(false);
      } finally {
        setCheckingReportes(false);
      }
    };

    checkReportes();
  }, [currentDatabase]);

  if (loading || checkingReportes || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = user.tipo_usuario === 'administrador';

  // Filtrar items del menú según permisos y disponibilidad
  const filteredNavItems = navItems.filter(item => {
    // Filtrar items solo para admin
    if (item.adminOnly && !isAdmin) return false;

    // Ocultar Reportes si no hay reportes configurados
    if (item.id === 'powerbi' && !hasReportes) return false;

    // Mostrar Planes solo para usuarios free
    if (item.freeOnly && !isFree) return false;

    return true;
  });

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'users':
        return isAdmin ? <UsersSection /> : <Navigate to="/main" replace />;
      case 'contributors':
        return <ContributorsSection />;
      case 'documents':
        return <DocumentsSection />;
      case 'automations':
        return <AutomationsSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'powerbi':
        return <PowerBISection />;
      case 'settings':
        return isAdmin ? <SettingsSection /> : <Navigate to="/main" replace />;
      case 'subscription':
        return <SubscriptionSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay para cerrar menú móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full border-r border-border bg-card transition-all duration-300 z-50",
          "hidden md:block",
          sidebarCollapsed ? "md:w-16" : "md:w-64",
          mobileMenuOpen ? "block w-64" : "hidden"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 p-4 border-b border-border",
          sidebarCollapsed && "md:justify-center"
        )}>
          <div className="p-2 bg-gradient-to-br from-primary to-primary-hover rounded-xl shrink-0">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <span className="font-bold text-xl text-foreground">
              Adquion
            </span>
          )}
        </div>

        {/* Toggle Button - Solo desktop */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:block absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background p-0 shadow-sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <Menu className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Organization Switcher */}
        {hasMultipleOrgs && (!sidebarCollapsed || mobileMenuOpen) && (
          <div className="p-3 border-b border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-left h-auto py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.organizacionActiva?.nombre || 'Organización'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.tipo_usuario}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {filteredNavItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-base md:text-sm h-12 md:h-10",
                sidebarCollapsed && "md:justify-center md:px-2",
                item.freeOnly && "text-primary"
              )}
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-5 w-5 md:h-4 md:w-4", (!sidebarCollapsed || mobileMenuOpen) && "mr-3")} />
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <>
                  <span>{item.label}</span>
                  {item.freeOnly && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                      Upgrade
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-card",
          sidebarCollapsed && "md:flex md:flex-col md:items-center"
        )}>
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="mb-3 px-3">
              <p className="text-sm font-medium truncate">{user.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{user.correo}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.tipo_usuario === 'administrador' ? 'default' : 'secondary'}>
                  {user.tipo_usuario}
                </Badge>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-12 md:h-10",
              sidebarCollapsed && "md:justify-center md:px-2"
            )}
            onClick={logout}
            title={sidebarCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className={cn("h-5 w-5 md:h-4 md:w-4", (!sidebarCollapsed || mobileMenuOpen) && "mr-3")} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        "pt-16 md:pt-0",
        sidebarCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <div className="p-4 md:p-6 lg:p-8">
          {renderSection()}
        </div>
      </main>

      {/* Botón de feedback flotante */}
      <FeedbackButton />
    </div>
  );
}
