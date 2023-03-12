const loginForm = document.querySelector('#login-form');
const errMsg = document.querySelector('#err-msg-text');
const logout  = document.querySelector('#logout');

loginForm.addEventListener('submit',async (event) => {
  event.preventDefault()

  // get the form data
  const formData = new FormData(loginForm)

  // send the form data to the main process
  const userStatus = await window.api.sendFormDataToMain(Object.fromEntries(formData.entries()));
    if(userStatus){
        errMsg.innerHTML = userStatus;
    }
  
})

logout.addEventListener('click', (event) => {
  
})
