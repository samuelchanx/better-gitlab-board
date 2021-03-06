/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const gitlabToken = 'gitlabToken'

function getBrowser() {
  if (typeof chrome !== "undefined") {
    if (typeof browser !== "undefined") return "Firefox"
    else return "Chrome"
  } else {
    return "Edge"
  }
}

function loadToken() {
  if (getBrowser() === 'Firefox') {
    return browser.storage.sync.get(gitlabToken)
  } else {
    return new Promise(function (resolve) {
      chrome.storage.sync.get(gitlabToken, function (result) {
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
    return new Promise(function (resolve) {
      chrome.storage.sync.set({
        gitlabToken: token
      }, function (result) {
        resolve(result)
      })
    })
  }
}