@echo off
cd /d "%~dp0"

echo Resetando banco de dados SQLite (apaga data/crm.sqlite)...
if exist data\crm.sqlite del /f /q data\crm.sqlite
if exist data\crm.sqlite-wal del /f /q data\crm.sqlite-wal
if exist data\crm.sqlite-shm del /f /q data\crm.sqlite-shm

echo [1/2] Migrando...
npm run db:migrate
echo [2/2] Seed...
npm run db:seed
echo.
echo Pronto. Rode start.bat para iniciar a aplicacao.
pause
