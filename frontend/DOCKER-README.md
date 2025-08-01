# 🐳 Ejecutar Frontend con Docker

Esta guía te ayudará a ejecutar el frontend de IT-SanCosme usando Docker, sin necesidad de instalar Node.js localmente.

## 📋 Prerrequisitos

### 1. Instalar Docker Desktop
- Descarga desde: https://www.docker.com/products/docker-desktop/
- Instala y reinicia tu computadora
- Verifica la instalación ejecutando: `docker --version`

## 🚀 Ejecutar el Frontend

### Opción 1: Script Automático (Recomendado)
```powershell
# En el directorio frontend/
.\run-frontend.ps1
```

### Opción 2: Comandos Manuales
```powershell
# Navegar al directorio frontend
cd frontend

# Construir y ejecutar con Docker Compose
docker-compose up --build
```

### Opción 3: Solo Docker
```powershell
# Construir la imagen
docker build -t it-sancosme-frontend .

# Ejecutar el contenedor
docker run -p 3000:3000 -v ${PWD}:/app -v /app/node_modules it-sancosme-frontend
```

## 🌐 Acceso a la Aplicación

Una vez ejecutado, la aplicación estará disponible en:
- **http://localhost:3000**

## 🎨 Lo que verás

- ✅ **Nuevo diseño moderno** con gradientes azul-púrpura
- ✅ **Navbar elegante** con efectos de glassmorphism
- ✅ **Login mejorado** con diseño moderno
- ✅ **Todo List completamente funcional** en la sección "Tareas"
- ✅ **Efectos de hover y animaciones** suaves
- ✅ **Diseño responsive** para móviles y desktop

## 🛠️ Comandos Útiles

### Detener el servidor
```powershell
# Si usaste docker-compose
Ctrl + C

# O desde otra terminal
docker-compose down
```

### Ver logs
```powershell
docker-compose logs -f frontend
```

### Reconstruir después de cambios
```powershell
docker-compose up --build
```

### Limpiar contenedores
```powershell
docker-compose down --volumes --remove-orphans
docker system prune -f
```

## 🔧 Solución de Problemas

### Puerto 3000 ocupado
Si el puerto 3000 está ocupado, modifica el `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Cambia 3000 por 3001
```

### Problemas de permisos (Linux/Mac)
```bash
sudo docker-compose up --build
```

### Problemas de Windows
- Asegúrate de que Docker Desktop esté ejecutándose
- Verifica que WSL2 esté habilitado
- Reinicia Docker Desktop si es necesario

## 📱 Probar el Todo List

1. Inicia sesión con tu usuario
2. Haz clic en "Tareas" en el menú de navegación
3. Agrega algunas tareas de prueba
4. Prueba marcar como completadas, editar y eliminar

## 🎉 ¡Listo!

Tu frontend moderno está ejecutándose con Docker. Todos los cambios que hagas en el código se reflejarán automáticamente en el navegador.

---

**Nota:** La primera vez que ejecutes el comando, Docker descargará la imagen de Node.js y construirá el contenedor, lo que puede tomar unos minutos. 