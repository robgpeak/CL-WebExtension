var subdomain;
var whost = window.location.host;
var href = window.location.href;
var urlFull = getAllUrlParams(href);
var urlParams = Object.keys(urlFull);
var isGoogle = window.location.host.includes('google.com')
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type == 'create-activate-tab') {
            console.log(request);
            var date = new Date;
            var time = date.getTime();
            sessionStorage.setItem('cl_activated_stamp', time);
            sessionStorage.setItem('ebatesCloneShowPopup', 'show');
            if (request.mode === "popup-activate") {
                sessionStorage.setItem('ebatesCloneShowPopupActivated', 'show');
            }
            if (request && request.url) {
                window.location.href = request.url;
            }
            sendResponse({
                type: "activated"
            });
        } else if (request.type == 'activated?') {
            sendResponse({
                type: sessionStorage.getItem('ebatesCloneShowPopupActivated')
            });
        }
    });
var getEmailAddress = function () {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            type: "get-user-email"
        }, function (response) {
            if (response && response.email) {
                subdomain = response.partnerSubdomain;
                //message to bg to save localstorage
                makeRequest(response).then(() => {
                    resolve()
                })
            } else { //logged out, ask for email, look for cookie?
                console.log(response);
                resolve()
            }
        });
    })
};
var makeRequest = function (userDataResponse, domain, element) {
    return new Promise((resolve, reject) => {
        if (domain !== null && typeof domain !== 'undefined') {
            console.log(domain);
            var a = domain.replace('http://', '').replace('https://', '');
            currentDomain = a.substring(0, a.indexOf('/'));
        } else {
            console.log(getLocation(window.location.href).hostname);
            var currentDomain = window.location.host.replace('www.', '');
        }
        var arr = [currentDomain];
        console.log(JSON.stringify({ "domainName": arr }));
        var apiUrl = "https://" + subdomain + ".rewardseverywhere.co/api/v1/checkDomain";

        chrome.runtime.sendMessage({
            type: "checkDomain",
            apiUrl: apiUrl,
            set: arr
        }, function (response) {
            var data = response;
            //if success
            handleSuccess(data[0], userDataResponse, element)
            resolve()
        });
    })
}
var handleSuccess = function (data, userDataResponse) {
    console.log(data);
    // Dont show popup to user if user has already  
    // activated or dismissed the offer earlier
    // console.log(userDataResponse);
    // set activated cookie and timestamp, don't show if passed 1 hour
    if (data.isAdvertiser && data.extensionEnabled) {
        var show = sessionStorage.getItem('ebatesCloneShowPopup');
        var activated = sessionStorage.getItem('ebatesCloneShowPopupActivated');
        var dismissed = sessionStorage.getItem('ebatesCloneShowPopupDismissed');

        if (show == 'show' && activated !== 'show') { //1st time activated and not dismissed, make green
            console.log('a');
            var date = new Date;
            var time = date.getTime();
            var oldStamp = Number(sessionStorage.getItem('cl_activated_stamp'));
            var diff = Math.abs(time - new Date(oldStamp)); //1 hr = 3600000
            if (diff < 3600000) { //show activated if not x'ed
                if (dismissed !== 'show') {
                    console.log('1');
                    if (document.querySelector(".complinks_popup") == null) {
                        document.querySelector("body").prepend(buildPopup(data, userDataResponse));
                        document.querySelector(".complinks_activate_button").innerHTML = data.reward + " Activated!"
                        document.querySelector(".complinks_activate_button").style.backgroundColor = "green"
                        setTimeout(() => {
                            document.querySelector(".complinks_popup").style.opacity = '1'
                            document.querySelector(".complinks_dismiss_container").click()
                            sessionStorage.setItem('ebatesCloneShowPopupActivated', 'show');
                        }, 100);
                    }
                } else {
                    console.log('less than 1 hr and x\'ed out');
                }
            } else if (dismissed === "show") {
                console.log('2-4');
            } else { // timeout, activate again
                console.log('2');
                console.log('complinks timeout');
                if (document.querySelector(".complinks_popup") == null) {
                    document.querySelector("body").prepend(buildPopup(data, userDataResponse));
                    setTimeout(() => {
                        document.querySelector(".complinks_popup").style.opacity = '1'
                    }, 100);
                }
            }
            // show activated flag and check
            // return true;
        } else if (show == "show" && activated == "show") {
            if (diff > 3600000) { //build again
                console.log('3');
                console.log('complinks timeout');
                if (document.querySelector(".complinks_popup") == null) {
                    document.querySelector("body").prepend(buildPopup(data, userDataResponse));
                    setTimeout(() => {
                        document.querySelector(".complinks_popup").style.opacity = '1'
                    }, 100);
                }

            }
        } else if (dismissed === "show") {
            console.log('4');
        } else {
            console.log('5');
            if (document.querySelector(".complinks_popup") == null) {
                document.querySelector("body").prepend(buildPopup(data, userDataResponse));
                setTimeout(() => {
                    document.querySelector(".complinks_popup").style.opacity = '1'
                }, 100);
            }
        }
    }
};
var buildPopup = function (data, userDataResponse) {
    var parentDiv = null
    if (document.querySelector(".complinks_popup") == null) {
        parentDiv = document.createElement("div");
        parentDiv.classList.add("complinks_popup")
        parentDiv.style.opacity = "0"
        if (data.isAdvertiser && data.extensionEnabled) {
            //  ---------------div1-----------------------
            var div1 = document.createElement("div")
            div1.classList.add("complinks_partner_logo")
            div1.style.cssText = `background-color:${userDataResponse.primaryColorCode}; border-color:${userDataResponse.primaryColorCode};`
            var spanInDiv1 = document.createElement("span")
            spanInDiv1.classList.add("helper")
            var imgInDiv1 = document.createElement("img")
            if (window.location.host.includes('berries.com')) {
                imgInDiv1.style.cssText = "height: 80px !important;"
            }
            imgInDiv1.classList.add("complinks_logo")
            imgInDiv1.src = userDataResponse.partnerLogo
            div1.appendChild(spanInDiv1)
            div1.appendChild(imgInDiv1)
            parentDiv.appendChild(div1)
            //  ---------------div2-----------------------
            var div2 = document.createElement("div")
            div2.classList.add("complinks_main_content")
            div2.style.cssText = `border-color:${userDataResponse.primaryColorCode};`
            var span1InDiv2 = document.createElement("span")
            span1InDiv2.classList.add("helper")
            var buttonInDiv2 = document.createElement("button")
            var buttonInDiv2Styles = `${userDataResponse.partnerName == "Foxwoods" ? "color: #000;" : ""}`
            if (window.location.host.includes('godaddy.com') || window.location.host.includes('walgreens.com')) {
                buttonInDiv2Styles += `min-width: 250px; padding: 16px 14px; font-size: 14px !important; padding-top: 16px; background-color:${userDataResponse.buttonColorCode};`;
            } else {
                buttonInDiv2Styles += `min-width: 241px; padding: 16px 20px; font-size: 14px !important; background-color:${userDataResponse.buttonColorCode};`;
            }
            buttonInDiv2.style.cssText = buttonInDiv2Styles
            buttonInDiv2.addEventListener("click", function (e) {
                buttonInDiv2.style.backgroundColor = "green"
                sessionStorage.setItem('ebatesCloneShowPopup', 'show');
                var date = new Date;
                var time = date.getTime();
                sessionStorage.setItem('cl_activated_stamp', time);
                if (data && data.clickUrl) {
                    window.location.href = data.clickUrl;
                }
            })
            buttonInDiv2.classList.add("complinks_activate_button")
            buttonInDiv2.innerHTML = `Click to earn ${data.reward}`
            var span2InDiv2 = document.createElement("span")
            span2InDiv2.classList.add("complinks_dismiss_container")
            var aInSpan2InDiv2 = document.createElement("a")
            aInSpan2InDiv2.innerHTML = "×"
            aInSpan2InDiv2.href = "#"
            span2InDiv2.addEventListener("click", function (e) {
                e.preventDefault()
                sessionStorage.setItem('ebatesCloneShowPopup', 'show');
                document.querySelector(".complinks_popup").style.opacity = "0"
                setTimeout(() => {
                    document.querySelector(".complinks_popup").remove()
                }, 1000);
            })
            div2.appendChild(span1InDiv2)
            div2.appendChild(buttonInDiv2)
            span2InDiv2.appendChild(aInSpan2InDiv2)
            div2.appendChild(span2InDiv2)
            parentDiv.appendChild(div2)
            /*
            <div class="complinks_popup">
                <div class="complinks_partner_logo" style="styles">
                    <span class="helper"></span>
                    <img style="height: 80px !important;" class="complinks_logo" src="logoLink" />
                </div>
                <div class="complinks_main_content" style="styles">
                    <span class="helper"></span>
                    <buttons class="complinks_activate_button" style="styles" >Click to earn {data.reward}</buttons>
                    <span class="complinks_dismiss_container">
                        <a href="#" class="complinks_dismiss_button">×</a>
                    </span>
                </div>
            </div>
            */
        }
    }
    return parentDiv;

};
var handleError = function (data, userDataResponse) {
    console.log("API call failed", data);
};
/**
 * show popup after getting data from API
 */
var handleGoogleSuccess = function (data, userData, element) {
    if (data.isAdvertiser && data.extensionEnabled) {
        $(element).before("<div style=\"margin-bottom: -30px;padding-top: 20px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\"" + userData.searchResultLogoUrl + "\"></img>" + "<a class=\"btn btn-primary activate-btn google-activate\" href=\"" + $(element).attr('href') + "\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:#FF3D02; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: #ffffff; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Click to earn " + data.reward + "</a></div>");
    }
};

var makeGoogleRequest = function (userDataResponse, elems) {

    var apiUrl = "https://" + userDataResponse.partnerSubdomain + ".rewardseverywhere.co/api/v1/checkDomain";
    elems = elems.filter(function (item) {
        if (item !== undefined && item.getAttribute('href') !== null) {
            var a = item.getAttribute('href').replace('http://', '').replace('https://', '');
            var ret = a.substring(0, a.indexOf('/'));
            if (ret !== null || ret !== "") {
                return true;
            }
        }
    });
    var res2 = elems.map(function (item) {
        var a = item.getAttribute('href').replace('http://', '').replace('https://', '');
        return a.substring(0, a.indexOf('/'));
    });
    var set = [...new Set(res2)];
    console.log('sending checkDomain to bg');
    //send message to run ajax from bg script
    chrome.runtime.sendMessage({
        type: "checkDomain",
        apiUrl: apiUrl,
        set: set
    }, function (response) {
        var data = response;
        Object.keys(res2).forEach(function (key, index) { //for each in long list
            //find position in set to check if valid
            var idx = set.findIndex(function (item) {
                return item === res2[key];
            });
            if (data[idx] !== undefined && data[idx].isAdvertiser && data[idx].extensionEnabled) {
                var buttonHTML = "";
                var p = userDataResponse.partnerName;
                if (p === "Foxwoods") {
                    buttonHTML = "<div style=\"margin-bottom: -30px; padding-top: 20px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\"" + userDataResponse.searchResultLogoUrl + "\"></img>" + "<a class=\"btn btn-primary activate-btn google-activate\" href=\"" + elems[index].getAttribute('href') + "\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:" + userDataResponse.buttonColorCode + "; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: " + userDataResponse.buttonColorCode + "; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Click to earn " + data[idx].reward + "</a></div>";
                } else {
                    buttonHTML = "<div style=\"margin-bottom: -30px; padding-top: 20px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\"" + userDataResponse.searchResultLogoUrl + "\"></img>" + "<a class=\"btn btn-primary activate-btn google-activate\" href=\"" + elems[index].getAttribute('href') + "\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:" + userDataResponse.buttonColorCode + "; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: #ffffff; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Click to earn " + data[idx].reward + "</a></div>";
                }
                elems[index].outerHTML = buttonHTML + elems[index].outerHTML
            }
        });
    });
}
var aElements = document.querySelectorAll("a")
for (let i = 0; i < aElements.length; i++) {
    var aElement = aElements[i];
    aElement.addEventListener("click", function (e) {
        var href = e.target.href;
        var urlFull = getAllUrlParams(href);
        chrome.runtime.sendMessage({
            type: "check-params",
            data: urlFull,
            host: whost,
            mode: 'click',
            href: href,
            referrer: ""
        });
    })
}
console.log(href);
console.log(urlFull);
console.log(urlParams);
chrome.runtime.sendMessage({
    type: "check-params",
    data: urlFull,
    host: window.location.host,
    mode: 'refresh',
    href: window.location.href,
    referrer: document.referrer
}, function (response) {
    if (response !== undefined && response.msg === "cease") {
        console.log('ceased');
        sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show');
    }

});
getEmailAddress().then(() => {
    // var elems = document.querySelectorAll('.g .rc >div > a:not(.l)');
    var elems = document.querySelectorAll("#search > div > div > div > div > div > div > a")
    var array = []
    for (let i in elems) {
        if (typeof elems[i] == "object")
            array.push(elems[i])
    }
    elems = array
    console.log(elems.length);
    if (elems.length > 0) {
        // console.log('1');
        // var res = Array.from(elems).map(function(el) {
        //     console.log(el);
        //     if(el.querySelector("a") !== null && el.querySelector("a").getAttribute('href') !== undefined)
        //         return el.querySelector("a").getAttribute('href');
        // });
        chrome.runtime.sendMessage({
            type: "get-user-email"
        }, function (response2) {
            console.log('got response from get-user-email');
            console.log(response2);
            if (response2 && response2.email) {
                subdomain = response2.partnerSubdomain;
                makeGoogleRequest(response2, elems);
                chrome.storage.local.set({ userData: JSON.stringify(response) });

            } else {
                console.log('logged out');
            }
        });
    } else if (!isGoogle) {
        console.log('2');
        //set cease from redirect page or cease if in previous link
        console.log('2.a');
        chrome.runtime.sendMessage({
            type: "cease-check",
            host: window.location.host
        }, function (response) {
            console.log(response.msg);
            if (response.msg === "cease") {
                sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show');
            } else if (response.msg === "activated") {
                var date = new Date;
                var time = date.getTime();
                sessionStorage.setItem('cl_activated_stamp', time);
                sessionStorage.setItem('ebatesCloneShowPopup', 'show');
                // sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show');  
                // sessionStorage.setItem('ebatesCloneShowPopupActivated', 'show');   
                getEmailAddress();
            } else {
                getEmailAddress();
            }
        });

        // makeRequest(callbacks);

    }
})


function getLocation(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}


function getAllUrlParams() {
    var match,
        pl = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query = window.location.search.substring(1);

    var urlParams = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
    return urlParams;
};


