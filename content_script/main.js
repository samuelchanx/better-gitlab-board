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
        else {
          return cardNumberMatch
        }
      })
    issue[0].closest('.board-card').querySelector('.board-card-header a').textContent = newName
  } else {
    throw response.error
  }
}

async function issueEstimate(projectId, issueNumber, estimation, privateToken) {
  const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issueNumber}/time_estimate?duration=${encodeURIComponent(estimation)}`, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    headers: {
      'PRIVATE-TOKEN': privateToken,
      'cache-control': 'no-cache'
    }
  })
  console.log(await response.json())
}

async function issueEstimateReset(projectId, issueNumber, privateToken) {
  const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issueNumber}/reset_time_estimate`, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    headers: {
      'PRIVATE-TOKEN': privateToken,
      'cache-control': 'no-cache'
    }
  })
  console.log(await response.json())
}

async function issueSpend(projectId, issueNumber, estimation, privateToken) {
  const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issueNumber}/add_spent_time?duration=${encodeURIComponent(estimation)}`, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    headers: {
      'PRIVATE-TOKEN': privateToken,
      'cache-control': 'no-cache'
    }
  })
  console.log(await response.json())
}

async function issueSpendReset(projectId, issueNumber, privateToken) {
  const response = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issueNumber}/reset_spent_time`, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    headers: {
      'PRIVATE-TOKEN': privateToken,
      'cache-control': 'no-cache'
    }
  })
  console.log(await response.json())
}

function listenForIssueNameUpdate(projectId, issueNumber) {
  document.querySelector('.new-title').onkeypress = async function (event) {
    if (event.keyCode === 13 || event.which === 13) {
      event.preventDefault()

      // eslint-disable-next-line no-undef
      let gitlabToken = await loadToken()
      console.log(`Token retrieved: ${gitlabToken}`)

      if (!gitlabToken) throw Error('Token invalid')
      const newName = document.querySelector('.new-title').innerText

      updateIssueName(projectId, issueNumber, newName, gitlabToken)
    }
  }
}

async function loadIssueDescription(projectId, issueNumber) {
  function urlToAnchorLink(html) {
    const urlRegex = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9$\-_.+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;
    return html.replace(urlRegex, `<a href="$&">$&</a>`)
  }

  function getDescriptionHtml(issue) {
    // eslint-disable-next-line no-undef
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

    let descriptionHtml = urlToAnchorLink(markdownHtml)

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
  const gitlabToken = await loadToken()
  const issueKey = `${projectId}/${issueNumber}`

  // Load cache
  const cache = issueData[issueKey]
  if (cache) {
    updateDescriptionHtml(getDescriptionHtml(cache))
  }

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

function listenForIssueTimeTrack(projectId, issueNumber) {
  const timeTrackSelector = '.right-sidebar .time-tracking .time-tracking-content'
  const timeTrackEstimateHtml = `<div class="time-tracking-estimate">
  <a href="#" class="estimate"><span>Estimate</span></a>
  <a href="#" class="reset"><span>Reset </span></a>
  <input type="search" id="" placeholder="e.g. 1h30m" autocomplete="off" class="time-tracking-estimate-input dropdown-input-field qa-dropdown-input-field hidden"></div>`
  const timeTrackSpendHtml = `<div class="time-tracking-spend">
  <a href="#" class="spend"><span>Spend</span></a>
  <a href="#" class="reset"><span> Reset </span></a>
  <input type="search" id="" placeholder="e.g. 1h30m" autocomplete="off" class="time-tracking-spend-input dropdown-input-field qa-dropdown-input-field hidden"></div>`

  document.querySelector(timeTrackSelector).querySelectorAll('.time-tracking-estimate, .time-tracking-spend').forEach(e => e.remove())

  document.querySelector(timeTrackSelector).insertAdjacentHTML('beforeend', timeTrackEstimateHtml)
  document.querySelector(timeTrackSelector).insertAdjacentHTML('beforeend', timeTrackSpendHtml)

  async function addListeners() {
    // eslint-disable-next-line no-undef
    let gitlabToken = await loadToken()

    document.querySelector(timeTrackSelector).querySelectorAll('.estimate, .spend').forEach(elem => {
      elem.addEventListener('click', function(e) {
        e.target.closest('div').querySelector('input').classList.toggle('hidden')
      })
    })

    document.querySelector(timeTrackSelector).querySelectorAll('.reset').forEach(e => {
      e.addEventListener('click', async function(e) {
        if (e.target.closest('div').classList.contains('time-tracking-estimate')) {
          // reset estimate
          console.log('reset estimate')
          await issueEstimateReset(projectId, issueNumber, gitlabToken)
        } else if (e.target.closest('div').classList.contains('time-tracking-spend')) {
          // reset spend
          console.log('reset spend')
          await issueSpendReset(projectId, issueNumber, gitlabToken)
        }
      })
    })

    document.querySelector(timeTrackSelector).querySelectorAll('input').forEach(e => {
      e.addEventListener('keypress', async function(e) {
        if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
          if (e.target.classList.contains('time-tracking-estimate-input')) {
            console.log('Estimate value: ', e.target.value)
            await issueEstimate(projectId, issueNumber, e.target.value, gitlabToken)
          } else if (e.target.classList.contains('time-tracking-spend-input')) {
            console.log('Spend value: ', e.target.value)
            await issueSpend(projectId, issueNumber, e.target.value, gitlabToken)
          }
          return false;
        }
      })
    })
  }

  addListeners()
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
    listenForIssueTimeTrack(projectId, issueNumber)
  })
  observer.observe(span, {
    childList: true,
    characterData: true,
    subtree: true,
    characterDataOldValue: true
  })
}

main()