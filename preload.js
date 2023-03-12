const { contextBridge, ipcRenderer } = require('electron')

// expose the sendFormDataToMain function to the renderer process
contextBridge.exposeInMainWorld('api', {
  sendFormDataToMain: (data) => ipcRenderer.send('form-submitted' , data),
//   checkUser: ipcRenderer.invoke('checkUser'),
})

