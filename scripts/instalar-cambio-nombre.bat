@echo off
:: INSTALADOR - Configura cambio automatico al reinicio
:: Ejecutar UNA SOLA VEZ como Administrador

echo.
echo  ================================================
echo   GHOST PC - Instalador de Cambio Automatico
echo  ================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Necesitas ejecutar como Administrador.
    pause
    exit /b 1
)

set "destino=C:\GhostPC"
if not exist "%destino%" mkdir "%destino%"

copy /Y "%~dp0cambiar-nombre-pc.bat" "%destino%\cambiar-nombre-pc.bat" >nul
echo [OK] Script copiado a %destino%

schtasks /create /tn "GhostPC_CambiarNombre" /tr "\"%destino%\cambiar-nombre-pc.bat\"" /sc onstart /ru SYSTEM /rl highest /f >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Tarea programada creada.
    echo.
    echo   Cada vez que enciendas el PC, el nombre cambiara
    echo   automaticamente a uno aleatorio tipo DESKTOP-XXXXXXX
    echo.
    echo   Para desinstalar: ejecuta desinstalar-cambio-nombre.bat
) else (
    echo [ERROR] No se pudo crear la tarea. Intenta de nuevo como Admin.
)

pause
