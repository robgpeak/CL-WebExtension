/**
 * Get user email address from local storage
 * and send it to content script
 */
var ceaseStack = [];
var path = [];
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.type == "get-user-email") {
        	var email = localStorage.getItem('userEmailAddress');
            var domains = ['shop','xclub'];
            var loggedIn = [];
            var userDetail = [];
            domains.forEach(function(domain) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST','https://'+domain+'.complinks.co/api/v1/getUserDetail');

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && JSON.parse(xhr.response).status !== 'unauthorized' ) {
                        // console.log(JSON.parse(xhr.response).partnerSubdomain);
                        // sessionStorage.setItem('subdomain', JSON.parse(xhr.response).partnerSubdomain);
                        // console.log(JSON.parse(xhr.response));
                        loggedIn.push(JSON.parse(xhr.response).partnerSubdomain);
                        userDetail.push(JSON.parse(xhr.response));
                        
                    } else {
                        // sendResponse({error: 'loggedOut'});
                    }
                }            
                xhr.send();
            });
            setTimeout(function() {
                var latestLogin = Math.max.apply(Math,userDetail.map(function(u){
                    var ainxs = u.lastLogin.indexOf("(");
                    var ainxe = u.lastLogin.indexOf(")");
                    var suba = u.lastLogin.substring(ainxs+1,ainxe-1);
                    suba = Number(suba);            
                    return suba;    
                }));
                // console.log(latestLogin);
                recentSubdomain = userDetail.find(function(u) {
                   return u.lastLogin.includes(latestLogin); 
                });
                // console.log(recentSubdomain);

                sendResponse(recentSubdomain);
            }, 700);
            
        } else if (request.type === "get-domain-cookie") {
            // chrome.cookies.get({"url" :"apis.google.com","name" : "QTZ"}, function(cookie) {
                sendResponse({
                    cookie: document.cookie
                });
            // });
        } else if (request.type === "set-activated-from-google") {
            // setTimeout(function() {
            //     chrome.tabs.query({
            //         active: true,
            //         currentWindow: true
            //     }, function(tabs) {
            //         chrome.tabs.sendMessage(tabs[0].id, {
            //             type: "set-activated-from-bg"
            //         }, function(response) {
                        
            //         });
            //     });                
            // }, 3000);
        } else if(request.type === "save-user-data") {
            // console.log('save user data called');
            // console.log(JSON.stringify(request.data));
            var store = {};
            store['userData'] = JSON.stringify(request.data);
            chrome.storage.local.set(store);
        } else if(request.type === "get-user-data") {
            console.log('get user data called');
            chrome.storage.local.get('userData', function(item) {
                console.log(item);
                sendResponse({
                    userData: item.userData
                });                
            });
        } else if (request.type === "check-params") { 
            var keys = Object.keys(request.data);
            // console.log(keys);
            if(request.data.afsrc === "1" || keys.includes("linksynergy") || keys.includes("ebtoken") || keys.includes("wmlspartner") || keys.includes("affiliate.rakuten.com")) {
                ceaseStack.push(1);
                // console.log(ceaseStack);
            }
        } else if(request.type === "path-check") {
            if(request.data.includes("/trip/start/")) {
                path.push(request.data);
                console.log(path);
                sendResponse({
                    msg: "trip-activated"
                });
            } else if(path.length > 0) {
                console.log(path);
                sendResponse({
                    msg: "trip-activated"
                });
            }
            setTimeout(function() {
                path = [];
            }, 5000);

        } else if (request.type === "cease-check") {
            // console.log(ceaseStack.length);
            // if(url) //if url is a link from complinks subdomain, set activated cookie in response
            if(ceaseStack.length > 0) {
                sendResponse({
                    msg: "cease" 
                });
            } else {
                sendResponse({
                    msg: "continue"
                });
            }
            setTimeout(function() {
                ceaseStack = [];
            }, 7000);
        } else if (request.type === "clear-cease") {
            ceaseStack = [];
        }
        return true;
    });