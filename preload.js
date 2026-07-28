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
  
  // URLs por perfil
  saveProfileUrl: (name, url) => ipcRenderer.invoke('save-profile-url', name, url),
  getProfileUrl: (name) => ipcRenderer.invoke('get-profile-url', name),
});
