# 📊 Fiscal Nexus Pro

> Sistema integral de gestión fiscal y contable multi-tenant

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

## 🎯 Descripción

**Fiscal Nexus Pro** es una plataforma moderna y completa para la gestión fiscal y contable, diseñada específicamente para despachos contables y empresas que necesitan administrar múltiples contribuyentes, documentos fiscales, reportes y automatizaciones de forma eficiente y segura.

### ✨ Características Principales

- 🏢 **Multi-tenant**: Soporte para múltiples organizaciones con datos completamente aislados
- 👥 **Gestión de Usuarios**: Control de acceso basado en roles (Administrador/Contador)
- 📄 **Gestión Documental**: Carga, organización y búsqueda de documentos fiscales
- 🤖 **Automatizaciones**: Sincronización automática con SAT y tareas programadas
- 📊 **Reportes Power BI**: Dashboards interactivos con análisis en tiempo real
- 🔔 **Notificaciones**: Sistema de alertas y recordatorios personalizables
- 🔐 **Seguridad**: Autenticación robusta y encriptación de datos
- 📱 **Responsive**: Interfaz adaptable a cualquier dispositivo

## 🚀 Inicio Rápido

### Prerequisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 o **Bun** >= 1.0.0

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/victor117-byte/fiscal-nexus-pro.git

# 2. Navegar al directorio
cd fiscal-nexus-pro

# 3. Instalar dependencias
npm install
# o si usas Bun
bun install

# 4. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus configuraciones

# 5. Iniciar servidor de desarrollo
npm run dev
# o
bun dev
```

La aplicación estará disponible en `http://localhost:5173`

### Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000/api

# Otras configuraciones...
```

## 🏗️ Estructura del Proyecto

```
fiscal-nexus-pro/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/          # Componentes base (shadcn/ui)
│   │   ├── main/        # Secciones del dashboard
│   │   └── *.tsx        # Componentes de features
│   ├── contexts/        # Contextos de React
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilidades
│   ├── pages/           # Páginas/Rutas principales
│   ├── App.tsx          # Componente raíz
│   └── main.tsx         # Punto de entrada
├── doc/                 # Documentación del proyecto
│   ├── PROJECT_OVERVIEW.md
│   ├── DIAGRAMS.md
│   ├── USER_MANUAL.md
│   └── API_GUIDE.md
├── public/              # Archivos estáticos
└── ...archivos de configuración
```

## 📚 Documentación

### Para Desarrolladores

- [📖 **Visión General del Proyecto**](./doc/PROJECT_OVERVIEW.md) - Arquitectura, tecnologías y características
- [📐 **Diagramas del Sistema**](./doc/DIAGRAMS.md) - Arquitectura visual, flujos y modelos
- [🔌 **Guía de API**](./doc/API_GUIDE.md) - Documentación de endpoints

### Para Usuarios

- [👥 **Manual de Usuario**](./doc/USER_MANUAL.md) - Guía completa de uso del sistema

## 🛠️ Stack Tecnológico

### Frontend

- **React 18.3** - Biblioteca de UI
- **TypeScript 5.8** - Tipado estático
- **Vite 7.1** - Build tool y dev server
- **React Router 6.30** - Enrutamiento
- **TanStack Query 5.83** - Gestión de estado del servidor
- **Tailwind CSS 3.4** - Framework de estilos
- **shadcn/ui** - Componentes de UI
- **Radix UI** - Primitivos accesibles
- **Recharts 2.15** - Gráficos y visualizaciones
- **React Hook Form 7.61** - Manejo de formularios
- **Zod 3.25** - Validación de esquemas

### Herramientas de Desarrollo

- **ESLint** - Linting
- **TypeScript ESLint** - Reglas TypeScript
- **PostCSS** - Procesamiento de CSS
- **Autoprefixer** - Prefijos CSS automáticos

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Producción
npm run build            # Build de producción
npm run build:dev        # Build en modo desarrollo
npm run preview          # Preview del build de producción

# Calidad de Código
npm run lint             # Ejecuta ESLint
```

## 🎨 Componentes UI

El proyecto utiliza **shadcn/ui** con más de 30 componentes pre-construidos:

- Formularios: Input, Select, Textarea, Checkbox, Radio, Switch
- Navegación: Tabs, Breadcrumb, Pagination, Navigation Menu
- Feedback: Toast, Alert, Dialog, Alert Dialog
- Data Display: Table, Card, Badge, Avatar, Tooltip
- Layout: Sidebar, Separator, Scroll Area, Resizable
- Y muchos más...

## 🔐 Autenticación y Seguridad

### Roles de Usuario

1. **Administrador**
   - Gestión completa de usuarios
   - Acceso a configuración del sistema
   - Todas las funcionalidades disponibles

2. **Contador**
   - Gestión de contribuyentes
   - Carga y consulta de documentos
   - Visualización de reportes

### Características de Seguridad

- ✅ Autenticación basada en credenciales
- ✅ Almacenamiento seguro de sesiones
- ✅ Validación de datos con Zod
- ✅ Protección de rutas
- ✅ Separación de datos por organización (multi-tenant)

## 🚀 Deployment

### Lovable (Recomendado)

1. Visita [Lovable Project](https://lovable.dev/projects/303a374d-7f0e-46fb-9f77-68a264a1c713)
2. Haz clic en Share → Publish
3. Configura tu dominio personalizado (opcional)

### Otras Plataformas

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Configura workflow de GitHub Actions

## 🤝 Contribución

### Flujo de Trabajo

1. Fork del repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit de cambios (`git commit -am 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

### Estándares de Código

- Sigue las convenciones de TypeScript
- Usa componentes funcionales con hooks
- Mantén componentes pequeños y reutilizables
- Documenta funciones complejas
- Escribe código limpio y legible

## 📊 Visualización de Diagramas

Los diagramas del proyecto usan **Mermaid**. Para visualizarlos:

- **GitHub**: Se renderizan automáticamente
- **VS Code**: Instala "Markdown Preview Mermaid Support"
- **Online**: [Mermaid Live Editor](https://mermaid.live/)

## 📝 Changelog

### Versión 0.0.0 (Enero 2026)

- ✅ Implementación inicial del sistema
- ✅ Sistema de autenticación multi-tenant
- ✅ Dashboard principal con navegación
- ✅ Módulos de gestión (usuarios, contribuyentes, documentos)
- ✅ Integración con Power BI
- ✅ Sistema de notificaciones
- ✅ Automatizaciones básicas
- ✅ Diseño responsive completo
- ✅ Documentación completa del proyecto

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor:

1. Verifica que no esté ya reportado en [Issues](https://github.com/victor117-byte/fiscal-nexus-pro/issues)
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si es posible
   - Información del entorno (navegador, OS, etc.)

## 📄 Licencia

Este proyecto es **propietario**. Todos los derechos reservados.

## 👨‍💻 Autor

**Victor117-byte**

- GitHub: [@victor117-byte](https://github.com/victor117-byte)

## 🙏 Agradecimientos

- [Lovable](https://lovable.dev) - Plataforma de desarrollo
- [shadcn/ui](https://ui.shadcn.com) - Componentes de UI
- [Radix UI](https://www.radix-ui.com) - Primitivos accesibles
- [Tailwind CSS](https://tailwindcss.com) - Framework de CSS
- [React](https://react.dev) - Biblioteca de UI

---

**Desarrollado con ❤️ para simplificar la gestión fiscal**

🌐 **Website**: [fiscalnexuspro.com](https://fiscalnexuspro.com)  
📧 **Email**: soporte@fiscalnexuspro.com  
💼 **LinkedIn**: [Fiscal Nexus Pro](https://linkedin.com/company/fiscal-nexus-pro)
