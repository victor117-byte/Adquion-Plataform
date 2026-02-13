import { useState } from "react";
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
    initialize,
  } = useDashboardDeclaraciones(organizacion, filtros, page, limit, sortBy, sortOrder);

  // PDF viewer
  const declaracionPdf = usePdfViewer();
  const pagoPdf = usePdfViewer();
  const [selectedDeclaracion, setSelectedDeclaracion] = useState<Declaracion | null>(null);

  const handleOpenPdfs = (d: Declaracion) => {
    setSelectedDeclaracion(d);
    if (d.pdf_base64) declaracionPdf.verPdf(d.pdf_base64);
    if (d.pdf_pago) pagoPdf.verPdf(d.pdf_pago);
  };

  const handleClosePdf = () => {
    setSelectedDeclaracion(null);
    declaracionPdf.cerrarPdf();
    pagoPdf.cerrarPdf();
  };

  const downloadPdf = (base64: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    link.click();
  };

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
        <TableCell className="text-sm">{d.fecha_hasta || "—"}</TableCell>
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
            {(d.pdf_base64 || d.pdf_pago) ? (
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
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Fecha</p>
            <p className="text-sm">{d.fecha_y_hora_presentacion}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vigencia</p>
            <p className="text-sm">{d.fecha_hasta || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Impuesto a Favor</p>
            <p className={impFavor > 0 ? "text-success font-medium" : "text-muted-foreground"}>
              {impFavor > 0 ? formatCurrency(impFavor) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total a Pagar</p>
            <p className={totalPagar > 0 ? "font-medium" : "text-muted-foreground"}>
              {totalPagar > 0 ? formatCurrency(totalPagar) : "—"}
            </p>
          </div>
        </div>
        {(d.pdf_base64 || d.pdf_pago) && (
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleOpenPdfs(d)}>
              <Eye className="h-3 w-3" /> Ver documentos
            </Button>
          </div>
        )}
      </Card>
    );
  };

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
                    <SortableHeader field="fecha_hasta">Vigencia</SortableHeader>
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
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
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

          {selectedDeclaracion?.pdf_base64 && selectedDeclaracion?.pdf_pago ? (
            <Tabs defaultValue="declaracion" className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-3 flex items-center justify-between gap-2">
                <TabsList>
                  <TabsTrigger value="declaracion" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Declaración
                  </TabsTrigger>
                  <TabsTrigger value="pago" className="gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Comprobante de Pago
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-1">
                  {selectedDeclaracion.pdf_base64 && (
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => downloadPdf(selectedDeclaracion.pdf_base64!, `declaracion_${selectedDeclaracion.rfc}.pdf`)}>
                      <Download className="h-3.5 w-3.5" />
                      Declaración
                    </Button>
                  )}
                  {selectedDeclaracion.pdf_pago && (
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => downloadPdf(selectedDeclaracion.pdf_pago!, `pago_${selectedDeclaracion.rfc}.pdf`)}>
                      <Download className="h-3.5 w-3.5" />
                      Pago
                    </Button>
                  )}
                </div>
              </div>
              <TabsContent value="declaracion" className="flex-1 px-6 pb-6 mt-3 min-h-0">
                {declaracionPdf.error ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-destructive">{declaracionPdf.error}</p>
                  </div>
                ) : declaracionPdf.pdfUrl ? (
                  <iframe src={declaracionPdf.pdfUrl} className="w-full h-full rounded-md border" title="PDF Declaración" />
                ) : null}
              </TabsContent>
              <TabsContent value="pago" className="flex-1 px-6 pb-6 mt-3 min-h-0">
                {pagoPdf.error ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-destructive">{pagoPdf.error}</p>
                  </div>
                ) : pagoPdf.pdfUrl ? (
                  <iframe src={pagoPdf.pdfUrl} className="w-full h-full rounded-md border" title="PDF Comprobante de Pago" />
                ) : null}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedDeclaracion?.pdf_base64 ? "Declaración" : "Comprobante de Pago"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    const base64 = selectedDeclaracion?.pdf_base64 || selectedDeclaracion?.pdf_pago;
                    const type = selectedDeclaracion?.pdf_base64 ? "declaracion" : "pago";
                    if (base64) downloadPdf(base64, `${type}_${selectedDeclaracion?.rfc}.pdf`);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </Button>
              </div>
              <div className="flex-1 px-6 pb-6 mt-3 min-h-0">
                {(declaracionPdf.error || pagoPdf.error) ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-destructive">{declaracionPdf.error || pagoPdf.error}</p>
                  </div>
                ) : (declaracionPdf.pdfUrl || pagoPdf.pdfUrl) ? (
                  <iframe src={(declaracionPdf.pdfUrl || pagoPdf.pdfUrl)!} className="w-full h-full rounded-md border" title="PDF" />
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
