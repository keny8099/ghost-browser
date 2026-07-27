# Ghost Browser - Parte 7: scripts + README

# === SCRIPTS DE CAMBIO DE NOMBRE DE PC ===
New-Item -ItemType Directory -Path "scripts" -Force | Out-Null

@'
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
'@ | Set-Content -Path "scripts\cambiar-nombre-pc.bat" -Encoding ASCII

@'
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
'@ | Set-Content -Path "scripts\instalar-cambio-nombre.bat" -Encoding ASCII

@'
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
'@ | Set-Content -Path "scripts\desinstalar-cambio-nombre.bat" -Encoding ASCII

# === README.md ===
@'
# Ghost Browser

Navegador anti-fingerprint con rotacion de canvas, fingerprint y limpieza de datos.

## Caracteristicas

- Canvas Fingerprint Spoofing - Inyecta ruido aleatorio en canvas
- WebGL Spoofing - Rota vendor/renderer de la GPU
- AudioContext Spoofing - Modifica las huellas de audio
- Navigator Spoofing - User-Agent, platform, languages, cores, memoria
- Screen Spoofing - Resolucion y pixel ratio aleatorios
- Timezone Spoofing - Zona horaria rotativa
- WebRTC Leak Protection - Bloquea filtracion de IP
- Rotacion con 1 click - Cambia todo el fingerprint al instante
- Limpieza de datos - Cookies, cache, localStorage, etc.

## Descarga

Ve a Releases y descarga el instalador .exe mas reciente.

## Uso

1. Abre Ghost Browser
2. Navega normalmente
3. Usa el boton Rotar para cambiar tu fingerprint
4. Usa el boton Limpiar para borrar cookies/datos
5. Click en el badge ID abajo para ver tu fingerprint actual
6. Limpiar TODO + Rotar borra todo Y cambia tu identidad

## Scripts de cambio de nombre de PC

En la carpeta scripts/ encontraras:
- instalar-cambio-nombre.bat - Ejecutar 1 vez como Admin
- cambiar-nombre-pc.bat - Cambia el nombre manualmente
- desinstalar-cambio-nombre.bat - Para quitar si quieres
'@ | Set-Content -Path "README.md" -Encoding UTF8

Write-Host "Parte 7 completada: scripts + README.md" -ForegroundColor Green
