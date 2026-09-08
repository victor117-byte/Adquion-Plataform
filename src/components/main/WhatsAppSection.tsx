import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot, Plus, Trash2, MessageSquare, Loader2,
  Phone, MoreHorizontal, Wifi, WifiOff, Copy,
  Check, ArrowLeft, RefreshCw, ZapOff, Zap,
  QrCode, Smartphone, Link2,
  Info, AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchAPI } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// ──────────────────────────────────────────────────────────────────────────────
// TIPOS
// ──────────────────────────────────────────────────────────────────────────────

type EstadoConexion = "esperando_qr" | "conectando" | "conectado" | "desconectado";

interface Canal {
  id: number;
  display_name: string;
  phone_number: string | null;
  estado_conexion: EstadoConexion;
  activo: boolean;
  system_prompt: string;
  contexto: string;
  modelo: string;
  temperatura: number;
  max_historial: number;
  created_at: string;
  updated_at: string;
}

interface QrInfo {
  image: string;
  expira_en: string;
}

interface Conversacion {
  id: number;
  jid: string;
  phone: string;
  canal_id: number;
  rfc: string | null;
  nombre_contacto: string | null;
  bot_activo: boolean;
  ultimo_mensaje_at: string;
}

interface Mensaje {
  id: number;
  conversacion_id: number;
  message_id: string | null;
  rol: "user" | "assistant";
  contenido: string;
  tipo: string;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// ESTILOS COMPARTIDOS
// ──────────────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition disabled:opacity-50";

const inputMonoCls = inputCls + " font-mono";

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:text-foreground transition"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
        : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function EstadoBadge({ estado }: { estado: EstadoConexion }) {
  const map: Record<EstadoConexion, { label: string; cls: string; dot: string }> = {
    conectado: { label: "Conectado", cls: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500" },
    conectando: { label: "Conectando…", cls: "bg-blue-500/10 text-blue-600", dot: "bg-blue-500 animate-pulse" },
    esperando_qr: { label: "Esperando código QR", cls: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500 animate-pulse" },
    desconectado: { label: "Desconectado", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
  };
  const s = map[estado];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function Spinner() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Pasos genéricos para vincular un dispositivo — iguales a los que el usuario ya
// conoce de WhatsApp Web, sin mencionar la tecnología detrás del QR.
const PASOS_VINCULACION = [
  "Abre WhatsApp en el celular que va a atender los mensajes del chatbot.",
  "Toca los tres puntos (Android) o Ajustes (iPhone), en la esquina superior.",
  'Selecciona "Dispositivos vinculados" y luego "Vincular un dispositivo".',
  "Apunta la cámara de tu celular a este código para escanearlo.",
];

// ──────────────────────────────────────────────────────────────────────────────
// ASISTENTE DE CONEXIÓN (crear número nuevo o reconectar uno existente)
// ──────────────────────────────────────────────────────────────────────────────

function ConnectWizard({
  canal,
  onClose,
  onConnected,
}: {
  /** null = crear número nuevo; un Canal = reconectar uno existente */
  canal: Canal | null;
  onClose: () => void;
  onConnected: (canal: Canal) => void;
}) {
  const [step, setStep] = useState<"nombre" | "qr" | "conectado">(canal ? "qr" : "nombre");
  const [displayName, setDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [qr, setQr] = useState<QrInfo | null>(null);
  const [loadingQr, setLoadingQr] = useState(canal !== null);
  const [expired, setExpired] = useState(false);
  const [activeCanal, setActiveCanal] = useState<Canal | null>(canal);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimers = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  const armCountdown = (expiraEn: string) => {
    if (tickRef.current) clearInterval(tickRef.current);
    const update = () => {
      const left = Math.max(0, Math.round((new Date(expiraEn).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) { setExpired(true); if (tickRef.current) clearInterval(tickRef.current); }
    };
    update();
    tickRef.current = setInterval(update, 1000);
  };

  const pollEstado = useCallback((canalId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetchAPI<{ estado_conexion: EstadoConexion; phone_number?: string }>(
          `/whatsapp/canales/${canalId}/estado`
        );
        if (res.estado_conexion === "conectado") {
          stopTimers();
          setStep("conectado");
          setActiveCanal(prev => prev ? { ...prev, estado_conexion: "conectado", phone_number: res.phone_number ?? prev.phone_number } : prev);
        }
      } catch {
        // Silencioso: un fallo puntual de polling no debe interrumpir la espera
      }
    }, 2500);
  }, []);

  useEffect(() => {
    if (canal) {
      // Reconectar: pedir un QR nuevo de inmediato
      (async () => {
        setLoadingQr(true);
        try {
          const res = await fetchAPI<{ qr: QrInfo }>(`/whatsapp/canales/${canal.id}/qr`);
          setQr(res.qr);
          setExpired(false);
          armCountdown(res.qr.expira_en);
          pollEstado(canal.id);
        } catch {
          toast({ title: "No se pudo generar el código QR", variant: "destructive" });
        } finally {
          setLoadingQr(false);
        }
      })();
    }
    return () => stopTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setCreating(true);
    try {
      const res = await fetchAPI<{ canal: Canal; qr: QrInfo }>("/whatsapp/canales", {
        method: "POST",
        body: JSON.stringify({ display_name: displayName.trim() }),
      });
      setActiveCanal(res.canal);
      setQr(res.qr);
      setExpired(false);
      armCountdown(res.qr.expira_en);
      setStep("qr");
      pollEstado(res.canal.id);
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "No se pudo iniciar la conexión", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const regenerarQr = async () => {
    if (!activeCanal) return;
    setLoadingQr(true);
    try {
      const res = await fetchAPI<{ qr: QrInfo }>(`/whatsapp/canales/${activeCanal.id}/qr`);
      setQr(res.qr);
      setExpired(false);
      armCountdown(res.qr.expira_en);
      pollEstado(activeCanal.id);
    } catch {
      toast({ title: "No se pudo generar un nuevo código", variant: "destructive" });
    } finally {
      setLoadingQr(false);
    }
  };

  const handleFinish = () => {
    stopTimers();
    if (activeCanal) onConnected(activeCanal);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) { stopTimers(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {canal ? "Reconectar WhatsApp" : "Conectar WhatsApp"}
          </DialogTitle>
        </DialogHeader>

        {step === "nombre" && (
          <form onSubmit={handleCrear} className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Ponle un nombre a este número para identificarlo dentro de la plataforma
              (tus clientes nunca lo ven).
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Nombre para identificarlo</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Atención a clientes"
                autoFocus
                disabled={creating}
                className={inputCls}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} disabled={creating}
                className="flex-1 rounded-lg border border-input py-2.5 text-sm font-medium hover:bg-muted transition disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={creating || !displayName.trim()}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60">
                {creating ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Generando código...</span> : "Continuar"}
              </button>
            </div>
          </form>
        )}

        {step === "qr" && (
          <div className="space-y-4 pt-1">
            <div className="flex justify-center">
              <div className="rounded-2xl border-2 border-border p-3 bg-white relative">
                {loadingQr ? (
                  <div className="flex h-48 w-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : qr ? (
                  <>
                    <img src={qr.image} alt="Código QR para vincular WhatsApp" className="h-48 w-48 object-contain" />
                    {expired && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/95">
                        <p className="text-xs font-medium text-muted-foreground">Código expirado</p>
                        <button onClick={regenerarQr}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition">
                          <RefreshCw className="h-3.5 w-3.5" /> Generar nuevo código
                        </button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
            {!expired && qr && (
              <p className="text-center text-xs text-muted-foreground">
                Este código expira en {secondsLeft}s
              </p>
            )}

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5" /> Cómo escanearlo
              </p>
              <ol className="space-y-1.5">
                {PASOS_VINCULACION.map((paso, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    {paso}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Esperando a que escanees el código...
            </div>

            <button type="button" onClick={onClose}
              className="w-full rounded-lg border border-input py-2.5 text-sm font-medium hover:bg-muted transition">
              Cerrar y continuar después
            </button>
          </div>
        )}

        {step === "conectado" && (
          <div className="space-y-4 pt-1 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">¡WhatsApp conectado!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ya puedes configurar cómo responde tu chatbot a tus clientes.
              </p>
            </div>
            <button onClick={handleFinish}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
              Configurar mi chatbot
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB: NÚMEROS (conexión + configuración del chatbot, todo en un solo lugar)
// ──────────────────────────────────────────────────────────────────────────────

interface ChatbotFields {
  display_name: string;
  activo: boolean;
  system_prompt: string;
  contexto: string;
  modelo: string;
  temperatura: number;
  max_historial: number;
}

function NumerosTab({ isAdmin }: { isAdmin: boolean }) {
  const isMobile = useIsMobile();
  const [canales, setCanales] = useState<Canal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fields, setFields] = useState<ChatbotFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Canal | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<Canal | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [reconnectTarget, setReconnectTarget] = useState<Canal | null>(null);

  const selected = canales.find(c => c.id === selectedId) ?? null;

  useEffect(() => { loadCanales(); }, []);
  useEffect(() => {
    // La organización solo puede tener un canal a la vez (el backend responde
    // 409 al intentar crear un segundo) — no hay nada que "elegir", así que se
    // selecciona directo también en móvil para no exigir un tap de más.
    if (canales.length > 0 && !selectedId) selectCanal(canales[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canales]);

  const loadCanales = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{ canales: Canal[] }>("/whatsapp/canales");
      setCanales(res.canales ?? []);
    } catch { /* sin datos aún — se muestra estado vacío */ }
    finally { setLoading(false); }
  };

  const syncFields = (c: Canal) => setFields({
    display_name: c.display_name, activo: c.activo,
    system_prompt: c.system_prompt ?? "", contexto: c.contexto ?? "",
    modelo: c.modelo || "llama-3.3-70b-versatile",
    temperatura: Number(c.temperatura ?? 0.3), max_historial: c.max_historial ?? 10,
  });

  const selectCanal = (c: Canal) => { setSelectedId(c.id); syncFields(c); };

  const handleSave = async () => {
    if (!selected || !fields) return;
    setSaving(true);
    try {
      const res = await fetchAPI<{ canal: Canal }>(`/whatsapp/canales/${selected.id}`, {
        method: "PATCH", body: JSON.stringify(fields),
      });
      setCanales(p => p.map(c => c.id === selected.id ? res.canal : c));
      syncFields(res.canal);
      toast({ title: "Chatbot guardado" });
    } catch { toast({ title: "Error guardando", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetchAPI(`/whatsapp/canales/${deleteTarget.id}`, { method: "DELETE" });
      await loadCanales();
      setSelectedId(null);
      setDeleteTarget(null);
      toast({ title: "Número eliminado" });
    } catch (e: unknown) { toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      const res = await fetchAPI<{ canal: Canal }>(`/whatsapp/canales/${disconnectTarget.id}/conexion`, { method: "DELETE" });
      setCanales(p => p.map(c => c.id === disconnectTarget.id ? res.canal : c));
      setDisconnectTarget(null);
      toast({ title: "Número desconectado" });
    } catch { toast({ title: "Error al desconectar", variant: "destructive" }); }
    finally { setDisconnecting(false); }
  };

  const set = <K extends keyof ChatbotFields>(k: K, v: ChatbotFields[K]) => setFields(p => p ? { ...p, [k]: v } : p);

  if (loading) return <Spinner />;

  const showList = isMobile ? !selectedId : true;
  const showDetail = isMobile ? !!selectedId : true;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 animate-fade-in">
      {/* Lista */}
      {showList && (
        <div className={cn("shrink-0 space-y-3", isMobile ? "w-full" : "w-[300px]")}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Mi número de WhatsApp</h2>
            {/* La organización solo puede tener un canal activo — el backend
                responde 409 si ya existe uno, así que el botón de conectar
                solo se ofrece cuando todavía no hay ninguno. */}
            {isAdmin && canales.length === 0 && (
              <button onClick={() => setWizardOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition">
                <Plus className="h-3.5 w-3.5" /> Conectar
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {canales.map(c => (
              <button key={c.id} onClick={() => selectCanal(c)}
                className={cn("flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                  c.id === selectedId ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/50")}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  c.estado_conexion === "conectado" ? "bg-emerald-500/10" : "bg-muted")}>
                  <Phone className={cn("h-4 w-4", c.estado_conexion === "conectado" ? "text-emerald-600" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{c.display_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate font-mono">
                    {c.phone_number || "Sin vincular todavía"}
                  </p>
                  <div className="mt-1.5"><EstadoBadge estado={c.estado_conexion} /></div>
                </div>
              </button>
            ))}
            {canales.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-center space-y-2">
                <Phone className="h-7 w-7 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">Sin números conectados</p>
                <p className="px-4 text-xs text-muted-foreground">
                  {isAdmin ? 'Toca "Conectar" para vincular el WhatsApp de tu despacho.' : "Aún no hay números conectados."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detalle */}
      {showDetail && selected && fields ? (
        <div className="flex-1 space-y-4 md:space-y-5 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button onClick={() => setSelectedId(null)}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">{selected.display_name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <EstadoBadge estado={selected.estado_conexion} />
                  {selected.phone_number && (
                    <span className="text-xs font-mono text-muted-foreground">{selected.phone_number}</span>
                  )}
                </div>
              </div>
            </div>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {selected.estado_conexion === "conectado" ? (
                    <DropdownMenuItem onClick={() => setDisconnectTarget(selected)} className="cursor-pointer">
                      <WifiOff className="mr-2 h-4 w-4" /> Desconectar este número
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setReconnectTarget(selected)} className="cursor-pointer">
                      <Wifi className="mr-2 h-4 w-4" /> Conectar / reconectar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDeleteTarget(selected)} className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar número
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Banner desconectado */}
          {selected.estado_conexion === "desconectado" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  Este número está <strong>desconectado</strong> — no puede recibir ni responder mensajes hasta que lo vincules de nuevo.
                </p>
              </div>
              {isAdmin && (
                <button onClick={() => setReconnectTarget(selected)}
                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition">
                  Reconectar
                </button>
              )}
            </div>
          )}

          {/* Banner borrador (conectado pero desactivado) */}
          {isAdmin && selected.estado_conexion === "conectado" && !fields.activo && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
              <div className="flex items-center gap-2.5">
                <ZapOff className="h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  El chatbot está <strong>apagado</strong> — el número recibe mensajes pero nadie responde.
                </p>
              </div>
              <button onClick={() => set("activo", true)}
                className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition">
                Activar ahora
              </button>
            </div>
          )}

          {/* Información básica */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Información básica</h3>
              {isAdmin && selected.estado_conexion === "conectado" && (
                <button onClick={() => set("activo", !fields.activo)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                    fields.activo
                      ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                      : "border-input bg-background text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                  )}>
                  {fields.activo ? <Zap className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" /> : <ZapOff className="h-3.5 w-3.5" />}
                  {fields.activo ? "Chatbot activo" : "Chatbot apagado"}
                </button>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre para identificarlo</label>
              <p className="mb-2 text-xs text-muted-foreground">Solo lo ves tú dentro de la plataforma, tus clientes no lo ven.</p>
              <input value={fields.display_name} onChange={e => set("display_name", e.target.value)} disabled={!isAdmin} className={inputCls} />
            </div>
          </div>

          {/* Instrucciones */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Instrucciones del chatbot</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Le dice al chatbot <strong>cómo comportarse</strong>: qué tono usar, qué puede responder y qué no.
              Piénsalo como las indicaciones que le darías a un empleado nuevo antes de contestar WhatsApp por ti.
            </p>
            <textarea value={fields.system_prompt} onChange={e => set("system_prompt", e.target.value)}
              rows={5} disabled={!isAdmin}
              placeholder="Eres un asistente fiscal experto en México. Responde solo dudas fiscales, con un tono amable y profesional. Si no sabes algo, dilo claramente en vez de inventar una respuesta..."
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition resize-none disabled:opacity-50" />
          </div>

          {/* Contexto (RAG) */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Información de tu despacho</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Datos propios que el chatbot usa para responder mejor: tarifas, horarios de atención, políticas,
              regímenes fiscales que manejas, etc. Se le recuerda esto en cada conversación, como si fuera su
              "hoja de referencia".
            </p>
            <textarea value={fields.contexto} onChange={e => set("contexto", e.target.value)}
              rows={6} disabled={!isAdmin}
              placeholder="Este despacho atiende a personas físicas con actividad empresarial. Régimen fiscal: RIF / RESICO. Obligaciones: declaraciones mensuales de IVA e ISR. Horario de atención: L-V 9am-6pm..."
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition resize-none disabled:opacity-50" />
          </div>

          {/* Parámetros del modelo */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Ajustes avanzados</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Opcional — los valores por defecto funcionan bien para la mayoría de los casos.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Modelo</label>
              <input value={fields.modelo} onChange={e => set("modelo", e.target.value)} disabled={!isAdmin} className={inputMonoCls} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Creatividad de las respuestas</label>
                <span className="text-sm font-mono text-muted-foreground">{fields.temperatura.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Más bajo = respuestas precisas y consistentes · Más alto = respuestas más variadas</p>
              <input type="range" min={0} max={1} step={0.1} value={fields.temperatura}
                onChange={e => set("temperatura", Number(e.target.value))} disabled={!isAdmin}
                className="w-full accent-primary disabled:opacity-50" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Memoria de la conversación</label>
                <span className="text-sm font-mono text-muted-foreground">{fields.max_historial} mensajes</span>
              </div>
              <p className="text-xs text-muted-foreground">Cuántos mensajes anteriores recuerda el chatbot al responder (1–50)</p>
              <input type="range" min={1} max={50} step={1} value={fields.max_historial}
                onChange={e => set("max_historial", Number(e.target.value))} disabled={!isAdmin}
                className="w-full accent-primary disabled:opacity-50" />
            </div>
          </div>

          {/* Acciones */}
          {isAdmin && (
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button onClick={() => syncFields(selected)}
                className="rounded-lg border border-input px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition">
                Descartar cambios
              </button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}
        </div>
      ) : (
        !isMobile && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Bot className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Selecciona un número para configurar su chatbot</p>
            </div>
          </div>
        )
      )}

      {/* Asistente de conexión (número nuevo) */}
      {wizardOpen && (
        <ConnectWizard
          canal={null}
          onClose={() => setWizardOpen(false)}
          onConnected={(c) => {
            setWizardOpen(false);
            loadCanales().then(() => selectCanal(c));
          }}
        />
      )}

      {/* Asistente de reconexión (número existente) */}
      {reconnectTarget && (
        <ConnectWizard
          canal={reconnectTarget}
          onClose={() => { setReconnectTarget(null); loadCanales(); }}
          onConnected={(c) => {
            setReconnectTarget(null);
            loadCanales().then(() => selectCanal(c));
          }}
        />
      )}

      {/* Confirmar desconexión */}
      <AlertDialog open={!!disconnectTarget} onOpenChange={o => !o && setDisconnectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desconectar este número?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{disconnectTarget?.display_name}</strong> dejará de recibir y responder mensajes hasta que
              vuelvas a escanear el código QR. La configuración del chatbot se conserva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={disconnecting} onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {disconnecting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Desconectando...</span> : "Sí, desconectar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este número?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.display_name}</strong> y toda la configuración de su chatbot.
              Las conversaciones ya registradas se conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Eliminando...</span> : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB: CONVERSACIONES
// ──────────────────────────────────────────────────────────────────────────────

function ConversacionesTab() {
  const isMobile = useIsMobile();
  const msgsEndRef = useRef<HTMLDivElement>(null);

  const [convs, setConvs] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [rfcInput, setRfcInput] = useState("");
  const [nombreInput, setNombreInput] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  useEffect(() => { loadConvs(); }, []);
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  const loadConvs = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{ conversaciones: Conversacion[] }>("/whatsapp/conversaciones?limit=50&offset=0");
      setConvs(res.conversaciones ?? []);
    } catch { /* sin datos aún — mostrar estado vacío */ }
    finally { setLoading(false); }
  };

  const selectConv = async (c: Conversacion) => {
    setSelected(c);
    setLinkMode(false);
    setRfcInput(c.rfc ?? "");
    setNombreInput(c.nombre_contacto ?? "");
    setLoadingMsgs(true);
    try {
      const jid = encodeURIComponent(c.jid);
      const res = await fetchAPI<{ mensajes: Mensaje[] }>(`/whatsapp/conversaciones/${jid}?limit=50&offset=0`);
      setMensajes(res.mensajes ?? []);
    } catch { toast({ title: "Error cargando mensajes", variant: "destructive" }); }
    finally { setLoadingMsgs(false); }
  };

  const patchConv = async (payload: Record<string, unknown>) => {
    if (!selected) return;
    const jid = encodeURIComponent(selected.jid);
    const res = await fetchAPI<{ conversacion: Conversacion }>(`/whatsapp/conversaciones/${jid}`, {
      method: "PATCH", body: JSON.stringify(payload),
    });
    setSelected(res.conversacion);
    setConvs(p => p.map(c => c.jid === res.conversacion.jid ? res.conversacion : c));
  };

  const handleToggleBot = async () => {
    if (!selected) return;
    setTogglingBot(true);
    try {
      await patchConv({ bot_activo: !selected.bot_activo });
      toast({ title: selected.bot_activo ? "Bot pausado — control manual" : "Bot reactivado" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setTogglingBot(false); }
  };

  const handleLinkRFC = async () => {
    if (!rfcInput.trim()) return;
    setSavingLink(true);
    try {
      await patchConv({ rfc: rfcInput.trim(), ...(nombreInput.trim() ? { nombre_contacto: nombreInput.trim() } : {}) });
      setLinkMode(false);
      toast({ title: "RFC vinculado" });
    } catch { toast({ title: "Error vinculando RFC", variant: "destructive" }); }
    finally { setSavingLink(false); }
  };

  const displayName = (c: Conversacion) => c.nombre_contacto || c.rfc || c.phone || c.jid.split("@")[0];

  if (loading) return <Spinner />;

  if (convs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-14 text-center space-y-2">
        <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-foreground">Sin conversaciones</p>
        <p className="text-xs text-muted-foreground">Las conversaciones de WhatsApp aparecerán aquí.</p>
      </div>
    );
  }

  const showList = isMobile ? !selected : true;
  const showDetail = isMobile ? !!selected : true;

  return (
    <div className="flex gap-4 animate-fade-in" style={{ height: "calc(100vh - 280px)", minHeight: 520 }}>
      {/* Lista */}
      {showList && (
        <div className={cn("flex flex-col border rounded-xl bg-card overflow-hidden", isMobile ? "w-full" : "w-72 shrink-0")}>
          <div className="flex items-center justify-between px-3 py-2.5 border-b">
            <p className="text-xs font-semibold text-foreground">{convs.length} conversaciones</p>
            <button onClick={loadConvs} className="rounded p-1 text-muted-foreground hover:text-foreground transition">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <ScrollArea className="flex-1">
            {convs.map(c => (
              <button key={c.jid} onClick={() => selectConv(c)}
                className={cn("w-full text-left px-3 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors",
                  selected?.jid === c.jid && "bg-primary/5")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{displayName(c)}</p>
                  <span className={cn("text-[10px] font-semibold uppercase shrink-0",
                    c.bot_activo ? "text-emerald-600" : "text-amber-600")}>
                    {c.bot_activo ? "Bot" : "Manual"}
                  </span>
                </div>
                {c.rfc && <p className="text-xs text-muted-foreground mt-0.5">{c.rfc}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(c.ultimo_mensaje_at)}</p>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Chat */}
      {showDetail && selected ? (
        <div className="flex-1 flex flex-col border rounded-xl bg-card overflow-hidden min-w-0">
          {/* Header chat */}
          <div className="flex items-center gap-3 px-3 py-2.5 border-b shrink-0">
            {isMobile && (
              <button onClick={() => setSelected(null)}
                className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName(selected)}</p>
              <p className="text-xs text-muted-foreground">{selected.phone || selected.jid.split("@")[0]}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => { setLinkMode(v => !v); setRfcInput(selected.rfc ?? ""); setNombreInput(selected.nombre_contacto ?? ""); }}
                className="flex items-center gap-1 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition">
                <Link2 className="h-3.5 w-3.5" />
                {selected.rfc ? selected.rfc : "RFC"}
              </button>
              <button onClick={handleToggleBot} disabled={togglingBot}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50",
                  selected.bot_activo
                    ? "border-input text-muted-foreground hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                    : "border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                )}>
                {togglingBot ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : selected.bot_activo ? <><Bot className="h-3.5 w-3.5" />Tomar control</>
                    : <><Zap className="h-3.5 w-3.5" />Devolver a bot</>}
              </button>
            </div>
          </div>

          {/* Link RFC */}
          {linkMode && (
            <div className="flex flex-wrap items-end gap-2 px-3 py-2.5 border-b bg-muted/30 shrink-0">
              <div className="space-y-1 flex-1 min-w-[130px]">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">RFC</label>
                <input className={cn(inputCls, "h-8 py-0 text-xs")} placeholder="XAXX010101000"
                  value={rfcInput} onChange={e => setRfcInput(e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1 flex-1 min-w-[130px]">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Nombre</label>
                <input className={cn(inputCls, "h-8 py-0 text-xs")} placeholder="Juan Pérez"
                  value={nombreInput} onChange={e => setNombreInput(e.target.value)} />
              </div>
              <button onClick={handleLinkRFC} disabled={savingLink || !rfcInput.trim()}
                className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
                {savingLink ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Vincular"}
              </button>
              <button onClick={() => setLinkMode(false)}
                className="h-8 rounded-lg border border-input px-3 text-xs hover:bg-muted transition">
                Cancelar
              </button>
            </div>
          )}

          {/* Mensajes */}
          <ScrollArea className="flex-1 px-4 py-3">
            {loadingMsgs ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : mensajes.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Sin mensajes.</p>
            ) : (
              <div className="space-y-2">
                {mensajes.map(msg => (
                  <div key={msg.id} className={cn("flex", msg.rol === "assistant" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      msg.rol === "assistant"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm")}>
                      <p className="break-words whitespace-pre-wrap">{msg.contenido || `[${msg.tipo}]`}</p>
                      <p className={cn("text-[10px] mt-0.5 text-right",
                        msg.rol === "assistant" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {timeAgo(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={msgsEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Bot status bar */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs border-t shrink-0",
            selected.bot_activo ? "bg-emerald-50 dark:bg-emerald-900/10" : "bg-amber-50 dark:bg-amber-900/10"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", selected.bot_activo ? "bg-emerald-500" : "bg-amber-500")} />
            <span className={selected.bot_activo ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}>
              {selected.bot_activo ? "Bot activo — respondiendo automáticamente" : "Control manual — bot pausado"}
            </span>
          </div>
        </div>
      ) : (
        !isMobile && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border">
            <div className="text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">Selecciona una conversación</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────────────────────

export function WhatsAppSection() {
  const { user } = useAuth();
  const isAdmin = user?.tipo_usuario === "administrador";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
          </div>
          WhatsApp
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Conecta el WhatsApp de tu despacho escaneando un código QR y configura cómo responde tu chatbot.
        </p>
      </div>

      <Tabs defaultValue="numeros">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="numeros" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Phone className="h-3.5 w-3.5" /> Números
          </TabsTrigger>
          <TabsTrigger value="conversaciones" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-3.5 w-3.5" /> Chats
          </TabsTrigger>
        </TabsList>
        <TabsContent value="numeros" className="mt-5"><NumerosTab isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="conversaciones" className="mt-5"><ConversacionesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
