# Script para levantar el backend con Docker
Write-Host "🚀 Levantando Backend Flask con Docker..." -ForegroundColor Green

# Verificar si Docker está corriendo
try {
    docker info | Out-Null
    Write-Host "✅ Docker está funcionando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está funcionando. Por favor inicia Docker Desktop" -ForegroundColor Red
    exit 1
}

# Construir y levantar el backend
Write-Host "📦 Construyendo imagen del backend..." -ForegroundColor Yellow
docker-compose -f docker-compose.backend.yml up --build -d

Write-Host "✅ Backend levantado exitosamente!" -ForegroundColor Green
Write-Host "🌐 URL del backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 API disponible en: http://localhost:5000/usuarios" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver los logs:" -ForegroundColor Yellow
Write-Host "docker-compose -f docker-compose.backend.yml logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener el backend:" -ForegroundColor Yellow
Write-Host "docker-compose -f docker-compose.backend.yml down" -ForegroundColor Gray 