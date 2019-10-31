/*
Just draw a border round the document.body.
*/
// extensions.sdk.console.logLevel = 'all'
try {
    console.log('Try load jQuery')
    var script = document.createElement('script');script.src = "https://code.jquery.com/jquery-3.4.1.min.js";document.getElementsByTagName('head')[0].appendChild(script);
    console.log('Loaded the browser script')
} catch (error) {
    console.log(error)
}

// $('.issuable-sidebar')

document.body.style.border = "5px solid red";
