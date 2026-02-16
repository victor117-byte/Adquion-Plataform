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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDashboardDeclaraciones,
  usePdfViewer,
  type Declaracion,
  type FiltrosDeclaraciones,
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
  import.meta.url
).toString();

// ==================== PDF Renderer ====================

const ZOOM_STEP = 0.2;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const file = useMemo(
    () => (base64 ? `data:application/pdf;base64,${base64}` : null),
    [base64]
  );

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + ZOOM_STEP, ZOOM_MAX)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - ZOOM_STEP, ZOOM_MIN)), []);
  const zoomReset = useCallback(() => setScale(1), []);
  const zoomPercent = Math.round(scale * 100);

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando documento...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{fetchError}</p>
      </div>
    );
  }

  if (!file) return null;

  // Base width for the PDF page (fit container at scale=1)
  const pageWidth = containerWidth > 0 ? (containerWidth - 2) * scale : undefined;

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Zoom controls */}
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
      {/* PDF scroll area */}
      <div ref={containerRef} className="flex-1 overflow-auto rounded-md border bg-muted/30 min-h-0">
        <Document
          file={file}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
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
      </div>
    </div>
  );
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

// ==================== Main Component ====================

export function Dashboard2Section() {
  const { user } = useAuth();
  const organizacion = user?.organizacionActiva?.database;

  // Filtros
  const [filterRfc, setFilterRfc] = useState("");
  const [filterRazonSocial, setFilterRazonSocial] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterBusqueda, setFilterBusqueda] = useState("");

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
  };

  const {
    data,
    kpis,
    pagination,
    loading,
    error,
    initialized,
    initializing,
  } = useDashboardDeclaraciones(organizacion, filtros, page, limit, sortBy, sortOrder);

  // PDF viewers (on-demand)
  const declaracionPdf = usePdfViewer(organizacion);
  const pagoPdf = usePdfViewer(organizacion);
  const [selectedDeclaracion, setSelectedDeclaracion] = useState<Declaracion | null>(null);

  const handleOpenPdfs = useCallback(async (d: Declaracion) => {
    setSelectedDeclaracion(d);
    if (d.tiene_pdf && d.num_de_operacion) {
      declaracionPdf.fetchPdf(d.num_de_operacion, "py_declaracion");
    }
    if (d.tiene_pdf_pago && d.num_de_operacion) {
      pagoPdf.fetchPdf(d.num_de_operacion, "py_pago");
    }
  }, [declaracionPdf, pagoPdf]);

  const handleClosePdf = useCallback(() => {
    setSelectedDeclaracion(null);
    declaracionPdf.cerrarPdf();
    pagoPdf.cerrarPdf();
  }, [declaracionPdf, pagoPdf]);

  const downloadPdf = useCallback((base64: string | null, filename: string) => {
    if (!base64) return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    link.click();
  }, []);

  const hasFilters = filterRfc || filterRazonSocial || filterEstado !== "all" || filterBusqueda;

  const clearFilters = () => {
    setFilterRfc("");
    setFilterRazonSocial("");
    setFilterEstado("all");
    setFilterBusqueda("");
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

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortBy === field ? "text-primary" : "text-muted-foreground/50"}`} />
      </div>
    </TableHead>
  );

  const renderRow = (d: Declaracion, index: number) => {
    const impFavor = Number(d.impuesto_a_favor) || 0;
    const totalPagar = Number(d.total_a_pagar_unico) || 0;
    const status = statusConfig[d.estatus_pago] || statusConfig.Pendiente;

    return (
      <TableRow key={`${d.rfc}-${d.linea_de_captura}-${index}`}>
        <TableCell className="font-medium max-w-[200px] truncate" title={d.razon_social || ""}>
          {d.razon_social}
        </TableCell>
        <TableCell className="font-mono text-sm">{d.rfc}</TableCell>
        <TableCell className="text-sm">{d.fecha_y_hora_presentacion}</TableCell>
        <TableCell className="font-mono text-sm">{d.linea_de_captura}</TableCell>
        <TableCell className="text-sm">{d.vigente_hasta || "—"}</TableCell>
        <TableCell className="text-sm">{d.fecha_de_pago || "—"}</TableCell>
        <TableCell className="text-right">
          {impFavor > 0 ? (
            <span className="text-success font-medium">{formatCurrency(impFavor)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          {totalPagar > 0 ? (
            <span className="font-medium">{formatCurrency(totalPagar)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant="secondary" className={status.className}>
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
              <span className="text-muted-foreground">—</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="razon_social">Razón Social</SortableHeader>
                    <SortableHeader field="rfc">RFC</SortableHeader>
                    <SortableHeader field="fecha_y_hora_presentacion">Fecha de Presentación</SortableHeader>
                    <SortableHeader field="linea_de_captura">Línea de Captura</SortableHeader>
                    <SortableHeader field="vigente_hasta">Vigencia</SortableHeader>
                    <SortableHeader field="fecha_de_pago">Fecha de Pago</SortableHeader>
                    <TableHead className="text-right">Impuesto a Favor</TableHead>
                    <SortableHeader field="total_a_pagar_unico">
                      <span className="ml-auto">Total a Pagar</span>
                    </SortableHeader>
                    <SortableHeader field="estatus_pago">
                      <span className="mx-auto">Estado</span>
                    </SortableHeader>
                    <TableHead className="text-center">Acciones</TableHead>
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
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!pagination.has_prev}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!pagination.has_prev}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">{pagination.page}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!pagination.has_next}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!pagination.has_next}
              onClick={() => setPage(pagination.total_pages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={selectedDeclaracion !== null} onOpenChange={(open) => { if (!open) handleClosePdf(); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[95vh] sm:h-[90vh] flex flex-col p-0">
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
