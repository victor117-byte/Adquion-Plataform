import { FileText, Users, Clock, ClipboardList, TrendingUp, CheckCircle, AlertTriangle, SearchX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanLimitsCard } from "./PlanLimitsCard";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardOverview, type ActividadItem } from "@/hooks/use-dashboard-overview";

const statCards = [
  { key: "documentos_procesados" as const, title: "Documentos Procesados", icon: FileText },
  { key: "contribuyentes_activos" as const, title: "Contribuyentes Activos", icon: Users },
  { key: "declaraciones_pendientes" as const, title: "Declaraciones Pendientes", icon: ClipboardList },
  { key: "automatizaciones_hoy" as const, title: "Automatizaciones Hoy", icon: TrendingUp },
];

const actividadConfig: Record<ActividadItem["tipo"], { icon: typeof FileText; label: string }> = {
  documento: { icon: FileText, label: "Documento subido" },
  contribuyente: { icon: Users, label: "Contribuyente agregado" },
  automatizacion: { icon: TrendingUp, label: "Automatización ejecutada" },
};

const conexionSatConfig = {
  activa: { label: "Activa", className: "text-success" },
  con_errores: { label: "Con errores", className: "text-destructive" },
  sin_datos: { label: "Sin datos", className: "text-muted-foreground" },
};

export function DashboardSection() {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const organizacion = user?.organizacionActiva?.database;
  const { stats, actividadReciente, sistema, loading, error } = useDashboardOverview(organizacion);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Resumen general de tu cuenta
          </p>
        </div>
        {/* Plan Limits Card - Only shows for free users or when near limits */}
        <div className="w-full lg:max-w-sm lg:ml-auto">
          <PlanLimitsCard />
        </div>
      </div>

      {error && !loading && (
        <Card className="p-6 flex flex-col items-center justify-center text-center gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.key} className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                {stat.title}
              </h3>
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats ? stats[stat.key] : "—"}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Actividad Reciente</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : actividadReciente.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <SearchX className="h-8 w-8 mb-2 text-muted-foreground/30" />
              <p className="text-sm">Aún no hay actividad registrada.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {actividadReciente.map((item, i) => {
                const config = actividadConfig[item.tipo];
                return (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-3 border-b border-border last:border-0 gap-1 sm:gap-2"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <config.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">
                          {config.label}: {item.titulo}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.fecha), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                    {item.detalle && (
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground shrink-0">
                        {item.detalle}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Estado del Sistema</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Conexión SAT</span>
              {loading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className={`text-xs sm:text-sm font-medium ${conexionSatConfig[sistema?.conexion_sat ?? "sin_datos"].className}`}>
                  {conexionSatConfig[sistema?.conexion_sat ?? "sin_datos"].label}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Última sincronización</span>
              {loading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {sistema?.ultima_sincronizacion
                    ? formatDistanceToNow(new Date(sistema.ultima_sincronizacion), { addSuffix: true, locale: es })
                    : "Sin datos"}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Plan actual</span>
              <span className="text-xs sm:text-sm font-medium text-primary">
                {subscription?.plan_name || "Cargando..."}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
