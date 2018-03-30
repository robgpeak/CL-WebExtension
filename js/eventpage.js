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

            //ajax to getUserDetail
            var domains = ['shop','xclub'];
            var loggedIn = [];
            domains.forEach(function(domain) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST','https://'+domain+'.complinks.co/api/v1/getUserDetail');

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && JSON.parse(xhr.response).status !== 'unauthorized' ) {
                        console.log(JSON.parse(xhr.response).partnerSubdomain);
                        sessionStorage.setItem('subdomain', JSON.parse(xhr.response).partnerSubdomain);
                        sendResponse(JSON.parse(xhr.response))
                    } else {
                        // sendResponse({error: 'loggedOut'});
                    }
                }            
                xhr.send();
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