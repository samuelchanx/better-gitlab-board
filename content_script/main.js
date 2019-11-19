let issueData = {}

function getIssue(projectId, issueNumber, privateToken) {
    return new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest()
        xhr.withCredentials = true

        xhr.open("GET", `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issueNumber}`)
        xhr.setRequestHeader("PRIVATE-TOKEN", privateToken)
        xhr.setRequestHeader("cache-control", "no-cache")
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                console.log(xhr.response)
                resolve({result: JSON.parse(xhr.response)})
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                })
            }
        }
        xhr.onerror = function () {
            reject({
                error: xhr.statusText
            })
        }
        xhr.send()
    })
}

function updateIssueName(projectId, issueNumber, newName, privateToken) {
    let data = null

    let xhr = new XMLHttpRequest()
    xhr.withCredentials = true

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            console.log(this.responseText)
            let issue = Array.from(document.querySelectorAll('.board-card .board-card-number')).filter(item => item.textContent.trim().replace('#', '').includes(issueNumber))
            issue[0].closest('.board-card').querySelector('.board-card-header a').textContent = newName
        }
    })

    xhr.open("PUT", `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issueNumber}?title=${encodeURIComponent(newName)}`)
    xhr.setRequestHeader("PRIVATE-TOKEN", privateToken)
    xhr.setRequestHeader("cache-control", "no-cache")

    xhr.send(data)
}

function supportChangeName() {
    function listenForUpdate(projectId, issueNumber) {
        document.querySelector('.new-title').onkeypress = async function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                event.preventDefault()

                // eslint-disable-next-line no-undef
                let { gitlabToken } = await loadToken()
                console.log(`Token retrieved: ${gitlabToken}`)

                if (!gitlabToken) throw Error('Token invalid')
                const newName = document.querySelector('.new-title').innerText

                updateIssueName(projectId, issueNumber, newName, gitlabToken)
            }
        }
    }
    
    let span = document.querySelector('.right-sidebar .issuable-header-text span')
    let observer = new MutationObserver(function () {
        const activeIssueElem = document.querySelector('.is-active.board-card .board-card-header')
        if (!activeIssueElem) return

        const issueName = activeIssueElem.textContent.trim()
        console.log(issueName)
        let originalTitle = document.querySelector('.right-sidebar .issuable-header-text strong')
        originalTitle.style.display = 'none'

        let newTitle = document.querySelector('div.new-title')
        if (newTitle) {
            newTitle.innerText = issueName
        } else {
            newTitle = document.createElement('div')
            newTitle.innerHTML = `<div class="bold new-title" contenteditable="true">${issueName}</div>`
            originalTitle.parentNode.insertBefore(newTitle, originalTitle.nextSibling)
        }

        let issueNumber = document.querySelector('.right-sidebar .issuable-header-text span').innerText.replace('#', '')
        let projectIdRaw = activeIssueElem.querySelector('.board-card-title a').getAttribute('href')
        const projectId = /(?=[^\/])(.+)(?=\/issues)/g.exec(projectIdRaw)[0]
        listenForUpdate(projectId, issueNumber.replace(/[^0-9]/g, ''))
    })
    observer.observe(span, {
        childList: true,
        characterData: true,
        subtree: true,
        characterDataOldValue: true
    })
}

try {
    supportChangeName()
} catch (error) {
    console.log(error)
}