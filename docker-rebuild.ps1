# Docker Rebuild Script for Morpheus Dream App
# Полная очистка кэша и пересборка всех контейнеров

Write-Host "🧹 Stopping all containers..." -ForegroundColor Yellow
docker-compose down --volumes --remove-orphans

Write-Host "🗑️  Removing old containers and images..." -ForegroundColor Yellow
docker container prune -f
docker image prune -a -f

Write-Host "🧽 Cleaning build cache..." -ForegroundColor Yellow
docker builder prune -a -f

Write-Host "💾 Removing volumes (database will be reset)..." -ForegroundColor Yellow
docker volume prune -f

Write-Host "🔧 Building and starting containers with no cache..." -ForegroundColor Green
docker-compose build --no-cache --pull
docker-compose up -d

Write-Host "✅ Rebuild completed! Checking container status..." -ForegroundColor Green
docker-compose ps

Write-Host "📋 To view logs, use:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f backend" -ForegroundColor White
Write-Host "  docker-compose logs -f frontend" -ForegroundColor White
Write-Host "  docker-compose logs -f db" -ForegroundColor White
