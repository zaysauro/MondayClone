$ErrorActionPreference = "Stop"
Push-Location
try {
  Set-Location "$PSScriptRoot"

  Write-Host "==========================================" -ForegroundColor Cyan
  Write-Host " CRM Imobiliario - Inicio rapido (Windows)" -ForegroundColor Cyan
  Write-Host "==========================================" -ForegroundColor Cyan

  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    Write-Host "Node.js nao encontrado. Instale em https://nodejs.org/" -ForegroundColor Red
    exit 1
  }

  if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Cyan
    npm install --no-audit --no-fund
  }

  Write-Host "[1/3] Migrando banco de dados SQLite..." -ForegroundColor Cyan
  npm run db:migrate

  Write-Host "[2/3] Populando seed (idempotente)..." -ForegroundColor Cyan
  npm run db:seed

  Write-Host "[3/3] Iniciando API (http://localhost:3001) e frontend (http://localhost:5173)..." -ForegroundColor Cyan
  Start-Process powershell.exe -ArgumentList "-NoExit","-Command","cd '$PSScriptRoot'; npm run dev"

  Write-Host "Aguardando servidores iniciarem..." -ForegroundColor Cyan
  Start-Sleep -Seconds 5

  Write-Host "Abrindo http://localhost:5173 no navegador..." -ForegroundColor Cyan
  Start-Process "http://localhost:5173"

  Write-Host "`nServidores rodando. API: http://localhost:3001 | Frontend: http://localhost:5173" -ForegroundColor Green
}
finally {
  Pop-Location
}
