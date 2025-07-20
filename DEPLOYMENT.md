# Guía de Despliegue - Sistema de Inventario IT

## Configuración Actual

### Frontend (Netlify)
- **URL**: Tu dominio de Netlify
- **Configuración**: `netlify.toml` actualizado para redirigir a Railway
- **API URL**: `https://api.soporteches.online`

### Backend (Railway)
- **URL**: `https://api.soporteches.online`
- **Archivo principal**: `main.py`
- **CORS**: Configurado para permitir Netlify

## Cambios Realizados

### 1. Configuración CORS (main.py)
- Agregados dominios de Netlify a los orígenes permitidos
- Incluido `https://*.netlify.app` y `https://*.netlify.com`

### 2. Redirecciones Netlify (netlify.toml)
- Actualizadas todas las redirecciones para apuntar a `https://api.soporteches.online`
- Eliminadas referencias a `localhost:5000`

### 3. URLs del Frontend
- Creado archivo `config.js` para centralizar URLs
- Corregidas todas las URLs hardcodeadas
- Actualizada función `exportarExcel` para usar API_URL

### 4. Configuración Railway (render.yaml)
- Corregido comando de inicio: `gunicorn main:app`

## Verificación de Funcionamiento

### 1. Verificar Backend
```bash
curl https://api.soporteches.online/
# Debe devolver: "Sistema de Inventario IT - Backend Flask funcionando"
```

### 2. Verificar CORS
```bash
curl -H "Origin: https://tu-dominio.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS https://api.soporteches.online/usuarios
```

### 3. Verificar Login
- Intentar iniciar sesión desde el frontend
- Verificar que el token se guarde correctamente
- Verificar que las peticiones incluyan el header Authorization

## Troubleshooting

### Error de CORS
- Verificar que el dominio de Netlify esté en la lista de orígenes permitidos
- Asegurar que Railway esté desplegado correctamente

### Error de Conexión
- Verificar que `https://api.soporteches.online` esté funcionando
- Revisar logs de Railway para errores

### Error de Autenticación
- Verificar que el token se esté enviando correctamente
- Revisar que el endpoint de login funcione

## Variables de Entorno

### Railway
- `FLASK_ENV`: production
- `DATABASE_URL`: (configurar según tu base de datos)

### Netlify
- No requiere variables de entorno específicas
- Las redirecciones están configuradas en `netlify.toml`

## Comandos Útiles

### Desplegar Backend
```bash
# En Railway, el despliegue es automático al hacer push
git add .
git commit -m "Actualizar configuración"
git push
```

### Desplegar Frontend
```bash
cd frontend
npm run build
# Netlify detectará automáticamente los cambios
```

### Probar Localmente
```bash
# Backend
python main.py

# Frontend
cd frontend
npm start
``` 