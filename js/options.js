/**
 * check if email is valid or not
 */
var validateEmail = function(id, errorOnly = false) {
    var email_regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
    if (!email_regex.test($("#" + id).val())) {
        var div = $("#" + id).closest("div");
        div.removeClass("has-success");
        $("#glypcn" + id).remove();
        div.addClass("has-error has-feedback");
        return false;
    } else {
        if(!errorOnly) {
            var div = $("#" + id).closest("div");
            div.removeClass("has-error");
            $("#glypcn" + id).remove();
            div.addClass("has-success has-feedback");            
        }
        return true;
    }
}

var saveEmail = function(email) {
    localStorage.setItem('userEmailAddress', email);
    emailAddress = email;
    try {
        // $("#success-alert > span").html("");
        // $("#success-alert > span").append("You are logged into "+recentSubdomain.partnerName)
        // $("#success-alert").alert();
        // $("#success-alert").fadeTo(2000, 500).slideUp(500, function() {
        //     // $("#success-alert").slideUp(500);
        // });
        return true;
    } catch (ex) {

    }
}

/**
 * Save Email Address in settings
 */
function saveOptions(e) {
    e.preventDefault();
    domains.forEach(function(domain) {
        try {
            var apiUrl = "https://"+domain+".complinks.co/api/v1/authenticate";
            $.ajax(apiUrl, {
                type: "POST",
                data: {
                    "email": $('#user-email-address').val(),
                    "password": $('#user-password').val()
                },
                statusCode: {
                  200: function (response) {
                    if(response['success']) {
                        console.log(domain);
                        var apiUrl = "https://"+domain+".complinks.co/api/v1/getUserDetail";
                        $.post(apiUrl, {})
                        .done(function(data) {
                            email = $("#user-email-address").val();   
                            saveEmail(email);
                            recentSubdomain = data;
                            console.log(data);
                            if(typeof data.status !== "unauthorized" && typeof data.partnerSubdomain !== "undefined" ) {
                                $("#success-alert").html("");
                                $("#success-alert").append("Success! You are logged into the  <strong>"+recentSubdomain.partnerName+"</strong> Shopping Assistant")
                                $("#success-alert").alert();
                                $("#success-alert").fadeTo(2000, 500);
                                $("#logout").show();
                                $("#auth-alert").hide();
                                $("#error-alert").hide();
                                loggedIn.push(data.partnerSubdomain);
                                setTimeout(function() {
                                    // location.reload();
                                }, 500);
                            } else {
                                $("#logout").hide();
                            }
                        });

                        return true;
                    } else { //auth unsuccessful
                        // $("#auth-alert").alert();
                        // if bad email address alert that, else say bad user/pass
                        if (!validateEmail('user-email-address', true)) {
                            // $("#error-alert").alert();
                            $("#error-alert").fadeTo(2000, 500).slideUp(500, function() {
                                $("#error-alert").slideUp(500);
                            });
                            return false;
                        } else {
                            $("#auth-alert").fadeTo(2000, 500).slideUp(500, function() {
                                $("#auth-alert").slideUp(500);
                            });    
                        }
                    }
                  },
                  400: function (response) {
                    console.log('auth error');
                    $("#error-alert").show();             
                    if (!validateEmail('user-email-address')) {
                        $("#error-alert").alert();
                        $("#error-alert").fadeTo(2000, 500).slideUp(500, function() {
                            $("#error-alert").slideUp(500);
                        });
                        return false;
                    }                    
                    // return false;
                  }
                }
            });
        } catch (ex) {

        }
    });

}

function logout(e) {
    e.preventDefault();
    // find current subdomain before logging out to use correct subdomain
    loggedIn.forEach(function(login) {
        $.ajax("https://"+login+".complinks.co/api/v1/logout", {
            type: "GET",
            data: {},
            statusCode: {
              200: function (response) {
                    $('#user-email-address').val("");
                    clearPassword();
                    localStorage.setItem('userEmailAddress', '');
                    $("#logout").hide();
                    $("#already-logged-in-alert").hide();
                    setTimeout(function() {
                        location.reload();
                    }, 500);
              },
              404: function (response) {}
            }
        });
    });
}

function clearPassword() {
    $('#user-password').val("");
}

function restore_options() {
    console.log(loggedIn);
    loggedIn.forEach(function(login) {
        console.log(login);
        var apiUrl = "https://"+login+".complinks.co/api/v1/getUserDetail";
        $.post(apiUrl, {})
        .done(function(data) {
            if(data['status'] === 'unauthorized') {
                $("#auth-alert").show();
                $("#logout").hide();
            } else {
                console.log(data);
                $("#already-logged-in-alert").append("to <strong>"+data.partnerName+"</strong>")
                $("#already-logged-in-alert").show();
                $("#auth-alert").hide();
                var emailAddress = localStorage.getItem('userEmailAddress');
                $('#user-email-address').val(emailAddress);
                if(emailAddress !== '' && emailAddress !== null && typeof emailAddress !== 'undefined')
                  $('#user-password').attr('value','••••••••');
            }
        })
        .fail(function(data) { 
            $("#auth-alert").show();
            $("#logout").hide();
        });   
    })
}

function getUserDetail(domain, i) {
    console.log(i);
    var apiUrl = "https://"+domain+".complinks.co/api/v1/getUserDetail";
    return $.post(apiUrl, {})
        .done(function(data) {
            if(typeof data.status !== "unauthorized" && typeof data.partnerSubdomain !== "undefined" ) {
                console.log(data);
                loggedIn.push(data.partnerSubdomain);
                userDetail.push(data);
            } else {
                console.log(data);
                loggedIn.push(data.partnerSubdomain);
                userDetail.push(data);
            }
        });
}

var initSubdomain = function() {
    var promiseChain = getUserDetail(domains[0], 0);
    for(let i = 1; i<domains.length; i++) {
        // console.log(i);
        if(i == domains.length-1) { //on last call
            promiseChain = promiseChain.then(function() {
                return getUserDetail(domains[i], i);
            }).then(function() {
                try {
                    userDetail = userDetail.filter(function(item) {
                        return !(item.status === "unauthorized");
                    });
                    var latestLogin = Math.max.apply(Math,userDetail.map(function(u){
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
                    $("#success-alert").html("");
                    $("#success-alert").append("Success! You are logged into the  <strong>"+recentSubdomain.partnerName+"</strong> Shopping Assistant")
                    $("#success-alert").alert();
                    $("#success-alert").fadeTo(2000, 500);
                    $("#logout").show();
                    $("#auth-alert").hide();
                    $("#error-alert").hide();
                    loggedIn.push(data.partnerSubdomain);                    

                    console.log(recentSubdomain);
                } catch(ex) {
                    console.log(ex);
                    // $("#logout").show();
                    //if not logged in
                    // $('#no-email-alert').show();
                    // $('.image-2').attr('src','images/icon128.png');
                    // $('.navbar-brand-co').html('Rewards Everywhere Shopping Assistant');
                    // $('body').css({"height":"300px !important;"});
                    // $('.tab-content.fb-tab-actions.fpanels').css({"min-height":"78px !important;"});                    
                }
                // restore_options();
            });
        } else {
            promiseChain = promiseChain.then(function() {
                return getUserDetail(domains[i], i);
            });    
        }
        
    }
    return loggedIn;
}

$("#logout").hide();
var loggedIn = [];
var userDetail = [];
var domains = ['shop','xclub'];
var recentSubdomain;
initSubdomain();

// domains.forEach(function(domain) {
//     var apiUrl = "https://"+domain+".complinks.co/api/v1/getUserDetail";
//     $.post(apiUrl, {})
//     .done(function(data) {
//         if(typeof data.status !== "unauthorized" && typeof data.partnerSubdomain !== "undefined" ) {
//             $("#logout").show();
//             userDetail.push(data);
//             loggedIn.push(data.partnerSubdomain);
//         } else {
//         }
//     });
// });




// setTimeout(function() {
//     try {
//         var latestLogin = Math.max.apply(Math,userDetail.map(function(u){
//             var ainxs = u.lastLogin.indexOf("(");
//             var ainxe = u.lastLogin.indexOf(")");
//             var suba = u.lastLogin.substring(ainxs+1,ainxe-1);
//             suba = Number(suba);            
//             return suba;
//         }));
//         console.log(userDetail);
//         console.log(latestLogin);
//         recentSubdomain = userDetail.find(function(u) {
//            return u.lastLogin.includes(latestLogin); 
//         });

//         var tmp = [];
//         tmp.push(recentSubdomain.partnerSubdomain);
//         loggedIn = tmp;
//         restore_options();
//     } catch (ex) {

//     }
// }, 1000);

// document.getElementById('user-email-address').addEventListener('focusin', clearPassword);
document.getElementById('user-password').addEventListener('focusin', clearPassword);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('logout').addEventListener('click', logout);