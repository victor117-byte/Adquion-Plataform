import { useState, useEffect, useRef } from "react";
import {
  Bot, Plus, Trash2, MessageSquare, Sparkles, Loader2,
  Phone, MoreHorizontal, Pencil,
  ArrowLeft, Link2, RefreshCw, ZapOff, Zap, QrCode,
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

type ConnectionStatus = "conectado" | "desconectado" | "pendiente_qr";

interface Canal {
  id: number;
  phone_number: string;
  display_name: string;
  wa_org_id: string;
  agente_id: number | null;
  activo: boolean;
  connection_status: ConnectionStatus;
  created_at: string;
  updated_at: string;
}

interface Agente {
  id: number;
  nombre: string;
  activo: boolean;
  system_prompt: string;
  contexto: string;
  modelo: string;
  temperatura: number;
  max_historial: number;
  created_at: string;
  updated_at: string;
  canales_asignados: { id: number; phone_number: string; display_name: string; activo: boolean }[];
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

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-muted-foreground/50")} />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

const CONNECTION_META: Record<ConnectionStatus, { label: string; className: string; dot: string }> = {
  conectado: { label: "Conectado", className: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500" },
  pendiente_qr: { label: "Falta escanear QR", className: "bg-amber-500/10 text-amber-700", dot: "bg-amber-500" },
  desconectado: { label: "Desconectado", className: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const meta = CONNECTION_META[status] ?? CONNECTION_META.desconectado;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      meta.className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
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

// ──────────────────────────────────────────────────────────────────────────────
// TAB: CANALES
// ──────────────────────────────────────────────────────────────────────────────

function CanalesTab({ isAdmin }: { isAdmin: boolean }) {
  const [canales, setCanales] = useState<Canal[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Canal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Canal | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErr, setFormErr] = useState("");

  // Una organización solo tiene un canal (el activo, si existe)
  const canal = canales.find(c => c.activo) ?? null;

  const [form, setForm] = useState({ displayName: "", agenteId: "" });
  const [editForm, setEditForm] = useState({ display_name: "", agente_id: "", activo: true });

  // ─── Emparejamiento por QR (Evolution API) ───────────────────────────────
  const [qrCanal, setQrCanal] = useState<Canal | null>(null);
  const [qrData, setQrData] = useState<{ base64: string | null; pairingCode: string | null } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.allSettled([
        fetchAPI<{ canales: Canal[] }>("/whatsapp/canales"),
        fetchAPI<{ agentes: Agente[] }>("/whatsapp/agentes"),
      ]);
      if (cRes.status === "fulfilled") setCanales(cRes.value.canales ?? []);
      if (aRes.status === "fulfilled") setAgentes(aRes.value.agentes ?? []);
    } finally { setLoading(false); }
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const closeQrDialog = () => {
    stopPolling();
    setQrCanal(null);
    setQrData(null);
    setQrError("");
  };

  const fetchQr = async (canalId: number) => {
    setQrLoading(true);
    setQrError("");
    try {
      const res = await fetchAPI<{ base64: string | null; pairingCode: string | null }>(
        `/whatsapp/canales/${canalId}/qr`
      );
      setQrData(res);
    } catch (e: unknown) {
      setQrError(e instanceof Error ? e.message : "Error obteniendo el código QR");
    } finally { setQrLoading(false); }
  };

  const openQrDialog = (canal: Canal) => {
    setQrCanal(canal);
    setQrData(null);
    setQrError("");
    fetchQr(canal.id);

    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetchAPI<{ connection_status: ConnectionStatus }>(`/whatsapp/canales/${canal.id}/estado`);
        setCanales(p => p.map(c => c.id === canal.id ? { ...c, connection_status: res.connection_status } : c));
        if (res.connection_status === "conectado") {
          stopPolling();
          toast({ title: "WhatsApp conectado" });
          closeQrDialog();
        }
      } catch { /* red intermitente — se reintenta en el próximo tick */ }
    }, 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) {
      setFormErr("El nombre a mostrar es obligatorio."); return;
    }
    setFormErr(""); setSaving(true);
    try {
      const res = await fetchAPI<{ canal: Canal }>(
        "/whatsapp/canales",
        { method: "POST", body: JSON.stringify({
          displayName: form.displayName,
          ...(form.agenteId ? { agenteId: Number(form.agenteId) } : {}),
        }) }
      );
      setCanales(p => [...p, res.canal]);
      setShowCreate(false);
      setForm({ displayName: "", agenteId: "" });
      openQrDialog(res.canal);
    } catch (e: unknown) {
      setFormErr(e instanceof Error ? e.message : "Error registrando canal");
    } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetchAPI<{ canal: Canal }>(
        `/whatsapp/canales/${editTarget.id}`,
        { method: "PATCH", body: JSON.stringify({
          display_name: editForm.display_name || undefined,
          agente_id: editForm.agente_id ? Number(editForm.agente_id) : null,
        }) }
      );
      setCanales(p => p.map(c => c.id === editTarget.id ? res.canal : c));
      setEditTarget(null);
      toast({ title: "Canal actualizado" });
    } catch { toast({ title: "Error actualizando canal", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetchAPI(`/whatsapp/canales/${deleteTarget.id}`, { method: "DELETE" });
      setCanales(p => p.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: "Canal desactivado" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  const openEdit = (c: Canal) => {
    setEditForm({ display_name: c.display_name, agente_id: String(c.agente_id ?? ""), activo: c.activo });
    setEditTarget(c);
  };

  if (loading) return <Spinner />;

  const agente = canal ? agentes.find(a => a.id === canal.agente_id) : undefined;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Tu número de WhatsApp para este bot
        </p>
        <button onClick={loadAll} className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Canal único */}
      {!canal ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-14 text-center space-y-3">
          <Phone className="h-8 w-8 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-foreground">Sin WhatsApp conectado</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
              Conecta tu número escaneando un código QR para empezar a recibir mensajes — gratis, sin cuenta de Meta.
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => { setFormErr(""); setShowCreate(true); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Conectar WhatsApp
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Phone className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{canal.display_name}</p>
                  <ConnectionBadge status={canal.connection_status} />
                </div>
                <p className="mt-0.5 text-xs font-mono text-muted-foreground">{canal.phone_number}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {agente
                    ? <span className="flex items-center gap-1"><Bot className="h-3 w-3" />{agente.nombre}</span>
                    : <span className="text-amber-600">Sin agente asignado</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canal.connection_status !== "conectado" && (
                <button onClick={() => openQrDialog(canal)}
                  className="flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition">
                  <QrCode className="h-3.5 w-3.5" /> Ver QR
                </button>
              )}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => openEdit(canal)} className="cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" /> Editar nombre
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(canal)} className="cursor-pointer text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Desconectar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog registrar canal */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!saving) setShowCreate(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <p className="text-xs text-muted-foreground">
              Se crea un número gratis vía WhatsApp Web — en el siguiente paso escaneas un código QR
              con el celular que va a operar el bot (Dispositivos vinculados → Vincular dispositivo).
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Nombre a mostrar *</label>
                <input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Adquion Fiscal" disabled={saving} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Agente IA <span className="font-normal text-muted-foreground">(opcional)</span></label>
                <select value={form.agenteId} onChange={e => setForm(p => ({ ...p, agenteId: e.target.value }))} disabled={saving} className={inputCls}>
                  <option value="">Sin agente (solo almacena mensajes)</option>
                  {agentes.map(a => <option key={a.id} value={String(a.id)}>{a.nombre}{!a.activo ? " (inactivo)" : ""}</option>)}
                </select>
              </div>
            </div>
            {formErr && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{formErr}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowCreate(false)} disabled={saving}
                className="flex-1 rounded-lg border border-input py-2.5 text-sm font-medium hover:bg-muted transition disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60">
                {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creando...</span> : "Crear y mostrar QR"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog QR de emparejamiento */}
      <Dialog open={!!qrCanal} onOpenChange={(o) => { if (!o) closeQrDialog(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Escanea el código QR</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1 text-center">
            <p className="text-xs text-muted-foreground">
              Abre WhatsApp en el celular de <strong>{qrCanal?.display_name}</strong> → Dispositivos vinculados →
              Vincular dispositivo, y escanea este código.
            </p>
            <div className="flex items-center justify-center rounded-xl border border-border bg-muted/30 p-4 min-h-[220px]">
              {qrLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : qrError ? (
                <p className="text-sm text-destructive">{qrError}</p>
              ) : qrData?.base64 ? (
                <img
                  src={qrData.base64.startsWith("data:") ? qrData.base64 : `data:image/png;base64,${qrData.base64}`}
                  alt="Código QR de WhatsApp"
                  className="h-52 w-52"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Sin código QR disponible — puede que ya esté conectado.</p>
              )}
            </div>
            {qrData?.pairingCode && (
              <p className="text-xs text-muted-foreground">
                O usa el código de emparejamiento: <code className="font-mono font-semibold">{qrData.pairingCode}</code>
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Esperando a que escanees...
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => qrCanal && fetchQr(qrCanal.id)} disabled={qrLoading}
                className="flex-1 rounded-lg border border-input py-2 text-xs font-medium hover:bg-muted transition disabled:opacity-50">
                <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Actualizar QR</span>
              </button>
              <button type="button" onClick={closeQrDialog}
                className="flex-1 rounded-lg border border-input py-2 text-xs font-medium hover:bg-muted transition">
                Cerrar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog editar canal */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!saving && !o) setEditTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar canal</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-1">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Nombre a mostrar</label>
                <input value={editForm.display_name} onChange={e => setEditForm(p => ({ ...p, display_name: e.target.value }))} disabled={saving} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Agente IA</label>
                <select value={editForm.agente_id} onChange={e => setEditForm(p => ({ ...p, agente_id: e.target.value }))} disabled={saving} className={inputCls}>
                  <option value="">Sin agente (solo almacena mensajes)</option>
                  {agentes.map(a => <option key={a.id} value={String(a.id)}>{a.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditTarget(null)} disabled={saving}
                className="flex-1 rounded-lg border border-input py-2.5 text-sm font-medium hover:bg-muted transition disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={saving}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60">
                {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Guardando...</span> : "Guardar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desconectar WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desconectará <strong>{deleteTarget?.display_name}</strong> ({deleteTarget?.phone_number}) y podrás
              conectar un número nuevo después. Las conversaciones se conservan.
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
// TAB: AGENTES
// ──────────────────────────────────────────────────────────────────────────────

interface AgenteFields {
  nombre: string;
  activo: boolean;
  system_prompt: string;
  contexto: string;
  modelo: string;
  temperatura: number;
  max_historial: number;
}

function Spinner() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function AgentesTab({ isAdmin }: { isAdmin: boolean }) {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<AgenteFields>({
    nombre: "Asistente Fiscal", activo: true, system_prompt: "", contexto: "",
    modelo: "llama-3.3-70b-versatile", temperatura: 0.3, max_historial: 10,
  });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Una organización solo tiene un agente
  const agente = agentes[0] ?? null;

  useEffect(() => { loadAgentes(); }, []);

  const loadAgentes = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{ agentes: Agente[] }>("/whatsapp/agentes");
      setAgentes(res.agentes ?? []);
      if (res.agentes?.[0]) syncFields(res.agentes[0]);
    } catch { /* sin datos aún — mostrar estado vacío */ }
    finally { setLoading(false); }
  };

  const syncFields = (a: Agente) => setFields({
    nombre: a.nombre, activo: a.activo, system_prompt: a.system_prompt ?? "",
    contexto: a.contexto ?? "", modelo: a.modelo ?? "llama-3.3-70b-versatile",
    temperatura: Number(a.temperatura ?? 0.3), max_historial: a.max_historial ?? 10,
  });

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetchAPI<{ agente: Agente }>("/whatsapp/agentes", {
        method: "POST",
        body: JSON.stringify({ ...fields }),
      });
      await loadAgentes();
      syncFields(res.agente);
      toast({ title: "Agente creado" });
    } catch (e: unknown) { toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!agente) return;
    setSaving(true);
    try {
      const res = await fetchAPI<{ agente: Agente }>(`/whatsapp/agentes/${agente.id}`, {
        method: "PATCH", body: JSON.stringify(fields),
      });
      setAgentes([res.agente]);
      syncFields(res.agente);
      toast({ title: "Agente guardado" });
    } catch { toast({ title: "Error guardando", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const set = <K extends keyof AgenteFields>(k: K, v: AgenteFields[K]) => setFields(p => ({ ...p, [k]: v }));

  if (loading) return <Spinner />;

  // Sin agente todavía: CTA para crear el único agente de la organización
  if (!agente) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-14 text-center space-y-3 animate-fade-in">
        <Sparkles className="h-8 w-8 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium text-foreground">Sin agente IA configurado</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
            Configura el bot que va a responder los mensajes de WhatsApp de esta organización.
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleCreate} disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Configurar agente IA
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">Tu agente IA</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Comportamiento y contexto del bot.</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => set("activo", !fields.activo)}
            className={cn(
              "flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border px-3 md:px-4 py-2 text-sm font-semibold transition",
              fields.activo
                ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                : "border-input bg-background text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30"
            )}>
            {fields.activo
              ? <Zap className="h-4 w-4 fill-emerald-500 text-emerald-500" />
              : <ZapOff className="h-4 w-4" />}
            {fields.activo ? "Activo" : "Activar"}
          </button>
        )}
      </div>

      {/* Banner borrador */}
      {isAdmin && !fields.activo && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2.5">
            <ZapOff className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-400">
              Agente en <strong>borrador</strong> — no responde mensajes.
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
        <h3 className="text-sm font-semibold text-foreground">Información básica</h3>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre del agente</label>
          <input value={fields.nombre} onChange={e => set("nombre", e.target.value)} disabled={!isAdmin} className={inputCls} />
        </div>
        {agente.canales_asignados?.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Canal conectado</p>
            <div className="flex flex-wrap gap-2">
              {agente.canales_asignados.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {c.display_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Instrucciones del sistema</h3>
        </div>
        <p className="text-xs text-muted-foreground">Define el comportamiento del agente en WhatsApp.</p>
        <textarea value={fields.system_prompt} onChange={e => set("system_prompt", e.target.value)}
          rows={5} disabled={!isAdmin}
          placeholder="Eres un asistente fiscal experto en México. Responde solo dudas fiscales..."
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition resize-none disabled:opacity-50" />
      </div>

      {/* Contexto (RAG) */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Contexto fiscal</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Base de conocimiento del agente: tarifas, reglas del negocio, información fiscal. Se inyecta en cada conversación.
        </p>
        <textarea value={fields.contexto} onChange={e => set("contexto", e.target.value)}
          rows={6} disabled={!isAdmin}
          placeholder="Esta organización atiende a personas físicas con actividad empresarial. Régimen fiscal: RIF / RESICO. Obligaciones: declaraciones mensuales de IVA e ISR..."
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition resize-none disabled:opacity-50" />
      </div>

      {/* Parámetros del modelo */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Parámetros del modelo</h3>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Modelo</label>
          <input value={fields.modelo} onChange={e => set("modelo", e.target.value)} disabled={!isAdmin} className={inputMonoCls} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Temperatura</label>
            <span className="text-sm font-mono text-muted-foreground">{fields.temperatura.toFixed(1)}</span>
          </div>
          <p className="text-xs text-muted-foreground">0 = preciso/conservador · 1 = creativo/variable</p>
          <input type="range" min={0} max={1} step={0.1} value={fields.temperatura}
            onChange={e => set("temperatura", Number(e.target.value))} disabled={!isAdmin}
            className="w-full accent-primary disabled:opacity-50" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Historial de mensajes</label>
            <span className="text-sm font-mono text-muted-foreground">{fields.max_historial}</span>
          </div>
          <p className="text-xs text-muted-foreground">Cuántos mensajes anteriores considera el agente (1–50)</p>
          <input type="range" min={1} max={50} step={1} value={fields.max_historial}
            onChange={e => set("max_historial", Number(e.target.value))} disabled={!isAdmin}
            className="w-full accent-primary disabled:opacity-50" />
        </div>
      </div>

      {/* Acciones */}
      {isAdmin && (
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button onClick={() => syncFields(agente)}
            className="rounded-lg border border-input px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition">
            Descartar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Guardando..." : "Guardar agente"}
          </button>
        </div>
      )}
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
    <div
      className="flex gap-4 animate-fade-in"
      style={{ height: isMobile ? "calc(100dvh - 220px)" : "calc(100vh - 280px)", minHeight: 420 }}
    >
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
          WhatsApp Chatbot
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Administra canales, agentes IA y conversaciones de WhatsApp Business.
        </p>
      </div>

      <Tabs defaultValue="agentes">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="canales" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Phone className="h-3.5 w-3.5" /> Canales
          </TabsTrigger>
          <TabsTrigger value="agentes" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Bot className="h-3.5 w-3.5" /> Agentes
          </TabsTrigger>
          <TabsTrigger value="conversaciones" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-3.5 w-3.5" /> Chats
          </TabsTrigger>
        </TabsList>
        <TabsContent value="canales" className="mt-5"><CanalesTab isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="agentes" className="mt-5"><AgentesTab isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="conversaciones" className="mt-5"><ConversacionesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
