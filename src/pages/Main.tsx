import { useState } from "react";
import { Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FileText, 
  Zap, 
  Bell, 
  BarChart3,
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

type SectionType = 'dashboard' | 'users' | 'contributors' | 'documents' | 'automations' | 'notifications' | 'powerbi';

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
  { id: 'powerbi', label: 'Power BI', icon: BarChart3 },
];

export default function Main() {
  const { user, logout, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
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

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

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
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full border-r border-border bg-card transition-all duration-300 z-50",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 p-4 border-b border-border",
          sidebarCollapsed && "justify-center"
        )}>
          <div className="p-2 bg-gradient-to-br from-primary to-primary-hover rounded-xl shrink-0">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-xl text-foreground">
              Adquion
            </span>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background p-0 shadow-sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <Menu className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
        
        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {filteredNavItems.map((item) => (
            <Button 
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"} 
              className={cn(
                "w-full justify-start",
                sidebarCollapsed && "justify-center px-2"
              )}
              onClick={() => setActiveSection(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-4 w-4", !sidebarCollapsed && "mr-3")} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>
        
        {/* User Info & Logout */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 border-t border-border",
          sidebarCollapsed && "flex flex-col items-center"
        )}>
          {!sidebarCollapsed && (
            <div className="mb-3 px-3">
              <p className="text-sm font-medium truncate">{user.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{user.correo}</p>
              <Badge className="mt-1" variant={user.tipo_usuario === 'administrador' ? 'default' : 'secondary'}>
                {user.tipo_usuario}
              </Badge>
            </div>
          )}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
              sidebarCollapsed && "justify-center px-2"
            )}
            onClick={logout}
            title={sidebarCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className={cn("h-4 w-4", !sidebarCollapsed && "mr-3")} />
            {!sidebarCollapsed && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-6 lg:p-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
