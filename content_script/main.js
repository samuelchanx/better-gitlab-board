let issueData = {}

async function getIssue(projectId, issueNumber, privateToken) {
    const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issueNumber}`, {
        method: 'GET',
        headers: {
            'PRIVATE-TOKEN': privateToken,
            'cache-control': 'no-cache'
        }
    })
    return response.json()
}

async function updateIssueName(projectId, issueNumber, newName, privateToken) {
    const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issueNumber}?title=${encodeURIComponent(newName)}`, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'PRIVATE-TOKEN': privateToken,
          'cache-control': 'no-cache'
        },
    })
    if (response.ok) {
        let issue = Array.from(document.querySelectorAll('.board-card-number-container'))
                .filter(item => {
                    const issuePath = item.querySelector('.board-issue-path')
                    const cardNumberMatch = item.querySelector('.board-card-number').textContent.trim().replace(/[^0-9]/g, '') === issueNumber
                    if (issuePath) return issuePath.textContent === projectId && cardNumberMatch
                    else { return cardNumberMatch }
                })
        issue[0].closest('.board-card').querySelector('.board-card-header a').textContent = newName
    } else {
        throw response.error
    }
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
        let descriptionHtml = markdownHtml
        
        // Toggle to collapse button
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${markdownHtml}</div>`, 'text/html');
        let markdownElems = Array.from(doc.querySelector('div').children).map(elem => elem.outerHTML)
        if (markdownElems.length > splitIndex) {
            const toggleBtn = `<button data-toggle="collapse" aria-expanded="false" aria-controls="collapseDescription" href="#collapseDescription" class="collapsed btn-link bold" style="color: blueviolet;"> >> show/hide</button>`
            descriptionHtml = markdownElems.slice(0, splitIndex).concat([
                `<div id="collapseDescription" class="collapse">`, 
                markdownElems.slice(splitIndex).length !== 0 ? markdownElems.slice(splitIndex).reduce((a, b) => a + b) : '',
                `</div>`, 
                toggleBtn
            ]).reduce((a, b) => a + b)
        }
    
        return `
            <div data-qa-selector="assignee_title">
                <img src="${issue.authorAvatar}" class="header-user-avatar qa-user-avatar js-sidebar-dropdown-toggle edit-link" width="32" height="32">${issue.authorUsername}<div>Created on ${new Date(issue.createDate).toLocaleDateString()}</div></div>  
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
            assigneeNode.parentNode.insertBefore(newDescription, assigneeNode)
        }
    }

    // eslint-disable-next-line no-undef
    const { gitlabToken } = await loadToken()
    const issueKey = `${projectId}/${issueNumber}`

    // Load cache
    const cache = issueData[issueKey]
    if (cache) { updateDescriptionHtml(getDescriptionHtml(cache)) }

    try {
        const result = await getIssue(projectId, issueNumber, gitlabToken)

        const newData = {
            title: result.title,
            description: result.description,
            createDate: result.created_at,
            authorUsername: result.author.username,
            authorAvatar: result.author.avatar_url
        }

        if (newData != cache) {
            updateDescriptionHtml(getDescriptionHtml(newData))
            issueData[issueKey] = newData
        }       
    } catch (e) {
        console.log(e)
    }
}

function main() {
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
        const projectId = /(?=[^/])(.+)(?=\/issues)/g.exec(projectIdRaw)[0]
        
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

main()
