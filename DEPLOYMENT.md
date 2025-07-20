# Guía de Despliegue - Sistema de Inventario IT

## Configuración Actual

### Frontend (Netlify)
- **URL**: Tu dominio de Netlify
- **Configuración**: `netlify.toml` actualizado para redirigir a Railway
- **API URL**: `https://sistemadesplegableboo-production.up.railway.app` (temporal)

### Backend (Railway)
- **URL**: `https://sistemadesplegableboo-production.up.railway.app` (temporal)
- **URL Futura**: `https://api.soporteches.online` (cuando se resuelva DNS)
- **Archivo principal**: `main.py`
- **CORS**: Configurado para permitir Netlify

## ⚠️ Nota Importante sobre Dominios

**Problema actual**: El dominio `soporteches.online` está en estado "Waiting for DNS update" en Railway, lo que causa errores de certificado SSL.

**Solución temporal**: Usando `sistemadesplegableboo-production.up.railway.app` que sí funciona correctamente.

**Para resolver el dominio personalizado**:
1. En Railway, haz clic en "Show instructions" junto a `soporteches.online`
2. Configura los registros DNS según las instrucciones
3. Una vez que el DNS esté propagado, actualiza las URLs en `config.js`

## Cambios Realizados

### 1. Configuración CORS (main.py)
- Agregados dominios de Netlify a los orígenes permitidos
- Incluido `https://*.netlify.app` y `https://*.netlify.com`

### 2. Redirecciones Netlify (netlify.toml)
- Actualizadas todas las redirecciones para apuntar al dominio temporal
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
curl https://sistemadesplegableboo-production.up.railway.app/
# Debe devolver: "Sistema de Inventario IT - Backend Flask funcionando"
```

### 2. Verificar CORS
```bash
curl -H "Origin: https://tu-dominio.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS https://sistemadesplegableboo-production.up.railway.app/usuarios
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
- Verificar que `https://sistemadesplegableboo-production.up.railway.app` esté funcionando
- Revisar logs de Railway para errores

### Error de Autenticación
- Verificar que el token se esté enviando correctamente
- Revisar que el endpoint de login funcione

### Error de Certificado SSL
- **Causa**: Dominio personalizado no configurado correctamente
- **Solución**: Usar el dominio temporal de Railway hasta que se resuelva DNS

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

## Migración Futura a Dominio Personalizado

Cuando `soporteches.online` esté funcionando correctamente:

1. Actualizar `frontend/src/config.js`:
```javascript
export const API_URL = "https://api.soporteches.online";
```

2. Actualizar `netlify.toml` con las nuevas redirecciones
3. Verificar que el certificado SSL esté funcionando
4. Probar todas las funcionalidades 