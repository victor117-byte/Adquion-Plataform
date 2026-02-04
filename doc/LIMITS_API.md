# Sistema de Límites y Suscripciones

## Modelo de Negocio

```
┌─────────────────────────────────────────────────────────────────┐
│  SUSCRIPCIÓN = POR ORGANIZACIÓN                                │
│                                                                 │
│  Cada organización tiene su propio plan (Free, Pro, Business)  │
│  Todos los usuarios de esa organización comparten:             │
│    - Límites del plan                                          │
│    - Espacio de almacenamiento                                 │
│    - Features habilitadas                                      │
│                                                                 │
│  LÍMITE GLOBAL: Máximo 5 organizaciones por usuario            │
│  (configurable en config/app.config.json)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Endpoints Afectados

### Endpoints que VERIFICAN límites antes de crear recursos:

| Endpoint | Límite verificado | Status si excede |
|----------|-------------------|------------------|
| `POST /api/documentos` | `files` + `storage` | 403 |
| `POST /api/auth/users` | `users` | 403 |
| `POST /api/auth/register` | organizaciones (global) | 403 |
| `POST /api/contribuyentes` | `clients` | 403 |
| `POST /api/automatizaciones` | `sat_automations` | 403 |

### Respuesta cuando se excede un límite:

```json
{
  "success": false,
  "message": "Has alcanzado el límite de 5 usuarios. Actualiza tu plan para continuar.",
  "upgradeRequired": true,
  "current": 5,
  "limit": 5
}
```

**HTTP Status: 403 Forbidden**

---

## GET /api/usage - Consultar Estado de Uso

### Request

```http
GET /api/usage
Authorization: Bearer <token>
```

Query params opcionales:
- `organizacion`: Nombre de la organización (default: organizacionActiva del JWT)
- `summary=true`: Retorna solo resumen rápido

### Response Completa

```json
{
  "success": true,
  "data": {
    "organization": "Mi Empresa",
    "database": "org_mi_empresa",
    "planId": "pro",
    "planName": "Pro",
    "limits": [
      {
        "resource": "files",
        "label": "Archivos",
        "unit": "archivos",
        "current": 25,
        "limit": -1,
        "percentage": 0,
        "isUnlimited": true,
        "isAtLimit": false,
        "isNearLimit": false,
        "remaining": -1,
        "displayValue": "25 (ilimitado)"
      },
      {
        "resource": "sat_automations",
        "label": "Automatizaciones SAT",
        "unit": "automatizaciones",
        "current": 2,
        "limit": -1,
        "percentage": 0,
        "isUnlimited": true,
        "isAtLimit": false,
        "isNearLimit": false,
        "remaining": -1,
        "displayValue": "2 (ilimitado)"
      },
      {
        "resource": "users",
        "label": "Usuarios",
        "unit": "usuarios",
        "current": 3,
        "limit": 5,
        "percentage": 60,
        "isUnlimited": false,
        "isAtLimit": false,
        "isNearLimit": false,
        "remaining": 2,
        "displayValue": "3 / 5"
      },
      {
        "resource": "clients",
        "label": "Contribuyentes",
        "unit": "contribuyentes",
        "current": 28,
        "limit": 30,
        "percentage": 93,
        "isUnlimited": false,
        "isAtLimit": false,
        "isNearLimit": true,
        "remaining": 2,
        "displayValue": "28 / 30"
      },
      {
        "resource": "storage",
        "label": "Almacenamiento",
        "unit": "MB",
        "current": 512.45,
        "limit": 1024,
        "percentage": 50,
        "isUnlimited": false,
        "isAtLimit": false,
        "isNearLimit": false,
        "remaining": 511.55,
        "displayValue": "512.45 / 1024"
      },
      {
        "resource": "scheduled_executions",
        "label": "Ejecuciones del día",
        "unit": "ejecuciones",
        "current": 1,
        "limit": 3,
        "percentage": 33,
        "isUnlimited": false,
        "isAtLimit": false,
        "isNearLimit": false,
        "remaining": 2,
        "displayValue": "1 / 3"
      }
    ],
    "features": [
      {
        "feature": "full_dashboard",
        "label": "Dashboard completo",
        "enabled": true
      },
      {
        "feature": "whatsapp_notifications",
        "label": "Notificaciones WhatsApp",
        "enabled": true
      },
      {
        "feature": "ai_agent",
        "label": "Agente IA",
        "enabled": false
      }
    ],
    "warnings": [
      "Estás cerca del límite de contribuyentes (28/30)"
    ],
    "hasWarnings": true,
    "quickStats": {
      "totalLimits": 6,
      "atLimit": 0,
      "nearLimit": 1,
      "unlimited": 2,
      "enabledFeatures": 2,
      "totalFeatures": 3
    }
  }
}
```

### Response Resumida (summary=true)

```http
GET /api/usage?summary=true
```

```json
{
  "success": true,
  "data": {
    "organization": "Mi Empresa",
    "database": "org_mi_empresa",
    "summary": [
      { "resource": "users", "current": 3, "limit": 5, "percentage": 60 },
      { "resource": "clients", "current": 28, "limit": 30, "percentage": 93 },
      { "resource": "storage", "current": 512.45, "limit": 1024, "percentage": 50 },
      { "resource": "scheduled_executions", "current": 1, "limit": 3, "percentage": 33 }
    ]
  }
}
```

---

## Cómo Calcular las Limitaciones

### Recursos por Organización (dependen del plan)

| Resource | Cálculo | Tabla |
|----------|---------|-------|
| `files` | `COUNT(*) FROM documentos` | documentos |
| `sat_automations` | `COUNT(*) FROM automatizaciones` | automatizaciones |
| `users` | `COUNT(*) FROM usuarios` | usuarios |
| `clients` | `COUNT(*) FROM contribuyentes` | contribuyentes |
| `storage` | `SUM(tamaño_bytes) / 1024 / 1024` | documentos |
| `scheduled_executions` | `COUNT(*) WHERE DATE(created_at) = TODAY` | logs_automatizaciones |

### Límite Global (no depende del plan)

| Resource | Cálculo |
|----------|---------|
| `organizations` | Busca el email en todas las BDs `org_*` y cuenta en cuántas existe |

---

## Planes Disponibles

### Archivo: `config/plans.config.json`

```json
{
  "BASIC_FREE": {
    "id": "basic_free",
    "name": "Basic Free",
    "price": 0,
    "limits": {
      "max_files": 50,
      "max_sat_automations": 1,
      "max_users": 1,
      "max_clients": 0,
      "storage_mb": 100,
      "scheduled_executions_day": 0,
      "has_full_dashboard": false,
      "has_whatsapp_notifications": false,
      "has_ai_agent": false
    }
  },
  "PRO": {
    "id": "prod_TsXyDhWYh7jjrR",
    "name": "Pro",
    "price": 999.99,
    "limits": {
      "max_files": -1,
      "max_sat_automations": -1,
      "max_users": 5,
      "max_clients": 30,
      "storage_mb": 1024,
      "scheduled_executions_day": 3,
      "has_full_dashboard": true,
      "has_whatsapp_notifications": true,
      "has_ai_agent": false
    }
  },
  "BUSINESS": {
    "id": "prod_TsY1akNl3vsLZ6",
    "name": "Business",
    "price": 1999.99,
    "limits": {
      "max_files": -1,
      "max_sat_automations": -1,
      "max_users": 10,
      "max_clients": 150,
      "storage_mb": 7168,
      "scheduled_executions_day": 3,
      "has_full_dashboard": true,
      "has_whatsapp_notifications": true,
      "has_ai_agent": true
    }
  }
}
```

**Nota:** `-1` significa ilimitado.

---

## Cómo Modificar los Límites

### 1. Límites de Planes (por organización)

Editar `config/plans.config.json`:

```json
{
  "PRO": {
    "limits": {
      "max_users": 10,        // Cambiar de 5 a 10
      "max_clients": 50,      // Cambiar de 30 a 50
      "storage_mb": 2048      // Cambiar de 1GB a 2GB
    }
  }
}
```

### 2. Límite Global de Organizaciones

Editar `config/app.config.json`:

```json
{
  "limits": {
    "max_organizations_per_user": 10  // Cambiar de 5 a 10
  }
}
```

### 3. Cambios en Caliente

Los cambios en los archivos JSON **requieren reiniciar el servidor** para que tomen efecto.

---

## Ejemplos de Uso en Frontend

### React Hook para Verificar Límites

```typescript
// hooks/useUsage.ts
import { useState, useEffect } from 'react';

interface LimitStatus {
  resource: string;
  label: string;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
  isAtLimit: boolean;
  isNearLimit: boolean;
  remaining: number;
}

interface UsageData {
  planId: string;
  planName: string;
  limits: LimitStatus[];
  features: { feature: string; label: string; enabled: boolean }[];
  warnings: string[];
  hasWarnings: boolean;
}

export function useUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/usage', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsage(data.data);
        } else {
          setError(data.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Helper functions
  const canCreate = (resource: string): boolean => {
    const limit = usage?.limits.find(l => l.resource === resource);
    return limit ? !limit.isAtLimit : false;
  };

  const getLimit = (resource: string): LimitStatus | undefined => {
    return usage?.limits.find(l => l.resource === resource);
  };

  const hasFeature = (feature: string): boolean => {
    return usage?.features.find(f => f.feature === feature)?.enabled ?? false;
  };

  return { usage, loading, error, canCreate, getLimit, hasFeature };
}
```

### Componente de Barra de Progreso

```tsx
// components/UsageBar.tsx
interface UsageBarProps {
  resource: string;
  label: string;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
  isAtLimit: boolean;
  isNearLimit: boolean;
}

export function UsageBar({
  label, current, limit, percentage, isUnlimited, isAtLimit, isNearLimit
}: UsageBarProps) {
  const getColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">
          {isUnlimited ? `${current} (ilimitado)` : `${current} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### Verificar Antes de Crear

```tsx
// pages/Usuarios.tsx
import { useUsage } from '@/hooks/useUsage';

export function NuevoUsuarioButton() {
  const { canCreate, getLimit } = useUsage();
  const usersLimit = getLimit('users');

  const handleClick = () => {
    if (!canCreate('users')) {
      // Mostrar modal de upgrade
      showUpgradeModal({
        message: `Has alcanzado el límite de ${usersLimit?.limit} usuarios`,
        current: usersLimit?.current,
        limit: usersLimit?.limit
      });
      return;
    }
    // Abrir formulario de nuevo usuario
    openNewUserForm();
  };

  return (
    <button
      onClick={handleClick}
      disabled={!canCreate('users')}
      className={!canCreate('users') ? 'opacity-50 cursor-not-allowed' : ''}
    >
      Nuevo Usuario
      {usersLimit?.isAtLimit && <span className="ml-2">🔒</span>}
    </button>
  );
}
```

### Mostrar Advertencias

```tsx
// components/UsageWarnings.tsx
import { useUsage } from '@/hooks/useUsage';

export function UsageWarnings() {
  const { usage } = useUsage();

  if (!usage?.hasWarnings) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">⚠️</div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700 font-medium">
            Atención: Te estás acercando a los límites de tu plan
          </p>
          <ul className="mt-2 text-sm text-yellow-600">
            {usage.warnings.map((warning, i) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
          <button className="mt-2 text-yellow-800 underline">
            Actualizar plan
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Verificar Features

```tsx
// components/AIAgentButton.tsx
import { useUsage } from '@/hooks/useUsage';

export function AIAgentButton() {
  const { hasFeature } = useUsage();

  if (!hasFeature('ai_agent')) {
    return (
      <button disabled className="opacity-50">
        Agente IA 🔒
        <span className="text-xs block">Disponible en plan Business</span>
      </button>
    );
  }

  return <button>Usar Agente IA</button>;
}
```

---

## Manejo de Errores 403 en Frontend

```typescript
// utils/api.ts
export async function apiRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include'
  });

  const data = await response.json();

  if (response.status === 403 && data.upgradeRequired) {
    // Mostrar modal de upgrade
    showUpgradeModal({
      message: data.message || data.error,
      current: data.current,
      limit: data.limit
    });
    throw new Error('LIMIT_EXCEEDED');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error desconocido');
  }

  return data;
}

// Uso
try {
  await apiRequest('/api/auth/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
} catch (error) {
  if (error.message === 'LIMIT_EXCEEDED') {
    // Ya se mostró el modal de upgrade
    return;
  }
  // Otro error
  showErrorToast(error.message);
}
```

---

## Resumen de Campos en Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `resource` | string | Identificador del recurso |
| `label` | string | Nombre para mostrar en UI |
| `unit` | string | Unidad (archivos, MB, usuarios, etc.) |
| `current` | number | Cantidad actual usada |
| `limit` | number | Límite del plan (-1 = ilimitado) |
| `percentage` | number | Porcentaje usado (0-100) |
| `isUnlimited` | boolean | true si limit = -1 |
| `isAtLimit` | boolean | true si current >= limit |
| `isNearLimit` | boolean | true si percentage >= 80% |
| `remaining` | number | Cuánto queda disponible |
| `displayValue` | string | Texto formateado para UI |
