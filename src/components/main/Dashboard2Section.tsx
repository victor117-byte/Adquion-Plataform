import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Search,
  X,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Users,
  TrendingUp,
  Loader2,
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDashboardDeclaraciones,
  usePdfViewer,
  useEjercicios,
  useUsuarios,
  type Declaracion,
  type FiltrosDeclaraciones,
  type PdfLookupParams,
} from "@/hooks/use-dashboard-declaraciones";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// ==================== PDF Renderer ====================

const ZOOM_STEP = 0.2;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

/** Convierte base64 a Uint8Array para evitar límites de data URI */
function base64ToUint8Array(b64: string): Uint8Array {
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function PdfRenderer({
  base64,
  loading: fetchLoading,
  error: fetchError,
}: {
  base64: string | null;
  loading: boolean;
  error: string | null;
}) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [renderError, setRenderError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Callback ref para el ResizeObserver — se conecta cuando el div se monta
  const observerRef = useRef<ResizeObserver | null>(null);
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    // Desconectar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    containerRef.current = el;
    if (!el) return;
    // Medir inmediatamente
    setContainerWidth(el.clientWidth);
    // Observar cambios de tamaño
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observerRef.current.observe(el);
  }, []);

  // Limpiar observer al desmontar
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    setNumPages(0);
    setRenderError(null);
  }, [base64]);

  const file = useMemo(() => {
    if (!base64) return null;
    try {
      return { data: base64ToUint8Array(base64) };
    } catch {
      return null;
    }
  }, [base64]);

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + ZOOM_STEP, ZOOM_MAX)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - ZOOM_STEP, ZOOM_MIN)), []);
  const zoomReset = useCallback(() => setScale(1), []);
  const zoomPercent = Math.round(scale * 100);

  const displayError = fetchError || renderError;
  const showPdf = !fetchLoading && !displayError && file;
  const pageWidth = containerWidth > 0 ? (containerWidth - 2) * scale : undefined;

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Zoom controls — solo visibles cuando hay PDF */}
      {showPdf && (
        <div className="flex items-center justify-center gap-1 shrink-0">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={zoomOut} disabled={scale <= ZOOM_MIN} title="Reducir">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-mono min-w-[52px]" onClick={zoomReset} title="Restablecer zoom">
            {zoomPercent}%
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={zoomIn} disabled={scale >= ZOOM_MAX} title="Ampliar">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          {scale !== 1 && (
            <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={zoomReset} title="Restablecer">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          {numPages > 0 && (
            <span className="text-xs text-muted-foreground ml-2">{numPages} pág.</span>
          )}
        </div>
      )}

      {/* Contenedor siempre montado para que el ref se conecte */}
      <div ref={setContainerRef} className="flex-1 overflow-auto rounded-md border bg-muted/30 min-h-0">
        {fetchLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando documento...</p>
          </div>
        )}

        {displayError && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{displayError}</p>
          </div>
        )}

        {!fetchLoading && !displayError && !file && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay PDF disponible</p>
          </div>
        )}

        {showPdf && (
          <Document
            file={file}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={(err) => {
              console.error("Error al cargar PDF:", err);
              setRenderError("Error al procesar el PDF");
            }}
            loading={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-destructive">Error al cargar el PDF</p>
              </div>
            }
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={pageWidth}
                className="mx-auto [&_canvas]:mx-auto"
                loading={null}
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}

// ==================== Resizable Column Hook ====================

const DEFAULT_COL_WIDTHS: Record<string, number> = {
  razon_social: 180,
  rfc: 140,
  linea_de_captura: 160,
  fecha_y_hora_presentacion: 150,
  vigente_hasta: 100,
  fecha_de_pago: 110,
  impuesto_a_favor: 110,
  total_a_pagar_unico: 110,
  estatus_pago: 100,
  acciones: 70,
};

const MIN_COL_WIDTH = 60;

function useResizableColumns(defaults: Record<string, number>) {
  const [widths, setWidths] = useState(defaults);
  const dragging = useRef<{ col: string; startX: number; startW: number } | null>(null);

  const onMouseDown = useCallback((col: string, e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = { col, startX: e.clientX, startW: widths[col] };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const diff = ev.clientX - dragging.current.startX;
      const newW = Math.max(MIN_COL_WIDTH, dragging.current.startW + diff);
      setWidths((prev) => ({ ...prev, [dragging.current!.col]: newW }));
    };
    const onMouseUp = () => {
      dragging.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [widths]);

  return { widths, onMouseDown };
}

// ==================== Helpers ====================

const formatCurrency = (amount: number | string | null | undefined) => {
  const num = Number(amount) || 0;
  const parts = num.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${intPart}.${parts[1]}`;
};

const statusConfig: Record<string, { className: string }> = {
  Pagado: { className: "bg-success/15 text-success hover:bg-success/20 border-0" },
  Pendiente: { className: "bg-warning/15 text-warning hover:bg-warning/20 border-0" },
  Vencido: { className: "bg-destructive/15 text-destructive hover:bg-destructive/20 border-0" },
};

/** Construye los parámetros de búsqueda de PDF a partir de una declaración */
function buildPdfLookup(d: Declaracion, tipo: "declaracion" | "pago" = "declaracion"): PdfLookupParams {
  if (tipo === "pago") {
    // Para pagos: num_operacion_pago o rfc + linea_de_captura
    return {
      num_de_operacion: d.num_operacion_pago,
      rfc: d.rfc,
      linea_de_captura: d.linea_de_captura,
    };
  }
  // Para declaraciones: 3 estrategias (num_de_operacion, rfc+linea, rfc+ejercicio+periodo)
  return {
    num_de_operacion: d.num_de_operacion,
    rfc: d.rfc,
    linea_de_captura: d.linea_de_captura,
    ejercicio: d.ejercicio,
    periodo_de_declaracion: d.periodo_de_declaracion,
  };
}

// ==================== Main Component ====================

export function Dashboard2Section() {
  const { user } = useAuth();
  const organizacion = user?.organizacionActiva?.database;
  const isAdmin = user?.tipo_usuario === "administrador";

  // Filtros
  const [filterRfc, setFilterRfc] = useState("");
  const [filterRazonSocial, setFilterRazonSocial] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterBusqueda, setFilterBusqueda] = useState("");
  const [filterEjercicio, setFilterEjercicio] = useState("all");
  const [selectedContadorId, setSelectedContadorId] = useState<number | undefined>();

  // Paginación
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Ordenamiento
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtros: FiltrosDeclaraciones = {
    rfc: filterRfc || undefined,
    razon_social: filterRazonSocial || undefined,
    estatus_pago: filterEstado !== "all" ? filterEstado : undefined,
    busqueda: filterBusqueda || undefined,
    ejercicio: filterEjercicio !== "all" ? filterEjercicio : undefined,
  };

  const {
    data,
    kpis,
    pagination,
    loading,
    error,
    initialized,
    initializing,
  } = useDashboardDeclaraciones(organizacion, filtros, page, limit, sortBy, sortOrder, selectedContadorId);

  const { ejercicios } = useEjercicios(organizacion, selectedContadorId);
  const { usuarios } = useUsuarios(isAdmin ? organizacion : undefined);

  // PDF viewers (on-demand)
  const declaracionPdf = usePdfViewer(organizacion);
  const pagoPdf = usePdfViewer(organizacion);
  const [selectedDeclaracion, setSelectedDeclaracion] = useState<Declaracion | null>(null);

  const handleOpenPdfs = useCallback(async (d: Declaracion) => {
    setSelectedDeclaracion(d);
    if (d.tiene_pdf) {
      const lookupDeclaracion = buildPdfLookup(d, "declaracion");
      declaracionPdf.fetchPdf(lookupDeclaracion, "py_declaracion");
    }
    if (d.tiene_pdf_pago) {
      const lookupPago = buildPdfLookup(d, "pago");
      pagoPdf.fetchPdf(lookupPago, "py_pago");
    }
  }, [declaracionPdf, pagoPdf]);

  const handleClosePdf = useCallback(() => {
    setSelectedDeclaracion(null);
    declaracionPdf.cerrarPdf();
    pagoPdf.cerrarPdf();
  }, [declaracionPdf, pagoPdf]);

  const downloadPdf = useCallback((base64: string | null, filename: string) => {
    if (!base64) return;
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Resizable columns
  const { widths: colW, onMouseDown } = useResizableColumns(DEFAULT_COL_WIDTHS);

  const hasFilters =
    filterRfc || filterRazonSocial || filterEstado !== "all" || filterBusqueda ||
    filterEjercicio !== "all" || selectedContadorId !== undefined;

  const clearFilters = () => {
    setFilterRfc("");
    setFilterRazonSocial("");
    setFilterEstado("all");
    setFilterBusqueda("");
    setFilterEjercicio("all");
    setSelectedContadorId(undefined);
    setPage(1);
  };

  const handleContadorChange = (contadorId: number | undefined) => {
    setSelectedContadorId(contadorId);
    setFilterEjercicio("all"); // los años disponibles pueden variar por usuario
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  // Estado: Inicializando automáticamente
  if (initialized === false || initializing) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Declaraciones</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gestión y seguimiento de declaraciones fiscales
          </p>
        </div>
        <Card className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Preparando dashboard...</p>
        </Card>
      </div>
    );
  }

  // Estado: Error
  if (error && !loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Declaraciones</h1>
        </div>
        <Card className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </Card>
      </div>
    );
  }

  // ---- Resizable header helper ----
  const ResizableHeader = ({ col, field, children, className = "" }: {
    col: string;
    field?: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`relative select-none ${field ? "cursor-pointer hover:text-foreground" : ""} ${className}`}
      style={{ width: colW[col], minWidth: MIN_COL_WIDTH }}
      onClick={field ? () => handleSort(field) : undefined}
    >
      <div className="flex items-center gap-1 pr-3">
        {children}
        {field && <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortBy === field ? "text-primary" : "text-muted-foreground/50"}`} />}
      </div>
      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center hover:bg-muted/50 z-10"
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(col, e); }}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground/30" />
      </div>
    </TableHead>
  );

  const renderRow = (d: Declaracion, index: number) => {
    const impFavor = Number(d.impuesto_a_favor) || 0;
    const totalPagar = Number(d.total_a_pagar_unico) || 0;
    const status = statusConfig[d.estatus_pago] || statusConfig.Pendiente;

    return (
      <TableRow key={`${d.rfc}-${d.linea_de_captura}-${index}`}>
        <TableCell className="font-medium truncate" style={{ maxWidth: colW.razon_social }} title={d.razon_social || ""}>
          {d.razon_social}
        </TableCell>
        <TableCell className="font-mono text-xs">{d.rfc}</TableCell>
        <TableCell className="font-mono text-xs truncate" style={{ maxWidth: colW.linea_de_captura }} title={d.linea_de_captura || ""}>
          {d.linea_de_captura}
        </TableCell>
        <TableCell className="text-xs">{d.fecha_y_hora_presentacion}</TableCell>
        <TableCell className="text-xs">{d.vigente_hasta || "—"}</TableCell>
        <TableCell className="text-xs">{d.fecha_de_pago || "—"}</TableCell>
        <TableCell className="text-right text-xs">
          {impFavor > 0 ? (
            <span className="text-success font-medium">{formatCurrency(impFavor)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right text-xs">
          {totalPagar > 0 ? (
            <span className="font-medium">{formatCurrency(totalPagar)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant="secondary" className={status.className + " text-[10px] px-1.5 py-0"}>
            {d.estatus_pago}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 justify-center">
            {(d.tiene_pdf || d.tiene_pdf_pago) ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver documentos" onClick={() => handleOpenPdfs(d)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderMobileCard = (d: Declaracion, index: number) => {
    const impFavor = Number(d.impuesto_a_favor) || 0;
    const totalPagar = Number(d.total_a_pagar_unico) || 0;
    const status = statusConfig[d.estatus_pago] || statusConfig.Pendiente;

    return (
      <Card
        key={`${d.rfc}-${d.linea_de_captura}-${index}`}
        className="p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{d.razon_social}</p>
            <p className="text-xs text-muted-foreground font-mono">{d.rfc}</p>
          </div>
          <Badge variant="secondary" className={status.className}>
            {d.estatus_pago}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Presentación</p>
            <p className="text-sm">{d.fecha_y_hora_presentacion}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vigencia</p>
            <p className="text-sm">{d.vigente_hasta || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha de Pago</p>
            <p className="text-sm">{d.fecha_de_pago || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total a Pagar</p>
            <p className={totalPagar > 0 ? "font-medium" : "text-muted-foreground"}>
              {totalPagar > 0 ? formatCurrency(totalPagar) : "—"}
            </p>
          </div>
          {impFavor > 0 && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Impuesto a Favor</p>
              <p className="text-success font-medium">{formatCurrency(impFavor)}</p>
            </div>
          )}
        </div>
        {(d.tiene_pdf || d.tiene_pdf_pago) && (
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleOpenPdfs(d)}>
              <Eye className="h-3 w-3" /> Ver documentos
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // Determine what PDFs are available for the dialog
  const hasBothPdfs = selectedDeclaracion?.tiene_pdf && selectedDeclaracion?.tiene_pdf_pago;
  const hasAnyPdf = selectedDeclaracion?.tiene_pdf || selectedDeclaracion?.tiene_pdf_pago;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Declaraciones</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Gestión y seguimiento de declaraciones fiscales
        </p>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total</h3>
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{kpis.total_declaraciones}</p>
            <p className="text-xs sm:text-sm mt-1 text-muted-foreground">Declaraciones</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Pagadas</h3>
              <div className="p-1.5 sm:p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{kpis.total_pagadas}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <p className="text-xs sm:text-sm text-success">{kpis.porcentaje_cumplimiento}% cumplimiento</p>
            </div>
          </Card>
          <Card className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Pendientes</h3>
              <div className="p-1.5 sm:p-2 bg-warning/10 rounded-lg">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{kpis.total_pendientes}</p>
            {kpis.total_vencidas > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <p className="text-xs sm:text-sm text-destructive">{kpis.total_vencidas} vencidas</p>
              </div>
            )}
            {kpis.total_vencidas === 0 && (
              <p className="text-xs sm:text-sm mt-1 text-warning">Por pagar</p>
            )}
          </Card>
          <Card className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Monto Pendiente</h3>
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(kpis.monto_pendiente)}</p>
            <div className="flex items-center gap-1 mt-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">{kpis.contribuyentes_activos} contribuyentes</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Búsqueda general..."
              value={filterBusqueda}
              onChange={(e) => handleFilterChange(setFilterBusqueda)(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por RFC..."
              value={filterRfc}
              onChange={(e) => handleFilterChange(setFilterRfc)(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por Razón Social..."
              value={filterRazonSocial}
              onChange={(e) => handleFilterChange(setFilterRazonSocial)(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="Pagado">Pagado</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterEjercicio} onValueChange={(v) => { setFilterEjercicio(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Año fiscal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los años</SelectItem>
              {ejercicios.map((ej) => (
                <SelectItem key={ej} value={ej}>{ej}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && usuarios.length > 0 && (
            <Select
              value={selectedContadorId !== undefined ? String(selectedContadorId) : "all"}
              onValueChange={(v) => handleContadorChange(v === "all" ? undefined : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ver como..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {(() => {
                  const admins = usuarios.filter(u => u.tipo_usuario === "administrador");
                  const contadores = usuarios.filter(u => u.tipo_usuario === "contador");
                  return (
                    <>
                      {admins.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Administradores</SelectLabel>
                          {admins.map(u => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.nombre} ({u.total_contribuyentes})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {contadores.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Contadores</SelectLabel>
                          {contadores.map(u => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.nombre} ({u.total_contribuyentes})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </>
                  );
                })()}
              </SelectContent>
            </Select>
          )}
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Tabla desktop */}
      {!loading && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <ResizableHeader col="razon_social" field="razon_social">Razón Social</ResizableHeader>
                    <ResizableHeader col="rfc" field="rfc">RFC</ResizableHeader>
                    <ResizableHeader col="linea_de_captura" field="linea_de_captura">Línea de Captura</ResizableHeader>
                    <ResizableHeader col="fecha_y_hora_presentacion" field="fecha_y_hora_presentacion">Presentación</ResizableHeader>
                    <ResizableHeader col="vigente_hasta" field="vigente_hasta">Vigencia</ResizableHeader>
                    <ResizableHeader col="fecha_de_pago" field="fecha_de_pago">Fecha Pago</ResizableHeader>
                    <ResizableHeader col="impuesto_a_favor" className="text-right">Imp. a Favor</ResizableHeader>
                    <ResizableHeader col="total_a_pagar_unico" field="total_a_pagar_unico" className="text-right">Total a Pagar</ResizableHeader>
                    <ResizableHeader col="estatus_pago" field="estatus_pago" className="text-center">Estado</ResizableHeader>
                    <TableHead className="text-center" style={{ width: colW.acciones, minWidth: MIN_COL_WIDTH }}>Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No se encontraron declaraciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((d, i) => renderRow(d, i))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {data.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No se encontraron declaraciones
              </Card>
            ) : (
              data.map((d, i) => renderMobileCard(d, i))
            )}
          </div>
        </>
      )}

      {/* Paginación */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.total_pages} — {pagination.total} declaraciones
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!pagination.has_prev} onClick={() => setPage(1)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!pagination.has_prev} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">{pagination.page}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!pagination.has_next} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!pagination.has_next} onClick={() => setPage(pagination.total_pages)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={selectedDeclaracion !== null} onOpenChange={(open) => { if (!open) handleClosePdf(); }}>
        <DialogContent className="max-w-5xl w-full sm:w-[95vw] h-[100dvh] sm:h-[90vh] sm:rounded-lg rounded-none flex flex-col p-0">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-base font-semibold">
                  {selectedDeclaracion?.razon_social}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-mono">{selectedDeclaracion?.rfc}</span>
                  <span className="text-muted-foreground/40">|</span>
                  <span>Periodo {selectedDeclaracion?.periodo_de_declaracion}/{selectedDeclaracion?.ejercicio}</span>
                  {selectedDeclaracion?.estatus_pago && (
                    <>
                      <span className="text-muted-foreground/40">|</span>
                      <Badge variant="secondary" className={statusConfig[selectedDeclaracion.estatus_pago]?.className + " text-[10px] px-1.5 py-0"}>
                        {selectedDeclaracion.estatus_pago}
                      </Badge>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {hasBothPdfs ? (
            <Tabs defaultValue="declaracion" className="flex-1 flex flex-col min-h-0">
              <div className="px-4 sm:px-6 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
                <TabsList>
                  <TabsTrigger value="declaracion" className="gap-1.5 text-xs sm:text-sm">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Declaración</span>
                    <span className="sm:hidden">Decl.</span>
                  </TabsTrigger>
                  <TabsTrigger value="pago" className="gap-1.5 text-xs sm:text-sm">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Comprobante de Pago</span>
                    <span className="sm:hidden">Pago</span>
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-1">
                  {declaracionPdf.pdfBase64 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 text-xs gap-1.5"
                      onClick={() => downloadPdf(declaracionPdf.pdfBase64, `declaracion_${selectedDeclaracion?.rfc}.pdf`)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Declaración</span>
                      <span className="sm:hidden">Decl.</span>
                    </Button>
                  )}
                  {pagoPdf.pdfBase64 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 text-xs gap-1.5"
                      onClick={() => downloadPdf(pagoPdf.pdfBase64, `pago_${selectedDeclaracion?.rfc}.pdf`)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Pago
                    </Button>
                  )}
                </div>
              </div>
              <TabsContent value="declaracion" className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 mt-3 min-h-0">
                <PdfRenderer
                  base64={declaracionPdf.pdfBase64}
                  loading={declaracionPdf.loading}
                  error={declaracionPdf.error}
                />
              </TabsContent>
              <TabsContent value="pago" className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 mt-3 min-h-0">
                <PdfRenderer
                  base64={pagoPdf.pdfBase64}
                  loading={pagoPdf.loading}
                  error={pagoPdf.error}
                />
              </TabsContent>
            </Tabs>
          ) : hasAnyPdf ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 sm:px-6 pt-3 flex items-center justify-between shrink-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedDeclaracion?.tiene_pdf ? "Declaración" : "Comprobante de Pago"}
                </p>
                {(declaracionPdf.pdfBase64 || pagoPdf.pdfBase64) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-8 text-xs gap-1.5"
                    onClick={() => {
                      const b64 = declaracionPdf.pdfBase64 || pagoPdf.pdfBase64;
                      const type = selectedDeclaracion?.tiene_pdf ? "declaracion" : "pago";
                      downloadPdf(b64, `${type}_${selectedDeclaracion?.rfc}.pdf`);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </Button>
                )}
              </div>
              <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 mt-3 min-h-0">
                <PdfRenderer
                  base64={declaracionPdf.pdfBase64 || pagoPdf.pdfBase64}
                  loading={declaracionPdf.loading || pagoPdf.loading}
                  error={declaracionPdf.error || pagoPdf.error}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
