const { contextBridge, ipcRenderer } = require('electron')

// expose the sendFormDataToMain function to the renderer process
contextBridge.exposeInMainWorld('api', {
  sendFormDataToMain: (data) => ipcRenderer.send('form-submitted' , data),
  logout: () => ipcRenderer.invoke('logout'),
  uploadFolder: (folderPath) => ipcRenderer.invoke('uploadFolder', folderPath),
  requestFiles: () => ipcRenderer.invoke('requestFiles'),
  openFile: (path) => ipcRenderer.invoke('openFile', path),
});

