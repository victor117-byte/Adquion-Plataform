import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CreditCard, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PaymentFormProps {
  planName: string;
  amount: number;
  onSuccess?: () => void;
}

export const PaymentForm = ({ planName, amount, onSuccess }: PaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      // Crear intención de pago con Stripe
      const response = await fetch(`${API_URL}/payments/create-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planName,
          paymentMethod: {
            card: cardData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar el pago');
      }

      const data = await response.json();

      toast({
        title: "¡Pago exitoso!",
        description: `Te has suscrito al plan ${planName}`,
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Información de Pago
        </CardTitle>
        <CardDescription>
          Plan: {planName} - ${amount}/mes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número de tarjeta</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardData.number}
              onChange={(e) =>
                setCardData({ ...cardData, number: formatCardNumber(e.target.value) })
              }
              maxLength={19}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">Nombre en la tarjeta</Label>
            <Input
              id="cardName"
              placeholder="Juan Pérez"
              value={cardData.name}
              onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Vencimiento</Label>
              <Input
                id="expiry"
                placeholder="MM/AA"
                value={cardData.expiry}
                onChange={(e) =>
                  setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })
                }
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                type="password"
                value={cardData.cvv}
                onChange={(e) =>
                  setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })
                }
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Pago seguro procesado por Stripe</span>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Procesando...' : `Pagar $${amount}/mes`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Puedes cancelar tu suscripción en cualquier momento
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
