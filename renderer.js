const loginForm = document.querySelector('#login-form');
const errMsg = document.querySelector('#err-msg-text');
const logout = document.querySelector('#logout');
const uploadForm = document.querySelector('#uploadForm');
const desplayFiles = document.querySelector('#display-files');
const displayFilesBtn = document.querySelector('#getAllFiles');
const wrapper = document.querySelector('#wrapper');

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
        console.log(e);
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
            classefyFiles(files);
        files = classefyFiles(files);
        createHtml(files);
    } catch (error) {
        console.log(error);
    }

})

// sort data and create html for the files
function createHtml(files){
  files = files.map(doc => doc.Size == 0 ? (doc.type = 'folder' , doc) : (doc.type = 'file' , doc));
        
        // get the objects with lowest level of folder structure
        let currentDocs = files.filter(file => file.nameArr.length === 2);
        console.log(currentDocs);
        // get the objects with highest level of folder structure
        let futureDocs = files.filter(file => file.nameArr.length > 1);
        let currentFolder = currentDocs.filter(file => file.type == 'folder');
        // remove repeated objects
        futureDocs = futureDocs.filter(doc => doc.nameArr[doc.nameArr.length - 2] !== currentFolder[0].nameArr[currentFolder[0].nameArr.length - 2])
        // creat the html for the currentDocs and future folders only
        let html = '';
        currentDocs.forEach(doc => {
            if (doc.type === 'folder') {
                html += `<div class="folder currentFolder">
                  <img src="../icons/icons8-file-folder-96.png" alt="folder">
                  <p class="folder-name">${doc.nameArr[doc.nameArr.length -2]}</p>
                  <p class="folder-date">${doc.LastModified}</p>
                </div>`;
            } else {
                html += `<div class="file">
                <img src="../icons/icons8-file-64.png" alt="folder">
                <p class="file-name">${doc.nameArr[doc.nameArr.length -2]}</p>
                <p class="file-date">${doc.LastModified}</p>
              </div>`;
            }
        });
        futureDocs.forEach(doc => {
            if (doc.type === 'folder') {
                html += `<div class="folder">
                <img src="../icons/icons8-file-folder-96.png" alt="folder">
                <p class="folder-name">${doc.nameArr[doc.nameArr.length -2]}</p>
                <p class="folder-date">${doc.LastModified}</p>
              </div>`;
            }
        });
        desplayFiles.innerHTML = html;
}; 


// take array of objects and return an array of objects with the Key turnded into string of naem of file and folder 
// longer array of key strings means it's the deeper in the folder structure
// shorter array of key strings means it's the higher in the folder structure
// ends with / means it's a folder else it's a file
function classefyFiles(files) {
    let filesArr = [];
    files.forEach(file => {
        let keyArr = file.Key.split('/');
        let fileObj = {
            Key: keyArr[keyArr.length - 1],
            nameArr: keyArr,
            LastModified: file.LastModified,
            Size: file.Size
        }
        filesArr.push(fileObj);
    });
    
    return filesArr;
}