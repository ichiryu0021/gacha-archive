const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  version: () => ipcRenderer.invoke('update:version'),
  checkUpdates: () => ipcRenderer.invoke('update:check'),
  applyUpdate: () => ipcRenderer.invoke('update:apply'),
  copyImage: (dataUrl) => ipcRenderer.invoke('share:copy-image', dataUrl),
  saveImage: (dataUrl, name) => ipcRenderer.invoke('share:save-image', dataUrl, name),
  onUpdateStatus: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('update:status', listener);
    return () => ipcRenderer.removeListener('update:status', listener);
  },
});
