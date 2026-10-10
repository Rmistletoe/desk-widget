import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  toggleCapsule: (isCapsule: boolean) => ipcRenderer.send('toggle-capsule-mode', isCapsule),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  hideWindow: () => ipcRenderer.send('window-hide'),
  closeWindow: () => ipcRenderer.send('window-close'),
  setAlwaysOnTop: (always: boolean) => ipcRenderer.send('set-always-on-top', always),
});
