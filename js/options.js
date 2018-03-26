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
                $("#auth-alert").hide();
                $("#error-alert").hide();
                $("#logout").show();
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
          },
          400: function (response) {
            $("#error-alert").show();
            console.log("auth empty");
            

            if (!validateEmail('user-email-address')) {
                // $("#error-alert").alert();
                // $("#error-alert").fadeTo(2000, 500).slideUp(500, function() {
                //     $("#error-alert").slideUp(500);
                // });
                return false;
            }                    
            return false;
          }
        }
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
                $("#logout").hide();
                $("#already-logged-in-alert").hide();
          },
          404: function (response) {}
        }
    });

}

function clearPassword() {
    $('#user-password').val("");
}

function restore_options() {
    var apiUrl = "https://shop.complinks.co/api/v1/getNews";
    $.post(apiUrl, {})
    .done(function(data) {
        if(data['status'] === 'unauthorized') {
            $("#auth-alert").show();
            $("#logout").hide();
        } else {
            $("#already-logged-in-alert").show();
            $("#auth-alert").hide();
            var emailAddress = localStorage.getItem('userEmailAddress');
            $('#user-email-address').val(emailAddress);
            if(emailAddress !== '' && emailAddress !== null && typeof emailAddress !== 'undefined')
              $('#user-password').attr('value','••••••••');
        }
    })
    .fail(function(data) { 
        //
    });
    
}
document.addEventListener('DOMContentLoaded', restore_options);
setInterval(function() {
    restore_options
}, 10000);

// document.getElementById('user-email-address').addEventListener('focusin', clearPassword);
document.getElementById('user-password').addEventListener('focusin', clearPassword);
document.getElementById('save').addEventListener('click',
    saveOptions);
document.getElementById('logout').addEventListener('click',
    logout);