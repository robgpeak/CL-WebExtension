/**
 * Get user email address from local storage
 * and send it to content script
 */
function makeRequest (method, url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

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
            makeRequest('GET','https://shop.rewardseverywhere.co/api/v1/getSubdomains').then(function(data) {
                var domainsList = JSON.parse(data);
                var domains = Object.keys(domainsList).map((key) => domainsList[key].subdomain);
                var loggedIn = [];
                var userDetail = [];
                var promises = [];
                domains.forEach(function(domain, idx, array) {
                    promises.push(makeRequest('POST','https://'+domain+'.rewardseverywhere.co/api/v1/getUserDetail'));
                });                    
                Promise.all(promises).then(function(values) {
                    console.log(values);
                    values.forEach(function(data2) {
                        if(data2 !== '{"status":"unauthorized"}') {    
                            loggedIn.push(JSON.parse(data2).partnerSubdomain);
                            userDetail.push(JSON.parse(data2));
                        }
                    });
                    var latestLogin = Math.max.apply(Math,userDetail.map(function(u){
                        var ainxs = u.lastLogin.indexOf("(");
                        var ainxe = u.lastLogin.indexOf(")");
                        var suba = u.lastLogin.substring(ainxs+1,ainxe-1);
                        suba = Number(suba);            
                        return suba;    
                    }));
                    userDetail.forEach(function(obj) {
                        console.log(obj.lastLogin);
                    });
                    recentSubdomain = userDetail.find(function(u) {
                       return u.lastLogin.includes(latestLogin); 
                    });
                    sendResponse(recentSubdomain);                                               
                });
            })
            // .then(function(data1) {
            //     console.log(data1);            
            // })
            // .catch(function (err) {
            //   console.error('get-user-email error', err.statusText);
            // });        
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
                sendResponse(item);              
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