const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ghostAPI', {
  getFingerprint: () => ipcRenderer.invoke('get-fingerprint'),
  rotateFingerprint: () => ipcRenderer.invoke('rotate-fingerprint'),
  clearData: (options) => ipcRenderer.invoke('clear-data', options),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),
  getUserAgent: () => ipcRenderer.invoke('get-user-agent'),
});
