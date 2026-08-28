import { useState } from "react";
import {
  Bug,
  CheckCircle2,
  Heart,
  HelpCircle,
  Lightbulb,
  Loader2,
  Mail,
  MailCheck,
  MessagesSquare,
  Send,
  Tags,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FeedbackType = "sugerencia" | "problema" | "apoyo" | "otro";

interface FeedbackOption {
  type: FeedbackType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const feedbackOptions: FeedbackOption[] = [
  {
    type: "sugerencia",
    label: "Sugerencia",
    icon: <Lightbulb className="h-5 w-5" />,
    description: "Tengo una idea o algo que podrían mejorar",
  },
  {
    type: "problema",
    label: "Reportar un problema",
    icon: <Bug className="h-5 w-5" />,
    description: "Algo no funcionó como esperaba",
  },
  {
    type: "apoyo",
    label: "Quiero apoyar el proyecto",
    icon: <Heart className="h-5 w-5" />,
    description: "Me interesa ayudar a impulsar Adquion",
  },
  {
    type: "otro",
    label: "Otro / Duda",
    icon: <HelpCircle className="h-5 w-5" />,
    description: "Comentario general o pregunta",
  },
];

const steps = [
  {
    icon: Tags,
    title: "1. Elige el tipo",
    description: "Sugerencia, problema, apoyo u otra cosa — así lo mandamos al lugar correcto.",
  },
  {
    icon: MessagesSquare,
    title: "2. Escríbenos",
    description: "Cuéntanos con tus palabras. Entre más específico, más fácil actuamos sobre eso.",
  },
  {
    icon: MailCheck,
    title: "3. Te respondemos",
    description: "Si dejas tu correo, alguien del equipo te contesta directamente — no es un bot.",
  },
];

const CONTACT_EMAIL = "contacto@converso.mx";
const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function Comentarios() {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim() || !selectedType) return;

    setSending(true);
    const payload = {
      fecha: new Date().toISOString().slice(0, 10),
      usuario: nombre.trim() || "Visitante web",
      organizacion: "Visitante web (página de comentarios)",
      email: correo.trim() || "no proporcionado",
      descripcion: mensaje.trim(),
      etiquetas: [selectedType],
    };

    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Error al enviar");
    } catch {
      const existing = JSON.parse(localStorage.getItem("pending_public_feedback") || "[]");
      existing.push(payload);
      localStorage.setItem("pending_public_feedback", JSON.stringify(existing));
    } finally {
      setSending(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <section className="bg-surface px-4 pb-20 pt-28 sm:pb-24 sm:pt-32">
        <div className="container mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Comentarios
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Queja, sugerencia o idea — te leemos
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-muted">
            Este formulario llega directo a nuestro equipo. No necesitas tener cuenta ni
            estar usando la plataforma para escribirnos.
          </p>
        </div>

        {/* Cómo funciona */}
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-2xl border border-line bg-surface-alt p-5 text-left">
              <step.icon className="h-5 w-5 text-brand" />
              <p className="mt-3 font-display text-sm font-bold text-ink">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-line bg-surface p-8 shadow-[var(--shadow-flat)]">
          {sent ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint-soft">
                <CheckCircle2 className="h-8 w-8 text-mint" />
              </div>
              <h2 className="font-display text-xl font-bold text-ink">¡Gracias por escribirnos!</h2>
              <p className="mt-2 text-ink-muted">
                Leemos cada mensaje. Si dejaste tu correo, te responderemos pronto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-3">
                <label className="text-sm font-medium text-ink">¿Qué nos quieres decir?</label>
                <div className="grid grid-cols-2 gap-2">
                  {feedbackOptions.map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setSelectedType(option.type)}
                      className={`rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                        selectedType === option.type
                          ? "border-brand bg-brand-soft"
                          : "border-transparent bg-surface-alt hover:bg-line/30"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-ink">
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                      <p className="line-clamp-1 text-xs text-ink-muted">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Nombre</label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Correo (opcional)</label>
                  <Input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Tu mensaje</label>
                <Textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntanos con detalle..."
                  rows={5}
                  maxLength={500}
                  required
                  className="resize-none"
                />
                <p className="text-right text-xs text-ink-muted">{mensaje.length}/500</p>
              </div>

              <Button
                type="submit"
                disabled={!selectedType || !mensaje.trim() || sending}
                size="lg"
                className="w-full rounded-lg bg-brand font-bold text-brand-foreground shadow-none hover:bg-brand-hover"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar mensaje
                  </>
                )}
              </Button>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-ink-muted hover:text-brand"
              >
                <Mail className="h-3.5 w-3.5" />
                o escríbenos directo a {CONTACT_EMAIL}
              </a>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
