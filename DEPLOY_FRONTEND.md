# 🚀 Guía de Despliegue del Frontend en Vercel

Esta guía te ayudará a desplegar el frontend de tu sistema electoral en Vercel de forma rápida y sencilla.

## 📋 Requisitos Previos

1. **Cuenta de Vercel**: Crea una cuenta gratuita en [vercel.com](https://vercel.com)
2. **Repositorio Git**: Tu código debe estar en GitHub, GitLab o Bitbucket
3. **Backend desplegado**: Asegúrate de que tu backend ya esté desplegado (Railway, Render, etc.) y tengas su URL

## 🎯 Opción 1: Despliegue desde la Interfaz Web de Vercel (Recomendado)

### Paso 1: Conectar el Repositorio

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New..."** → **"Project"**
3. Conecta tu repositorio (GitHub, GitLab o Bitbucket)
4. Selecciona el repositorio que contiene tu frontend

### Paso 2: Configurar el Proyecto

Vercel detectará automáticamente que es un proyecto Vite. Verifica que:

- **Framework Preset**: `Vite`
- **Root Directory**: `.` (raíz del proyecto)
- **Build Command**: `npm run build` (debería detectarse automáticamente)
- **Output Directory**: `dist` (debería detectarse automáticamente)
- **Install Command**: `npm install` (debería detectarse automáticamente)

### Paso 3: Configurar Variables de Entorno

Antes de hacer el deploy, configura las siguientes variables de entorno en Vercel:

1. En la sección **"Environment Variables"**, agrega:

```env
VITE_API_URL=https://tu-backend.railway.app/api
```

**Importante**: 
- Reemplaza `https://tu-backend.railway.app` con la URL real de tu backend desplegado
- Si tu backend está en Render, usa la URL de Render
- **NO** incluyas `/api` al final si tu backend ya lo incluye en la configuración

**Ejemplos**:
- Backend en Railway: `VITE_API_URL=https://sistema-electoral-backend-production.up.railway.app/api`
- Backend en Render: `VITE_API_URL=https://sistema-electoral-backend.onrender.com/api`
- Backend local (solo para pruebas): `VITE_API_URL=http://localhost:8080/api`

### Paso 4: Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que se complete el build (generalmente 1-3 minutos)
3. Una vez completado, Vercel te dará una URL como: `https://tu-proyecto.vercel.app`

### Paso 5: Verificar el Despliegue

1. Visita la URL proporcionada por Vercel
2. Verifica que la aplicación cargue correctamente
3. Prueba el login con DNI para confirmar que se conecta al backend

## 🎯 Opción 2: Despliegue desde la Línea de Comandos (CLI)

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Iniciar Sesión

```bash
vercel login
```

### Paso 3: Desplegar

Desde la raíz de tu proyecto frontend:

```bash
vercel
```

Sigue las instrucciones:
- **Set up and deploy?** → `Y`
- **Which scope?** → Selecciona tu cuenta
- **Link to existing project?** → `N` (primera vez) o `Y` (si ya tienes un proyecto)
- **Project name?** → Presiona Enter para usar el nombre por defecto
- **Directory?** → Presiona Enter para usar `.` (raíz)

### Paso 4: Configurar Variables de Entorno

```bash
vercel env add VITE_API_URL
```

Cuando te pregunte:
- **Environment**: Selecciona `Production`, `Preview` y `Development`
- **Value**: Ingresa la URL de tu backend (ej: `https://tu-backend.railway.app/api`)

### Paso 5: Desplegar a Producción

```bash
vercel --prod
```

## 🔧 Configuración Adicional

### Variables de Entorno por Entorno

Puedes configurar diferentes URLs de backend para diferentes entornos:

```bash
# Producción
vercel env add VITE_API_URL production
# Valor: https://tu-backend-produccion.railway.app/api

# Preview (pull requests)
vercel env add VITE_API_URL preview
# Valor: https://tu-backend-staging.railway.app/api

# Desarrollo
vercel env add VITE_API_URL development
# Valor: http://localhost:8080/api
```

### Actualizar Variables de Entorno

Si necesitas cambiar una variable de entorno:

1. **Desde la web**: Ve a tu proyecto en Vercel → Settings → Environment Variables
2. **Desde CLI**: 
   ```bash
   vercel env rm VITE_API_URL
   vercel env add VITE_API_URL
   ```

### Configurar Dominio Personalizado

1. Ve a tu proyecto en Vercel → Settings → Domains
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar los DNS

## 🔄 Actualizaciones Automáticas

Vercel se conecta automáticamente a tu repositorio Git. Cada vez que hagas `git push`:

- **Push a `main`/`master`**: Se despliega automáticamente a producción
- **Push a otras ramas**: Se crea un preview deployment (URL única para esa rama)
- **Pull Requests**: Se crea un preview deployment automáticamente

## 🐛 Solución de Problemas

### Error: "Failed to fetch" o "Network Error"

**Causa**: El frontend no puede conectarse al backend.

**Solución**:
1. Verifica que `VITE_API_URL` esté configurada correctamente en Vercel
2. Verifica que tu backend esté funcionando y accesible
3. Verifica la configuración de CORS en tu backend (debe incluir la URL de Vercel)

### Error: "Build failed"

**Causa**: Error durante la compilación.

**Solución**:
1. Revisa los logs de build en Vercel
2. Verifica que todas las dependencias estén en `package.json`
3. Asegúrate de que el comando `npm run build` funcione localmente

### Error: "404 Not Found" al navegar

**Causa**: Vercel necesita configuración para SPA (Single Page Application).

**Solución**: El archivo `vercel.json` ya incluye la configuración de rewrites. Si aún tienes problemas, verifica que el archivo esté en la raíz del proyecto.

### CORS Error

**Causa**: El backend no permite solicitudes desde el dominio de Vercel.

**Solución**: 
1. Actualiza `CORS_ALLOWED_ORIGINS` en tu backend para incluir:
   - `https://tu-proyecto.vercel.app`
   - `https://*.vercel.app` (para preview deployments)
2. Reinicia tu backend después de actualizar CORS

## 📝 Checklist Pre-Deploy

Antes de desplegar, asegúrate de:

- [ ] El backend está desplegado y funcionando
- [ ] Tienes la URL del backend
- [ ] Has configurado `VITE_API_URL` en Vercel
- [ ] Has actualizado `CORS_ALLOWED_ORIGINS` en el backend para incluir tu dominio de Vercel
- [ ] El comando `npm run build` funciona localmente
- [ ] Has probado la aplicación localmente con la URL del backend de producción

## 🎉 ¡Listo!

Una vez completado el despliegue, tu aplicación estará disponible en:

- **Producción**: `https://tu-proyecto.vercel.app`
- **Preview**: Se genera automáticamente para cada branch/PR

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Guía de Vite en Vercel](https://vercel.com/guides/deploying-vite-with-vercel)
- [Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

**¿Necesitas ayuda?** Revisa los logs de build en Vercel o consulta la documentación oficial.

