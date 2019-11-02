import { loadToken, saveToken } from '../helpers/storage.js'

function updateIssueName(projectId, issueNumber, newName, privateToken) {
    let data = null

    let xhr = new XMLHttpRequest()
    xhr.withCredentials = true

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            console.log(this.responseText)
            let issue = Array.from(document.querySelectorAll('.board-card .board-card-number')).filter(item => item.textContent.trim().replace('#', '') === issueNumber)
            issue[0].closest('.board-card').querySelector('.board-card-header').textContent = newName
        }
    })

    xhr.open("PUT", `https://gitlab.com/api/v4/projects/${projectId}/issues/${issueNumber}?title=${encodeURIComponent(newName)}`)
    xhr.setRequestHeader("PRIVATE-TOKEN", privateToken)
    xhr.setRequestHeader("cache-control", "no-cache")

    xhr.send(data)
}

function supportChangeName() {
    function listenForUpdate(issueNumber) {
        document.querySelector('.new-title').onkeypress = async function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                event.preventDefault()

                let res = await browser.storage.sync.get('gitlabToken')
                let gitlabToken = res.gitlabToken
                console.log(`Token retrieved: ${gitlabToken}`)

                if (!res) throw Error('Token invalid')
                const projectId = document.querySelector('#search_project_id').getAttribute('value')
                const newName = document.querySelector('.new-title').innerText

                updateIssueName(projectId, issueNumber, newName, gitlabToken)
            }
        }
    }

    let span = document.querySelector('.right-sidebar .issuable-header-text span')
    let observer = new MutationObserver(function () {
        const isVisible = span.style.display != 'none'
        console.log(`Sidebar is shown: ${isVisible}`)
        const issueName = document.querySelector('.is-active.board-card .board-card-header').textContent.trim()
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

        listenForUpdate(issueNumber)
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