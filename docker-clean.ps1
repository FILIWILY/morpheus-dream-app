# Docker Clean Script for Morpheus Dream App
# Только очистка кэша без пересборки

Write-Host "🧹 Stopping all containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "🗑️  Cleaning unused containers and images..." -ForegroundColor Yellow
docker container prune -f
docker image prune -f

Write-Host "🧽 Cleaning build cache..." -ForegroundColor Yellow
docker builder prune -f

Write-Host "✅ Cache cleanup completed!" -ForegroundColor Green

Write-Host "📋 To rebuild after cleanup, use:" -ForegroundColor Cyan
Write-Host "  docker-compose build --no-cache" -ForegroundColor White
Write-Host "  docker-compose up -d" -ForegroundColor White
