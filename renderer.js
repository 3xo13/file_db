const loginForm = document.querySelector('#login-form');
const errMsg = document.querySelector('#err-msg-text');
const logout = document.querySelector('#logout');
const uploadForm = document.querySelector('#uploadForm');
const desplayFiles = document.querySelector('#display-files');
const rootBtn = document.querySelector('#getAllFiles');
const wrapper = document.querySelector('#wrapper');
const uploadBtn = document.querySelector('#upload');
const uploadFolder = document.querySelector('#uploadFolderBtn');
const uploadSection = document.querySelector('#upload-section');
const uploadFile = document.querySelector('#uploadfileBtn');
const pathText = document.querySelector('#path-text');
const back = document.querySelector('#step-back');

let currentObject = null;

// login using the form data
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault()

        // get the form data
        const formData = new FormData(loginForm)

        // send the form data to the main process
        const userStatus = await window
            .api
            .sendFormDataToMain(Object.fromEntries(formData.entries()));
        if (userStatus) {
            errMsg.innerHTML = userStatus;
            window
                .api
                .reload();
        }

    })
}
// logout the user
if (logout) {
    logout.addEventListener('click', (e) => {

        window
            .api
            .logout()

    });
}

// upload section toggle
uploadBtn.addEventListener('click', (e) => {
    uploadSection
        .classList
        .toggle('hidden');
});

// get folder path and send it to the main process
uploadFolder.addEventListener('click', async (e) => {
    const currentFolder = getCurrentPath();
    // console.log(currentFolder);
    window
        .api
        .uploadFolder(currentFolder);
});

// get the curent folder path
function getCurrentPath() {
    let currentFolder = document.querySelector('.currentFolder');
    //console.log(currentFolder);
    if (currentFolder) {
        let currentPath = currentFolder.id;
        return currentPath;
    }
    return 'main/'
};

// show content of root folder
rootBtn.addEventListener('click', async (e) => {
    try {
        let files = await window
            .api
            .requestFiles();
        if (files.length === 0) {
            throw new Error('No files found');
        }
        currentObject = files;
        createElement(files);
        // addOpeningEvents();

    } catch (error) {
        console.log(error);
    }
});

// create elements for the files and folders
function createElement(files) {
    // clear the display files section
    desplayFiles.innerHTML = '';
    // add elements to the display files section
    files[0]
        .children
        .forEach((file) => {
            // console.log(file);
            let ext = file
                .name
                .split('.')
                .slice(-1)[0];
            let div = document.createElement('div');
            let img = document.createElement('img');
            let p = document.createElement('p');
            p
                .classList
                .add('file-name');
            div
                .classList
                .add('folder-item');
            div
                .classList
                .add(`${file.type}`);
            file.type === 'folder'
                ? img.src = `../assets/folder.png`
                : img.src = `../assets/${ext}.png`;
            img
                .classList
                .add('file-icon');
            p.innerHTML = file.name;
            div.appendChild(img);
            div.appendChild(p);
            div.dataset.object = JSON.stringify(file);
            desplayFiles.appendChild(div);
        });
    addOpeningEvents();
    addSelectEvents();
}

// add event listeners to the folder items
function addOpeningEvents() {
    const folderItem = document.querySelectorAll('.folder-item');
    // show content of the folder
    folderItem.forEach((item) => {
        item.addEventListener('dblclick',async (e) => {
            // log the folder item when it is clicked or one of its children
            let target = e.target;
            if (!target.classList.contains('folder-item')) {
                target = target.parentElement;
            };
            // console.log(target.dataset.object);
            let file = JSON.parse(target.dataset.object);
            if (file.type === 'folder') {
            createElement([file]);
            }else{
            window.api.openFile(file.path);
            // console.log(file.path);
            }
        });
    });
};

// add event listeners to the folder selected
function addSelectEvents() {
    const folderItem = document.querySelectorAll('.folder-item');
    // show content of the folder
    folderItem.forEach((item) => {
        item.addEventListener('click', (e) => {
            // log the folder item when it is clicked or one of its children
            let target = e.target;
            if (!target.classList.contains('folder-item')) {
                target = target.parentElement;
            };
            // console.log(target.dataset.object);
            let file = JSON.parse(target.dataset.object);
            changePath(file.path);
        });
    });
};
// change the path text
function changePath(path) {
    pathText.innerHTML = path;
};

// go back to the previous folder
back.addEventListener('click', (e) => {
    let currentPath = pathText.innerHTML;
    if (currentPath === 'main/') {
        return;
    }
    if (currentPath[currentPath.length - 1] === '/') { 
        let pathArray = currentPath.split('/'); 
        pathArray.pop();
        pathArray.pop();
        let newPath = pathArray.join('/') + '/';
        pathText.innerHTML = newPath;
        // console.log(newPath);

    } else {
        let pathArray = currentPath.split('/');
        pathArray.pop();
        let newPath = pathArray.join('/') + '/';
        pathText.innerHTML = newPath;
        // console.log(newPath);
    }
    findFile(pathText.innerHTML);

});

// find the file in the current object
function findFile(filePath) {
    if (filePath === 'main/') {
        createElement(currentObject);
        return;
    }
    let curent = currentObject;
    let pathArray = filePath.split('/');
    // console.log('pathArray before shift', pathArray);
    pathArray.shift();
    // console.log('pathArray after shift', pathArray);
    pathArray.forEach((path) => {
        // console.log(curent);
        let file = curent[0]
            .children
            .find((file) => file.name === path);
        if (file) {
            curent = [file];
        }

    });
    createElement([...curent]);

}