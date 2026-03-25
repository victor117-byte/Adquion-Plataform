import { useState, useEffect, useRef } from "react";
import {
  Bot, Plus, Trash2, MessageSquare, Sparkles, Loader2,
  Phone, MoreHorizontal, Pencil, Wifi, WifiOff, Copy,
  Check, ArrowLeft, Link2, RefreshCw, ZapOff, Zap,
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

interface Canal {
  id: number;
  channel_id: string;
  phone_number: string;
  display_name: string;
  phone_number_id: string;
  waba_id: string;
  wa_org_id: string;
  agente_id: number | null;
  subscription_id: string;
  webhook_url: string;
  activo: boolean;
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
  const [webhookInfo, setWebhookInfo] = useState<{ url: string; verifyToken: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [formErr, setFormErr] = useState("");

  const [form, setForm] = useState({
    phoneNumber: "", displayName: "", accessToken: "",
    phoneNumberId: "", wabaId: "", verifyToken: "", agenteId: "",
  });
  const [editForm, setEditForm] = useState({ display_name: "", agente_id: "", activo: true });

  useEffect(() => { loadAll(); }, []);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phoneNumber || !form.displayName || !form.accessToken || !form.phoneNumberId || !form.wabaId) {
      setFormErr("Completa todos los campos obligatorios."); return;
    }
    setFormErr(""); setSaving(true);
    try {
      const res = await fetchAPI<{ canal: Canal; metaWebhook: { url: string; verifyToken: string } }>(
        "/whatsapp/canales",
        { method: "POST", body: JSON.stringify({
          phoneNumber: form.phoneNumber, displayName: form.displayName,
          accessToken: form.accessToken, phoneNumberId: form.phoneNumberId,
          wabaId: form.wabaId,
          ...(form.verifyToken ? { verifyToken: form.verifyToken } : {}),
          ...(form.agenteId ? { agenteId: Number(form.agenteId) } : {}),
        }) }
      );
      setCanales(p => [...p, res.canal]);
      setWebhookInfo(res.metaWebhook);
      setShowCreate(false);
      setForm({ phoneNumber: "", displayName: "", accessToken: "", phoneNumberId: "", wabaId: "", verifyToken: "", agenteId: "" });
      toast({ title: "Canal registrado" });
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
          activo: editForm.activo,
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

  const handleToggle = async (canal: Canal) => {
    setToggling(canal.id);
    try {
      const res = await fetchAPI<{ canal: Canal }>(
        `/whatsapp/canales/${canal.id}`,
        { method: "PATCH", body: JSON.stringify({ activo: !canal.activo }) }
      );
      setCanales(p => p.map(c => c.id === canal.id ? res.canal : c));
      toast({ title: canal.activo ? "Canal desactivado" : "Canal activado" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setToggling(null); }
  };

  const openEdit = (c: Canal) => {
    setEditForm({ display_name: c.display_name, agente_id: String(c.agente_id ?? ""), activo: c.activo });
    setEditTarget(c);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Webhook info post-creación */}
      {webhookInfo && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
              Canal registrado — configura el Webhook en Meta
            </p>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Ve a <strong>Meta Developer Console → WhatsApp → Webhooks</strong> y pega estos valores. Solo se muestran una vez.
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Callback URL</p>
              <div className="flex items-center rounded-lg border border-input bg-background px-3 py-2">
                <code className="flex-1 min-w-0 truncate text-xs">{webhookInfo.url}</code>
                <CopyBtn text={webhookInfo.url} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Verify Token</p>
              <div className="flex items-center rounded-lg border border-input bg-background px-3 py-2">
                <code className="flex-1 min-w-0 truncate text-xs">{webhookInfo.verifyToken}</code>
                <CopyBtn text={webhookInfo.verifyToken} />
              </div>
            </div>
          </div>
          <button onClick={() => setWebhookInfo(null)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition">
            Entendido, ya los copié
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {canales.length} {canales.length === 1 ? "canal" : "canales"} configurados
        </p>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {isAdmin && (
            <button onClick={() => { setFormErr(""); setShowCreate(true); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Registrar Canal
            </button>
          )}
        </div>
      </div>

      {/* Lista de canales */}
      {canales.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-14 text-center space-y-2">
          <Phone className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">Sin canales registrados</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Registra tu primer número de WhatsApp Business para empezar a recibir mensajes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {canales.map(canal => {
            const agente = agentes.find(a => a.id === canal.agente_id);
            return (
              <div key={canal.id} className="rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      canal.activo ? "bg-emerald-500/10" : "bg-muted"
                    )}>
                      <Phone className={cn("h-4 w-4", canal.activo ? "text-emerald-600" : "text-muted-foreground")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{canal.display_name}</p>
                        <ActiveBadge active={canal.activo} />
                      </div>
                      <p className="mt-0.5 text-xs font-mono text-muted-foreground">{canal.phone_number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {agente
                          ? <span className="flex items-center gap-1"><Bot className="h-3 w-3" />{agente.nombre}</span>
                          : <span className="text-amber-600">Sin agente asignado</span>}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button disabled={toggling === canal.id} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50">
                          {toggling === canal.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <MoreHorizontal className="h-4 w-4" />}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEdit(canal)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(canal)} className="cursor-pointer">
                          {canal.activo ? <><WifiOff className="mr-2 h-4 w-4" /> Desactivar</> : <><Wifi className="mr-2 h-4 w-4" /> Activar</>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(canal)} className="cursor-pointer text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {canal.webhook_url && (
                  <div className="mt-3 pt-3 border-t border-border/60">
                    <p className="text-[10px] text-muted-foreground mb-1">Webhook URL</p>
                    <div className="flex items-center rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
                      <code className="flex-1 min-w-0 truncate text-[10px] text-muted-foreground">{canal.webhook_url}</code>
                      <CopyBtn text={canal.webhook_url} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog registrar canal */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!saving) setShowCreate(o); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar canal de WhatsApp</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1.5 block text-xs font-medium text-foreground">Número de teléfono *</label>
                  <input value={form.phoneNumber} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="+521234567890" disabled={saving} className={inputCls} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1.5 block text-xs font-medium text-foreground">Nombre a mostrar *</label>
                  <input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Adquion Fiscal" disabled={saving} className={inputCls} />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Credenciales Meta</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-foreground">Phone Number ID *</label>
                      <input value={form.phoneNumberId} onChange={e => setForm(p => ({ ...p, phoneNumberId: e.target.value }))} placeholder="1024654650730049" disabled={saving} className={inputMonoCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-foreground">WABA ID *</label>
                      <input value={form.wabaId} onChange={e => setForm(p => ({ ...p, wabaId: e.target.value }))} placeholder="987654321098765" disabled={saving} className={inputMonoCls} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">Access Token *</label>
                    <input type="password" value={form.accessToken} onChange={e => setForm(p => ({ ...p, accessToken: e.target.value }))} placeholder="EAAam3UqdWAABQ..." disabled={saving} className={inputMonoCls} />
                    <p className="mt-1 text-xs text-muted-foreground">Usa un token de sistema permanente para producción.</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">Verify Token <span className="font-normal text-muted-foreground">(opcional, se autogenera)</span></label>
                    <input value={form.verifyToken} onChange={e => setForm(p => ({ ...p, verifyToken: e.target.value }))} placeholder="mi_token_secreto" disabled={saving} className={inputMonoCls} />
                  </div>
                </div>
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
                {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Registrando...</span> : "Registrar canal"}
              </button>
            </div>
          </form>
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
                  <option value="">Sin agente</option>
                  {agentes.map(a => <option key={a.id} value={String(a.id)}>{a.nombre}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3.5 py-3">
                <span className="text-sm font-medium text-foreground">Canal activo</span>
                <button type="button" onClick={() => setEditForm(p => ({ ...p, activo: !p.activo }))}
                  className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    editForm.activo ? "bg-primary" : "bg-muted-foreground/30")}>
                  <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                    editForm.activo ? "translate-x-4.5" : "translate-x-0.5")} />
                </button>
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
            <AlertDialogTitle>¿Eliminar canal?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará <strong>{deleteTarget?.display_name}</strong> ({deleteTarget?.phone_number}). Las conversaciones se conservan.
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
  const isMobile = useIsMobile();
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fields, setFields] = useState<AgenteFields>({
    nombre: "", activo: true, system_prompt: "", contexto: "",
    modelo: "llama-3.3-70b-versatile", temperatura: 0.3, max_historial: 10,
  });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Agente | null>(null);

  const selected = agentes.find(a => a.id === selectedId) ?? null;

  useEffect(() => { loadAgentes(); }, []);
  useEffect(() => {
    if (agentes.length > 0 && !selectedId && !isMobile) selectAgente(agentes[0]);
  }, [agentes, isMobile]);

  const loadAgentes = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{ agentes: Agente[] }>("/whatsapp/agentes");
      setAgentes(res.agentes ?? []);
    } catch { /* sin datos aún — mostrar estado vacío */ }
    finally { setLoading(false); }
  };

  const syncFields = (a: Agente) => setFields({
    nombre: a.nombre, activo: a.activo, system_prompt: a.system_prompt ?? "",
    contexto: a.contexto ?? "", modelo: a.modelo ?? "llama-3.3-70b-versatile",
    temperatura: a.temperatura ?? 0.3, max_historial: a.max_historial ?? 10,
  });

  const selectAgente = (a: Agente) => { setSelectedId(a.id); syncFields(a); };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetchAPI<{ agente: Agente }>("/whatsapp/agentes", {
        method: "POST",
        body: JSON.stringify({ nombre: "Nuevo Agente", activo: false, modelo: "llama-3.3-70b-versatile", temperatura: 0.3, max_historial: 10 }),
      });
      await loadAgentes();
      selectAgente(res.agente);
      toast({ title: "Agente creado" });
    } catch (e: unknown) { toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetchAPI<{ agente: Agente }>(`/whatsapp/agentes/${selected.id}`, {
        method: "PATCH", body: JSON.stringify(fields),
      });
      setAgentes(p => p.map(a => a.id === selected.id ? res.agente : a));
      syncFields(res.agente);
      toast({ title: "Agente guardado" });
    } catch { toast({ title: "Error guardando", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetchAPI(`/whatsapp/agentes/${deleteTarget.id}`, { method: "DELETE" });
      await loadAgentes();
      setSelectedId(null);
      setDeleteTarget(null);
      toast({ title: "Agente eliminado" });
    } catch (e: unknown) { toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  const set = <K extends keyof AgenteFields>(k: K, v: AgenteFields[K]) => setFields(p => ({ ...p, [k]: v }));

  if (loading) return <Spinner />;

  const showList = isMobile ? !selectedId : true;
  const showDetail = isMobile ? !!selectedId : true;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 animate-fade-in">
      {/* Lista */}
      {showList && (
        <div className={cn("shrink-0 space-y-3", isMobile ? "w-full" : "w-[280px]")}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Mis Agentes</h2>
            {isAdmin && (
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Nuevo
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {agentes.map(a => (
              <button key={a.id} onClick={() => selectAgente(a)}
                className={cn("flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                  a.id === selectedId ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/50")}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  a.activo ? "bg-emerald-500/10" : "bg-primary/10")}>
                  <Bot className={cn("h-4 w-4", a.activo ? "text-emerald-600" : "text-primary")} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.nombre}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {a.canales_asignados?.length
                      ? `${a.canales_asignados.length} canal${a.canales_asignados.length > 1 ? "es" : ""}`
                      : "Sin canales asignados"}
                  </p>
                  <span className={cn(
                    "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    a.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", a.activo ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                    {a.activo ? "Activo" : "Borrador"}
                  </span>
                </div>
              </button>
            ))}
            {agentes.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin agentes.{isAdmin ? " Crea el primero." : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Detalle */}
      {showDetail && selected ? (
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
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">Configurar Agente</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Comportamiento y contexto del bot.</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={() => set("activo", !fields.activo)}
                  className={cn(
                    "flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg border px-3 md:px-4 py-2 text-sm font-semibold transition",
                    fields.activo
                      ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                      : "border-input bg-background text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                  )}>
                  {fields.activo
                    ? <Zap className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                    : <ZapOff className="h-4 w-4" />}
                  {fields.activo ? "Activo" : "Activar"}
                </button>
                <button onClick={() => setDeleteTarget(selected)} disabled={deleting}
                  className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
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
            {selected.canales_asignados?.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Canales asignados</p>
                <div className="flex flex-wrap gap-2">
                  {selected.canales_asignados.map(c => (
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
              <button onClick={() => syncFields(selected)}
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
      ) : (
        !isMobile && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Bot className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Selecciona un agente para configurarlo</p>
            </div>
          </div>
        )
      )}

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.nombre}</strong>.
              {(deleteTarget?.canales_asignados?.length ?? 0) > 0 && (
                <span className="block mt-1 text-destructive">
                  Tiene {deleteTarget!.canales_asignados.length} canal(es) asignado(s). Desasígnalos primero.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleting || (deleteTarget?.canales_asignados?.length ?? 0) > 0}
              onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
