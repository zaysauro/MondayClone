$ErrorActionPreference = "Stop"
Push-Location
try {
  Set-Location "$PSScriptRoot"

  Write-Host "Resetando banco de dados SQLite (remove data/crm.sqlite)..." -ForegroundColor Cyan
  if (Test-Path "data\crm.sqlite") { Remove-Item "data\crm.sqlite" -Force }
  if (Test-Path "data\crm.sqlite-wal") { Remove-Item "data\crm.sqlite-wal" -Force }
  if (Test-Path "data\crm.sqlite-shm") { Remove-Item "data\crm.sqlite-shm" -Force }

  Write-Host "[1/2] Migrando..." -ForegroundColor Cyan
  npm run db:migrate
  Write-Host "[2/2] Seed..." -ForegroundColor Cyan
  npm run db:seed

  Write-Host "Pronto. Rode start.ps1 para iniciar a aplicacao." -ForegroundColor Green
}
finally {
  Pop-Location
}
