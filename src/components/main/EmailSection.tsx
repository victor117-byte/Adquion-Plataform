import { useState, useEffect } from "react";
import {
  Mail, Loader2, Send, ZapOff, Zap, ShieldCheck, AlertTriangle, Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchAPI } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

// ──────────────────────────────────────────────────────────────────────────────
// TIPOS
//
// El correo lo envía la plataforma con una sola cuenta SMTP compartida por
// todas las organizaciones (mismo criterio que WhatsApp con Evolution API) —
// nadie captura host/usuario/contraseña de correo aquí, solo si quiere los
// recordatorios activos y el nombre de remitente que se muestra.
// ──────────────────────────────────────────────────────────────────────────────

interface EmailSettings {
  activo: boolean;
  remitente_nombre: string;
  ultima_prueba_at: string | null;
  ultima_prueba_exitosa: boolean | null;
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition disabled:opacity-50";

// ──────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ──────────────────────────────────────────────────────────────────────────────

export function EmailSection() {
  const { user } = useAuth();
  const isAdmin = user?.tipo_usuario === "administrador";

  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [remitenteNombre, setRemitenteNombre] = useState("");
  const [activo, setActivo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<EmailSettings>("/whatsapp/notificaciones/email");
      setSettings(res);
      setRemitenteNombre(res.remitente_nombre);
      setActivo(res.activo);
    } catch { /* sin datos aún — se muestra el formulario vacío */ }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchAPI<EmailSettings>("/whatsapp/notificaciones/email", {
        method: "PUT",
        body: JSON.stringify({ activo, remitente_nombre: remitenteNombre.trim() }),
      });
      setSettings(res);
      toast({ title: "Configuración de correo guardada" });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "No se pudo guardar", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    try {
      await fetchAPI("/whatsapp/notificaciones/email/prueba", {
        method: "POST", body: JSON.stringify({ correo_destino: testEmail.trim() }),
      });
      toast({ title: "Correo de prueba enviado", description: `Revisa la bandeja de ${testEmail.trim()}` });
    } catch (e: unknown) {
      toast({ title: "No se pudo enviar", description: e instanceof Error ? e.message : "Intenta de nuevo", variant: "destructive" });
    } finally {
      setTesting(false);
      loadSettings();
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
            <Mail className="h-4 w-4 text-blue-600" />
          </div>
          Correo
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Recordatorios de fechas límite y avisos importantes por correo — sin configuración técnica.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/20 p-4">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            El correo lo envía la plataforma automáticamente — no necesitas conectar tu propia cuenta.
            Solo elige si quieres activar los recordatorios y qué nombre aparece como remitente.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", activo ? "bg-emerald-500/10" : "bg-muted")}>
              {activo ? <Zap className="h-4 w-4 text-emerald-600" /> : <ZapOff className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {activo ? "Recordatorios por correo activos" : "Recordatorios por correo desactivados"}
              </p>
              <p className="text-xs text-muted-foreground">Si lo apagas, no se enviará ningún recordatorio por correo.</p>
            </div>
          </div>
          <button type="button" disabled={!isAdmin} onClick={() => setActivo(v => !v)}
            className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
              activo ? "bg-primary" : "bg-muted-foreground/30")}>
            <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
              activo ? "translate-x-4.5" : "translate-x-0.5")} />
          </button>
        </div>

        {settings?.ultima_prueba_at && (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            settings.ultima_prueba_exitosa ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
          )}>
            {settings.ultima_prueba_exitosa ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            Última prueba: {settings.ultima_prueba_exitosa ? "exitosa" : "falló"}
          </span>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Nombre del remitente</label>
          <input value={remitenteNombre} onChange={e => setRemitenteNombre(e.target.value)}
            placeholder="Mi Despacho Fiscal" disabled={!isAdmin} className={inputCls} />
          <p className="mt-1 text-xs text-muted-foreground">Así se verá el nombre de quien envía el correo — el resto de la cuenta la administra la plataforma.</p>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-1">
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60">
              {saving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Guardando...</span> : "Guardar configuración"}
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Enviar un correo de prueba</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Confirma que los recordatorios llegan correctamente enviándote un correo de prueba.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="tucorreo@midespacho.com"
              className={cn(inputCls, "flex-1")} />
            <button onClick={handleTest} disabled={testing || !testEmail.trim()}
              className="flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition disabled:opacity-50 shrink-0">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar prueba
            </button>
          </div>
        </div>
      )}

      {!isAdmin && (
        <p className="text-center text-xs text-muted-foreground py-2">
          Solo un administrador puede configurar el correo de la organización.
        </p>
      )}
    </div>
  );
}
