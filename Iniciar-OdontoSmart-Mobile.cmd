@echo off
setlocal
if /i "%~1"=="--api" goto api
if /i "%~1"=="--expo" goto expo

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Iniciar-OdontoSmart-Mobile.ps1"
if errorlevel 1 (
    echo.
    pause
    exit /b 1
)
exit /b 0

:api
title OdontoSmart - API
cd /d "%~dp0OdontoSmartAPI" || exit /b 1
dotnet run --launch-profile http
echo.
echo La API se detuvo. Revise los mensajes anteriores.
exit /b

:expo
title OdontoSmart - Expo
cd /d "%~dp0mobile-app" || exit /b 1
call npx expo start --lan
echo.
echo Expo se detuvo. Revise los mensajes anteriores.
exit /b
