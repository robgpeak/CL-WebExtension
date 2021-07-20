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
// sites that should be blacklisted from showing offers
var ceaseStack = [];
// sites that are active in showing offers
var activateStack = [];
// url of content page
var path = [];
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // send domain of google result to API to check for potential offers
    if (request.type == "checkDomain") {
        helpfulFunctions.Fetchs.postFetch(request.apiUrl, {
            domainName: request.set
        }, { credentials: 'include' })
            .then(response => response.json()).then(rsp => {
                sendResponse(rsp);
            }).catch(err => {
                console.log(err);
            })
        // for all subdomains, get user email
    } else if (request.type == "get-user-email") {
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
                values.forEach(function (data2) {
                    var data2Parsed = JSON.parse(data2)
                    if (data2Parsed.status !== "unauthorized") {
                        loggedIn.push(data2Parsed.partnerSubdomain);
                        userDetail.push(data2Parsed);
                    }
                });
                var latestLogin = Math.max.apply(Math, userDetail.map(function (u) {
                    var ainxs = u.lastLogin.indexOf("(");
                    var ainxe = u.lastLogin.indexOf(")");
                    var suba = u.lastLogin.substring(ainxs + 1, ainxe - 1);
                    suba = Number(suba);
                    return suba;
                }));
                recentSubdomain = userDetail.find(function (u) {
                    return u.lastLogin.includes(latestLogin);
                });
                sendResponse(recentSubdomain);
            });
        });
    } else if (request.type === "get-domain-cookie") {
        sendResponse({
            cookie: document.cookie
        });
    } else if (request.type === "check-params") {
        if (request.href.includes("rewardseverywhere.co/trip/start")) {
            activateStack.push(1);
        } else if (request.href.includes("aclk")) {
            ceaseStack.push(1);
        } else if (request.href.includes("=") && !request.host.includes("google.com") && !request.referrer.includes("google.com")) {
            ceaseStack.push(1);
        }
    } else if (request.type === "cease-check") {
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
