import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

// Definición de los temas disponibles
export type ColorTheme = 'default' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate';
export type AppearanceMode = 'light' | 'dark' | 'system';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Headers para las peticiones
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

interface ThemeConfig {
  id: ColorTheme;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
  };
}

// Catálogo de temas disponibles
export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Azul Corporativo',
    description: 'El tema por defecto con tonos azules profesionales',
    preview: { primary: '#3b82f6', secondary: '#8b5cf6' }
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    description: 'Tonos verdes frescos y naturales',
    preview: { primary: '#10b981', secondary: '#14b8a6' }
  },
  {
    id: 'rose',
    name: 'Rosa',
    description: 'Tonos rosas elegantes y modernos',
    preview: { primary: '#f43f5e', secondary: '#ec4899' }
  },
  {
    id: 'amber',
    name: 'Ámbar',
    description: 'Tonos cálidos dorados y naranjas',
    preview: { primary: '#f59e0b', secondary: '#ef4444' }
  },
  {
    id: 'violet',
    name: 'Violeta',
    description: 'Tonos púrpuras creativos',
    preview: { primary: '#8b5cf6', secondary: '#a855f7' }
  },
  {
    id: 'slate',
    name: 'Pizarra',
    description: 'Tonos neutros y minimalistas',
    preview: { primary: '#64748b', secondary: '#475569' }
  }
];

interface ThemeContextType {
  colorTheme: ColorTheme;
  appearanceMode: AppearanceMode;
  resolvedMode: 'light' | 'dark';
  setColorTheme: (theme: ColorTheme) => void;
  setAppearanceMode: (mode: AppearanceMode) => void;
  availableThemes: ThemeConfig[];
  loadPreferencesFromServer: (correo: string, organizacion: string) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_COLOR = 'fiscal-nexus-color-theme';
const STORAGE_KEY_MODE = 'fiscal-nexus-appearance-mode';

interface ThemeProviderProps {
  children: ReactNode;
  defaultColorTheme?: ColorTheme;
  defaultAppearanceMode?: AppearanceMode;
}

export function ThemeProvider({
  children,
  defaultColorTheme = 'default',
  defaultAppearanceMode = 'system'
}: ThemeProviderProps) {
  // Estado para el tema de color
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_COLOR) as ColorTheme;
      if (stored && AVAILABLE_THEMES.some(t => t.id === stored)) {
        return stored;
      }
    }
    return defaultColorTheme;
  });

  // Estado para el modo de apariencia (light/dark/system)
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_MODE) as AppearanceMode;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
    }
    return defaultAppearanceMode;
  });

  // Estado para el modo resuelto (el modo real aplicado)
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

  // Estado de carga
  const [isLoading, setIsLoading] = useState(false);

  // Referencia para las credenciales del usuario actual
  const [userCredentials, setUserCredentials] = useState<{ correo: string; organizacion: string } | null>(null);

  // Resolver el modo real basado en preferencias del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedMode = () => {
      if (appearanceMode === 'system') {
        setResolvedMode(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedMode(appearanceMode);
      }
    };

    updateResolvedMode();
    mediaQuery.addEventListener('change', updateResolvedMode);

    return () => mediaQuery.removeEventListener('change', updateResolvedMode);
  }, [appearanceMode]);

  // Aplicar las clases CSS al documento
  useEffect(() => {
    const root = document.documentElement;

    // Remover todas las clases de tema anteriores
    root.classList.remove('light', 'dark');
    AVAILABLE_THEMES.forEach(theme => {
      root.classList.remove(`theme-${theme.id}`);
    });

    // Aplicar el modo de apariencia
    root.classList.add(resolvedMode);

    // Aplicar el tema de color (solo si no es default)
    if (colorTheme !== 'default') {
      root.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme, resolvedMode]);

  // Función para guardar preferencias en el servidor
  const savePreferencesToServer = useCallback(async (
    newColorTheme: ColorTheme,
    newAppearanceMode: AppearanceMode
  ) => {
    if (!userCredentials) return;

    try {
      const response = await fetch(`${API_URL}/usuarios/preferencias`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          correo: userCredentials.correo,
          organizacion: userCredentials.organizacion,
          color_theme: newColorTheme,
          appearance_mode: newAppearanceMode,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error('❌ Error guardando preferencias:', result.error || result.message);
      }
    } catch (error) {
      console.error('❌ Error de conexión al guardar preferencias:', error);
    }
  }, [userCredentials]);

  // Función para cargar preferencias desde el servidor
  const loadPreferencesFromServer = useCallback(async (correo: string, organizacion: string) => {
    setIsLoading(true);
    setUserCredentials({ correo, organizacion });

    try {
      const url = `${API_URL}/usuarios/preferencias?correo=${encodeURIComponent(correo)}&organizacion=${encodeURIComponent(organizacion)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { color_theme, appearance_mode } = result.data;

        // Validar y aplicar tema de color
        if (color_theme && AVAILABLE_THEMES.some(t => t.id === color_theme)) {
          setColorThemeState(color_theme as ColorTheme);
          localStorage.setItem(STORAGE_KEY_COLOR, color_theme);
        }

        // Validar y aplicar modo de apariencia
        if (appearance_mode && ['light', 'dark', 'system'].includes(appearance_mode)) {
          setAppearanceModeState(appearance_mode as AppearanceMode);
          localStorage.setItem(STORAGE_KEY_MODE, appearance_mode);
        }

        console.log('✅ Preferencias cargadas del servidor:', result.data);
      }
    } catch (error) {
      console.error('❌ Error cargando preferencias del servidor:', error);
      // En caso de error, mantener las preferencias de localStorage
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar preferencias en localStorage y servidor
  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem(STORAGE_KEY_COLOR, theme);
    // Guardar en servidor si hay credenciales
    if (userCredentials) {
      savePreferencesToServer(theme, appearanceMode);
    }
  };

  const setAppearanceMode = (mode: AppearanceMode) => {
    setAppearanceModeState(mode);
    localStorage.setItem(STORAGE_KEY_MODE, mode);
    // Guardar en servidor si hay credenciales
    if (userCredentials) {
      savePreferencesToServer(colorTheme, mode);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        colorTheme,
        appearanceMode,
        resolvedMode,
        setColorTheme,
        setAppearanceMode,
        availableThemes: AVAILABLE_THEMES,
        loadPreferencesFromServer,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
}
