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

async function loadIssueDescription(projectId, issueNumber) {
    function getDescriptionHtml(issue) {
        const converter = new showdown.Converter({
            ghCompatibleHeaderId: true,
            simpleLineBreaks: true,
            ghMentions: true
        })
        
        const splitIndex = 3

        // Replace relative link with absolute
        const description = issue.description ? issue.description.replace(/\(([\\/a-zA-Z0-9.]*)\)/, `(https://gitlab.com/${projectId}$1)`) : ''
        converter.setFlavor('original')
        const markdownHtml = converter.makeHtml(description)

        // Toggle to collapse button
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${markdownHtml}</div>`, 'text/html');

        let descriptionHtml = ''
        if (doc.querySelector('div').hasChildNodes()) {
            let array = Array.from(doc.querySelector('div').children).map(elem => elem.outerHTML)
            
            const toggleBtn = `<button data-toggle="collapse" aria-expanded="false" aria-controls="collapseDescription" href="#collapseDescription" class="collapsed btn-link bold" style="color: blueviolet;"> >> show/hide</button>`
            descriptionHtml = array.slice(0, splitIndex).concat([
                `<div id="collapseDescription" class="collapse">`, 
                array.slice(splitIndex).reduce((a, b) => a + b), 
                `</div>`, 
                toggleBtn
            ]).reduce((a, b) => a + b)
        }
        
        return `
            <div data-qa-selector="assignee_title">
                <img src="${issue.authorAvatar}" class="header-user-avatar qa-user-avatar js-sidebar-dropdown-toggle edit-link" width="40" height="40">${issue.authorUsername}<div>Created on ${new Date(issue.createDate).toLocaleDateString()}</div></div>  
                <div class="value"> <div class="value hide-collapsed" style="margin-top: 10px;"><span class="js-vue-md-preview md md-preview-holder no-value">${descriptionHtml}</span></div>
            </div>`
    }

    function updateDescriptionHtml(html) {
        const assigneeNode = document.querySelector('.right-sidebar .block.assignee')
        let newDescription = document.querySelector('div.block.new-description')
        if (newDescription) {
            newDescription.innerHTML = html
        } else {
            newDescription = document.createElement('div')
            newDescription.className = 'block new-description'
            newDescription.innerHTML = html
            assigneeNode.parentNode.insertBefore(newDescription, assigneeNode.nextSibling)
        }
    }

    // eslint-disable-next-line no-undef
    const { gitlabToken } = await loadToken()
    const issueKey = `${projectId}/${issueNumber}`

    // Load cache
    const cache = issueData[issueKey]
    if (cache) { updateDescriptionHtml(getDescriptionHtml(cache)) }

    const { result, error } = await getIssue(projectId, issueNumber, gitlabToken)
    if (error) {
        console.log(error)
        return
    }

    const newData = {
        title: result.title,
        description: result.description,
        createDate: result.created_at,
        authorUsername: result.author.username,
        authorAvatar: result.author.avatar_url
    }

    if (newData != cache) {
        updateDescriptionHtml(getDescriptionHtml(newData))
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

        let issueNumber = document.querySelector('.right-sidebar .issuable-header-text span').innerText.replace(/[^0-9]/g, '')
        let projectIdRaw = activeIssueElem.querySelector('.board-card-title a').getAttribute('href')
        const projectId = /(?=[^\/])(.+)(?=\/issues)/g.exec(projectIdRaw)[0]
        
        loadIssueDescription(projectId, issueNumber)
        listenForIssueNameUpdate(projectId, issueNumber)
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