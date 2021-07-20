var loggedIn = []
var userDetail = []
var recentSubdomain = {}
var appVue = new Vue({
    el: "#app",
    data: {
        isErrored: false,
        isLoggedIn: false,
        isInStore: false,
        errorText: `Please click the "Settings" button below to enter your email address and password. <br> You will
                only need to do this one time.`,
        isLoaded: false,
        deals: [],
        user: {},
        partnerSite: {
            name: "",
            imgUrl: chrome.extension.getURL("images/icon128.png"),
            primaryColor: "#000",
            secondaryColor: "#1a992f",
        },
        currentStore: {}
    },
    methods: {
        shopBtn: (item) => {
            window.open(item.clickUrl)
        },
        settingsBtn: () => {
            chrome.tabs.create({
                'url': 'chrome://extensions/?options=' + chrome.runtime.id
            });
        },
        closeBtn: () => {
            window.close();
        }
    },
})
function setIsActivated(value) {
    appVue.currentStore.isActivated = value
    if (value == true) {
        document.querySelector(".activate-btn").style.backgroundColor = "green"
        document.querySelector(".activate-btn").style.borderColor = "green"
    } else {
        document.querySelector(".activate-btn").style.backgroundColor = appVue.partnerSite.secondaryColor
        document.querySelector(".activate-btn").style.borderColor = appVue.partnerSite.secondaryColor
    }
}
function setIsLoaded(value) {
    appVue.isLoaded = value
    if (value == true) {
        document.querySelector("#loadingPage").style.display = "none"
        document.querySelector("#loadedPage").style.display = "block"
    } else {
        document.querySelector("#loadingPage").style.display = "block"
        document.querySelector("#loadedPage").style.display = "none"
    }
}
function setIsInStore(value, obj = {}) {
    appVue.isInStore = value
    appVue.currentStore = obj
}
function initiate() {
    fetch("https://shop.rewardseverywhere.co/api/v1/getSubdomains")
        .then(response => response.text())
        .then(rsp => {
            if (rsp.trim() !== "") {
                var domainsList = JSON.parse(rsp);
                var domains = Object.keys(domainsList).map((key) => domainsList[key].subdomain);

                initSubdomain(domains);
            }
        })





    var initSubdomain = function (domains) {
        function getUserDetail(domain) {
            return new Promise((resolve, reject) => {
                var apiUrl = "https://" + domain + ".rewardseverywhere.co/api/v1/getUserDetail";

                helpfulFunctions.Fetchs.postFetch(apiUrl, {
                    userEmail: localStorage.getItem('userEmailAddress')

                }, { credentials: 'include' })
                    .then(response => response.json())
                    .then((data) => {
                        if (typeof data.status !== "unauthorized" && typeof data.partnerSubdomain !== "undefined") {
                            console.log(data);
                            let found = userDetail.some((item) => {
                                return item.partnerSubdomain === data.partnerSubdomain
                            });
                            console.log('found', found);
                            // don't push same partner object twice
                            if (!found) {
                                loggedIn.push(data.partnerSubdomain);
                                userDetail.push(data);
                            }
                        } else {
                            // console.log(data);
                            // loggedIn.push(data.partnerSubdomain);
                            // userDetail.push(data);
                        }
                        resolve(data)
                    }).catch(data => {
                        console.log(data);
                    })
            })

        }
        var toggleEmailField = function () {
            return new Promise(async (resolve1, reject2) => {
                var emailExists = function () {
                    return new Promise((resolve, reject) => {
                        var email = localStorage.getItem('userEmailAddress');
                        if (email !== undefined && email != null && email != '') {
                            emailAddress = email;
                            resolve(true)
                        }
                        //don't need to have email saved to be logged in
                        try {
                            var apiUrl = "https://" + recentSubdomain.partnerSubdomain + ".rewardseverywhere.co/api/v1/getUserDetail";
                            helpfulFunctions.Fetchs.postFetch(apiUrl, {}, { credentials: 'include' })
                                .then(response => response.json())
                                .then((data) => {
                                    localStorage.setItem('userEmailAddress', data.email);
                                    resolve(true);//save email from userDetail call

                                }).catch(data => {

                                    appVue.isErrored = true
                                    appVue.partnerSite = {
                                        name: "",
                                        imgUrl: chrome.extension.getURL("images/icon128.png"),
                                        primaryColor: "#000",
                                        secondaryColor: "#1a992f",
                                    }
                                    // put default data in popup
                                    resolve(false)
                                })
                        } catch (ex) {
                            appVue.isErrored = true
                            appVue.partnerSite = {
                                name: "",
                                imgUrl: chrome.extension.getURL("images/icon128.png"),
                                primaryColor: "#000",
                                secondaryColor: "#1a992f",
                            }
                            resolve(false)
                        }
                    })



                };
                var emailExistsResult = await emailExists()
                if (!(emailExistsResult)) {
                    setIsLoaded(true)
                    appVue.isErrored = true
                }
                resolve1()
            })
        };
        var buildTheme = function () {
            try {
                var primaryHex = recentSubdomain.primaryColorCode;
                var accentHex = recentSubdomain.buttonColorCode;;
                var primaryHue = recentSubdomain.secondaryColorCode;

                localStorage.setItem('primaryHex', primaryHex);
                localStorage.setItem('accentHex', accentHex);
                localStorage.setItem('primaryHue', primaryHue);

                var primary = primaryHex;
                var accent = accentHex;
                appVue.partnerSite = {
                    name: recentSubdomain.partnerName,
                    imgUrl: recentSubdomain.partnerIcon,
                    primaryColor: primary,
                    secondaryColor: accent,
                }
                appVue.user = {
                    pendingPoints: recentSubdomain.pendingPoints,
                    availablePoints: recentSubdomain.availablePoints,
                    name: recentSubdomain.firstName
                }
                localStorage.setItem('availablePoints', recentSubdomain.availablePoints);
            } catch (ex) {

            }
        }
        var getOffers = function () {
            var showOffer = function (data) {
                if (data === undefined || !data.isAdvertiser || data.reward == '') {
                    return;
                }


                chrome.tabs.query({
                    active: true,
                    currentWindow: true
                }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "activated?"
                    }, function (response) {
                        if (chrome.runtime.lastError) {
                            console.log(chrome.runtime.lastError);
                        }
                        if (response !== undefined && response.type == "show") {
                            setIsInStore(true, {
                                imgUrl: data.logoUrl,
                                clickUrl: data.clickUrl,
                                earnText: data.reward,
                                isActivated: true
                            })
                        } else {
                            setIsInStore(true, {
                                imgUrl: data.logoUrl,
                                clickUrl: data.clickUrl,
                                earnText: data.reward,
                                isActivated: false
                            })
                        }
                    });

                });
            };

            var showDeals = function (deals) {
                console.log(deals);
                if (deals === null) {
                    return false;
                }
                deals.forEach(deal => {
                    var date = deal.endDate.split("(")[1].slice(0, -2);
                    var d = new Date(date * 1);
                    var dateString;
                    d.setDate(d.getDate() + 20);
                    dateString = ('0' + (d.getMonth() + 1)).slice(-2) + '/'
                        + ('0' + d.getDate()).slice(-2) + '/'
                        + d.getFullYear();
                    appVue.deals.push({
                        advertiserid: deal.advertiserId,
                        earnText: deal.PointText,
                        expDate: `Expiration Date: ${dateString}`,
                        clickUrl: `https://${recentSubdomain.partnerSubdomain}.rewardseverywhere.co${deal.startTripLink}`,
                        description: deal.description,
                    })
                });
            }
            var extractHostname = function (url) {
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

            return new Promise((resolve, reject) => {
                try {
                    var currentDomain = '';
                    var apiUrl = "https://" + recentSubdomain.partnerSubdomain + ".rewardseverywhere.co/api/v1/checkDomain";
                    chrome.tabs.query({
                        active: true,
                        currentWindow: true
                    }, function (tabs) {
                        if (!tabs || !tabs[0] || !tabs[0].url) {
                            reject();
                            return;
                        }
                        var arr = [];
                        currentDomain = extractHostname(tabs[0].url);
                        arr.push(currentDomain);
                        var store = { "includeDeals": "true", "domainName": arr };
                        helpfulFunctions.Fetchs.postFetch(apiUrl, store, { credentials: 'include' })
                            .then(response => response.json())
                            .then((data) => {
                                if (data.length > 0 && data[0].Deals !== null && data[0].isAdvertiser) {
                                    showOffer(data[0]);
                                    showDeals(data[0].Deals);
                                    chrome.tabs.sendMessage(tabs[0].id, {
                                        type: "activated?"
                                    }, function (response) {
                                        if (chrome.runtime.lastError) {
                                            console.log(chrome.runtime.lastError);
                                        }
                                        console.log(response);
                                        if (response !== undefined && response.type === "show") {
                                            setIsActivated(true)
                                        }
                                    });
                                    appVue.isInStore = true
                                    resolve();
                                } else {
                                    reject();
                                }

                            }).catch(data => {
                                callbacks.error(data[0]);
                                reject();
                            })
                    });
                } catch (ex) {
                    // callbacks.error({status: "unauthorized"});
                    reject();
                }
            });
        };
        var getEvents = function () {
            var getNewsErrorHtml = function () {
                appVue.errorText = "Api failed to fetch events for this email"
            };
            return new Promise((resolve, reject) => {
                try {
                    var apiUrl = "https://" + recentSubdomain.partnerSubdomain + ".rewardseverywhere.co/api/v1/getNews";
                    // 
                    helpfulFunctions.Fetchs.postFetch(apiUrl, {
                        userEmail: localStorage.getItem('userEmailAddress')

                    }, { credentials: 'include' })
                        .then(response => response.json())
                        .then((data) => {
                            if (data['status'] === 'unauthorized') {
                                appVue.isErrored = true
                                getNewsErrorHtml();
                                resolve()
                                return false;
                            }

                            if (data && data.featuredAdvertisers) {
                                var ads = data.featuredAdvertisers;
                                console.log(ads);
                                appVue.deals = []
                                for (var i = 0; i < ads.length; i++) {
                                    appVue.deals.push({
                                        advertiserid: ads[i].advertiserId,
                                        earnText: `Earn ${ads[i].PointText}`,
                                        imgUrl: ads[i].logo,
                                        clickUrl: `https://${recentSubdomain.partnerSubdomain}.rewardseverywhere.co${ads[i].startTripLink}`,
                                        storeDomain: ads[i].name
                                    })
                                }
                                resolve()
                            }


                        }).catch(data => {
                            appVue.isErrored = true
                            getNewsErrorHtml();
                            reject();
                        })
                    helpfulFunctions.Fetchs.postFetch(apiUrl, {
                        userEmail: localStorage.getItem('userEmailAddress')

                    }, { credentials: 'include' })
                } catch (ex) {
                    appVue.isErrored = true
                    getNewsErrorHtml();
                    reject();
                }
            })
        };
        var promises = []
        for (let i = 1; i < domains.length; i++) {
            promises.push(getUserDetail(domains[i]))
        }
        Promise.all(promises)
            .then(values => {
                authedValues = values.filter(e => e.status != "unauthorized");
                var latestLogin = Math.max.apply(Math, authedValues.map(function (u) {
                    var ainxs = u.lastLogin.indexOf("(");
                    var ainxe = u.lastLogin.indexOf(")");
                    var suba = u.lastLogin.substring(ainxs + 1, ainxe - 1);
                    suba = Number(suba);
                    return suba;
                }));

                recentSubdomain = authedValues.find(function (u) {
                    return u.lastLogin.includes(latestLogin);
                });
                if (recentSubdomain && recentSubdomain.partnerSubdomain != 'undefined') {
                    toggleEmailField().then(() => {
                        buildTheme();
                        getOffers()
                            .then(() => {
                                setIsLoaded(true)
                            })
                            .catch(async (error) => {
                                // if no offers for this page then show events
                                console.log('error', error);
                                await getEvents()
                                setIsLoaded(true)
                            });
                    })

                } else {
                    appVue.partnerSite = {
                        name: "",
                        imgUrl: chrome.extension.getURL("images/icon128.png"),
                        primaryColor: "#000",
                        secondaryColor: "#1a992f",
                    }
                    appVue.isErrored = true
                    setIsLoaded(true)
                }
            })
        return loggedIn;
    }




}


/**
 * Show email field in popup if the user   
 * didn't provided it yet otherwise hide it.  
 */

initiate()