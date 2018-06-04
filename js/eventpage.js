/**
 * Get user email address from local storage
 * and send it to content script
 */
var ceaseStack = [];
var activateStack = [];
var path = [];
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // console.log(sender.tab ?
        //     "from a content script:" + sender.tab.url :
        //     "from the extension");
        if (request.type == "get-user-email") {
        	var email = localStorage.getItem('userEmailAddress');
            // var domains = ['shop','xclub','totalrewards','foxwoods'];
            var xhr = new XMLHttpRequest();
            xhr.open('GET','https://shop.complinks.co/api/v1/getSubdomains');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var domainsList = JSON.parse(xhr.response);
                    var domains = Object.keys(domainsList).map((key) => domainsList[key].subdomain);
                    console.log(domains);
                    var loggedIn = [];
                    var userDetail = [];
                    domains.forEach(function(domain) {
                        var xhr2 = new XMLHttpRequest();
                        xhr2.open('POST','https://'+domain+'.complinks.co/api/v1/getUserDetail');

                        xhr2.onreadystatechange = function() {
                            if (xhr2.readyState === 4 && JSON.parse(xhr2.response).status !== 'unauthorized' ) {
                                loggedIn.push(JSON.parse(xhr2.response).partnerSubdomain);
                                userDetail.push(JSON.parse(xhr2.response));
                            } else {
                                // sendResponse({error: 'loggedOut'});
                            }
                        }            
                        xhr2.send();
                    });
                    setTimeout(function() {
                        var latestLogin = Math.max.apply(Math,userDetail.map(function(u){
                            var ainxs = u.lastLogin.indexOf("(");
                            var ainxe = u.lastLogin.indexOf(")");
                            var suba = u.lastLogin.substring(ainxs+1,ainxe-1);
                            suba = Number(suba);            
                            return suba;    
                        }));
                        recentSubdomain = userDetail.find(function(u) {
                           return u.lastLogin.includes(latestLogin); 
                        });
                        console.log(recentSubdomain);
                        sendResponse(recentSubdomain);
                    }, 1000);

                } 
            }
            xhr.send();                        
        } else if (request.type === "get-domain-cookie") {
            sendResponse({
                cookie: document.cookie
            });
        } else if (request.type === "set-activated-from-google") {
        } else if(request.type === "save-user-data") {
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
            console.log('check-params top');
            console.log(request);
            console.log(request.host);
            console.log(request.mode);
            var keys = Object.keys(request.data);

            if(request.href.includes("complinks.co/trip/start")) 
            {
                console.log(request.data);
                activateStack.push(1);
                console.log('activate stack push');
            } else if (request.href.includes("aclk")) {
                ceaseStack.push(1);
            } else if (request.href.includes("=") && !request.host.includes("google.com") && !request.referrer.includes("google.com")) {
                ceaseStack.push(1);
            }
        } else if (request.type === "cease-check") {
            console.log(ceaseStack);
            console.log(activateStack);
            if(activateStack.length > 0 && !request.host.includes("complinks.co")) {
                activateStack = [];
                sendResponse({
                    msg: "activated"
                });
            } else if(ceaseStack.length > 0) {
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
            }, 10000);
        } else if (request.type === "clear-cease") {
            ceaseStack = [];
        }
        return true;
    });