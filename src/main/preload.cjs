const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleCapsule: (isCapsule) => ipcRenderer.send('toggle-capsule-mode', isCapsule),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  hideWindow: () => ipcRenderer.send('window-hide'),
  closeWindow: () => ipcRenderer.send('window-close'),
  setAlwaysOnTop: (always) => ipcRenderer.send('set-always-on-top', always),
});
