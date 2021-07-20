var loggedIn = [];
var userDetail = [];
var domains;
var maxRequests = 8
var currentRequests = 0
function setUpCloseBtns() {
    var closebtns = document.querySelectorAll(".close")
    for (let i = 0; i < closebtns.length; i++) {
        var closebtn = closebtns[i];
        closebtn.addEventListener("click", function (e) {
            var parent = e.target.parentElement
            while (parent.classList.contains("alert") == false) {
                parent = parent.parentElement
            }
            hideAlert(parent.id)
        })
    }
}
setUpCloseBtns()
var xhr = new XMLHttpRequest();
var sleep = (ms) => new Promise((resolve, reject) => setTimeout(() => { resolve() }, ms))
xhr.open('GET', 'https://shop.rewardseverywhere.co/api/v1/getSubdomains');
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        var domainsList = JSON.parse(xhr.response);
        domains = Object.keys(domainsList).map((key) => domainsList[key].subdomain);

        /**
         * check if email is valid or not
         */
        var validateEmail = function (value) {
            var email_regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
            return email_regex.test(value);
        }

        var saveEmail = function (email) {
            localStorage.setItem('userEmailAddress', email);
            emailAddress = email;
            return true
        }

        /**
         * Save Email Address in settings
         */
        function saveOptions(e) {
            e.preventDefault();
            domains.forEach(async function (domain) {
                while (currentRequests != 0) {
                    await sleep(1000)
                }
                if (loggedIn.filter(e => e != undefined).length != 0) {
                    return
                }
                if (validateEmail(document.querySelector("#user-email-address").value) == false) {
                    showAlert("email-error-alert")
                    return
                }
                var apiUrl = "https://" + domain + ".rewardseverywhere.co/api/v1/authenticate";
                helpfulFunctions.Fetchs.postFetch(apiUrl, {
                    email: document.querySelector("#user-email-address").value,
                    password: document.querySelector("#user-password").value
                }, { credentials: 'include' })
                    .then(response => response.json())
                    .then((response) => {
                        if (response['success']) {
                            var apiUrl = "https://" + domain + ".rewardseverywhere.co/api/v1/getUserDetail";
                            helpfulFunctions.Fetchs.postFetch(apiUrl, {}, { credentials: 'include' })
                                .then(response => response.json())
                                .then((data) => {
                                    email = document.querySelector("#user-email-address").value
                                    saveEmail(email);
                                    recentSubdomain = data;
                                    if (data.status !== "unauthorized" && typeof data.partnerSubdomain !== "undefined") {
                                        handleSuccessAuth(data.partnerSubdomain, data.partnerName, data.email);
                                    } else {
                                        handleFailedAuth();
                                    }
                                }).catch(data => {
                                    console.log(data);
                                })

                            return true;
                        } else { //auth unsuccessful

                        }
                    }).catch(data => {
                        console.log(data);
                    })

            });

        }

        async function logout(e) {
            e.preventDefault();
            // find current subdomain before logging out to use correct subdomain
            var requests = 0
            loggedIn.forEach(function (login) {
                requests++
                helpfulFunctions.Fetchs.getFetch("https://" + login + ".rewardseverywhere.co/api/v1/logout", { credentials: 'include' })
                    .then(() => {
                        requests--
                    }).catch(() => {
                        requests--
                    })
            });
            while (requests != 0) {
                await sleep(1000)
            }
            localStorage.setItem("userEmailAddress", "")
            loggedIn = []
            document.querySelector("#user-email-address").removeAttribute("disabled")
            document.querySelector("#user-email-address").value = ""
            document.querySelector("#user-password").removeAttribute("disabled")
            document.querySelector("#user-password").value = ""
            localStorage.setItem('userEmailAddress', '');
            document.querySelector("#startShopping").style.display = "none"
            document.querySelector("#logout").style.display = "none"
            document.querySelector("#save").style.display = "inline-block"
        }

        function getUserDetail(domain) {
            return new Promise((resolve, reject) => {
                var apiUrl = "https://" + domain + ".rewardseverywhere.co/api/v1/getUserDetail";
                helpfulFunctions.Fetchs.postFetch(apiUrl, {}, { credentials: 'include' })
                    .then(response => response.json())
                    .then((data) => {
                        resolve(data)
                    }).catch(data => {
                        console.log(data);
                    })
            })

        }

        var initSubdomain = function (domains) {
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
                        handleSuccessAuth(recentSubdomain.partnerSubdomain, recentSubdomain.partnerName, recentSubdomain.email)
                    } else {
                        document.querySelector("#startShopping").style.display = "none";
                        document.querySelector("#logout").style.display = "none";
                        document.querySelector("#save").style.display = "inline-block";
                        document.querySelector("#loadingPage").style.display = "none";
                        document.querySelector("#loadedPage").style.display = "block";
                    }
                })
            return loggedIn;
        }

        var recentSubdomain;
        initSubdomain(domains);
        document.getElementById('save').addEventListener('click', saveOptions);
        document.getElementById('logout').addEventListener('click', logout);

    }
};
xhr.send();

function handleFailedAuth() {
    showAlert("pass-error-alert")
    document.querySelector("#startShopping").style.display = "none";
    document.querySelector("#logout").style.display = "none";
    document.querySelector("#save").style.display = "inline-block";
    document.querySelector("#loadingPage").style.display = "none";
    document.querySelector("#loadedPage").style.display = "block";
}
function showAlert(id, text = "") {
    document.querySelector(`#${id}`).classList.add("active")
    if (text != "") {
        document.querySelector(`#${id} span:not(.close)`).innerHTML = text;
    }
    setTimeout(() => {
        document.querySelector(`#${id}`).classList.remove("active")
    }, 2000);
}
function hideAlert(id) {
    document.querySelector(`#${id}`).classList.remove("active")
}
function handleSuccessAuth(partnerSubdomain, partnerName, email) {
    document.querySelector("#user-email-address").value = email
    document.querySelector("#user-email-address").setAttribute("disabled", "true")
    document.querySelector("#user-password").value = "••••••••"
    document.querySelector("#user-password").setAttribute("disabled", "true")
    showAlert("success-alert", "You are logged into the  <strong>" + partnerName + "</strong> Shopping Assistant")
    document.querySelector("#startShopping").onclick = function (e) {
        e.preventDefault()
        window.location.href = "https://" + partnerSubdomain + ".rewardseverywhere.co";
    }
    loggedIn.push(partnerSubdomain);
    document.querySelector("#startShopping").style.display = "inline-block";
    document.querySelector("#logout").style.display = "inline-block";
    document.querySelector("#save").style.display = "none";
    document.querySelector("#loadingPage").style.display = "none";
    document.querySelector("#loadedPage").style.display = "block";
}
