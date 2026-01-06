# 🔧 Guía de Desarrollo - Fiscal Nexus Pro

## 📋 Índice

1. [Configuración del Entorno](#configuración-del-entorno)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Convenciones de Código](#convenciones-de-código)
4. [Componentes](#componentes)
5. [Estado y Gestión de Datos](#estado-y-gestión-de-datos)
6. [Routing](#routing)
7. [Estilos](#estilos)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## 🚀 Configuración del Entorno

### Prerequisitos

```bash
# Versiones requeridas
node >= 18.0.0
npm >= 9.0.0
# o
bun >= 1.0.0
```

### Instalación de Dependencias

```bash
# Usando npm
npm install

# Usando Bun (más rápido)
bun install
```

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
# Backend API
VITE_API_URL=http://localhost:8000/api

# Modo de desarrollo
VITE_DEV_MODE=true

# Otras configuraciones...
```

### Configuración del IDE (VS Code)

Extensiones recomendadas:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "bierner.markdown-mermaid"
  ]
}
```

## 📁 Estructura de Archivos

### Organización por Feature

```
src/
├── components/
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── main/            # Secciones del dashboard
│   ├── Feature.tsx      # Componente de feature
│   └── index.ts         # Barrel exports
├── contexts/
│   └── AuthContext.tsx  # Contextos globales
├── hooks/
│   └── use-custom.ts    # Custom hooks
├── lib/
│   └── utils.ts         # Utilidades
├── pages/
│   └── PageName.tsx     # Páginas/Rutas
├── types/
│   └── index.ts         # Tipos TypeScript
└── constants/
    └── index.ts         # Constantes
```

### Naming Conventions

**Archivos:**
- Componentes: `PascalCase.tsx` (ej: `UserCard.tsx`)
- Hooks: `use-kebab-case.ts` (ej: `use-auth.ts`)
- Utilidades: `kebab-case.ts` (ej: `format-date.ts`)
- Tipos: `PascalCase.types.ts` (ej: `User.types.ts`)

**Variables y Funciones:**
```typescript
// Variables - camelCase
const userName = "Juan";
const isActive = true;

// Funciones - camelCase
function handleSubmit() {}
const calculateTotal = () => {};

// Componentes - PascalCase
const UserProfile = () => {};

// Constantes - UPPER_SNAKE_CASE
const API_BASE_URL = "...";
const MAX_FILE_SIZE = 10485760;

// Tipos/Interfaces - PascalCase
interface User {}
type UserRole = "admin" | "contador";
```

## 📦 Componentes

### Estructura de un Componente

```typescript
// Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

// Component
export const MyComponent = ({ 
  title, 
  onAction,
  className 
}: MyComponentProps) => {
  // State
  const [isLoading, setIsLoading] = useState(false);

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction?.();
    } finally {
      setIsLoading(false);
    }
  };

  // Render
  return (
    <div className={cn("container", className)}>
      <h2>{title}</h2>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Cargando..." : "Acción"}
      </Button>
    </div>
  );
};
```

### Mejores Prácticas

#### ✅ DO

```typescript
// Componentes pequeños y enfocados
const UserAvatar = ({ user }: { user: User }) => (
  <Avatar>
    <AvatarImage src={user.avatar} />
    <AvatarFallback>{user.initials}</AvatarFallback>
  </Avatar>
);

// Props destructuring
const Card = ({ title, children, className }: CardProps) => { ... };

// Early returns
if (!data) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

// Composición sobre prop drilling
<UserContext.Provider value={user}>
  <UserProfile />
</UserContext.Provider>
```

#### ❌ DON'T

```typescript
// No componentes gigantes (>300 líneas)
const MegaComponent = () => {
  // 500 líneas de código...
};

// No lógica compleja en JSX
return (
  <div>
    {users.filter(u => u.active).map(u => 
      u.role === 'admin' ? <AdminCard {...u} /> : <UserCard {...u} />
    )}
  </div>
);

// Mejor: extraer a funciones/componentes
const activeUsers = users.filter(u => u.active);
return (
  <div>
    {activeUsers.map(user => <UserCard key={user.id} user={user} />)}
  </div>
);
```

## 🎣 Custom Hooks

### Patrón de Custom Hook

```typescript
// hooks/use-fetch-data.ts
import { useState, useEffect } from "react";

interface UseFetchDataOptions<T> {
  url: string;
  initialData?: T;
}

export function useFetchData<T>({ url, initialData }: UseFetchDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// Uso
const MyComponent = () => {
  const { data, loading, error } = useFetchData<User>({
    url: '/api/users/1'
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <UserProfile user={data} />;
};
```

## 📊 Estado y Gestión de Datos

### Context API

```typescript
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### TanStack Query

```typescript
// hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Queries
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Mutations
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUser: NewUser) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache de usuarios
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Uso en componente
const UsersPage = () => {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();

  const handleCreate = (user: NewUser) => {
    createUser.mutate(user, {
      onSuccess: () => {
        toast.success('Usuario creado exitosamente');
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    });
  };

  // ...
};
```

## 🎨 Estilos

### Tailwind CSS

**Orden de clases:**
1. Layout (display, position, flex, grid)
2. Spacing (margin, padding)
3. Sizing (width, height)
4. Typography (font, text)
5. Colors
6. Effects (shadow, opacity, transition)

```typescript
// ✅ Bien organizado
<div className="flex items-center justify-between p-4 w-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">

// ❌ Desordenado
<div className="shadow-md bg-white transition-shadow hover:shadow-lg flex p-4 rounded-lg items-center w-full justify-between">
```

### Función cn() - Class Names

```typescript
import { cn } from "@/lib/utils";

// Combinar clases condicionales
<Button 
  className={cn(
    "px-4 py-2",
    isActive && "bg-blue-500",
    isDisabled && "opacity-50 cursor-not-allowed",
    className // Props del componente
  )}
>
```

### Variantes con CVA

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  // ...
}

const Button = ({ variant, size, className, ...props }: ButtonProps) => {
  return (
    <button 
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};
```

## 🧪 Testing

### Unit Tests con Vitest

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

## 🚀 Deployment

### Build de Producción

```bash
# Build
npm run build

# Preview del build
npm run preview
```

### Optimizaciones

**Lazy Loading:**
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  );
}
```

**Code Splitting:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

## 🐛 Troubleshooting

### Problemas Comunes

**1. Error: "Cannot find module '@/...'"**

Verifica `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**2. Tailwind no aplica estilos**

Verifica `tailwind.config.ts`:
```typescript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

**3. Error de CORS con API**

Configura proxy en `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

## 📝 Git Workflow

### Branching Strategy

```
main                 # Producción
├── develop         # Desarrollo
    ├── feature/user-management
    ├── feature/documents
    └── fix/login-issue
```

### Commit Messages

Formato: `tipo(scope): mensaje`

```bash
feat(auth): agregar autenticación con Google
fix(dashboard): corregir error en carga de datos
docs(readme): actualizar instrucciones de instalación
style(button): ajustar espaciado
refactor(api): simplificar llamadas HTTP
test(user): agregar tests unitarios
chore(deps): actualizar dependencias
```

### Pre-commit Checklist

- [ ] Código lintado (`npm run lint`)
- [ ] Sin errores de TypeScript
- [ ] Tests pasando
- [ ] Commit message descriptivo
- [ ] Sin console.logs

## 🔐 Seguridad

### Validación de Datos

```typescript
import { z } from "zod";

// Schema de validación
const userSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  correo: z.string().email("Email inválido"),
  edad: z.number().min(18, "Debes ser mayor de edad"),
});

// Uso
try {
  const validatedData = userSchema.parse(formData);
  // Datos válidos
} catch (error) {
  if (error instanceof z.ZodError) {
    // Manejar errores de validación
    console.log(error.errors);
  }
}
```

### Sanitización de Inputs

```typescript
// Evitar XSS
const sanitizeInput = (input: string) => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};
```

## 📊 Performance

### Memoización

```typescript
import { memo, useMemo, useCallback } from 'react';

// Componente memoizado
export const ExpensiveComponent = memo(({ data }: Props) => {
  return <div>{/* render */}</div>;
});

// Valor memoizado
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// Función memoizada
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### Virtualización

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualList = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div key={virtualItem.key} style={{ height: `${virtualItem.size}px` }}>
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎯 Mejores Prácticas

### DRY (Don't Repeat Yourself)

```typescript
// ❌ Repetición
const AdminButton = () => (
  <button className="px-4 py-2 bg-blue-500 text-white rounded">
    Admin
  </button>
);

const UserButton = () => (
  <button className="px-4 py-2 bg-blue-500 text-white rounded">
    User
  </button>
);

// ✅ Reutilización
const RoleButton = ({ role }: { role: string }) => (
  <button className="px-4 py-2 bg-blue-500 text-white rounded">
    {role}
  </button>
);
```

### SOLID Principles

**Single Responsibility:**
```typescript
// ❌ Hace demasiado
const UserComponent = () => {
  // Fetch data
  // Validate data
  // Format data
  // Render UI
  // Handle events
};

// ✅ Responsabilidad única
const useUserData = () => { /* fetch & validate */ };
const formatUserName = (name: string) => { /* format */ };
const UserCard = ({ user }: Props) => { /* render */ };
```

---

## 📚 Recursos Adicionales

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)

---

**Mantén este documento actualizado con nuevos patrones y mejores prácticas que el equipo adopte.**

**Versión:** 1.0  
**Última actualización:** Enero 2026
