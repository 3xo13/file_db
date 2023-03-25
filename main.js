const {app, BrowserWindow ,ipcMain , dialog} = require('electron');
const path = require('path');
const { MongoClient, GridFSBucket } = require('mongodb');
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

// Load AWS configuration file
process.env.AWS_SDK_LOAD_CONFIG = 1;
// Load AWS credentials and region from environment variables
const accessKey = process.env.AWS_ACCESS_KEY;
const secretKey = process.env.AWS_SECRET_KEY;
const region = process.env.AWS_REGION;
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

let currentWindow;


function createWindow(window) {
  currentWindow = new BrowserWindow({ width: 800, height: 600 , webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: true,
    contextIsolation: true,
    contentSecurityPolicy: "default-src 'self'; style-src https://cdnjs.cloudflare.com"
} });
  currentWindow.loadFile(window);
  //currentWindow.webContents.openDevTools();
  currentWindow.maximize();
  
  currentWindow.on('closed', () => {
    currentWindow = null;
  });
  
}


app.whenReady().then(() => {
  createWindow('./views/index.html');
  

  // open new window when the app activate and all windows are closed
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow('./views/login.html')
    }
  })
  // close the app if all windows are closed except for mac users
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  // handle the data for loging in 
  ipcMain.on('form-submitted',async (event, data) => {
    //console.log(data);
    const user = await findUserInDatabase(data);
    if(user){
      if(typeof user === 'string'){
        return user
      }else{
    
      currentWindow.loadFile('./views/index.html');
    }
  }
  //console.log('Received form data in main process:',user);
})
// handle logout
ipcMain.handle('logout',() => currentWindow.loadFile('./views/login.html'));
// find a way to reload with the data
ipcMain.handle('reload', () => currentWindow.reload());

// handle upload files
ipcMain.handle('uploadFiles', async (event, path) => {
  try {
    let fileToBeUploaded =await handleFileOpen();
  console.log(fileToBeUploaded);
  } catch (error) {
    console.log(error);
  }
  
});


ipcMain.handle('requestFiles', handleFilesReq);

ipcMain.handle('sendDocumentPath',async (event, path) => {
  try {
    const data = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: path
    }).promise();
    //console.log(data.Contents);
    return data.Contents;
  } catch (err) {
    console.log(err);
    return [];
  }
});

});

// s3 operations
// Set the parameters for the bucket and object
const bucketName = 'alpha-limit';
const keyName = 'example-object.txt';
const params = {
  Bucket: bucketName,
  Key: keyName,
  Body: 'Hello, world!'
};
// configure S3
const s3 = new AWS.S3(
  {accessKeyId: accessKey, secretAccessKey: secretKey, region: region}
  );
  
  // console.log('AWS access key ID:', accessKey); console.log('AWS secret access
  // key:', secretKey); Create a new object in the bucket
  
  
  // Upload the object to the bucket
  // s3.putObject(params, function (err, data) {
    //     if (err) {
//         console.log(err);
//     } else {
//         console.log(
//             `Successfully uploaded data to ` + bucketName + '/' + keyName
//         );
//     }
// });

// Read the object from the bucket
// s3.getObject({
//     Bucket: bucketName,
//     Key: keyName
// }, function (err, data) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log('Object contents:', data.Body.toString());
//     }
// });

// list contnts of folder in bucket
// s3.listObjects({
//     Bucket: bucketName,
//     Prefix: 'logos'
// }, function (err, data) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log('Object contents:', data.Contents);
//         //console.log('data contents: ', data);
//     }
// });

const handleFilesReq = async function() {
  try {
    const data = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: 'logos'
    }).promise();
    //console.log(data.Contents);
    return data.Contents;
  } catch (err) {
    console.log(err);
    return [];
  }
};


// handle file open
async function handleFileOpen() {
 let path =await dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    if (!result.canceled) {
      return result.filePaths[0];
    }
  }).catch(err => {
    console.log(err);
  });
  return path;
}
