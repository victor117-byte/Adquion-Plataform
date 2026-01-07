import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
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
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
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

type SectionType = 'dashboard' | 'users' | 'contributors' | 'documents' | 'automations' | 'notifications' | 'powerbi' | 'settings';

interface NavItem {
  id: SectionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
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
];

export default function Main() {
  const { user, logout, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasReportes, setHasReportes] = useState(false);
  const [checkingReportes, setCheckingReportes] = useState(true);

  useEffect(() => {
    // Verificar si hay reportes disponibles
    const checkReportes = async () => {
      if (!user?.correo || !user?.organizacion) {
        setCheckingReportes(false);
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(
          `${API_URL}/reportes?correo=${encodeURIComponent(user.correo)}&organizacion=${encodeURIComponent(user.organizacion)}`
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
  }, [user]);

  if (loading || checkingReportes) {
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

  // Filtrar items del menú según permisos y disponibilidad de reportes
  const filteredNavItems = navItems.filter(item => {
    // Filtrar items solo para admin
    if (item.adminOnly && !isAdmin) return false;
    
    // Ocultar Reportes si no hay reportes configurados (para todos los usuarios)
    if (item.id === 'powerbi' && !hasReportes) return false;
    
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
          // Desktop
          "hidden md:block",
          sidebarCollapsed ? "md:w-16" : "md:w-64",
          // Mobile
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
        
        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {filteredNavItems.map((item) => (
            <Button 
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"} 
              className={cn(
                "w-full justify-start text-base md:text-sm h-12 md:h-10",
                sidebarCollapsed && "md:justify-center md:px-2"
              )}
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-5 w-5 md:h-4 md:w-4", (!sidebarCollapsed || mobileMenuOpen) && "mr-3")} />
              {(!sidebarCollapsed || mobileMenuOpen) && <span>{item.label}</span>}
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
              <Badge className="mt-1" variant={user.tipo_usuario === 'administrador' ? 'default' : 'secondary'}>
                {user.tipo_usuario}
              </Badge>
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Organización:</p>
                <p className="text-sm font-medium truncate">{user.organizacion}</p>
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
        "pt-16 md:pt-0", // Padding top en móvil para el botón de menú
        sidebarCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <div className="p-4 md:p-6 lg:p-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
