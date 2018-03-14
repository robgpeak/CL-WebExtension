var emailAddress = null;

setTimeout(function() {
    chrome.browserAction.setIcon({
        path: {
            16:    '../img/alt-icon16.png',
            32:    '../img/alt-icon32.png',
            128:   '../img/alt-icon128.png'            
        }
    });
}, 5000);

/**
 * check if user has provide the email address 
 * and it exists in local storage
 */
var emailExists = function() {
    var email = localStorage.getItem('userEmailAddress');
    if (email !== undefined && email != null && email != '') {
        emailAddress = email;
        return true;
    }
    $('#no-email-alert').show();
    return false;
};

/**
 * Show email field in popup if the user   
 * didn't provided it yet otherwise hide it.  
 */
var toggleEmailField = function() {
    if (!emailExists()) {
        $('.loading-icon').hide();
        $('.email-address-div').show();
    } else {
        $('.email-address-div').hide();
    }
};

var openSettings = function() {
    chrome.tabs.create({
        'url': 'chrome://extensions/?options=' + chrome.runtime.id
    });
};
var extractHostname = function(url) {
    var hostname;
    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    } else {
        hostname = url.split('/')[0];
    }
    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];
    hostname = hostname.replace('www.', '');
    return hostname;
}

var showOffer = function(data) {
    if (!data.isAdvertiser || data.reward == '') {
        return;
    }
    var html = '<div class="row">';
    html += '<div class="col-xs-12">';
    html += '<buttons class="btn btn-primary activate-btn">Activate ' + data.reward + '</buttons>';
    html += '</div></div>';
    $('.show-offers').html(html);
    $('.activate-btn').click(function() {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "create-activate-tab",
                url: data.clickUrl
            }, function(response) {});
        });
    });
};

/**
 * Send POST request to get offers
 */
var getOffers = function() {
    var currentDomain = '';
    var apiUrl = "https://shop.complinks.co/api/checkDomain";
    var email = localStorage.getItem('userEmailAddress');
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        if (!tabs || !tabs[0] || !tabs[0].url) {
            return;
        }
        currentDomain = extractHostname(tabs[0].url);
        $.post(apiUrl, {
                "domainName": currentDomain,
                "userEmail": email
            })
            .done(function(data) {
                showOffer(data);
            })
            .fail(function(data) {
                callbacks.error(data);
            });
    });
};

/**
 * Close popup window
 */
var cancel = function() {
    window.close();
}

/**
 * Bind onclick events on buttons
 */
var bindEvents = function() {
    $('#cancel').click(cancel);
    $('#settings').click(openSettings);
};

/**
 * Create html to show on extension popup
 */
var buildTimelineHtml = function(events) {
    var html = '';
    if (events.length < 1) {
        html += '<div class="well well-sm">Nothing to show</div>';
        return html;
    }
    $.each(events, function(index, value) {
        if (value && value != '') {
            html += '<div class="well well-sm">' + value + '</div>';
        }
    });
    return html;
};

/**
 * Build html to show error if 
 * API call fails to fetch News
 * For specific email
 */
var getNewsErrorHtml = function() {
    var html = '<div class="alert alert-danger">';
    html += 'Api failed to fetch events for this email</div>';
    return html;
};

/**
 * Get timeline of user activities
 */
var getEvents = function() {
    if (!emailAddress)
        return true;
    $(".loading-icon").show();
    var apiUrl = "https://shop.complinks.co/api/getNews";
    $.post(apiUrl, {
            userEmail: emailAddress,
        })
        .done(function(data) {
            console.log("Events loaded ", data);
            $(".loading-icon").hide();
            if (data) {
                var eventHtml = buildTimelineHtml(data);
                console.log("eventHtml", eventHtml);
                $('.timeline-events').html(eventHtml);
            }
        })
        .fail(function() {
            $(".loading-icon").hide();
            $('.timeline-events').html(getNewsErrorHtml());
        });
};

$(function() {
    bindEvents();
    toggleEmailField();
    getEvents();
    getOffers();
});