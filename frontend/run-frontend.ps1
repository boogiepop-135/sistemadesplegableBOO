# Script para ejecutar el frontend con Docker
Write-Host "🚀 Iniciando el frontend de IT-SanCosme..." -ForegroundColor Green

# Verificar si Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker Desktop desde https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ No se encontró package.json. Asegúrate de estar en el directorio frontend/" -ForegroundColor Red
    exit 1
}

# Construir y ejecutar el contenedor
Write-Host "🔨 Construyendo la imagen Docker..." -ForegroundColor Yellow
docker-compose up --build

Write-Host "✅ Frontend ejecutándose en http://localhost:3000" -ForegroundColor Green
Write-Host "📝 Presiona Ctrl+C para detener el servidor" -ForegroundColor Cyan 