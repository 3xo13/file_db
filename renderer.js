const loginForm = document.querySelector('#login-form');
const errMsg = document.querySelector('#err-msg-text');
const logout = document.querySelector('#logout');
const uploadForm = document.querySelector('#uploadForm');
const desplayFiles = document.querySelector('#display-files');
const displayFilesBtn = document.querySelector('#getAllFiles');
const wrapper = document.querySelector('#wrapper');
const uploadBtn = document.querySelector('#upload');
const uploadFolder = document.querySelector('#uploadFolderBtn');
const uploadSection = document.querySelector('#upload-section');
const uploadFile = document.querySelector('#uploadfileBtn');

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
    console.log(currentFolder);
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
    return 'main/test2/'
};

