# Guía de Despliegue - Sistema de Inventario IT

## Configuración Actual

### Frontend (Netlify)
- **URL**: `https://soporteches.online` (dominio personalizado)
- **Configuración**: `netlify.toml` actualizado para redirigir a Railway
- **API URL**: `https://sistemadesplegableboo-production.up.railway.app` (temporal)

### Backend (Railway)
- **URL**: `https://sistemadesplegableboo-production.up.railway.app` (temporal)
- **URL Futura**: `https://api.soporteches.online` (cuando se resuelva DNS)
- **Archivo principal**: `main.py`
- **CORS**: Configurado globalmente para permitir todos los orígenes temporalmente

## ⚠️ Nota Importante sobre Dominios

**Problema actual**: El dominio `soporteches.online` está en estado "Waiting for DNS update" en Railway, lo que causa errores de certificado SSL.

**Solución temporal**: Usando `sistemadesplegableboo-production.up.railway.app` que sí funciona correctamente.

**Para resolver el dominio personalizado**:
1. En Railway, haz clic en "Show instructions" junto a `soporteches.online`
2. Configura los registros DNS según las instrucciones
3. Una vez que el DNS esté propagado, actualiza las URLs en `config.js`

## Cambios Realizados

### 1. Configuración CORS (main.py)
- **Simplificada**: Configuración global con `origins=["*"]` temporalmente
- **Eliminadas**: Configuraciones CORS individuales en blueprints para evitar conflictos
- **Métodos permitidos**: GET, POST, PUT, DELETE, OPTIONS
- **Headers permitidos**: Content-Type, Authorization

### 2. Redirecciones Netlify (netlify.toml)
- Actualizadas todas las redirecciones para apuntar al dominio temporal
- Eliminadas referencias a `localhost:5000`

### 3. URLs del Frontend
- Creado archivo `config.js` para centralizar URLs
- Corregidas todas las URLs hardcodeadas
- Actualizada función `exportarExcel` para usar API_URL

### 4. Configuración Railway (render.yaml)
- Corregido comando de inicio: `gunicorn main:app`

### 5. Corrección de Errores
- Eliminado log de debug en `usuarios.py` que causaba errores
- Simplificada configuración CORS para evitar redirecciones

## Verificación de Funcionamiento

### 1. Verificar Backend
```bash
curl https://sistemadesplegableboo-production.up.railway.app/
# Debe devolver: "Sistema de Inventario IT - Backend Flask funcionando"
```

### 2. Verificar CORS
```bash
curl -H "Origin: https://soporteches.online" \
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
- **Causa**: Configuraciones CORS conflictivas o redirecciones
- **Solución**: Configuración CORS simplificada y global

### Error de Conexión
- Verificar que `https://sistemadesplegableboo-production.up.railway.app` esté funcionando
- Revisar logs de Railway para errores

### Error de Autenticación
- Verificar que el token se esté enviando correctamente
- Revisar que el endpoint de login funcione

### Error de Certificado SSL
- **Causa**: Dominio personalizado no configurado correctamente
- **Solución**: Usar el dominio temporal de Railway hasta que se resuelva DNS

### Error de Redirección en Preflight
- **Causa**: Railway redirigiendo peticiones OPTIONS
- **Solución**: Configuración CORS simplificada y manejo explícito de OPTIONS

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
git commit -m "Actualizar configuración CORS"
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
5. Restringir CORS a dominios específicos en producción

## Configuración CORS para Producción

Una vez que todo funcione, actualizar la configuración CORS en `main.py`:

```python
CORS(app, 
     origins=[
         "https://soporteches.online",
         "https://api.soporteches.online",
         "http://localhost:3000"  # Solo para desarrollo
     ],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])
``` 