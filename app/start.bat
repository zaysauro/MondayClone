@echo off
cd /d "%~dp0"

echo ==========================================
echo  CRM Imobiliario - Inicio rapido (Windows)
echo ==========================================

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo Node.js nao encontrado. Instale em https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias...
  npm install --no-audit --no-fund
  if %errorlevel% neq 0 (
    echo FALHA no npm install.
    pause
    exit /b 1
  )
)

echo [1/3] Migrando banco de dados SQLite...
npm run db:migrate
if %errorlevel% neq 0 (
  echo FALHA na migracao.
  pause
  exit /b 1
)

echo [2/3] Populando seed (idempotente)...
npm run db:seed
if %errorlevel% neq 0 (
  echo FALHA no seed.
  pause
  exit /b 1
)

echo [3/3] Iniciando API (http://localhost:3001) e frontend (http://localhost:5173)...
start "" cmd /c "npm run dev"

echo Aguardando servidores iniciarem...
timeout /t 5 >nul

echo Abrindo http://localhost:5173 no navegador...
start "" "http://localhost:5173"

echo.
echo Servidores rodando. API: http://localhost:3001 | Frontend: http://localhost:5173
pause
