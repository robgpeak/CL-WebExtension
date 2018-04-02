/**
 * Create html to show popup on bottom of page
 * Please see its css in content.css file
 */
var buildPopup = function(data, userDataResponse) {
    // console.log(data);
    console.log(userDataResponse.partnerStyle);
    var partnerStyle = JSON.parse(userDataResponse.partnerStyle);

    var primaryName = partnerStyle.primary.name.replace('-','').toLowerCase();

    var primaryHex = primaryName.concat(partnerStyle.primary.main);
    console.log(eval(primaryHex));
    var accentName = partnerStyle.accent.name.replace('-','').toLowerCase();
    var accentHex = accentName.concat(partnerStyle.accent.main);
    console.log(accentHex);

    console.log(eval(accentHex));
    var html = '';
    if (data.isAdvertiser && data.extensionEnabled) {
        html += '<div class="complinks_popup">';
        html += '<div class="complinks_partner_logo" style="background-color: '+eval(primaryHex)+'; border-color: '+eval(primaryHex)+';">';
        html += '<img class="complinks_logo" src="'+userDataResponse.partnerLogo+'" />';
        html += '</div>';
        html += '<div class="complinks_main_content" style="border-color: '+eval(primaryHex)+';">';
        html += '<button class="complinks_activate_button" style="background-color: '+eval(accentHex)+';" >Click here to earn ' + data.reward + '</button>';
        html += '<p class="complinks_dismiss_container">';
        html += '<a href="#" class="complinks_dismiss_button">No thanks, maybe next time</a>';
        html += '</p>';
        html += '</div>';
        html += '</div>';
    }
    return html;
};

/**
 * Handle activate button click
 */
var bindActivateEvent = function(data) {
    $('.complinks_activate_button').click(function() {
        // we will use this session variable to 
        // check either to show the popup on page refresh
        // or not
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
    if(data.isAdvertiser && data.extensionEnabled) {
        var show = sessionStorage.getItem('ebatesCloneShowPopup');
        if (show == 'show') {
            return true;
        } else {
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
var handleGoogleSuccess = function(data, element) {
    //Dont show popup to user if user has already  
    //activated or dismissed the offer earlier

    //check response for disallowed domain
    if(data.isAdvertiser && data.extensionEnabled) {
        $(element).css({'color': 'red'});    
    }
    // console.log(element);
    // console.log(data);

};

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
                $('.g h3.r > a').each(function() { //make icon for each valid result 
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
            console.log(data);
            callbacks.success(data, userDataResponse);
        })
        .fail(function(data) {
            console.log(data);
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
                sessionStorage.setItem('ebatesCloneShowPopup', 'show');
                if (request && request.url) {
                    window.location.href = request.url;
                }
                sendResponse({
                    type: "activated"
                });

            }
        });
});