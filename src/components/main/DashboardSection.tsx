import { FileText, Users, Upload, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlanLimitsCard } from "./PlanLimitsCard";
import { useSubscription } from "@/hooks/use-subscription";

const statsData = [
  {
    title: "Documentos Procesados",
    value: "127",
    change: "+12%",
    changeType: "positive" as const,
    icon: FileText,
  },
  {
    title: "Contribuyentes Activos",
    value: "45",
    change: "+5 nuevos",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Documentos Pendientes",
    value: "8",
    change: "Por procesar",
    changeType: "neutral" as const,
    icon: Upload,
  },
  {
    title: "Automatizaciones",
    value: "12",
    change: "Ejecutadas hoy",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const recentActivity = [
  {
    id: 1,
    title: "Documento procesado: Factura-2025-001.pdf",
    time: "Hace 2 horas",
    status: "Completado",
    statusColor: "text-success",
  },
  {
    id: 2,
    title: "Nuevo contribuyente agregado: Empresa ABC S.A.",
    time: "Hace 5 horas",
    status: "Nuevo",
    statusColor: "text-info",
  },
  {
    id: 3,
    title: "Automatización SAT ejecutada",
    time: "Hace 8 horas",
    status: "Exitoso",
    statusColor: "text-success",
  },
  {
    id: 4,
    title: "Notificación enviada a 15 contribuyentes",
    time: "Ayer",
    status: "Enviado",
    statusColor: "text-primary",
  },
];

export function DashboardSection() {
  const { subscription } = useSubscription();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen general de tu cuenta
          </p>
        </div>
        {/* Plan Limits Card - Only shows for free users or when near limits */}
        <div className="lg:w-80">
          <PlanLimitsCard />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <Card key={stat.title} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </h3>
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className={`text-sm mt-1 ${
              stat.changeType === 'positive' ? 'text-success' : 'text-muted-foreground'
            }`}>
              {stat.change}
            </p>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Actividad Reciente</h2>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
                <span className={`text-sm font-medium ${activity.statusColor}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Estado del Sistema</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conexión SAT</span>
              <span className="text-sm font-medium text-success">Activa</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Última sincronización</span>
              <span className="text-sm font-medium text-foreground">Hace 1 hora</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Notificaciones</span>
              <span className="text-sm font-medium text-success">Habilitadas</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Plan actual</span>
              <span className="text-sm font-medium text-primary">
                {subscription?.plan_name || 'Cargando...'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
