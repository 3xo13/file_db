const loginForm = document.querySelector('#login-form');
const errMsg = document.querySelector('#err-msg-text');
const logout = document.querySelector('#logout');
const uploadForm = document.querySelector('#uploadForm');
const desplayFiles = document.querySelector('#display-files');
const displayFilesBtn = document.querySelector('#getAllFiles');
const wrapper = document.querySelector('#wrapper');
const uploadBtn = document.querySelector('#upload');
const slelectPath = document.querySelector('#uploadPathBtn');
const uploadSection = document.querySelector('#upload-section');
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

// receive the data from the main process and display it in the renderer process
displayFilesBtn.addEventListener('click', async (event) => {
    try {
        let files = await window
            .api
            .requestFiles();

        files = classefyFiles(files);
        createHtml(files);
    } catch (error) {
        console.log(error);
    }

})


// get the path of the clicked folder or file and send it to the main process
desplayFiles.addEventListener('dblclick', async (event) => {
    // get the clicked file or folder node
    let clickedDoc = event
        .target
        .closest('.folder, .file');
    let clickedDocId = clickedDoc.id;

    // send the id to the main process and get and display the
    try {
        let files = await window
            .api
            .sendDocumentPath(clickedDocId);

        let newDocs = classefyFiles(files);
        // generate the html for the new files
        createHtml(newDocs);
    } catch (error) {
        console.log(error);
    }

});

// take array of objects and return an array of objects with the Key turnded
// into string of naem of file and folder longer array of key strings means it's
// the deeper in the folder structure shorter array of key strings means it's
// the higher in the folder structure ends with / means it's a folder else it's
// a file
function classefyFiles(files) {
    let filesArr = [];
    files.map(file => {
        file.nameArr = [];
        let keyArr = file
            .Key
            .split('/');

        let fileObj = {
            Key: file.Key,
            fileName: keyArr[keyArr.length - 1],
            nameArr: keyArr,
            LastModified: file.LastModified,
            Size: file.Size,
            type: file.Size == 0 ? 'folder' : 'file'
        }
        filesArr.push(fileObj);
    });

    return filesArr;
}

// get all the docs currently rendered on the screen
function getDocs() {
    let docs = document.querySelectorAll('.folder, .file');
    //console.log(docs);
    return docs;
}


function createHtml( newDocs){
  let html = '';
        let count = Infinity;
        newDocs.forEach(doc => { // get the lowest level of folder structure
            doc.nameArr.length < count
                ? count = doc.nameArr.length
                : count;
        });
        let currentDocs = newDocs.filter( // get the objects with the lowest level of folder structure
            file => file.nameArr.length == count  || (file.nameArr.length == count + 1 && file.type == 'folder')
        );
        
        currentDocs.forEach(doc => {
            let date = new Date(doc.LastModified); // format the date
            date = date.toUTCString(date).slice(0, 25); // turn the date into a shorter string
            let folderName = doc.nameArr[doc.nameArr.length - 2]; 
            let fileName = doc.nameArr[doc.nameArr.length - 1];
            if (doc.type === 'folder') {
                html += `<div class="folder flex-center ${doc.nameArr.length == count ? 'currentFolder' : ''} clickable doc" id="${doc
                    .nameArr
                    .join('/')}">
                    <img class="doc-img" src="../icons/icons8-file-folder-96.png" alt="folder">
                    <p class="folder-name">${folderName}</p>
                    <p class="folder-date">${date}</p>
                  </div>`;
            } else {
                html += `<div class="file flex-center clickable doc" id="${doc
                    .nameArr
                    .join('/')}">
                  <img class="doc-img" src="../icons/icons8-file-64.png" alt="folder">
                  <p class="file-name">${fileName}</p>
                  <p class="file-date">${date}</p>
                </div>`;
            }
        });
        desplayFiles.innerHTML = html;
        let currentRenderedDocs = getDocs();
        currentRenderedDocs.forEach(doc => {
            // add event listener to each node
            doc.addEventListener('click', (e) => {

                doc
                    .classList
                    .toggle('selected');

            });
        });
}

// upload section toggle
uploadBtn.addEventListener('click', (e) => {
    uploadSection.classList.toggle('hidden');
});

// get the curent folder path
function getCurrentPath() {
    let currentFolder = document.querySelector('.currentFolder');
    let currentPath = currentFolder.id;
    return currentPath;
};

// get the selected folder path and send it to the main process
slelectPath.addEventListener('click', async (e) => {
  let path = getCurrentPath();
  try {
    let files = await window.api.uploadFiles(path);
  } catch (error) {
    
  }
});