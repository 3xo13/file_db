const { contextBridge, ipcRenderer } = require('electron')

// expose the sendFormDataToMain function to the renderer process
contextBridge.exposeInMainWorld('api', {
  sendFormDataToMain: (data) => ipcRenderer.send('form-submitted' , data),
  logout: () => ipcRenderer.invoke('logout'),
  reload: () => ipcRenderer.invoke('reload'),
  uploadFiles: () => ipcRenderer.invoke('uploadFiles'),
  requestFiles: () => ipcRenderer.invoke('requestFiles'),
  //sendFilesToRenderer: () => ipcRenderer.invoke('sendFilesToRendere'),
//   checkUser: ipcRenderer.invoke('checkUser'),
})

