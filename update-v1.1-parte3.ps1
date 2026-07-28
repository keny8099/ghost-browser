# Ghost Browser v1.1 - Parte 3: preload.js actualizado

@'
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ghostAPI', {
  // Fingerprint
  getFingerprint: () => ipcRenderer.invoke('get-fingerprint'),
  rotateFingerprint: () => ipcRenderer.invoke('rotate-fingerprint'),
  getUserAgent: () => ipcRenderer.invoke('get-user-agent'),
  
  // Limpieza
  clearData: (options) => ipcRenderer.invoke('clear-data', options),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),
  
  // Red
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
  
  // Perfiles
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  createProfile: (name) => ipcRenderer.invoke('create-profile', name),
  switchProfile: (name) => ipcRenderer.invoke('switch-profile', name),
  deleteProfile: (name) => ipcRenderer.invoke('delete-profile', name),
  getProfilePartition: (name) => ipcRenderer.invoke('get-profile-partition', name),
});
'@ | Set-Content -Path "preload.js" -Encoding UTF8

# Fix BOM
$content = Get-Content -Path "preload.js" -Raw
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("$PWD\preload.js", $content, $utf8NoBom)

Write-Host "v1.1 Parte 3 completada: preload.js (nuevas APIs)" -ForegroundColor Green
