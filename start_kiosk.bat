@echo off
title Mirror Match - Batalla 3P BTL Launcher
echo ====================================================
echo      MIRROR MATCH - INICIANDO BATALLA 3P BTL
echo ====================================================

:: Iniciar servidor Vite en segundo plano
start /B npm run preview -- --port 3000

:: Esperar 2 segundos para que el servidor este listo
timeout /t 2 /nobreak >nul

:: Abrir Chrome o Edge en modo Kiosco Pantalla Completa
where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Iniciando Google Chrome en modo Kiosco...
    start chrome.exe --kiosk --kiosk-printing --disable-pinch --overscroll-history-navigation=0 "http://localhost:3000"
) else (
    echo Chrome no encontrado. Iniciando Microsoft Edge en modo Kiosco...
    start msedge.exe --kiosk "http://localhost:3000" --edge-kiosk-type=fullscreen
)
