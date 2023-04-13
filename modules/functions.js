const {dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// create a mongoose schema
const folderSchema = new mongoose.Schema({
  name: String,
  path: String,
  children: [Object],
  type: String,
});

// create a mongoose model
const Folder = mongoose.model('Folder', folderSchema);

// return tree structure of the folder and files
function getTreeStructure(folderInDBPath,fileNames) {
  console.log(fileNames);
  if(fileNames.length === 0) return null;
  let folderName = fileNames[0][0]; // get the name of the folder
  let folder = new Folder({
      name: folderName,
      path: folderInDBPath + folderName + '/',
      type: 'folder',
      children: [],
  });
  fileNames = fileNames.map(path => path.slice(1)); // remove the folder name from the path
  // create a tree from an array of arrays
  fileNames.forEach((path) => {
    let currentFolder = folder;
    path.forEach((name, index) => {
      let childFolder = currentFolder.children.find((child) => child.name === name);
      if (childFolder) {
        currentFolder = childFolder;
      } else {
        let newFolder = new Folder({
          name,
          children: [],
          // if the index is the last index in the path then it is a file else it is a folder
          path: index === path.length - 1 ? currentFolder.path + name : currentFolder.path + name + '/',
          type: index === path.length - 1
            ? 'file'
            : 'folder',
        });
        currentFolder.children.push(newFolder);
        currentFolder = newFolder;
      }
    });
  });

  return folder;
}

// return the path of the folder to be uploaded
async function handleFolderOpen() {
    let path = await
    dialog
        .showOpenDialog({properties: ['openDirectory']})
        .then(result => {
            if (!result.canceled) {
                return result.filePaths[0];
            }
        })
        .catch(err => {
            console.log(err);
        });

    return path;
}

// return the path of the files to be uploaded from the folder as an array
function getFilePaths(folderPath) {
  const fileNames = fs.readdirSync(folderPath);
  const filePaths = [];

  fileNames.forEach((fileName) => {
      const filePath = path.join(folderPath, fileName);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
          filePaths.push(filePath);
      } else if (stats.isDirectory()) {
          filePaths.push(...getFilePaths(filePath));
      }
  });

  return filePaths;
}

async function insertNewFolder(rootFolder, newFolder, parentPath) {
  if(!rootFolder)return null;
  if(parentPath[parentPath.length - 1] !== '/')return null;
  parentPath = parentPath.slice(0, parentPath.length - 1);
  let pathSegments = parentPath.split('/');
  pathSegments = pathSegments.slice(1);
  let currentSegment = pathSegments[0];
  // recursive function to find the folder and add the new folder to it
  function findFolderAndAddNew(currentFolder, newFolder) {
      currentFolder.children.forEach((child) => {
          if (child.name === currentSegment) {
              if (pathSegments.length === 1) {
                  if (child.children.find((child) => child.name === newFolder.name)) {
                      console.log('already exists');
                      return null;
                  } else {
                      child.children.push(newFolder);  
                  }
              } else {
                  pathSegments = pathSegments.slice(1);
                  currentSegment = pathSegments[0];
                  findFolderAndAddNew(child, newFolder);
              }
          }
      });
  }
  findFolderAndAddNew(rootFolder, newFolder);
}

module.exports = {
    getTreeStructure,
    handleFolderOpen,
    getFilePaths,
    insertNewFolder,
}
