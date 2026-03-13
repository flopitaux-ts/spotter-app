const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  logout: () => ipcRenderer.invoke('logout'),
  getHostUrl: () => ipcRenderer.invoke('get-host-url'),
  setHostUrl: (url) => ipcRenderer.invoke('set-host-url', url),
  clearHostUrl: () => ipcRenderer.invoke('clear-host-url'),
});
