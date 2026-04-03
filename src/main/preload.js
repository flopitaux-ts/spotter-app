const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  logout: () => ipcRenderer.invoke('logout'),
  getHostUrl: () => ipcRenderer.invoke('get-host-url'),
  setHostUrl: (url) => ipcRenderer.invoke('set-host-url', url),
  clearHostUrl: () => ipcRenderer.invoke('clear-host-url'),
  openAuthWindow: () => ipcRenderer.invoke('open-auth-window'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getLoggedIn: () => ipcRenderer.invoke('get-logged-in'),
  setLoggedIn: (v) => ipcRenderer.invoke('set-logged-in', v),
});
