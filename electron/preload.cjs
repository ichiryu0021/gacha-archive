const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  version: () => ipcRenderer.invoke('update:version'),
  checkUpdates: () => ipcRenderer.invoke('update:check'),
  applyUpdate: (options) => ipcRenderer.invoke('update:apply', options),
  copyImage: (dataUrl) => ipcRenderer.invoke('share:copy-image', dataUrl),
  saveImage: (dataUrl, name) => ipcRenderer.invoke('share:save-image', dataUrl, name),
  heybox: {
    open: () => ipcRenderer.invoke('heybox:open'),
    collect: () => ipcRenderer.invoke('heybox:collect'),
    close: () => ipcRenderer.invoke('heybox:close'),
  },
  nteCapture: {
    start: (options) => ipcRenderer.invoke('nte:capture-start', options),
    status: (file) => ipcRenderer.invoke('nte:capture-status', file),
    read: (file) => ipcRenderer.invoke('nte:capture-read', file),
  },
  onUpdateStatus: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('update:status', listener);
    return () => ipcRenderer.removeListener('update:status', listener);
  },
});
