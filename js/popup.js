var emailAddress = null;

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
    //don't need to have email saved to be logged in
    try {
        var apiUrl = "https://"+recentSubdomain.partnerSubdomain+".rewardseverywhere.co/api/v1/getUserDetail";

        $.post(apiUrl, {})
        .done(function(data) {
            // console.log(data);
            return true;//save email from userDetail call
        })
        .fail(function(data) {
            $('#no-email-alert').show();
            $('.image-2').attr('src','images/icon128.png');
            $('.navbar-brand-co').html('Rewards Everywhere Shopping Assistant');
            $('body').css({"height":"300px !important;"});
            $('.tab-content.fb-tab-actions.fpanels').css({"min-height":"78px !important;"});
            // put default data in popup
            return false;        
        });    
    } catch (ex) {
        $('#no-email-alert').show();
        $('.image-2').attr('src','images/icon128.png');
        $('.navbar-brand-co').html('Rewards Everywhere Shopping Assistant');
        $('body').css({"height":"300px !important;"});
        $('.tab-content.fb-tab-actions.fpanels').css({"min-height":"78px !important;"});
        
        return false;
    }
    


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
    if (data === undefined || !data.isAdvertiser || data.reward == '') {
        return;
    }
    // $('.navbar-co').hide();
    var lsph = localStorage.getItem('primaryHex');
    var lsah = localStorage.getItem('accentHex');

    var html = "";
    var p = recentSubdomain.partnerName;
    if(data !== undefined && p === "Foxwoods") {
        html = '<buttons class="btn btn-primary activate-btn" style="color: #000; background-color:'+lsah+'; border-color: '+lsah+';">Activate ' + data.reward + '</buttons>';
    } else {
        html = '<buttons class="btn btn-primary activate-btn" style="background-color:'+lsah+'; border-color: '+lsah+';">Activate ' + data.reward + '</buttons>';
    }
    
    $('.image-3').attr('src',data.logoUrl);
    
    // $('.navbar-co').fadeTo(2000, 0, function() {

    // }); 

    $('.partner-header').css({"height":"60px"});
    // $('.navbar-co').hide();
    $('body-div').css({"position":"relative"});
    // $('.navbar-co, .partner-header').css({"position":"absolute"});
    $('.name-panel').hide();
    $('.partner-header').show()
    // $('.container-fluid').css({"padding-top":"55px"});

    $(document).on('click','.activate-btn',function() {
        console.log('activate-btn clicked');
        // chrome.browserAction.setIcon({
        //     path: {
        //         // 16:    '../img/alt-icon16.png',
        //         48:    '../img/alt-icon48.png',
        //         // 128:   '../img/alt-icon128.png'            
        //     }
        // });
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "create-activate-tab",
                url: data.clickUrl,
                mode: 'popup-activate'
            }, function(response) {
                if(chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                }
                console.log(response);
                chrome.tabs.query({
                    active: true,
                    currentWindow: true
                }, function(tabs) {
                    if(response.type=="activated") {
                        var html = "";
                        // html = '<div class="row">';
                        // html += '<div class="col-xs-12">';
                        html += '<buttons class="btn btn-primary activate-btn" style="background-color:green; border-color: green;">' + data.reward + ' Activated!</buttons>';
                        // html += '</div></div>';
                        $('.offer-btn-container').html(html);
                    }
                });
            });    
        });
    });

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            type: "activated?"
        }, function(response) {
            if(chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
            }
            if(response !== undefined && response.type=="show") {
                html = "";
                html = '<div class="row">';
                html += '<div class="col-xs-12">';
                html += '<buttons class="btn btn-primary activate-btn" style="background-color:green; border-color: green;">' + data.reward + ' Activated!</buttons>';
                html += '</div></div>';
            }
            $('.offer-btn-container').html(html);
        });
    
    });
};

var showDeals = function(deals) {
    console.log(deals);
    if(deals === null) {
        return false;
    }
    var html = "";
    // var lsph = localStorage.getItem('primaryHex');
    var lsah = localStorage.getItem('accentHex');
    for(var i = 0; i < deals.length; i++) {
        var date = deals[i].endDate.split("(")[1].slice(0, -2);
        var d = new Date(date*1);
        console.log(d);
        var dateString;

        d.setDate(d.getDate() + 20);

        dateString = ('0' + (d.getMonth()+1)).slice(-2) + '/'
                     + ( '0' + d.getDate()).slice(-2) + '/'
                     + d.getFullYear();
        console.log(dateString);
        var p = recentSubdomain.partnerName;
        if(p === "Foxwoods") {
            html +=`<div class="retailer-deal">
                        <div class="row-2 w-row">
                            <div class="column deal-col w-col w-col-8">
                                <div target="_blank" class="retailer-deal-text" "href="https://`+recentSubdomain.partnerSubdomain+`.rewardseverywhere.co`+deals[i].startTripLink+`">`+deals[i].description+`</div>
                                <div class="retailer-deal-points">`+deals[i].PointText+`</div>
                                <div class="retailer-deal-exp"><img class="clock-icon" src="../img/clock-icon.png"/>Expiration Date: `+dateString+`</div>
                            </div>
                            <div class="column-2 w-col w-col-4 deal-link-col"><a class="w-button retailer-deal-link activate-btn btn-primary" target="_blank" style="color: #000; background-color: `+lsah+`;" href="https://`+recentSubdomain.partnerSubdomain+`.rewardseverywhere.co`+deals[i].startTripLink+`">Shop Now  <div id="triangle-right"></div></a></div>
                        </div>
                    </div>`;
        } else {
            html +=`<div class="retailer-deal">
                        <div class="row-2 w-row">
                            <div class="column deal-col w-col w-col-8">
                                <div target="_blank" class="retailer-deal-text" "href="https://`+recentSubdomain.partnerSubdomain+`.rewardseverywhere.co`+deals[i].startTripLink+`">`+deals[i].description+`</div>
                                <div class="retailer-deal-points">`+deals[i].PointText+`</div>
                                <div class="retailer-deal-exp"><img class="clock-icon" src="../img/clock-icon.png"/>Expiration Date: `+dateString+`</div>
                            </div>
                            <div class="column-2 w-col w-col-4 deal-link-col"><a class="w-button retailer-deal-link activate-btn btn-primary" target="_blank" style="background-color: `+lsah+`;" href="https://`+recentSubdomain.partnerSubdomain+`.rewardseverywhere.co`+deals[i].startTripLink+`">Shop Now  <div id="triangle-right"></div></a></div>
                        </div>
                    </div>`;            
        }
    }

    $(document).on('click','.retailer-deal-link', function(e) {
        e.preventDefault();
        var href = $(this).attr('href');
        console.log(href);
        //set activated session storage on content page first, then redirect
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "create-activate-tab",
                url: href,
                mode: 'other'
            }, function(response) { 
                if(chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                }
            });
        });          
    });         

    $('.show-offers .container').html(html);
    $('.offers-container').append("<div class=\"cl-link-container\"><a class=\"cl-link\" target=\"_blank\" href=\"https://"+recentSubdomain.partnerSubdomain+".rewardseverywhere.co/stores/index/"+deals[0].advertiserid+"\"> View More...</a></div>");     
    $('.show-offers').show();
}

/**
 * Send POST request to get offers
 */
var getOffers = function() {
    return new Promise((resolve, reject) => {
        try {
            var currentDomain = '';
            var apiUrl = "https://"+recentSubdomain.partnerSubdomain+".rewardseverywhere.co/api/v1/checkDomain";
            var email = localStorage.getItem('userEmailAddress');
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function(tabs) {
                if (!tabs || !tabs[0] || !tabs[0].url) {
                    reject();
                    return;
                }
                var arr = [];
                currentDomain = extractHostname(tabs[0].url);
                arr.push(currentDomain);
                var store = {"includeDeals":"true", "domainName":arr};
                $.post({
                    url: apiUrl,
                    type: "POST",
                    data: JSON.stringify(store),
                    contentType:"application/json",
                    dataType:"json"
                })
                .done(function(data) {
                    if(data.length > 0 && data[0].Deals !== null && data[0].isAdvertiser) {                    
                        showOffer(data[0]); 
                        showDeals(data[0].Deals);  
                        
                        chrome.tabs.query({
                            active: true,
                            currentWindow: true
                        }, function(tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: "activated?"
                            }, function(response) {
                                if(chrome.runtime.lastError) {
                                    console.log(chrome.runtime.lastError);
                                }
                                console.log(response);
                                if(response !== undefined && response.type === "show") {
                                    $('.activate-btn').css({
                                        'background-color': 'green !important',
                                        'border-color': 'green !important'
                                    });
                                }
                            });
                        }); 
                        $('.show-offers .deals-promotions-header').html('<hr class="left"/>Deals &amp; Promotions<hr class="right"/>');
                        resolve();
                    } else {
                        reject();
                    }
                })
                .fail(function(data) {
                    callbacks.error(data[0]);
                    reject();
                });
            });
        } catch (ex) {
            // callbacks.error({status: "unauthorized"});
            reject();
        }
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
    var lsph = localStorage.getItem('primaryHex');
    var lsah = localStorage.getItem('accentHex');

    if (events.length < 1) {
        html += '<div class="well well-sm" style="background-color: '+lsph+';">Nothing to show</div>';
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
    try {
        $(".loading-icon").show();
        var apiUrl = "https://"+recentSubdomain.partnerSubdomain+".rewardseverywhere.co/api/v1/getNews";
        $.post(apiUrl, {
                userEmail: emailAddress
            })
            .done(function(data) {
                if(data['status'] === 'unauthorized') {
                    $(".loading-icon").hide();
                    $('.timeline-events').html(getNewsErrorHtml());    
                    return false;
                }
                $(".loading-icon").hide();
                if (data) {
                    // var eventHtml = buildTimelineHtml(data.news);
                    // $('.timeline-events').html(eventHtml);
                    var ads = data.featuredAdvertisers;
                    console.log(ads);
                    var html = "";
                    // var lsph = localStorage.getItem('primaryHex');
                    var lsah = localStorage.getItem('accentHex');
                    for(var i = 0; i < ads.length; i++) {
                        // html += "<a href=\""+deals[i].startTripLink+"\">"+deals[i].description+"</a><br>";
                        // console.log(recentSubdomain.partnerSubdomain);
                        // var date = deals[i].endDate.split("(")[1].slice(0, -2);
                        // var d = new Date(date*1);
                        // console.log(d);

                        html +=`<div class="retailer-deal">
                                    <div class="row-2 w-row">
                                        <div class="column deal-col w-col w-col-8">
                                            <div><img class="image-4" src="`+ads[i].logo+`"/></div>
                                            <div target="_blank" class="retailer-deal-text ads-deal-text" "href="https://`+recentSubdomain.partnerSubdomain+`.rewardseverywhere.co`+ads[i].startTripLink+`">Earn `+ads[i].PointText+`</div>
                                            <div class="retailer-deal-points ads-deal-points">Shop all `+ads[i].name+` deals</div>
                                        </div>
                                        <div class="column-2 w-col w-col-4 deal-link-col ads-link-col"><a class="w-button retailer-deal-link activate-btn btn-primary" target="_blank" style="background-color: `+lsah+`;" href="https://`+recentSubdomain.partnerSubdomain+`.rewardseverywhere.co`+ads[i].startTripLink+`">Shop Now  <div id="triangle-right"></div></a></div>
                                    </div>
                                </div>`;
                    }
                    $('.show-offers .deals-promotions-header').html('<hr class="left"/>Shop <strong>Featured Stores</strong><hr class="right"/>');
                    // $('.deals-promotions-header').append("<div class='delimiter'></div>");
                    $('.show-offers .container').html(html);
                    $('.show-offers').show();

                    var lsph = localStorage.getItem('primaryHex');
                    $('.well-sm, .btn-primary').css({'background-color':lsah});
                    $('.well-sm, .btn-primary').css({'border-color':lsah});
                }
            })
            .fail(function() {
                $(".loading-icon").hide();
                $('.timeline-events').html(getNewsErrorHtml());
                reject();
            });
    } catch (ex) {
        $(".loading-icon").hide();
        $('.timeline-events').html(getNewsErrorHtml());
    }  
};

function getUserDetail(domain, i) {
    // if(domain != 'foxwoods') {
        var apiUrl = "https://"+domain+".rewardseverywhere.co/api/v1/getUserDetail";
        return $.post(apiUrl, {})
            .done(function(data) {
                if(typeof data.status !== "unauthorized" && typeof data.partnerSubdomain !== "undefined" ) {
                    console.log(data);
                    let found = userDetail.some((item) => { 
                        return item.partnerSubdomain === data.partnerSubdomain 
                    });
                    console.log('found', found);
                    // don't push same partner object twice
                    if(!found) {
                        loggedIn.push(data.partnerSubdomain);
                        userDetail.push(data);
                    }
                } else {
                    // console.log(data);
                    // loggedIn.push(data.partnerSubdomain);
                    // userDetail.push(data);
                }
            }).fail(function(data) {
                console.log(data);
            });
    // }
}

var initSubdomain = function(domains) {
    // var domains = ['shop','xclub','totalrewards','foxwoods'];
    var promiseChain = getUserDetail(domains[0], 0);
    for(let i = 1; i<domains.length; i++) {
        console.log(promiseChain);
        if(i == domains.length-1) { //on last call
            promiseChain = promiseChain.then(function() {
                return getUserDetail(domains[i], i);
            }).then(function() {
                    userDetail = userDetail.filter(function(item) {
                        return !(item.status === "unauthorized");
                    });
                    console.log(userDetail);
                    if(userDetail.length > 0) {
                        var latestLogin = Math.max.apply(Math,userDetail.map(function(u) {
                            if(u.lastLogin === null) {
                                u.lastLogin = "/Date(1525787051000)/"
                            }
                            console.log(u.lastLogin);
                            var ainxs = u.lastLogin.indexOf("(");
                            var ainxe = u.lastLogin.indexOf(")");
                            var suba = u.lastLogin.substring(ainxs+1,ainxe-1);
                            suba = Number(suba);
                            return suba;
                        }));

                        recentSubdomain = userDetail.find(function(u) {
                           console.log(typeof u.lastLogin);
                           return u.lastLogin.includes(latestLogin); 
                        });
                        bindEvents();
                        toggleEmailField();
                        buildTheme();
                        getOffers()
                        .then(() => {
                            // got offers successfully
                            $(".loading-icon").hide(); 
                            $('.greeting-points').html('Hi '+recentSubdomain.firstName+', you have '+recentSubdomain.pendingPoints+' pending points and '+recentSubdomain.availablePoints+' available points');
                            $('#name-panel').css({"height":"25px"});
                            $('.greeting-points').css({"padding-top":"4px","background-color":recentSubdomain.secondaryColorCode});
                            // return true;
                        })
                        .catch(error => {
                            // if no offers for this page then show events
                            console.log('error', error);
                            getEvents()    
                            $(".loading-icon").hide(); 
                            // return true;
                        });
                    } else {
                        bindEvents();
                        $('#no-email-alert').show();
                        $('.image-2').attr('src','images/icon128.png');
                        $('.navbar-brand-co').html('Rewards Everywhere Shopping Assistant');
                        $('body').css({"height":"300px !important;"});
                        $('.tab-content.fb-tab-actions.fpanels').css({"min-height":"78px !important;"}); 
                        $(".loading-icon").hide();                   
                    }
            });
        } else {
            promiseChain = promiseChain.then(function() {
                return getUserDetail(domains[i], i);
            });    
        }
        
    }
    return loggedIn;
}

var buildTheme = function() {
    console.log(recentSubdomain);
    try {
        // var primary = localStorage.getItem('primaryHex');
        // var accent = localStorage.getItem('accentHex');
        // var primaryHue = localStorage.getItem('primaryHue');

        // console.log(primary);
        // console.log(accent);
        // console.log(primaryHue);
        
        var primaryHex = recentSubdomain.primaryColorCode;
        var accentHex = recentSubdomain.buttonColorCode;;
        var primaryHue = recentSubdomain.secondaryColorCode;
        
        localStorage.setItem('primaryHex', primaryHex);
        localStorage.setItem('accentHex', accentHex);
        localStorage.setItem('primaryHue', primaryHue);
        
        var primary = primaryHex;
        var accent = accentHex;
        
    
        console.log(primary);
        console.log(accent);
        $('.navbar-header-co').css({'background-color':primary});

        $('.well-sm').css({'background-color':primary});
        
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "activated?"
            }, function(response) {
                if(chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                }
                console.log(response);
                if(response !== undefined && response.type !== "show" && response.type !== null) {
                    $('.activate-btn').css({'background-color':accent});
                    $('.activate-btn').css({'border-color':accent});   
                    $('.retailer-deal-link').css({'background-color':accent});
                }
            });
        });  


        $(".activate-btn").hover(function () {
           $(this).animate({'opacity':'0.7'}, 100);
        },function (){
           $(this).animate({'opacity':'1'}, 100);
        });
        $('.greeting-points').html('Hi '+recentSubdomain.firstName+', you have '+recentSubdomain.pendingPoints+' pending points and '+recentSubdomain.availablePoints+' available points');
        $('#name-panel').css({"height":"25px"});
        $('.greeting-points').css({"padding-top":"4px","background-color":primaryHue});
        localStorage.setItem('availablePoints', recentSubdomain.availablePoints);
        $('.image-2').attr('src',recentSubdomain.partnerIcon); //change class in webflow
        $('.navbar-brand-co').html(recentSubdomain.partnerName+' Rewards Everywhere Shopping Assistant');
    } catch (ex) {

    }
}


var preBuildTheme = function() {
        var primary = localStorage.getItem('primaryHex');
        var accent = localStorage.getItem('accentHex');
        var primaryHue = localStorage.getItem('primaryHue');

        // console.log(primary);
        // console.log(accent);
        // console.log(primaryHue);

        if(primary !== null && accent !== null && primaryHue !== null) {
            // fail, wait for real buildTheme()
            $('.navbar-header-co').css({'background-color':primary});
            $('.well-sm').css({'background-color':primary});
        }
        
        
        // chrome.tabs.query({
        //     active: true,
        //     currentWindow: true
        // }, function(tabs) {
        //     chrome.tabs.sendMessage(tabs[0].id, {
        //         type: "activated?"
        //     }, function(response) {
        //         console.log(response);
        //         if(response !== undefined && response.type !== "show" && response.type !== null) {
        //             $('.activate-btn').css({'background-color':accent});
        //             $('.activate-btn').css({'border-color':accent});   
        //             $('.retailer-deal-link').css({'background-color':accent});
        //         }
        //     });
        // });  


        // $(".activate-btn").hover(function () {
        //    $(this).animate({'opacity':'0.7'}, 100);
        // },function (){
        //    $(this).animate({'opacity':'1'}, 100);
        // });
        // $('.greeting-points').html('Hi '+recentSubdomain.firstName+', you currently have '+recentSubdomain.availablePoints+' points');
        // $('#name-panel').css({"height":"25px"});
        // $('.greeting-points').css({"padding-top":"4px","background-color":primaryHue});
        // localStorage.setItem('availablePoints', recentSubdomain.availablePoints);
        // $('.image-2').attr('src',recentSubdomain.partnerIcon); //change class in webflow
        // $('.navbar-brand-co').html(recentSubdomain.partnerName+' Rewards Everywhere Shopping Assistant');
}

var loggedIn = [];
var userDetail = [];
var recentSubdomain;

$(document).ready(function() {
    preBuildTheme();
    var xhr = new XMLHttpRequest();
    xhr.open('GET','https://shop.rewardseverywhere.co/api/v1/getSubdomains');
    xhr.onreadystatechange = function() {
        console.log(xhr.response);
        if(xhr.response.trim() !== "") {
            var domainsList = JSON.parse(xhr.response);
            var domains = Object.keys(domainsList).map((key) => domainsList[key].subdomain);

            initSubdomain(domains);            
        }
    }
    xhr.send();
});