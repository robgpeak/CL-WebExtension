/**
 * Create html to show popup on bottom of page
 * Please see its css in content.css file
 */
var buildPopup = function(data, userDataResponse) {
    // var partnerStyle = JSON.parse(userDataResponse.partnerStyle);
    // var primaryName = partnerStyle.primary.name.replace('-','').toLowerCase();
    // var primaryHex = primaryName.concat(partnerStyle.primary.main);
    // var accentName = partnerStyle.accent.name.replace('-','').toLowerCase();
    // var accentHex = accentName.concat(partnerStyle.accent.main);

    // console.log(userDataResponse.primaryColorCode);
    // console.log(userDataResponse.secondaryColorCode);
    // console.log(userDataResponse.buttonColorCode);

    var html = '';
    if (data.isAdvertiser && data.extensionEnabled) {
        html += '<div class="complinks_popup">';
        html += '<div class="complinks_partner_logo" style="background-color: '+userDataResponse.primaryColorCode+'; border-color: '+userDataResponse.primaryColorCode+';"><span class="helper"></span>';
        if(window.location.host.includes('berries.com')) {
            html += '<img style="height: 80px !important;" class="complinks_logo" src="'+userDataResponse.partnerLogo+'" />';
        } else {
            html += '<img class="complinks_logo" src="'+userDataResponse.partnerLogo+'" />';    
        }
        html += '</div>';
        html += '<div class="complinks_main_content" style="border-color: '+userDataResponse.primaryColorCode+';"><span class="helper"></span>';
        var p = userDataResponse.partnerName;
        if(p === "Foxwoods") {
            if(window.location.host.includes('godaddy.com') || window.location.host.includes('walgreens.com') ) {
                html += '<buttons class="complinks_activate_button" style="min-width: 250px; padding: 16px 14px; font-size: 14px !important; padding-top: 16px; color: #000; background-color: '+userDataResponse.secondaryColorCode+';" >Click to earn ' + data.reward + '</buttons>';
            } else {
                html += '<buttons class="complinks_activate_button" style="min-width: 241px; padding: 16px 20px; font-size: 14px !important; color: #000; background-color: '+userDataResponse.secondaryColorCode+';" >Click to earn ' + data.reward + '</buttons>';
            }
        } else {
            if(window.location.host.includes('godaddy.com') || window.location.host.includes('walgreens.com') ) {
                html += '<buttons class="complinks_activate_button" style="min-width: 250px; padding: 16px 14px; font-size: 14px !important; padding-top: 16px; background-color: '+userDataResponse.secondaryColorCode+';" >Click to earn ' + data.reward + '</buttons>';
            } else {
                html += '<buttons class="complinks_activate_button" style="min-width: 241px; padding: 16px 20px; font-size: 14px !important; background-color: '+userDataResponse.secondaryColorCode+';" >Click to earn ' + data.reward + '</buttons>';
            }
        }
        html += '<span class="complinks_dismiss_container">';
        html += '<a href="#" class="complinks_dismiss_button">×</a>';
        html += '</span>';
        html += '</div>';
        html += '</div>';
    }

    return html;
};

$(document).on('click','.complinks_dismiss_button',function(e) {
    sessionStorage.setItem('ebatesCloneShowPopup', 'show'); 
    sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show'); 
})
/**
 * Handle activate button click
 */
var bindActivateEvent = function(data) {
    $('.complinks_activate_button').click(function() {
        $(".complinks_activate_button").css({
            'background-color': 'green'
        });         
        sessionStorage.setItem('ebatesCloneShowPopup', 'show');
        var date = new Date;
        var time = date.getTime();
        sessionStorage.setItem('cl_activated_stamp', time);
        if (data && data.clickUrl) {
            window.location.href = data.clickUrl;
        }
    });
};


/**
 * Handle activate later button click
 */
var bindActivateLaterEvent = function() {
    $('.complinks_dismiss_button').click(function() {
        sessionStorage.setItem('ebatesCloneShowPopup', 'show');
        $('.complinks_popup').hide();
    });
};

/**
 * show popup after getting data from API
 */
var handleSuccess = function(data, userDataResponse) {
    console.log(data);
    // Dont show popup to user if user has already  
    // activated or dismissed the offer earlier
    // console.log(userDataResponse);
    // set activated cookie and timestamp, don't show if passed 1 hour
    if(data.isAdvertiser && data.extensionEnabled) {
        var show = sessionStorage.getItem('ebatesCloneShowPopup');
        var activated = sessionStorage.getItem('ebatesCloneShowPopupActivated');
        var dismissed = sessionStorage.getItem('ebatesCloneShowPopupDismissed'); 

        if (show == 'show' && activated !== 'show') { //1st time activated and not dismissed, make green
            console.log('a');
            var date = new Date;
            var time = date.getTime();
            var oldStamp = Number(sessionStorage.getItem('cl_activated_stamp'));
            var diff = Math.abs(time - new Date(oldStamp)); //1 hr = 3600000
            if(diff < 3600000) { //show activated if not x'ed
                if(dismissed !== 'show') {
                    console.log('1');
                    $('body').prepend(buildPopup(data, userDataResponse));
                    $(".complinks_popup").show("slow", function() {
                        bindActivateEvent(data);
                        bindActivateLaterEvent();
                    });    
                    $('.complinks_activate_button').html(data.reward+" Activated!");
                    $(".complinks_activate_button").css({
                        'background-color': 'green'
                    });       
                    $(".complinks_popup").fadeTo(2000, 500).slideUp(500, function() {
                        $(".complinks_popup").slideUp(2000);
                    }); 
                    if(dismissed !== 'show') {    
                        sessionStorage.setItem('ebatesCloneShowPopupActivated', 'show');
                    }
                } else {
                    console.log('less than 1 hr and x\'ed out');
                }
            } else if (dismissed === "show") {
                console.log('2-4');
            } else { // timeout, activate again
                console.log('2');
                console.log('complinks timeout');
                $('body').prepend(buildPopup(data, userDataResponse));
                $(".complinks_popup").show("slow", function() {
                    bindActivateEvent(data);
                    bindActivateLaterEvent();
                });    
            }
            // show activated flag and check
            // return true;
        } else if(show == "show" && activated == "show") { 
            if(diff > 3600000) { //build again
                console.log('3');
                console.log('complinks timeout');
                $('body').prepend(buildPopup(data, userDataResponse));
                $(".complinks_popup").show("slow", function() {
                    bindActivateEvent(data);
                    bindActivateLaterEvent();
                });  
            }
        } else if(dismissed === "show") {
            console.log('4');
        } else {
            console.log('5');
            $('body').prepend(buildPopup(data, userDataResponse));
            $(".complinks_popup").show("slow", function() {
                bindActivateEvent(data);
                bindActivateLaterEvent();
            });
        }
    }
};

/**
 * show popup after getting data from API
 */
var handleGoogleSuccess = function(data, userData, element) {
    if(data.isAdvertiser && data.extensionEnabled) {
        $(element).before("<div style=\"margin-bottom: 0px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\""+userData.searchResultLogoUrl+"\"></img>"+"<a class=\"btn btn-primary activate-btn google-activate\" href=\""+$(element).attr('href')+"\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:#FF3D02; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: #ffffff; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Click to earn " + data.reward + "</a></div>");
    }
};

// $(document).on('click', function() {
//     chrome.runtime.sendMessage({
//         type: "set-activated-from-google"
//     }, function(response) {
//         //catch elsewhere
//     });          
// });

/**
 * handle if error occurs in API call
 */
var handleError = function(data, userDataResponse) {
    console.log("API call failed", data);
};

var callbacks = {
    success: handleSuccess,
    error: handleError
};

/**
 * Get user email address from local storage
 */
var getEmailAddress = function() {
    chrome.runtime.sendMessage({
        type: "get-user-email"
    }, function(response) {
        if (response && response.email) {
            subdomain = response.partnerSubdomain;
            //message to bg to save localstorage
            makeRequest(response, callbacks);   
            chrome.runtime.sendMessage({
                type: "save-user-data",
                data: response
            }, function(response) {
                
            });                 
        } else { //logged out, ask for email, look for cookie?
            console.log(response);
        }
    });
};


/**
 * Send POST request to get
 */
var makeGoogleRequest = function(userDataResponse, callbacks, res, elems) {
    
    // var partnerStyle = JSON.parse(userDataResponse.partnerStyle);
    // var primaryName = partnerStyle.primary.name.replace('-','').toLowerCase();
    // var primaryHex = primaryName.concat(partnerStyle.primary.main);
    // var accentName = partnerStyle.accent.name.replace('-','').toLowerCase();
    // var accentHex = accentName.concat(partnerStyle.accent.main);

    // console.log(userDataResponse.primaryColorCode);
    // console.log(userDataResponse.secondaryColorCode);
    // console.log(userDataResponse.buttonColorCode);

    var apiUrl = "https://"+userDataResponse.partnerSubdomain+".rewardseverywhere.co/api/v1/checkDomain";
    var res2 = res.map(function(item) {
        var a = item.replace('http://', '').replace('https://', '');
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
        Object.keys(res2).forEach(function(key, index) { //for each in long list
            //find position in set to check if valid
            var idx = set.findIndex(function(item) {
                return item === res2[key];
            });
            if(data[idx].isAdvertiser && data[idx].extensionEnabled) {
                var buttonHTML = "";
                var p = userDataResponse.partnerName;
                if(p === "Foxwoods") {
                    buttonHTML = "<div style=\"margin-bottom: 0px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\""+userDataResponse.searchResultLogoUrl+"\"></img>"+"<a class=\"btn btn-primary activate-btn google-activate\" href=\""+elems[index].getAttribute('href')+"\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:"+userDataResponse.secondaryColorCode+"; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: "+userDataResponse.primaryColorCode+"; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Click to earn " + data[idx].reward + "</a></div>";
                } else {
                    buttonHTML = "<div style=\"margin-bottom: 0px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\""+userDataResponse.searchResultLogoUrl+"\"></img>"+"<a class=\"btn btn-primary activate-btn google-activate\" href=\""+elems[index].getAttribute('href')+"\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:"+userDataResponse.secondaryColorCode+"; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: #ffffff; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Click to earn " + data[idx].reward + "</a></div>";
                }
                $(elems[index]).before(buttonHTML);
            }
        });
    });
    //callback 
}


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

/**
 * Send POST request to get
 */
var makeRequest = function(userDataResponse, callbacks, domain, element) {
    if(domain!==null && typeof domain !== 'undefined') {
        console.log(domain);
        var a = domain.replace('http://', '').replace('https://', '');
        currentDomain = a.substring(0, a.indexOf('/'));
    } else {
        console.log(getLocation(window.location.href).hostname);
        var currentDomain = window.location.host.replace('www.', '');    
    }
    var arr = [currentDomain];
    console.log(JSON.stringify({"domainName":arr}));
    var apiUrl = "https://"+subdomain+".rewardseverywhere.co/api/v1/checkDomain";
    
    chrome.runtime.sendMessage({
        type: "checkDomain",
        apiUrl: apiUrl,
        set: arr
    }, function (response) {
        var data = response;                
        //if success
        callbacks.success(data[0], userDataResponse, element);
    });
}
function getAllUrlParams() {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    var urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
    return urlParams;
};

var subdomain;
$(function() {
    var whost = window.location.host;
    $(document).on('click','a',function(e) {
        var href = $(this).attr('href');
        var urlFull = getAllUrlParams(href);
        var urlParams = Object.keys(urlFull);
        chrome.runtime.sendMessage({
            type: "check-params",
            data: urlFull,
            host: whost,
            mode: 'click',
            href: href,
            referrer: ""
        }, function () {   });
    });    
    var href = window.location.href;
    var urlFull = getAllUrlParams(href);
    var urlParams = Object.keys(urlFull);
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
        if(response !== undefined && response.msg === "cease") {
            console.log('ceased');
            sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show');  
        }
    });
    // chrome.runtime.sendMessage({
    //     type: "path-check",
    //     data: href
    // }, function (response) { 
    //     console.log('path-check destination');
    //     console.log(response);
    //     if(!window.location.host.includes("complinks.co") && response.msg === "trip-activated") {
            // var date = new Date;
            // var time = date.getTime();
            // sessionStorage.setItem('cl_activated_stamp', time);
            // sessionStorage.setItem('ebatesCloneShowPopup', 'show');
    //         sessionStorage.setItem('ebatesCloneShowPopupActivated', 'show');        
    //         sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show');  
    //     }
    // });    

    getEmailAddress();  
    callbacks['success'] = handleGoogleSuccess;//overwrite google page callback here
    var elems = document.querySelectorAll('.g .r > a:not(.l)');
    console.log(elems.length);
    if(elems.length > 0) {
        // console.log('1');
        var res = Array.from(elems).map(function(el) {
            console.log(el);
            return el.getAttribute('href');
        });
        chrome.runtime.sendMessage({
                type: "get-user-email"
            }, function(response2) {
                console.log('got response from get-user-email');
                console.log(response2);
                if (response2 && response2.email) {
                    subdomain = response2.partnerSubdomain;                     
                    makeGoogleRequest(response2, callbacks, res, elems);  
                    chrome.runtime.sendMessage({
                        type: "save-user-data",
                        data: response2
                    }, function(response3) {});                 
                } else {
                    console.log('logged out');
                }
        });
    } else if(!window.location.host.includes('google.com')) {
        console.log('2');
        //set cease from redirect page or cease if in previous link
        console.log('2.a');
        chrome.runtime.sendMessage({
            type: "cease-check",
            host: window.location.host
        }, function(response) {
            console.log(response.msg);
            if(response.msg === "cease") {
                sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show');  
            } else if (response.msg === "activated") {
                var date = new Date;
                var time = date.getTime();
                sessionStorage.setItem('cl_activated_stamp', time);
                sessionStorage.setItem('ebatesCloneShowPopup', 'show');                
                // sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show');  
                // sessionStorage.setItem('ebatesCloneShowPopupActivated', 'show');   
                callbacks['success'] = handleSuccess;
                getEmailAddress();
            } else {
                callbacks['success'] = handleSuccess;
                getEmailAddress();
            }
        });

        // makeRequest(callbacks);
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                if (request.type == 'create-activate-tab') {
                    console.log(request);
                    var date = new Date;
                    var time = date.getTime();
                    sessionStorage.setItem('cl_activated_stamp', time);
                    sessionStorage.setItem('ebatesCloneShowPopup', 'show');
                    if(request.mode === "popup-activate") {
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
    }
});