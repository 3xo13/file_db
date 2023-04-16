const { contextBridge, ipcRenderer } = require('electron')

// expose the sendFormDataToMain function to the renderer process
contextBridge.exposeInMainWorld('api', {
  sendFormDataToMain: (data) => ipcRenderer.send('form-submitted' , data),
  logout: () => ipcRenderer.invoke('logout'),
  uploadFolder: (folderPath) => ipcRenderer.invoke('uploadFolder', folderPath),
  //reload: () => ipcRenderer.invoke('reload'),
  //uploadFiles: (path) => ipcRenderer.invoke('uploadFiles' , path),
  requestFiles: () => ipcRenderer.invoke('requestFiles'),
  openFile: (path) => ipcRenderer.invoke('openFile', path),
  //sendDocumentPath: (path) => ipcRenderer.invoke('sendDocumentPath', path),
  //openFile: (path) => ipcRenderer.invoke('openFile', path),
  // openPdf: (path) => ipcRenderer.invoke('openPdf', path),
  // openImage: (path) => ipcRenderer.invoke('openImage', path),
  // openFileDefault: (path) => ipcRenderer.invoke('openFileDefault', path),
  //sendFilesToRenderer: () => ipcRenderer.invoke('sendFilesToRendere'),
//   checkUser: ipcRenderer.invoke('checkUser'),
})

