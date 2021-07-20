// Background page, persistent running script


// helper method for any xhr request
function makeRequest(method, url) {
    //Promises return deferred object state: pending; resolved; rejected
    //Chainable processes with .then()
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

// Data structures for ad state outside of content page
// sites that should be blacklisted from showing offers
var ceaseStack = [];
// sites that are active in showing offers
var activateStack = [];
// url of content page
var path = [];


//Background page message handler
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // send domain of google result to API to check for potential offers
    if (request.type == "checkDomain") {
        helpfulFunctions.Fetchs.postFetch(request.apiUrl, {}, { credentials: 'include' })
            .then(response => response.json())
            .then((data) => {
                sendResponse(data);
            }).catch(data => {
                console.log(data);
            })
        // for all subdomains, get user email
    } else if (request.type == "get-user-email") {
        var email = localStorage.getItem('userEmailAddress');
        var lastSubDomain = results.lastSubDomain || null
        makeRequest('GET', 'https://shop.rewardseverywhere.co/api/v1/getSubdomains').then(function (data) {
            var domainsList = JSON.parse(data);
            var domains = Object.keys(domainsList).map((key) => domainsList[key].subdomain);
            var loggedIn = [];
            var userDetail = [];
            var promises = [];
            domains.forEach(function (domain, idx, array) {
                promises.push(makeRequest('POST', 'https://' + domain + '.rewardseverywhere.co/api/v1/getUserDetail'));
            });
            Promise.all(promises).then(function (values) {
                console.log(values);
                values.forEach(function (data2) {
                    if (data2 !== '{"status":"unauthorized"}') {
                        loggedIn.push(JSON.parse(data2).partnerSubdomain);
                        userDetail.push(JSON.parse(data2));
                    }
                });
                var latestLogin = Math.max.apply(Math, userDetail.map(function (u) {
                    var ainxs = u.lastLogin.indexOf("(");
                    var ainxe = u.lastLogin.indexOf(")");
                    var suba = u.lastLogin.substring(ainxs + 1, ainxe - 1);
                    suba = Number(suba);
                    return suba;
                }));
                userDetail.forEach(function (obj) {
                    console.log(obj.lastLogin);
                });
                recentSubdomain = userDetail.find(function (u) {
                    return u.lastLogin.includes(latestLogin);
                });
                chrome.storage.local.set({ lastSubDomain: recentSubdomain.partnerSubdomain }, function () {
                    sendResponse(recentSubdomain);
                })
            });
        });
    } else if (request.type === "get-domain-cookie") {
        sendResponse({
            cookie: document.cookie
        });
    } else if (request.type === "set-activated-from-google") {
    } else if (request.type === "save-user-data") {
        var store = {};
        store['userData'] = JSON.stringify(request.data);
        chrome.storage.local.set(store);
    } else if (request.type === "get-user-data") {
        console.log('get user data called');
        chrome.storage.local.get('userData', function (item) {
            console.log(item);
            sendResponse(item);
        });

    } else if (request.type === "check-params") {
        console.log('check-params top');
        console.log(request);
        console.log(request.host);
        console.log(request.mode);
        var keys = Object.keys(request.data);

        if (request.href.includes("rewardseverywhere.co/trip/start")) {
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
        console.log(request.host);
        if (activateStack.length > 0 && !request.host.includes("rewardseverywhere.co")) {
            activateStack = [];
            sendResponse({
                msg: "activated"
            });
        } else if (ceaseStack.length > 0) {
            sendResponse({
                msg: "cease"
            });
        } else {
            sendResponse({
                msg: "continue"
            });
        }
        setTimeout(function () {
            ceaseStack = [];
        }, 10000);
    } else if (request.type === "clear-cease") {
        ceaseStack = [];
    }
    return true;
});
