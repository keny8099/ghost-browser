@echo off
:: DESINSTALADOR - Quita el cambio automatico

echo.
echo  ================================================
echo   GHOST PC - Desinstalar Cambio Automatico
echo  ================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Necesitas ejecutar como Administrador.
    pause
    exit /b 1
)

schtasks /delete /tn "GhostPC_CambiarNombre" /f >nul 2>&1
echo [OK] Tarea programada eliminada.

if exist "C:\GhostPC" (
    rmdir /s /q "C:\GhostPC"
    echo [OK] Carpeta C:\GhostPC eliminada.
)

echo.
echo   El nombre ya no cambiara al reiniciar.
echo   Nombre actual: %COMPUTERNAME%
echo.
pause
