const { contextBridge, ipcRenderer } = require('electron');

let initialState = null;
try {
  initialState = ipcRenderer.sendSync('get-initial-app-state');
} catch (e) {
  console.warn('Failed to get initial state synchronously:', e);
}

contextBridge.exposeInMainWorld('electronAPI', {
  initialState,
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  saveData: (data) => ipcRenderer.send('save-data', data),
  toggleCapsule: (isCapsule) => ipcRenderer.send('toggle-capsule-mode', isCapsule),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  hideWindow: () => ipcRenderer.send('window-hide'),
  closeWindow: () => ipcRenderer.send('window-close'),
  setAlwaysOnTop: (always) => ipcRenderer.send('set-always-on-top', always),
});
