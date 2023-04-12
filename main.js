const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const {MongoClient} = require('mongodb');
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();
const {getTreeStructure, handleFolderOpen} = require('./modules/functions');
const {getFilePaths} = require('./modules/functions');
const {findUserInDatabase} = require('./modules/mongoOperations');
const {createFolderRecord} = require('./modules/mongoOperations');
// Load AWS configuration file
process.env.AWS_SDK_LOAD_CONFIG = 1;
// Load AWS credentials and region from environment variables
const accessKey = process.env.AWS_ACCESS_KEY;
const secretKey = process.env.AWS_SECRET_KEY;
const region = process.env.AWS_REGION;
const mongoURL = process.env.MONGO_URL;
const dbName = 'alpha_file_syastem';
// Set the parameters for the bucket and object
const bucketName = 'alpha-limit';

// configure S3
const s3 = new AWS.S3(
    {accessKeyId: accessKey, secretAccessKey: secretKey, region: region}
);

// global window
let currentWindow;

// create a new window
app
    .whenReady()
    .then(() => {
        createWindow('./views/index.html');
    });

// open new window when the app activate and all windows are closed
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow('./views/login.html')
    }
});

// close the app if all windows are closed except for mac users
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// handle the data for loging in
ipcMain.on('form-submitted', async (event, data) => {
    //console.log(data);
    const user = await findUserInDatabase(data);
    if (user) {
        if (typeof user === 'string') {
            return user
        } else {

            currentWindow.loadFile('./views/index.html');
        }
    }
    //console.log('Received form data in main process:',user);
})

// handle logout
ipcMain.handle('logout', () => currentWindow.loadFile('./views/login.html'));

// find a way to reload with the data
ipcMain.handle('reload', () => currentWindow.reload());

// handle upload folder
ipcMain.handle('uploadFolder', async (event, s3FolderPath) => {
    try {
        const folderPath = await handleFolderOpen();
        const filePaths = getFilePaths(folderPath);
        const files = await Promise.all(filePaths.map(path => fs.readFileSync(path)));
        let recordResult = await createFolderRecord(s3FolderPath, folderPath, filePaths);
        //console.log(recordResult);
    } catch (error) {
        console.log(error);
    }
});

// expermintal functions


  








// create windwos
function createWindow(window) {
    currentWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            contentSecurityPolicy: "default-src 'self'; style-src https://cdnjs.cloudflare.com"
        }
    });
    currentWindow.loadFile(window);
    //currentWindow.webContents.openDevTools();
    currentWindow.maximize();

    currentWindow.on('closed', () => {
        currentWindow = null;
    });

}