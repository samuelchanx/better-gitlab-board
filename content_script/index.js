function getBrowser() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") {
            return "Firefox";
        } else {
            return "Chrome";
        }
    } else {
        return "Edge";
    }
}

(async () => {
    let src = ''
    if (getBrowser() === 'Firefox') src = chrome.extension.getURL('content_script/main.js')
    else src = chrome.extension.getURL('content_script/main.js')
    const contentScript = await import(src)
    contentScript.main( /* chrome: no need to pass it */ )
})()