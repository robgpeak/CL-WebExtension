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
    $("#success-alert").alert();
    $("#success-alert").fadeTo(2000, 500).slideUp(500, function() {
        $("#success-alert").slideUp(500);
    });
    return true;
}

/**
 * Save Email Address in settings
 */
function saveOptions(e) {
    e.preventDefault();
    // check if already logged in 
    var apiUrl = "https://shop.complinks.co/api/v1/getNews";
    $.post(apiUrl, {
        userEmail: $('#user-email-address').val(),
    })
    .done(function(data) {
        // workaround until api doesn't always return 200
        console.log(data);
        if (data) { //if logged in, save email and say all good
            console.log(data);   
            email = $("#user-email-address").val();
            // saveEmail(email); 
            $('#already-logged-in-alert').append('<strong>'+email+'</strong>');
            $("#already-logged-in-alert").alert();
            $("#already-logged-in-alert").fadeTo(2000, 500).slideUp(500, function() {
                $("already-logged-in-alert").slideUp(500);
            });    
        }
    })
    .fail(function() { //something went really wrong
        $.ajax("https://shop.complinks.co/api/v1/authenticate", {
            type: "POST",
            data: {
            "email": $('#user-email-address').val(),
            "password": $('#user-password').val()
            },
            statusCode: {
              200: function (response) {
                console.log(response);
                if(response['success']) {
                    email = $("#user-email-address").val();   
                    saveEmail(email);
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
              }//,
              // 404: function (response) {
              //   $("#auth-alert").alert();
              //   if (!validateEmail('user-email-address')) {
              //       // $("#error-alert").alert();
              //       // $("#error-alert").fadeTo(2000, 500).slideUp(500, function() {
              //       //     $("#error-alert").slideUp(500);
              //       // });
              //       return false;
              //   }                    
              //   return false;
              // }
            }
        });
        return false;
    });
}

function logout(e) {
    e.preventDefault();
    $.ajax("https://shop.complinks.co/api/v1/logout", {
        type: "GET",
        data: {},
        statusCode: {
          200: function (response) {
                $('#user-email-address').val("");
                clearPassword();
                localStorage.setItem('userEmailAddress', '');
          },
          404: function (response) {}
        }
    });

}

function clearPassword() {
    $('#user-password').val("");
}

function restore_options() {
    var emailAddress = localStorage.getItem('userEmailAddress');
    $('#user-email-address').val(emailAddress);
    // show password placeholder
    console.log(emailAddress);
    if(emailAddress !== '' && emailAddress !== null && typeof emailAddress !== 'undefined')
        $('#user-password').attr('value','••••••••');
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('user-email-address').addEventListener('focusin', clearPassword);
document.getElementById('user-password').addEventListener('focusin', clearPassword);
document.getElementById('save').addEventListener('click',
    saveOptions);
document.getElementById('logout').addEventListener('click',
    logout);