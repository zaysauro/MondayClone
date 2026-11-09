$ErrorActionPreference = "Stop"
Push-Location
try {
  Set-Location "$PSScriptRoot"

  Write-Host "==========================================" -ForegroundColor Cyan
  Write-Host " CRM Imobiliario - Verificacao de integridade" -ForegroundColor Cyan
  Write-Host "==========================================" -ForegroundColor Cyan

  $ok = $true

  Write-Host "[1/4] npx tsc --noEmit" -ForegroundColor Cyan
  npx tsc --noEmit
  if ($LASTEXITCODE -ne 0) { $ok = $false; Write-Host "FALHA: tsc --noEmit" -ForegroundColor Red }

  Write-Host "[2/4] npm test" -ForegroundColor Cyan
  npm test
  if ($LASTEXITCODE -ne 0) { $ok = $false; Write-Host "FALHA: npm test" -ForegroundColor Red }

  Write-Host "[3/4] npm run build" -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { $ok = $false; Write-Host "FALHA: npm run build" -ForegroundColor Red }

  Write-Host "[4/4] npm run db:migrate + db:seed" -ForegroundColor Cyan
  npm run db:migrate
  if ($LASTEXITCODE -ne 0) { $ok = $false; Write-Host "FALHA: db:migrate" -ForegroundColor Red }
  npm run db:seed
  if ($LASTEXITCODE -ne 0) { $ok = $false; Write-Host "FALHA: db:seed" -ForegroundColor Red }

  Write-Host "`n" -ForegroundColor Cyan
  if ($ok) {
    Write-Host "RESULTADO: TODAS AS VERIFICACOES PASSARAM" -ForegroundColor Green
  } else {
    Write-Host "RESULTADO: FALHAS DETECTADAS (veja acima)" -ForegroundColor Red
    exit 1
  }
}
finally {
  Pop-Location
}
