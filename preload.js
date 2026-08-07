const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("ghostAPI", {
  getFingerprint: () => ipcRenderer.invoke("get-fingerprint"),
  rotateFingerprint: () => ipcRenderer.invoke("rotate-fingerprint"),
  clearData: (opts) => ipcRenderer.invoke("clear-data", opts),
  clearAllData: () => ipcRenderer.invoke("clear-all-data"),
  getNetworkInfo: () => ipcRenderer.invoke("get-network-info"),
  getProfiles: () => ipcRenderer.invoke("get-profiles"),
  createProfile: (name) => ipcRenderer.invoke("create-profile", name),
  switchProfile: (name) => ipcRenderer.invoke("switch-profile", name),
  deleteProfile: (name) => ipcRenderer.invoke("delete-profile", name),
  saveProfileUrl: (name, url) => ipcRenderer.invoke("save-profile-url", name, url),
  getProfileUrl: (name) => ipcRenderer.invoke("get-profile-url", name),
  onOpenUrl: (callback) => ipcRenderer.on("open-url", (ev, url) => callback(url)),
});