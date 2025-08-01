# Script para levantar Frontend + Backend completo
Write-Host "🚀 Levantando Sistema Completo (Frontend + Backend)..." -ForegroundColor Green

# Verificar si Docker está corriendo
try {
    docker info | Out-Null
    Write-Host "✅ Docker está funcionando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está funcionando. Por favor inicia Docker Desktop" -ForegroundColor Red
    exit 1
}

# Detener contenedores existentes si los hay
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.full.yml down 2>$null

# Construir y levantar ambos servicios
Write-Host "📦 Construyendo y levantando servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.full.yml up --build -d

Write-Host ""
Write-Host "✅ ¡Sistema completo levantado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs disponibles:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   API:      http://localhost:5000/usuarios" -ForegroundColor White
Write-Host ""
Write-Host "📊 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   Ver logs: docker-compose -f docker-compose.full.yml logs -f" -ForegroundColor Gray
Write-Host "   Detener:  docker-compose -f docker-compose.full.yml down" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 ¡El sistema está listo para usar!" -ForegroundColor Green 