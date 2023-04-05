const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const {MongoClient} = require('mongodb');
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();
const {getTreeStructure, handleFolderOpen} = require('./modules/functions');
const {getFilePaths} = require('./modules/functions');
const {findUserInDatabase} = require('./modules/mongoOperations');
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
        creatFolderRecord(s3FolderPath, folderPath, filePaths);
    } catch (error) {
        console.log(error);
    }
});

// mongodb functions

async function creatFolderRecord(s3FolderPath, folderPath, filePaths) {
    const client = await MongoClient.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const db = client
        .db(dbName)
        .collection('records');

    // get the folder name
    const folderName = folderPath
        .split('\\')
        .slice(-1)[0];

    let fileNames = filePaths.map(path => path.split('\\'));

    fileNames = fileNames.map(path => path.slice(path.indexOf(folderName)));

    let record = getTreeStructure(s3FolderPath, fileNames);

    try { // insert the record to the database

        const folderInDB = await db.findOne({folderName: 'main'});
        let val = false;
        if (s3FolderPath === 'main') {
            if (folderInDB.children.filter(ch => ch.name === record.name).length > 0){ 
                console.log(folderInDB.children.filter(ch => ch.name === record.name).length > 0);
                console.log('Folder already exists');
                return 'Folder already exists'
            }
           
                try {
                    const updatedFolder = await db.findOneAndUpdate({
                        folderName: 'main'
                    }, {
                        $push: {
                            children: record
                        }
                    },);
                    val = true;
                } catch (error) {
                    console.log(error);
                }
            
           
        } else {
          const updatedFolder = insertIntoChildByPath(folderInDB, s3FolderPath, record);
          //console.log(updatedFolder);
            //console.dir(JSON.stringify(updatedFolder , null, 2));
            if (updatedFolder) {
                // save the updated folder to the database
                try {
                    const updatedDoc = await db.findOneAndUpdate({
                        folderName: 'main'
                    }, {
                        $set: folderInDB
                    },);
                    val = true;
                    
                } catch (error) {
                    console.log(error);
                }
            } else {
                console.log('Folder not found');
                
            }
        }
        
    } catch (error) {
        console.log(error);
    }
};

// experimental functions
//insertIntoChildByPath(folderInDB, s3FolderPath, record)
// function insertIntoChildByPath(folder, childPath, newChild) {
//     // Split the child path into an array of path segments
//     const pathSegments = childPath
//         .split('/')
//         .filter(segment => segment.length > 0).slice(1);
//     console.log(pathSegments);
//     // Traverse the folder hierarchy to find the child with the matching path
//     let currentFolder = folder;
//     console.log(currentFolder);
//     for (let i = 0; i < pathSegments.length; i++) {
//         const pathSegment = pathSegments[i];
//         let childFound = false;

//         // Search for the child with the matching name
//         for (let j = 0; j < currentFolder.children.length; j++) {
//             const child = currentFolder.children[j];
//             console.log(child.path,`${currentFolder.path}/${pathSegment}`);
//             if (child.path === `${currentFolder.path}/${pathSegment}`) {
//                 // Found the child with the matching name, continue searching
//                 currentFolder = child;
//                 childFound = true;
//                 break;
//             }
//         }

//         // If the child with the matching name was not found, return false
//         if (!childFound) {
//             return false;
//         }
//     }

//     // Add the new child to the children array of the found child
//     currentFolder
//         .children
//         .push(newChild);
//     return currentFolder;
// }

function insertIntoChildByPath(folder, childPath, newChild) {
    // Split the child path into an array of path segments
    const pathSegments = childPath
        .split('/')
        .filter(segment => segment.length > 0);
  
    // Traverse the folder hierarchy to find the child with the matching path
    let currentFolder = folder;
    for (let i = 0; i < pathSegments.length; i++) {
        const pathSegment = pathSegments[i];
        let childFound = false;
  
        // Search for the child with the matching name
        for (let j = 0; j < currentFolder.children.length; j++) {
            const child = currentFolder.children[j];
            if (child.name === pathSegment) {
                // Found the child with the matching name, continue searching
                currentFolder = child;
                childFound = true;
                break;
            }
        }
  
        // If the child with the matching name was not found, create a new child
        if (!childFound) {
            const newChildFolder = {
                name: pathSegment,
                children: [],
                type: 'folder'
            };
            currentFolder.children.push(newChildFolder);
            currentFolder = newChildFolder;
        }
    }
  
    // Check if the new child already exists in the current folder
    const existingChild = currentFolder.children.find(child => child.name === newChild.name);
    if (existingChild) {
        // Child with the same name already exists, return false
        console.log('Child with the same name already exists');
        return false;
    } else {
        // Add the new child to the children array of the current folder
        currentFolder.children.push(newChild);
        return currentFolder;
    }
  }
  








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