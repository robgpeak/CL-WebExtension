/**
 * Create html to show popup on bottom of page
 * Please see its css in content.css file
 */
var buildPopup = function(data) {
    var html = '';
    if (data.isAdvertiser) {
		html += '<div class="complinks_popup">';
		html += '<div class="complinks_partner_logo">';
		html += '<img class="complinks_logo" src="https://shop.complinks.co/Images/extension/logo.png" />';
		html += '</div>';
		html += '<div class="complinks_main_content">';
		html += '<button class="complinks_activate_button">Click here to earn ' + data.reward + '</button>';
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
var handleSuccess = function(data) {
    //Dont show popup to user if user has already  
    //activated or dismissed the offer earlier
    var show = sessionStorage.getItem('ebatesCloneShowPopup');
    if (show == 'show') {
        return true;
    } else {
        $('body').prepend(buildPopup(data));
        $(".complinks_popup").show("slow", function() {
            bindActivateEvent(data);
            bindActivateLaterEvent();
        });
    }
};

/**
 * handle if error occurs in API call
 */
var handleError = function(data) {
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
        if (response && response.userEmailAddress) {
            console.log(response);
            makeRequest(response.userEmailAddress, callbacks);
        }
    });
};

/**
 * Send POST request to get
 */
var makeRequest = function(email, callbacks) {
    var currentDomain = window.location.host.replace('www.', '')
    var apiUrl = "https://shop.complinks.co/api/checkDomain";

    $.post(apiUrl, {
            "domainName": currentDomain,
            "userEmail": email
        })
        .done(function(data) {
            callbacks.success(data);
        })
        .fail(function(data) {
            callbacks.error(data);
        });
}

$(function() {
    getEmailAddress();
    //makeRequest(callbacks);
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