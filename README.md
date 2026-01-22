
# 📊 Fiscal Nexus Pro

> Plataforma integral para la gestión fiscal y contable multi-tenant

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 🚀 Guía de Despliegue

### Despliegue Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/victor117-byte/Adquion-Plataform.git
   cd Adquion-Plataform
   ```
2. Instala dependencias:
   ```bash
   npm install # o bun install
   ```
3. Configura variables de entorno:
   - Copia `.env.production` a `.env` y edítalo según tu entorno.
   - Ejemplo:
     ```env
     VITE_API_URL=http://localhost:8000/api
     VITE_PUBLIC_KEY=tu_clave_publica
     ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev # o bun dev
   ```
5. Accede a `http://localhost:5173`

### Despliegue en Producción

1. Build de producción:
   ```bash
   npm run build
   ```
2. Sirve el contenido de la carpeta `dist/` con tu servidor preferido (Nginx, Vercel, Netlify, etc).
3. Configura las variables de entorno en el host de producción.
4. Revisa la documentación en `/doc/` para detalles de endpoints y arquitectura.

#### Ejemplo de despliegue en Vercel
1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel --prod`
3. Configura variables en el dashboard de Vercel.

#### Ejemplo de despliegue en Netlify
1. Instala Netlify CLI: `npm i -g netlify-cli`
2. Ejecuta: `netlify deploy --prod`
3. Configura variables en el dashboard de Netlify.

---


## 🎯 Descripción

**Fiscal Nexus Pro** es una plataforma moderna y completa para la gestión fiscal y contable, diseñada para despachos contables y empresas que requieren administrar múltiples contribuyentes, documentos fiscales, reportes y automatizaciones de forma eficiente y segura.


### ✨ Características Principales

- 🏢 **Multi-tenant**: Soporte para múltiples organizaciones con datos aislados
- 👥 **Gestión de Usuarios**: Roles y permisos (Administrador/Contador)
- 📄 **Gestión Documental**: Carga, organización y búsqueda de documentos fiscales
- 🤖 **Automatizaciones**: Sincronización automática con SAT y tareas programadas
- 📊 **Reportes Power BI**: Dashboards interactivos en tiempo real
- 🔔 **Notificaciones**: Alertas y recordatorios personalizables
- 🔐 **Seguridad**: Autenticación robusta y encriptación de datos
- 📱 **Responsive**: Interfaz adaptable a cualquier dispositivo

---

git clone https://github.com/victor117-byte/fiscal-nexus-pro.git

## 🛠️ Información del Proyecto

### Prerequisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 o **Bun** >= 1.0.0

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto. Ejemplo:

```env
VITE_API_URL=http://localhost:8000/api
VITE_PUBLIC_KEY=tu_clave_publica
# Agrega otras variables necesarias
```

Consulta `.env.production` para ejemplos y recomendaciones.

---

fiscal-nexus-pro/

## 🗂️ Estructura del Proyecto

```
Adquion-Plataform/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/           # Componentes base (shadcn/ui)
│   │   ├── main/         # Secciones del dashboard
│   └── *.tsx             # Features
│   ├── contexts/         # Contextos de React
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilidades
│   ├── pages/            # Páginas principales
│   ├── App.tsx           # Componente raíz
│   └── main.tsx          # Entry point
├── doc/                  # Documentación
├── public/               # Archivos estáticos
├── .env.production       # Ejemplo de variables
├── vite.config.ts        # Configuración Vite
└── ...otros archivos
```

---


## 📚 Documentación

- [Visión General](./doc/PROJECT_OVERVIEW.md)
- [Diagramas](./doc/DIAGRAMS.md)
- [API Automatizaciones](./doc/API_AUTOMATIZACIONES.md)
- [API Contribuyentes](./doc/API_CONTRIBUYENTES.md)
- [API Documentos](./doc/API_DOCUMENTOS.md)

---


## 🧩 Principales Dependencias

- **React 18.3**
- **TypeScript 5.8**
- **Vite 7.1**
- **Tailwind CSS 3.4**
- **shadcn/ui**
- **Radix UI**
- **Recharts 2.15**
- **React Hook Form 7.61**
- **Zod 3.25**
- **TanStack Query 5.83**
- **React Router 6.30**

---


### Herramientas de Desarrollo

- **ESLint**
- **TypeScript ESLint**
- **PostCSS**
- **Autoprefixer**

---


## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Producción
npm run build            # Build de producción
npm run preview          # Preview del build

# Calidad de Código
npm run lint             # Ejecuta ESLint
```

---

## 🎨 Componentes UI

El proyecto utiliza **shadcn/ui** con más de 30 componentes pre-construidos:

- Formularios: Input, Select, Textarea, Checkbox, Radio, Switch
- Navegación: Tabs, Breadcrumb, Pagination, Navigation Menu
- Feedback: Toast, Alert, Dialog, Alert Dialog
- Data Display: Table, Card, Badge, Avatar, Tooltip
- Layout: Sidebar, Separator, Scroll Area, Resizable
- Y muchos más...


## 🔐 Seguridad y Roles

### Roles

1. **Administrador**: Control total, gestión de usuarios y configuración.
2. **Contador**: Gestión de contribuyentes, documentos y reportes.

### Seguridad

- Autenticación robusta
- Encriptación de datos sensibles
- Validación de datos con Zod
- Protección de rutas y sesiones
- Separación de datos por organización

---


## 🧑‍💻 Troubleshooting y Buenas Prácticas

- Verifica las variables de entorno antes de desplegar
- Usa HTTPS en producción
- Mantén dependencias actualizadas
- Revisa los logs y errores en consola
- Consulta la documentación en `/doc/` para endpoints y arquitectura

---


## 🤝 Contribución

1. Haz fork del repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit y push
4. Crea un Pull Request

### Estándares
- TypeScript y componentes funcionales
- Hooks y reutilización
- Documenta funciones complejas
- Código limpio y legible

---


## 📊 Visualización de Diagramas

Diagramas en `/doc/DIAGRAMS.md` usando **Mermaid**.
- GitHub: Render automático
- VS Code: Instala "Markdown Preview Mermaid Support"
- Online: [Mermaid Live Editor](https://mermaid.live/)

---


## 📝 Changelog

Consulta el historial de cambios en los Pull Requests y en la sección de Releases.

---


## 🐛 Reporte de Bugs

1. Verifica que no esté reportado en [Issues](https://github.com/victor117-byte/Adquion-Plataform/issues)
2. Crea un nuevo issue con:
   - Descripción clara
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots
   - Información del entorno

---


## 📄 Licencia

Este proyecto es **propietario**. Todos los derechos reservados.

---


## 👨‍💻 Autor

**Victor117-byte**
- GitHub: [@victor117-byte](https://github.com/victor117-byte)

---


## 🙏 Agradecimientos

- [Lovable](https://lovable.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React](https://react.dev)

---

**Desarrollado con ❤️ para simplificar la gestión fiscal**

🌐 **Website**: [fiscalnexuspro.com](https://fiscalnexuspro.com)
📧 **Email**: soporte@fiscalnexuspro.com
💼 **LinkedIn**: [Fiscal Nexus Pro](https://linkedin.com/company/fiscal-nexus-pro)
