const { contextBridge, ipcRenderer } = require('electron');

// レンダラー（index.html）から窓操作だけを許可する
contextBridge.exposeInMainWorld('widget', {
  hide: () => ipcRenderer.send('widget:hide'),
  minimize: () => ipcRenderer.send('widget:minimize'),
});
