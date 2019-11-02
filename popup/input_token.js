const gitlabToken = 'gitlabToken'

function getBrowser() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") return "Firefox"
        else return "Chrome"
    } else { return "Edge" }
}

function loadToken() {
    if (getBrowser() === 'Firefox') {
        return browser.storage.sync.get(gitlabToken)
    } else {
        return new Promise(function(resolve) {
            chrome.storage.sync.get(gitlabToken, function(result) {
                resolve(result)
            })
        })
    }
}

function saveToken(token) {
    if (getBrowser() === 'Firefox') {
        return browser.storage.sync.set({
            gitlabToken: token
        })
    } else {
        return new Promise(function(resolve) {
            chrome.storage.sync.set({gitlabToken: token}, function(result) {
                resolve(result)
            })
        })
    }
}

(async () => {
    let res = await loadToken()
    document.getElementById('token-input').value = res.gitlabToken || ''
})()

document.getElementById('token-input').onkeypress = async function(event) {
    if (event.keyCode === 13 || event.which === 13) {
        saveToken(event.target.value)
        console.log(`Token input: ${event.target.value}`)
        
        document.getElementsByClassName('success-input')[0].style.display = 'block'
    }
}

document.addEventListener("click", function(e) {
    if (!e.target.classList.contains("page-choice")) {
      return
    }
  
    var chosenPage = "https://" + e.target.textContent
    browser.tabs.create({
      url: chosenPage
    })
  
})