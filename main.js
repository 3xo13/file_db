const {app, BrowserWindow ,ipcMain} = require('electron');
const path = require('path');
const { MongoClient, GridFSBucket } = require('mongodb');
//const db = require('mongodb');
//const mongoose = require('mongoose');
require('dotenv').config();

const mongoURL = process.env.MONGO_URL;

//mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = 'alpha_file_syastem';

async function findUserInDatabase(data) {
  const {email, password} = data; 
  const client = await  MongoClient.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(dbName).collection('users');

  try {
    const doc = await db.findOne({email: email});
    if(doc){
      if(password === doc.password){
        return doc
      }else{
        return 'incorrect password';
      }
    }else{
      return 'user not found'
    }
  } catch (error) {
    console.log(err)
  }
}

// global variables to be accessed later

let loginWindow;
let mainWindow;

function createLoginWindow(window) {
  loginWindow = new BrowserWindow({ width: 800, height: 600 , webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true,
} });
  loginWindow.loadFile(window);
  loginWindow.maximize();
  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

function createMainWindow(window) {
  mainWindow = new BrowserWindow({ width: 800, height: 600, webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true,
} });
  mainWindow.loadFile(window);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createLoginWindow('./views/login.html');
  

  // open new window when the app activate and all windows are closed
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow('./views/login.html')
    }
  })
})
// close the app if all windows are closed except for mac users
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// handle the data for loging in 
ipcMain.on('form-submitted',async (event, data) => {
  const user = await findUserInDatabase(data);
  if(user){
    if(typeof user === 'string'){
      return user
    }else{
      
      createMainWindow('./views/index.html')
      loginWindow.close();
    }
  }
  console.log('Received form data in main process:',user);
  
})
