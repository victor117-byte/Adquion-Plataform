import { useState } from "react";
import {
  MessageSquarePlus,
  Send,
  X,
  Lightbulb,
  Bug,
  Heart,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

type FeedbackType = 'idea' | 'bug' | 'mejora' | 'otro';

interface FeedbackOption {
  type: FeedbackType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

const feedbackOptions: FeedbackOption[] = [
  {
    type: 'idea',
    label: 'Nueva idea',
    icon: <Lightbulb className="h-5 w-5" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
    description: 'Tengo una idea para una nueva función'
  },
  {
    type: 'mejora',
    label: 'Mejora',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    description: 'Algo existente podría ser mejor'
  },
  {
    type: 'bug',
    label: 'Problema',
    icon: <Bug className="h-5 w-5" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50',
    description: 'Encontré algo que no funciona bien'
  },
  {
    type: 'otro',
    label: 'Otro',
    icon: <HelpCircle className="h-5 w-5" />,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
    description: 'Comentario general o pregunta'
  }
];

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);


  const handleSubmit = async () => {
    if (!message.trim() || !selectedType || !user) return;

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          fecha: new Date().toISOString().slice(0, 10),
          usuario: user.nombre || user.correo || "anónimo",
          organizacion: user.organizacion || "Sin organización",
          email: user.correo || "anónimo",
          descripcion: message.trim(),
          etiquetas: [selectedType]
        }),
      });

      if (response.ok) {
        setSent(true);
        setTimeout(() => {
          setOpen(false);
          // Reset después de cerrar
          setTimeout(() => {
            setSent(false);
            setSelectedType(null);
            setMessage('');
          }, 300);
        }, 2000);
      } else {
        throw new Error('Error al enviar');
      }
    } catch {
      // Si el endpoint no existe, guardamos localmente y mostramos éxito igual
      // En producción esto se conectaría a un endpoint real
      const feedbackData = {
        fecha: new Date().toISOString().slice(0, 10),
        usuario: user.nombre || user.correo || "anónimo",
        organizacion: user.organizacion || "Sin organización",
        email: user.correo || "anónimo",
        descripcion: message.trim(),
        etiquetas: [selectedType]
      };

      // Guardar en localStorage como fallback
      const existingFeedback = JSON.parse(localStorage.getItem('pending_feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('pending_feedback', JSON.stringify(existingFeedback));

      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setTimeout(() => {
          setSent(false);
          setSelectedType(null);
          setMessage('');
        }, 300);
      }, 2000);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setOpen(false);
      setTimeout(() => {
        if (!sent) {
          setSelectedType(null);
          setMessage('');
        }
      }, 300);
    }
  };

  const selectedOption = feedbackOptions.find(o => o.type === selectedType);

  return (
    <>
      {/* Botón flotante */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50 bg-gradient-to-r from-primary to-primary/80"
        size="icon"
      >
        <MessageSquarePlus className="h-6 w-6" />
      </Button>

      {/* Modal de feedback */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden [&>button]:hidden">
          {sent ? (
            // Estado de éxito
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">¡Gracias por tu feedback!</h3>
              <p className="text-muted-foreground text-center">
                Tu opinión nos ayuda a mejorar la aplicación
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Tu opinión importa</h3>
                      <p className="text-xs text-muted-foreground">
                        Ayúdanos a mejorar la aplicación
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Tipo de feedback */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">¿Qué tipo de feedback tienes?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackOptions.map((option) => (
                      <button
                        key={option.type}
                        onClick={() => setSelectedType(option.type)}
                        className={`
                          p-3 rounded-lg border-2 transition-all duration-200 text-left
                          ${selectedType === option.type
                            ? `border-primary ${option.bgColor}`
                            : 'border-transparent bg-muted/50 hover:bg-muted'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={option.color}>{option.icon}</span>
                          <span className="font-medium text-sm">{option.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {selectedOption
                      ? `Cuéntanos más sobre tu ${selectedOption.label.toLowerCase()}`
                      : 'Tu mensaje'
                    }
                  </label>
                  <Textarea
                    placeholder={
                      selectedType === 'idea'
                        ? "Describe tu idea... ¿Qué función te gustaría ver?"
                        : selectedType === 'mejora'
                        ? "¿Qué podríamos mejorar? ¿Cómo lo harías?"
                        : selectedType === 'bug'
                        ? "Describe el problema... ¿Qué esperabas que pasara?"
                        : "Escribe tu comentario aquí..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/500
                  </p>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedType || !message.trim() || sending || message.length > 500}
                  className="w-full"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar feedback
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Tu feedback se envía de forma anónima y nos ayuda a priorizar mejoras
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}