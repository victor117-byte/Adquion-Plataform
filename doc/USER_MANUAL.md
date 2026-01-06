# 👥 Manual de Usuario - Fiscal Nexus Pro

## 📖 Introducción

Bienvenido a **Fiscal Nexus Pro**, tu solución integral para la gestión fiscal y contable. Este manual te guiará paso a paso en el uso de todas las funcionalidades del sistema.

## 🚀 Primeros Pasos

### Registro de Cuenta

1. **Accede a la plataforma**
   - Visita la página principal de Fiscal Nexus Pro
   - Haz clic en el botón **"Comenzar Ahora"** o **"Registrarse"**

2. **Completa el formulario de registro**
   - **Organización**: Nombre de tu empresa o despacho
   - **Nombre completo**: Tu nombre
   - **Correo electrónico**: Email válido
   - **Teléfono**: Número de contacto
   - **Fecha de nacimiento**: Para validación
   - **Contraseña**: Mínimo 8 caracteres, incluir mayúsculas y números

3. **Confirma tu cuenta**
   - Recibirás un correo de confirmación
   - Haz clic en el enlace para activar tu cuenta

### Inicio de Sesión

1. **Accede al login**
   - Haz clic en **"Iniciar Sesión"** en la página principal

2. **Ingresa tus credenciales**
   - **Organización**: Nombre de tu organización
   - **Correo electrónico**: Tu email registrado
   - **Contraseña**: Tu contraseña

3. **Accede al sistema**
   - Serás redirigido al dashboard principal

### Proceso de Onboarding (Primera vez)

Cuando accedas por primera vez, se te guiará a través de:

1. **Bienvenida y Tour**
   - Conoce las funcionalidades principales
   - Familiarízate con la interfaz

2. **Configuración Inicial**
   - Completa tu perfil
   - Configura preferencias básicas

3. **Guía Rápida**
   - Aprende las acciones más comunes
   - Tips y mejores prácticas

## 🎯 Dashboard Principal

### Visión General

El dashboard es tu centro de comando. Desde aquí puedes:
- Ver métricas clave en tiempo real
- Acceder rápidamente a todas las secciones
- Revisar notificaciones pendientes
- Monitorear el estado de tus procesos

### Navegación

**Sidebar (Barra Lateral)**
- **Dashboard**: Vista general del sistema
- **Usuarios**: Gestión de usuarios (Solo Admin)
- **Contribuyentes**: Gestión de contribuyentes
- **Documentos**: Gestión de documentos fiscales
- **Automatizaciones**: Configuración de tareas automáticas
- **Notificaciones**: Centro de mensajes y alertas
- **Reportes**: Dashboards de Power BI
- **Configuración**: Ajustes del sistema (Solo Admin)

**Acciones Rápidas**
- **Menú de usuario**: Haz clic en tu nombre/avatar
- **Notificaciones**: Campana en la parte superior
- **Colapsar sidebar**: Botón de toggle para más espacio

## 👥 Gestión de Usuarios (Solo Administradores)

### Ver Usuarios

1. Navega a **"Usuarios"** en el sidebar
2. Verás una tabla con todos los usuarios de tu organización
3. Información visible:
   - Nombre
   - Correo electrónico
   - Rol (Administrador/Contador)
   - Fecha de registro
   - Estado

### Crear Nuevo Usuario

1. Haz clic en **"Agregar Usuario"**
2. Completa el formulario:
   - Nombre completo
   - Correo electrónico
   - Teléfono
   - Fecha de nacimiento
   - Rol (Administrador o Contador)
   - Contraseña temporal
3. Haz clic en **"Crear Usuario"**
4. El usuario recibirá un correo con sus credenciales

### Editar Usuario

1. En la lista de usuarios, haz clic en el botón **"Editar"** (ícono de lápiz)
2. Modifica los campos necesarios
3. Haz clic en **"Guardar Cambios"**

### Eliminar Usuario

1. Haz clic en el botón **"Eliminar"** (ícono de papelera)
2. Confirma la acción en el diálogo
3. ⚠️ **Advertencia**: Esta acción no se puede deshacer

### Permisos por Rol

**Administrador**
- ✅ Gestión completa de usuarios
- ✅ Acceso a configuración
- ✅ Todas las funcionalidades

**Contador**
- ✅ Gestión de contribuyentes
- ✅ Carga de documentos
- ✅ Visualización de reportes
- ❌ No puede gestionar usuarios
- ❌ No puede modificar configuración

## 🏢 Gestión de Contribuyentes

### Ver Contribuyentes

1. Navega a **"Contribuyentes"** en el sidebar
2. Visualiza la lista completa de contribuyentes
3. Usa los filtros para buscar:
   - Por RFC
   - Por razón social
   - Por régimen fiscal
   - Por estatus

### Registrar Nuevo Contribuyente

1. Haz clic en **"Agregar Contribuyente"**
2. Completa el formulario:
   
   **Datos Fiscales**
   - RFC (13 caracteres)
   - Razón Social
   - Régimen Fiscal
   - Código Postal

   **Información de Contacto**
   - Correo electrónico
   - Teléfono
   - Dirección completa

   **Configuración**
   - Estatus (Activo/Inactivo)
   - Notas adicionales

3. Haz clic en **"Guardar"**

### Editar Contribuyente

1. Selecciona un contribuyente de la lista
2. Haz clic en **"Editar"**
3. Modifica la información necesaria
4. Guarda los cambios

### Ver Detalle de Contribuyente

1. Haz clic en el nombre del contribuyente
2. Verás:
   - Información completa
   - Documentos asociados
   - Historial de actividad
   - Cumplimiento fiscal
   - Notificaciones relacionadas

## 📄 Gestión de Documentos

### Cargar Documento

1. Navega a **"Documentos"**
2. Haz clic en **"Cargar Documento"** o arrastra archivos a la zona de carga
3. Selecciona el tipo de documento:
   - Factura
   - Nómina
   - Declaración
   - Comprobante
   - Otros

4. Completa los metadatos:
   - Contribuyente asociado
   - Fecha de emisión
   - Período fiscal
   - Descripción

5. Haz clic en **"Subir"**

### Formatos Aceptados

- PDF (recomendado)
- XML
- Excel (.xlsx, .xls)
- Word (.docx, .doc)
- Imágenes (.jpg, .png)

**Tamaño máximo**: 10MB por archivo

### Buscar Documentos

**Filtros disponibles:**
- Por contribuyente
- Por tipo de documento
- Por fecha (rango)
- Por período fiscal
- Por texto en nombre

**Búsqueda avanzada:**
1. Haz clic en **"Filtros Avanzados"**
2. Combina múltiples criterios
3. Guarda búsquedas frecuentes

### Descargar Documentos

1. Selecciona uno o varios documentos
2. Haz clic en **"Descargar"**
3. Se descargará un archivo ZIP (múltiples) o el archivo individual

### Organización

**Carpetas automáticas:**
- Por contribuyente
- Por año fiscal
- Por tipo de documento

**Etiquetas:**
- Agrega etiquetas personalizadas
- Filtra por etiquetas
- Crea colecciones

## ⚡ Automatizaciones

### Ver Automatizaciones Activas

1. Navega a **"Automatizaciones"**
2. Verás todas las automatizaciones configuradas
3. Estados posibles:
   - 🟢 Activa
   - 🟡 Pausada
   - 🔴 Error
   - ⚪ Inactiva

### Crear Nueva Automatización

1. Haz clic en **"Nueva Automatización"**
2. Selecciona el tipo:
   - **Sincronización SAT**: Descarga automática de documentos
   - **Notificaciones**: Alertas programadas
   - **Reportes**: Generación automática
   - **Procesamiento**: Tareas batch

3. Configura los parámetros:
   - Frecuencia (Diaria, Semanal, Mensual)
   - Horario de ejecución
   - Condiciones de activación
   - Acciones a realizar

4. Prueba la automatización
5. Activa y programa

### Editar Automatización

1. Selecciona la automatización
2. Haz clic en **"Editar"**
3. Modifica la configuración
4. Guarda y reactiva

### Pausar/Activar

- Toggle en la lista para cambiar el estado
- Las automatizaciones pausadas no se ejecutarán

### Historial de Ejecuciones

1. Haz clic en una automatización
2. Ve a la pestaña **"Historial"**
3. Revisa:
   - Fecha y hora de ejecución
   - Estado (Éxito/Error)
   - Registros detallados
   - Acciones realizadas

## 🔔 Centro de Notificaciones

### Ver Notificaciones

1. Haz clic en el ícono de campana (🔔)
2. Verás notificaciones recientes
3. Tipos de notificaciones:
   - 📄 Documentos nuevos
   - ⚠️ Alertas importantes
   - ✅ Confirmaciones
   - 📊 Reportes disponibles
   - 🔄 Actualizaciones del sistema

### Gestionar Notificaciones

**Marcar como leída:**
- Haz clic en la notificación
- Se marcará automáticamente

**Eliminar:**
- Desliza a la izquierda (móvil)
- Haz clic en el ícono de papelera (escritorio)

**Filtrar:**
- No leídas
- Por tipo
- Por fecha

### Configurar Alertas

1. Ve a **"Configuración"** → **"Notificaciones"**
2. Personaliza:
   - Tipos de alertas a recibir
   - Frecuencia de emails
   - Notificaciones push
   - Horarios de envío

## 📊 Reportes Power BI

### Acceder a Reportes

1. Navega a **"Reportes"**
2. Verás los dashboards disponibles
3. Haz clic en un reporte para visualizarlo

### Tipos de Reportes

**Reportes Financieros:**
- Estado de resultados
- Balance general
- Flujo de efectivo
- Análisis de costos

**Reportes Fiscales:**
- Cumplimiento tributario
- Declaraciones por período
- Retenciones e IVA
- Análisis de deducciones

**Reportes Operativos:**
- Actividad por usuario
- Documentos procesados
- Contribuyentes activos
- Métricas de uso

### Interactuar con Reportes

**Filtros:**
- Usa los filtros laterales para personalizar
- Selecciona períodos específicos
- Filtra por contribuyente

**Interactividad:**
- Haz clic en gráficos para drill-down
- Hover para ver detalles
- Usa controles de zoom

**Exportar:**
1. Haz clic en el menú del reporte
2. Selecciona **"Exportar"**
3. Elige formato (PDF, Excel, PowerPoint)
4. Descarga el archivo

### Solicitar Nuevos Reportes

1. Haz clic en **"Solicitar Reporte"**
2. Describe tus necesidades:
   - Tipo de análisis
   - Datos a incluir
   - Periodicidad
   - Audiencia

3. El equipo evaluará la solicitud
4. Recibirás notificación cuando esté disponible

## ⚙️ Configuración (Solo Administradores)

### Configuración General

**Información de la Organización:**
- Nombre comercial
- RFC de la organización
- Datos de contacto
- Logo corporativo

**Preferencias del Sistema:**
- Zona horaria
- Formato de fecha
- Moneda predeterminada
- Idioma

### Configuración de Seguridad

**Políticas de Contraseña:**
- Longitud mínima
- Complejidad requerida
- Expiración de contraseñas
- Historial de contraseñas

**Sesiones:**
- Tiempo de inactividad
- Sesiones concurrentes
- Dispositivos autorizados

**Autenticación:**
- Autenticación de dos factores (2FA)
- Métodos de verificación
- Recuperación de cuenta

### Integraciones

**SAT:**
- Credenciales FIEL
- Configuración de sincronización
- Periodicidad de descarga

**Power BI:**
- Token de acceso
- Workspace ID
- Reportes a mostrar

**Otras Integraciones:**
- APIs de terceros
- Webhooks
- Exportaciones automatizadas

### Respaldos

**Configurar Respaldos:**
- Frecuencia (Diaria, Semanal)
- Retención de backups
- Destino de almacenamiento

**Restaurar:**
1. Ve a **"Respaldos"**
2. Selecciona un punto de restauración
3. Confirma la operación
4. ⚠️ Advertencia: Sobrescribirá datos actuales

## 💳 Gestión de Suscripción

### Ver Plan Actual

1. Ve a **"Configuración"** → **"Suscripción"**
2. Verás:
   - Plan contratado
   - Usuarios incluidos
   - Almacenamiento disponible
   - Fecha de renovación
   - Método de pago

### Cambiar de Plan

1. Haz clic en **"Cambiar Plan"**
2. Compara opciones disponibles:
   - **Básico**: Para pequeños despachos
   - **Profesional**: Para despachos medianos
   - **Empresarial**: Para grandes organizaciones

3. Selecciona el plan deseado
4. Confirma los cambios
5. Se prorratearán los días restantes

### Actualizar Método de Pago

1. Ve a **"Métodos de Pago"**
2. Haz clic en **"Agregar Nuevo"**
3. Ingresa datos de tarjeta
4. Establece como predeterminado

### Historial de Facturación

- Consulta todas las facturas emitidas
- Descarga facturas individuales
- Ve el historial de pagos

## 🔐 Seguridad y Privacidad

### Cambiar Contraseña

1. Ve a tu perfil (haz clic en tu nombre)
2. Selecciona **"Cambiar Contraseña"**
3. Ingresa:
   - Contraseña actual
   - Nueva contraseña
   - Confirma nueva contraseña
4. Guarda cambios

### Habilitar 2FA (Autenticación de Dos Factores)

1. Ve a **"Configuración"** → **"Seguridad"**
2. Haz clic en **"Habilitar 2FA"**
3. Escanea el código QR con tu app de autenticación
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
4. Ingresa el código de 6 dígitos
5. Guarda los códigos de recuperación

### Sesiones Activas

1. Ve a **"Sesiones Activas"**
2. Verás todos los dispositivos conectados
3. Puedes cerrar sesiones remotamente
4. Revoca acceso a dispositivos no reconocidos

### Registro de Actividad

- Consulta todas las acciones en tu cuenta
- Filtra por tipo de acción
- Descarga reportes de auditoría

## 📱 Uso en Dispositivos Móviles

### Responsive Design

La plataforma se adapta automáticamente a:
- 📱 Smartphones
- 📱 Tablets
- 💻 Laptops
- 🖥️ Monitores de escritorio

### Navegación Móvil

**Menú Hamburguesa:**
- Toca el ícono ☰ para abrir el menú
- Accede a todas las secciones
- Cierra tocando fuera del menú

**Gestos:**
- Desliza para ver más opciones
- Pull-to-refresh para actualizar
- Toca y mantén para acciones rápidas

### Tips para Móvil

- Usa la versión horizontal para tablas
- Los gráficos son interactivos táctiles
- Puedes subir fotos directamente desde la cámara

## ❓ Solución de Problemas

### No puedo iniciar sesión

**Verifica:**
1. Nombre de organización correcto
2. Correo electrónico correcto
3. Contraseña (distingue mayúsculas/minúsculas)

**Solución:**
- Usa **"¿Olvidaste tu contraseña?"**
- Contacta al administrador de tu organización
- Verifica tu conexión a internet

### Error al cargar documentos

**Causas comunes:**
1. Archivo excede 10MB
2. Formato no soportado
3. Conexión intermitente

**Solución:**
- Reduce el tamaño del archivo
- Convierte a PDF
- Intenta nuevamente con mejor conexión

### Reportes no cargan

**Solución:**
1. Recarga la página (F5)
2. Limpia caché del navegador
3. Verifica que tengas reportes asignados
4. Contacta a soporte si persiste

### Automatización falló

**Revisa:**
1. Ve al historial de ejecuciones
2. Lee el mensaje de error
3. Verifica credenciales de integraciones
4. Ajusta la configuración si es necesario

## 📞 Soporte y Ayuda

### Centro de Ayuda

- **Documentación**: [docs.fiscalnexuspro.com](https://docs.fiscalnexuspro.com)
- **Tutoriales en video**: Canal de YouTube
- **FAQs**: Preguntas frecuentes
- **Blog**: Tips y mejores prácticas

### Contacto Directo

**Soporte Técnico:**
- 📧 Email: soporte@fiscalnexuspro.com
- 📱 WhatsApp: +52 XXX XXX XXXX
- ☎️ Teléfono: 01 800 XXX XXXX
- 💬 Chat en vivo: Disponible 9:00-18:00 hrs

**Horarios de Atención:**
- Lunes a Viernes: 9:00 - 18:00
- Urgencias 24/7: soporte-urgencias@fiscalnexuspro.com

### Retroalimentación

¿Tienes sugerencias o encontraste un bug?

1. Ve a **"Ayuda"** → **"Enviar Retroalimentación"**
2. Describe tu experiencia
3. Adjunta capturas de pantalla si es posible
4. Envía

¡Tu opinión nos ayuda a mejorar!

## 🎓 Recursos Adicionales

### Videos Tutoriales

- **Introducción al sistema** (5 min)
- **Gestión de contribuyentes** (10 min)
- **Carga masiva de documentos** (8 min)
- **Configuración de automatizaciones** (12 min)
- **Lectura de reportes** (7 min)

### Guías Rápidas PDF

- Guía rápida de inicio
- Checklist de configuración
- Tips de eficiencia
- Atajos de teclado

### Actualizaciones

**Registro de cambios:**
- Ve a **"Ayuda"** → **"Novedades"**
- Revisa las últimas actualizaciones
- Aprende sobre nuevas funcionalidades

---

## 📋 Glosario

- **RFC**: Registro Federal de Contribuyentes
- **SAT**: Servicio de Administración Tributaria
- **FIEL**: Firma Electrónica Avanzada
- **2FA**: Autenticación de Dos Factores
- **Dashboard**: Tablero de control
- **Power BI**: Herramienta de visualización de datos
- **Multi-tenant**: Sistema que soporta múltiples organizaciones

---

## ✅ Checklist de Configuración Inicial

Para administradores nuevos:

- [ ] Completar perfil de la organización
- [ ] Configurar logo corporativo
- [ ] Crear usuarios iniciales
- [ ] Registrar primeros contribuyentes
- [ ] Configurar integraciones (SAT, Power BI)
- [ ] Establecer políticas de seguridad
- [ ] Configurar automatizaciones básicas
- [ ] Probar carga de documentos
- [ ] Revisar reportes disponibles
- [ ] Configurar notificaciones
- [ ] Establecer método de pago
- [ ] Realizar tour completo del sistema

---

**¡Listo para comenzar!** 🚀

Si tienes alguna duda, no dudes en contactar a nuestro equipo de soporte. Estamos aquí para ayudarte a aprovechar al máximo Fiscal Nexus Pro.

---

**Versión:** 1.0  
**Última actualización:** Enero 2026  
**Autor:** Equipo Fiscal Nexus Pro
