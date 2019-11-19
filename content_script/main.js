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

function listenForIssueNameUpdate(projectId, issueNumber) {
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

async function loadIssueName(projectId, issueNumber) {
    function getDescriptionHtml(issue) {
        return `
        <div class="block new-description">
            <div data-qa-selector="assignee_title">
                <img src="${issue.authorAvatar}" class="header-user-avatar qa-user-avatar js-sidebar-dropdown-toggle edit-link" width="40" height="40">${issue.authorUsername}<div>${issue.createDate}</div></div>  
                <div class="value"> <div class="value hide-collapsed"><span class="assign-yourself no-value qa-assign-yourself">${issue.description}</span></div>
            </div>
        </div>`
    }

    // eslint-disable-next-line no-undef
    const { gitlabToken } = await loadToken()
    const { result, error } = await getIssue(projectId, issueNumber, gitlabToken)
    if (error) {
        console.log(error)
        return
    }

    issueData[issueNumber] = {
        title: result.title,
        description: result.description,
        createDate: result.created_at,
        authorUsername: result.author.username,
        authorAvatar: result.author.avatar_url
    }

    const assigneeNode = document.querySelector('.right-sidebar .block.assignee')
    let newDescription = document.querySelector('div.block.new-description')
    if (newDescription) {
        newDescription.innerHTML = getDescriptionHtml(issueData[issueNumber])
    } else {
        newDescription = document.createElement('div')
        newDescription.innerHTML = getDescriptionHtml(issueData[issueNumber])
        assigneeNode.parentNode.insertBefore(newDescription, assigneeNode.nextSibling)
    }
}

function supportChangeName() {
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
        
        loadIssueName(projectId, issueNumber)
        listenForIssueNameUpdate(projectId, issueNumber.replace(/[^0-9]/g, ''))
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