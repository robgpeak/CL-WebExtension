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
        html += '<img class="complinks_logo" src="'+userDataResponse.partnerLogo+'" />';
        html += '</div>';
        html += '<div class="complinks_main_content" style="border-color: '+eval(primaryHex)+';">';
        html += '<button class="complinks_activate_button" style="background-color: '+eval(accentHex)+';" >Click here to earn ' + data.reward + '</button>';
        html += '<p class="complinks_dismiss_container">';
        html += '<a href="#" class="complinks_dismiss_button">×</a>';
        html += '</p>';
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
    //Dont show popup to user if user has already  
    //activated or dismissed the offer earlier

    //check response for disallowed domain
    if(data.isAdvertiser && data.extensionEnabled) {
        console.log(data);
        console.log(element);
        console.log(userData);
        $(element).before("<div style=\"margin-bottom: 0px;\"><img class=\"searchResultDeal\" style=\"height: 25px; display: inline-block; margin-bottom:-5px;\" src=\""+userData.searchResultLogoUrl+"\"></img>"+"<a class=\"btn btn-primary activate-btn google-activate\" href=\""+$(element).attr('href')+"\"style=\"margin-bottom: 5px !important; margin-left: 15px; padding: 10px 15px; background-color:#FF3D02; border-color: #FF3D02; border-radius: 0px !important; border-width: 2px; color: #ffffff; display: inline-block; margin-bottom: 0; font-weight: normal; text-align: center; vertical-align: middle; -ms-touch-action: manipulation; touch-action: manipulation; cursor: pointer; background-image: none; white-space: nowrap; padding: 10px 15px; font-size: 12px; line-height: 1;\">Activate " + data.reward + "</a></div>");
        //send message to background -> activate cookies after redirect.  
    }
    // console.log(element);
    // console.log(data);

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
            if(window.location.host.includes('google.com')) { //if on google search page
                callbacks['success'] = handleGoogleSuccess;//overwrite google page callback here
                $('.g h3.r > a:not(table a)').each(function() { //make icon for each valid result 
                    var domain = $(this).attr('href');
                    makeRequest(response, callbacks, domain, this); 
                })
            } else { //proceed as normal
                subdomain = response.partnerSubdomain;
                console.log(subdomain);
                makeRequest(response, callbacks);        
            }
        } else { //logged out, ask for email, look for cookie?
            console.log(response);
        }
    });
};

/**
 * Send POST request to get
 */
var makeRequest = function(userDataResponse, callbacks, domain, element) {
    if(domain!==null && typeof domain !== 'undefined') {
        var a = domain.replace('www.', '').replace('http://.', '').replace('https://', '');
        currentDomain = a.substring(0, a.indexOf('.com') + 4);
        console.log(currentDomain);
    } else {
        var currentDomain = window.location.host.replace('www.', '');    
    }
    var apiUrl = "https://"+subdomain+".complinks.co/api/v1/checkDomain";
    $.post(apiUrl, {
            "domainName": currentDomain
        })
        .done(function(data) {
            // console.log(data);
            callbacks.success(data, userDataResponse, element);
        })
        .fail(function(data) {
            // console.log(data);
            callbacks.error(data, userDataResponse);
        });
}

function getDomainCookie() {
    // console.log(document.cookie);
    // chrome.runtime.sendMessage({
    //     type: "get-domain-cookie"
    // }, function(response) {
    //     console.log(response);
    // });
}

var subdomain;
$(function() {
    getDomainCookie();
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
                })
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
            }
        });
});