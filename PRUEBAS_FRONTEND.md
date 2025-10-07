# Pruebas de integración del frontend con la API

## Prerrequisitos
1. Backend ejecutándose en http://localhost:8000
2. Frontend ejecutándose con `npm run dev`

## Pruebas de autenticación

### 1. Registro de usuario
- Acceder a la página de autenticación `/auth`
- Completar el formulario de registro con:
  - Email: test@example.com
  - Contraseña: password123
  - (Si aplica) Nombre: Usuario Prueba
- Hacer clic en "Registrarse"
- **Resultado esperado**: Redireccionamiento al Dashboard con sesión iniciada

### 2. Inicio de sesión
- Acceder a la página de autenticación `/auth`
- Completar formulario de inicio de sesión con:
  - Email: test@example.com
  - Contraseña: password123
- Hacer clic en "Iniciar sesión"
- **Resultado esperado**: Redireccionamiento al Dashboard con sesión iniciada

### 3. Verificación de sesión persistente
- Iniciar sesión como en el paso anterior
- Cerrar y volver a abrir el navegador
- Acceder directamente a `/dashboard`
- **Resultado esperado**: Acceso al dashboard sin necesidad de iniciar sesión nuevamente

## Pruebas de gestión de documentos

### 1. Subida de documento
- Iniciar sesión y acceder al dashboard
- Hacer clic en "Cargar Archivos" en el menú lateral
- Arrastrar un archivo PDF o XML al área de carga o seleccionarlo con el botón
- **Resultado esperado**: Visualización del progreso de carga y notificación de éxito

### 2. Visualización de documentos
- Iniciar sesión y acceder al dashboard
- Hacer clic en "Mis Documentos" en el menú lateral
- **Resultado esperado**: Visualización de la lista de documentos subidos

### 3. Paginación y filtros
- En la página "Mis Documentos":
  - Probar los filtros por estado (Pendiente, Procesando, Procesado, Error)
  - Cambiar entre páginas usando la paginación
  - Buscar un documento específico usando el campo de búsqueda
- **Resultado esperado**: La lista se actualiza conforme a los filtros aplicados

### 4. Visualización de detalles (si aplica)
- En la lista de documentos, hacer clic en "Ver" en algún documento
- **Resultado esperado**: Visualización de detalles del documento seleccionado

## Notas para desarrolladores

Si encuentras problemas durante las pruebas, revisa lo siguiente:

1. Verificar que la API está correctamente configurada en:
   - En entorno de desarrollo: http://localhost:8000
   - Variable de entorno: VITE_API_URL

2. Los tokens de autenticación se almacenan en:
   - localStorage.getItem('auth_token') para el token JWT
   - localStorage.getItem('user_data') para la información del usuario

3. Para depurar solicitudes a la API, utiliza las herramientas de desarrollo del navegador (F12) > Pestaña Network

4. Si hay problemas con CORS, asegúrate que el backend tiene configurado:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],  # URL de desarrollo de Vite
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```