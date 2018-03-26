/**
 * Get user email address from local storage
 * and send it to content script
 */
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.type == "get-user-email"){
        	var email = localStorage.getItem('userEmailAddress');
            sendResponse({
                userEmailAddress: email
            });
        } else if (request.type === "get-domain-cookie") {
            // chrome.cookies.get({"url" :"apis.google.com","name" : "QTZ"}, function(cookie) {
                sendResponse({
                    cookie: document.cookie
                });
            // });
        }
        return true;
    });