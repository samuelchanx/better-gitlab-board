async function loadToken() {
    let res = await browser.storage.sync.get('gitlabToken')
    document.getElementById('token-input').value = res.gitlabToken
}

loadToken()

document.getElementById('token-input').onkeypress = async function(event) {
    if (event.keyCode === 13 || event.which === 13) {
        browser.storage.sync.set({
            gitlabToken: event.target.value
        })
        console.log(`Token input: ${event.target.value}`)
        
        document.getElementsByClassName('success-input')[0].style.display = 'block'
    }
}

document.addEventListener("click", function(e) {
    if (!e.target.classList.contains("page-choice")) {
      return;
    }
  
    var chosenPage = "https://" + e.target.textContent;
    browser.tabs.create({
      url: chosenPage
    });
  
});