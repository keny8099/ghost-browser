@echo off
:: CAMBIAR NOMBRE DE PC AUTOMATICAMENTE
:: Ejecutar como Administrador la primera vez

echo.
echo  ========================================
echo   GHOST PC - Cambio de Nombre Automatico
echo  ========================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Necesitas ejecutar como Administrador.
    echo Haz click derecho y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

setlocal enabledelayedexpansion
set "chars=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
set "nombre=DESKTOP-"

for /L %%i in (1,1,7) do (
    set /a "idx=!random! %% 36"
    for %%j in (!idx!) do set "nombre=!nombre!!chars:~%%j,1!"
)

echo [INFO] Nombre actual: %COMPUTERNAME%
echo [INFO] Nuevo nombre:  !nombre!
echo.

wmic computersystem where name="%COMPUTERNAME%" call rename name="!nombre!" >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Nombre cambiado a: !nombre!
) else (
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\ComputerName\ComputerName" /v ComputerName /t REG_SZ /d "!nombre!" /f >nul
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\ComputerName\ActiveComputerName" /v ComputerName /t REG_SZ /d "!nombre!" /f >nul
    reg add "HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" /v Hostname /t REG_SZ /d "!nombre!" /f >nul
    reg add "HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" /v "NV Hostname" /t REG_SZ /d "!nombre!" /f >nul
    echo [OK] Nombre cambiado via registro a: !nombre!
)

echo El cambio se aplicara en el proximo reinicio.
endlocal
exit /b 0
