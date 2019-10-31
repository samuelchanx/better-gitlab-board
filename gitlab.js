function updateIssueName(projectId, issueNumber, newName, privateToken) {
    var data = null;

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            console.log(this.responseText);
            // TODO: Update local issue board name
        }
    });

    xhr.open("PUT", `https://gitlab.com/api/v4/projects/${projectId}/issues/${issueNumber}?title=${encodeURIComponent(newName)}`);
    xhr.setRequestHeader("PRIVATE-TOKEN", privateToken);
    xhr.setRequestHeader("cache-control", "no-cache");

    xhr.send(data);
}

function supportChangeName() {
    function listenForUpdate(issueNumber) {
        document.querySelector('.new-title').onkeypress = function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                let gitlabToken = browser.storage.sync.get('gitlabToken');
                gitlabToken.then((res) => {
                    console.log(`Token retrieved: ${res.gitlabToken}`)

                    if (!res) throw Error('Token invalid')
                    const projectId = document.querySelector('#search_project_id').getAttribute('value')
                    const newName = document.querySelector('.new-title').innerText
                
                    updateIssueName(projectId, issueNumber, newName, res.gitlabToken)
                })

                event.preventDefault()
            }
        }
    }

    let targetNode = document.getElementsByClassName('right-sidebar')[0];
    let observer = new MutationObserver(function() {
        const isVisible = targetNode.style.display != 'none'
        console.log(`Target node is shown: ${isVisible}`)
        if(isVisible) {
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
        }
    });
    observer.observe(targetNode, { attributes: true, childList: true });
}

try {
    supportChangeName()
} catch (error) {
    console.log(error)
}

// FIXME: Just to indicate working
document.body.style.border = "5px solid red";
