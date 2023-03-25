const { contextBridge, ipcRenderer } = require('electron')

// expose the sendFormDataToMain function to the renderer process
contextBridge.exposeInMainWorld('api', {
  sendFormDataToMain: (data) => ipcRenderer.send('form-submitted' , data),
  logout: () => ipcRenderer.invoke('logout'),
  reload: () => ipcRenderer.invoke('reload'),
  uploadFiles: (path) => ipcRenderer.invoke('uploadFiles' , path),
  requestFiles: () => ipcRenderer.invoke('requestFiles'),
  sendDocumentPath: (path) => ipcRenderer.invoke('sendDocumentPath', path),
  //sendFilesToRenderer: () => ipcRenderer.invoke('sendFilesToRendere'),
//   checkUser: ipcRenderer.invoke('checkUser'),
})

