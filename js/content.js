/**
 * Create html to show popup on bottom of page
 * Please see its css in content.css file
 */
var buildPopup = function(data, userDataResponse) {
    var partnerStyle = JSON.parse(userDataResponse.partnerStyle);
    var primaryName = partnerStyle.primary.name.replace('-','').toLowerCase();
    var primaryHex = primaryName.concat(partnerStyle.primary.main);
    var accentName = partnerStyle.accent.name.replace('-','').toLowerCase();
    var accentHex = accentName.concat(partnerStyle.accent.main);

    var html = '';
    if (data.isAdvertiser && data.extensionEnabled) {
        html += '<div class="complinks_popup">';
        html += '<div class="complinks_partner_logo" style="background-color: '+eval(primaryHex)+'; border-color: '+eval(primaryHex)+';">';
        if(window.location.host.includes('berries.com')) {
            html += '<img style="height: 80px !important;" class="complinks_logo" src="'+userDataResponse.partnerLogo+'" />';
        } else {
            html += '<img class="complinks_logo" src="'+userDataResponse.partnerLogo+'" />';    
        }
        html += '</div>';
        html += '<div class="complinks_main_content" style="border-color: '+eval(primaryHex)+';">';
        if(window.location.host.includes('godaddy.com')) {
            html += '<buttons class="complinks_activate_button" style="font-size: 11px; padding-top: 16px; background-color: '+eval(accentHex)+';" >Click here to earn ' + data.reward + '</buttons>';
        } else {
            html += '<buttons class="complinks_activate_button" style="background-color: '+eval(accentHex)+';" >Click here to earn ' + data.reward + '</buttons>';
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
        // we will use this session variable to 
        // check either to show the popup on page refresh
        // or not
        $(".complinks_activate_button").css({
            'background-color': 'green'
        });         
        sessionStorage.setItem('ebatesCloneShowPopup', 'show');
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
        // we will use this session variable to 
        // check either to show the popup on page refresh
        // or not
        sessionStorage.setItem('ebatesCloneShowPopup', 'show');
        $('.complinks_popup').hide();
    });
};

/**
 * show popup after getting data from API
 */
var handleSuccess = function(data, userDataResponse) {
    //Dont show popup to user if user has already  
    //activated or dismissed the offer earlier
    // console.log(userDataResponse);
    // set activated cookie and timestamp, don't show if passed 1 hour
    var date = new Date;
    var time = date.getTime();
    var oldStamp = Number(sessionStorage.getItem('cl_activated_stamp'));
    var diff = Math.abs(time - new Date(oldStamp)); //1 hr = 3600000

    sessionStorage.setItem('cl_activated_stamp', time);

    if(data.isAdvertiser && data.extensionEnabled) {
        var show = sessionStorage.getItem('ebatesCloneShowPopup');
        var activated = sessionStorage.getItem('ebatesCloneShowPopupActivated');
        var dismissed = sessionStorage.getItem('ebatesCloneShowPopupDismissed'); 

        if (show == 'show' && activated !== 'show') { //1st time activated and not dismissed, make green
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
        $(element).before("<div style=\"margin-bottom: 0px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\""+userData.searchResultLogoUrl+"\"></img>"+"<a class=\"btn btn-primary activate-btn google-activate\" href=\""+$(element).attr('href')+"\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:#FF3D02; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: #ffffff; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Activate " + data.reward + "</a></div>");
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
    var apiUrl = "https://"+userDataResponse.partnerSubdomain+".complinks.co/api/v1/checkDomain";
    console.log(res);
    var res2 = res.map(function(item) {
        var a = item.replace('http://', '').replace('https://', '');
        return a.substring(0, a.indexOf('/'));
    });
    var set = [...new Set(res2)];
    $.post({
        url: apiUrl,
        type: "POST",
        data: JSON.stringify({"domainName":set}),
        contentType:"application/json",
        dataType:"json"
    })
    .done(function(data) {
        console.log(data);
        console.log(elems);
        console.log(set);
        Object.keys(res2).forEach(function(key, index) { //for each in long list
            //find position in set to check if valid
            var idx = set.findIndex(function(item) {
                return item === res2[key];
            });
            if(data[idx].isAdvertiser && data[idx].extensionEnabled) {
                $(elems[index]).before("<div style=\"margin-bottom: 0px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\""+userDataResponse.searchResultLogoUrl+"\"></img>"+"<a class=\"btn btn-primary activate-btn google-activate\" href=\""+elems[index].getAttribute('href')+"\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:#FF3D02; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: #ffffff; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Activate " + data[idx].reward + "</a></div>");
            }
        });
    })
    .fail(function(data) {
        console.log(data);
        Object.keys(data).forEach(function(key, index) {
            callbacks.error(data[index], userDataResponse);
        });
    });
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
    var apiUrl = "https://"+subdomain+".complinks.co/api/v1/checkDomain";
    $.post({
        url: apiUrl,
        type: "POST",
        data: JSON.stringify({"domainName":arr}),
        contentType:"application/json",
        dataType:"json"
    })
    .done(function(data) {
        console.log(data[0]);
        callbacks.success(data[0], userDataResponse, element);
    })
    .fail(function(data) {
        console.log(data[0]);
        callbacks.error(data[0], userDataResponse);
    });
}

var subdomain;
$(function() {
    callbacks['success'] = handleGoogleSuccess;//overwrite google page callback here
    var elems = document.querySelectorAll('.g h3.r > a:not(.l)');
    console.log(typeof elems.length);
    if(elems.length > 0) {
        console.log('1');
        var res = Array.from(elems).map(function(el) {
            console.log(el);
            return el.getAttribute('href');
        });
        chrome.runtime.sendMessage({
            type: "get-user-data"
        }, function(response) {
            if(Object.keys(response).length === 0 && response.constructor === Object) {
                chrome.runtime.sendMessage({
                        type: "get-user-email"
                    }, function(response) {
                        console.log(response);
                        if (response && response.email) {
                            //map full array indices to unique array, pass into req function
                            subdomain = response.partnerSubdomain;
                            makeGoogleRequest(JSON.parse(response.userData), callbacks, res, elems);                         
                            chrome.runtime.sendMessage({
                                type: "save-user-data",
                                data: response
                            }, function(response) {
                                
                            });                 
                        } else {
                            console.log('logged out');
                        }
                });                
            } else {
                makeGoogleRequest(JSON.parse(response.userData), callbacks, res, elems);             
            }
        });
    } else if(!window.location.host.includes('google.com')) {
        console.log('2');
        callbacks['success'] = handleSuccess;
        getEmailAddress();
        // makeRequest(callbacks);
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                if (request.type == 'create-activate-tab') {
                    console.log(request);
                    sessionStorage.setItem('ebatesCloneShowPopup', 'show');
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
                } else if (request.type == 'set-activated-from-bg') {
                    // var date = new Date;                
                    // var time = date.getTime();           
                    // sessionStorage.setItem('cl_activated_stamp', time); 
                    // setTimeout(function() {
                    //     $('.complinks_activate_button').html("Activated!");    
                    //     $(".complinks_activate_button").css({
                    //         'background-color': 'green'
                    //     });       
                    //     $(".complinks_popup").fadeTo(2000, 500).slideUp(500, function() {
                    //         $(".complinks_popup").slideUp(2000);
                    //     }); 
                    //     sessionStorage.setItem('ebatesCloneShowPopupActivated', 'show'); 
                    //     sessionStorage.setItem('ebatesCloneShowPopupDismissed', 'show');                     
                    // }, 1000);
                } else if (request.type == 'redirect') {
                    window.location.href = request.data;
                }
            });
    }
});