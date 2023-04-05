const {dialog} = require('electron');
const fs = require('fs');
const path = require('path');


// return tree structure of the folder and files
 function getTreeStructure(folderInDBPath,fileNames) {
    let folderName = fileNames[0][0];
    let folder = {
      name: folderName,
      children: [],
      path: folderInDBPath + '/' + fileNames[0][0] ,
      type: 'folder',
    };
    fileNames = fileNames.map(path => path.slice(1));
    // create a tree from an array of arrays
    fileNames.forEach((path) => {
      let currentFolder = folder;
      path.forEach((name, index) => {
        let childFolder = currentFolder.children.find((child) => child.name === name);
        if (childFolder) {
          currentFolder = childFolder;
        } else {
          let newFolder = {
            name,
            children: [],
            path: currentFolder.path + '/' + name,
            type: index === path.length - 1
              ? 'file'
              : 'folder',
          };
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

// export the functions
module.exports = {
    getTreeStructure,
    handleFolderOpen,
    getFilePaths,
};