import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAPI } from "@/utils/api";

// ==================== TIPOS ====================

export interface Declaracion {
  razon_social: string | null;
  rfc: string | null;
  fecha_y_hora_presentacion: string | null;
  linea_de_captura: string | null;
  impuesto_a_favor: string | null;
  total_a_pagar_unico: number;
  estatus_pago: "Pagado" | "Pendiente" | "Vencido";
  fecha_de_pago: string | null;
  fecha_hasta: string | null;
  ejercicio: string | null;
  periodo_de_declaracion: string | null;
  num_de_operacion: string | null;
  tiene_pdf: boolean;
  pdf_base64: string | null;
  pdf_pago: string | null;
  ruta_pago: string | null;
}

export interface KPIs {
  total_declaraciones: number;
  total_pagadas: number;
  total_pendientes: number;
  total_vencidas: number;
  porcentaje_cumplimiento: number;
  monto_total_declarado: number;
  monto_pagado: number;
  monto_pendiente: number;
  contribuyentes_activos: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FiltrosDeclaraciones {
  rfc?: string;
  razon_social?: string;
  ejercicio?: string;
  periodo?: string;
  estatus_pago?: string;
  busqueda?: string;
}

interface DashboardResponse {
  success: boolean;
  data: Declaracion[];
  pagination: Pagination;
  kpis: KPIs;
}

interface InitializeResponse {
  success: boolean;
  message: string;
}

// ==================== HOOK PDF ====================

export function usePdfViewer() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verPdf = useCallback((base64: string | null) => {
    if (!base64) {
      setError("No hay PDF disponible");
      return;
    }
    setError(null);
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch {
      setError("Error al procesar el PDF");
    }
  }, []);

  const cerrarPdf = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setError(null);
  }, [pdfUrl]);

  return { pdfUrl, verPdf, cerrarPdf, error };
}

// ==================== HOOK PRINCIPAL ====================

export function useDashboardDeclaraciones(
  organizacion: string | undefined,
  filtros: FiltrosDeclaraciones = {},
  page = 1,
  limit = 20,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
) {
  const [data, setData] = useState<Declaracion[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(false);

  // Serializar filtros para dependencias estables
  const filtrosKey = JSON.stringify(filtros);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Inicializar dashboard
  const initialize = useCallback(async () => {
    if (!organizacion) return;
    setInitializing(true);
    try {
      await fetchAPI<InitializeResponse>(
        "/dashboard-declaraciones/initialize",
        {
          method: "POST",
          body: JSON.stringify({ organizacion }),
        }
      );
      setInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al inicializar");
    } finally {
      setInitializing(false);
    }
  }, [organizacion]);

  // Siempre POST initialize al montar — CREATE OR REPLACE VIEW es idempotente
  // y asegura que la vista tenga los campos más recientes
  const autoInit = useCallback(async () => {
    if (!organizacion) return;
    await initialize();
  }, [organizacion, initialize]);

  // Fetch datos
  const fetchData = useCallback(async () => {
    if (!organizacion || initialized === false) return;
    setLoading(true);
    setError(null);
    try {
      const parsedFiltros: FiltrosDeclaraciones = JSON.parse(filtrosKey);
      const params = new URLSearchParams({
        organizacion,
        page: String(page),
        limit: String(limit),
      });

      if (parsedFiltros.rfc) params.set("rfc", parsedFiltros.rfc);
      if (parsedFiltros.razon_social) params.set("razon_social", parsedFiltros.razon_social);
      if (parsedFiltros.ejercicio) params.set("ejercicio", parsedFiltros.ejercicio);
      if (parsedFiltros.periodo) params.set("periodo", parsedFiltros.periodo);
      if (parsedFiltros.estatus_pago) params.set("estatus_pago", parsedFiltros.estatus_pago);
      if (parsedFiltros.busqueda) params.set("busqueda", parsedFiltros.busqueda);
      if (sortBy) params.set("sort_by", sortBy);
      if (sortOrder) params.set("sort_order", sortOrder);

      const res = await fetchAPI<DashboardResponse>(
        `/dashboard-declaraciones?${params.toString()}`
      );
      setData(res.data);
      setKpis(res.kpis);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [organizacion, initialized, filtrosKey, page, limit, sortBy, sortOrder]);

  // Check initialization on mount — auto-init if needed
  useEffect(() => {
    autoInit();
  }, [autoInit]);

  // Fetch data with debounce for filter changes
  useEffect(() => {
    if (initialized !== true) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchData, initialized]);

  return {
    data,
    kpis,
    pagination,
    loading,
    error,
    initialized,
    initializing,
    initialize,
    refetch: fetchData,
  };
}
