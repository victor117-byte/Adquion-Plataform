import { useState, useEffect, useCallback } from "react";
import { get } from "@/utils/api";

export interface DashboardOverviewStats {
  documentos_procesados: number;
  contribuyentes_activos: number;
  declaraciones_pendientes: number;
  automatizaciones_hoy: number;
}

export interface ActividadItem {
  tipo: "documento" | "contribuyente" | "automatizacion";
  titulo: string;
  detalle: string | null;
  fecha: string;
}

export interface DashboardSistema {
  conexion_sat: "activa" | "con_errores" | "sin_datos";
  ultima_sincronizacion: string | null;
}

interface DashboardOverviewResponse {
  success: boolean;
  stats: DashboardOverviewStats;
  actividad_reciente: ActividadItem[];
  sistema: DashboardSistema;
}

export function useDashboardOverview(organizacion: string | undefined) {
  const [stats, setStats] = useState<DashboardOverviewStats | null>(null);
  const [actividadReciente, setActividadReciente] = useState<ActividadItem[]>([]);
  const [sistema, setSistema] = useState<DashboardSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!organizacion) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ organizacion });
      const res = await get<DashboardOverviewResponse>(`/dashboard-overview?${params.toString()}`);
      setStats(res.stats);
      setActividadReciente(res.actividad_reciente);
      setSistema(res.sistema);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, [organizacion]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { stats, actividadReciente, sistema, loading, error, refetch: fetchOverview };
}
