const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const {MongoClient} = require('mongodb');
const {uploadFolderToBucket} = require('./modules/database.js');
require('dotenv').config();
const {handleFolderOpen} = require('./modules/functions');
const {getFilePaths} = require('./modules/functions');
const {findUserInDatabase} = require('./modules/mongoOperations');
const {createFolderRecord} = require('./modules/mongoOperations');
const {getFileFromDB} = require('./modules/database.js');
const fs = require('fs');

// Load AWS configuration file
process.env.AWS_SDK_LOAD_CONFIG = 1;
// Load AWS credentials and region from environment variables
const mongoURL = process.env.MONGO_URL;
const dbName = 'alpha_file_syastem';

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
    const user = await findUserInDatabase(data);
    if (user) {
        if (typeof user === 'string') {
            return user
        } else {
            currentWindow.loadFile('./views/index.html');
        };
    };
});

// handle logout
ipcMain.handle('logout', () => currentWindow.loadFile('./views/login.html'));

// find a way to reload with the data
ipcMain.handle('reload', () => currentWindow.reload());

// handle upload folder
ipcMain.handle('uploadFolder', async (event, s3FolderPath) => {
    try {
        const folderPath = await handleFolderOpen();
        const filePaths = getFilePaths(folderPath);
        if(filePaths.length === 0){
            throw new Error('No files found in the folder');
        }
        const folderName = folderPath
        .split('\\')
        .slice(-1)[0];
        let recordResult = await createFolderRecord(
            s3FolderPath,
            folderPath,
            filePaths
        );
        if (recordResult && recordResult[1].modifiedCount > 0) {
            let result = await uploadFolderToBucket(s3FolderPath, filePaths , folderName);
        }
    } catch (error) {
        console.log(error);
    }
});

// handle root folder request
ipcMain.handle('requestFiles', async (e)=> {
    try {
        const client = new MongoClient(mongoURL);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('records');
        const result = await collection.find({name: 'main'}).toArray();
        return result;
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
    // open dev tools
    currentWindow.maximize();
    setTimeout(() => {
       currentWindow.webContents.openDevTools(); 
    }, 500);
    
    currentWindow.on('closed', () => {
        currentWindow = null;
    });

};

// save a file to the local machine
ipcMain.handle('openFile', async (event, path ) => {
    const fileName = path.split('/').slice(-1)[0];
    try {
        let file = await getFileFromDB(path);
        // download file
        let saveDialog = await dialog.showSaveDialog({
            title: 'Save File',
            buttonLabel: 'Save',
            defaultPath: fileName
            
        });
        if(saveDialog.canceled){
            return;
        }
        else{
            let filePath = saveDialog.filePath;
            fs.writeFileSync(filePath, file.Body, (err) => {
                if(err){
                    console.log(err);
                }
                else{
                    return 'File saved successfully';
                }
            })
        }
    } catch (error) {
        return error;
    }
    
    
});


