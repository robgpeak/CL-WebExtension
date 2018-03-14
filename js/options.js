/**
 * check if email is valid or not
 */
var validateEmail = function(id) {
    var email_regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
    if (!email_regex.test($("#" + id).val())) {
        var div = $("#" + id).closest("div");
        div.removeClass("has-success");
        $("#glypcn" + id).remove();
        div.addClass("has-error has-feedback");
        return false;
    } else {
        var div = $("#" + id).closest("div");
        div.removeClass("has-error");
        $("#glypcn" + id).remove();
        div.addClass("has-success has-feedback");
        return true;
    }

}

/**
 * Save Email Address in settings
 */
function saveOptions(e) {
    e.preventDefault();
    if (!validateEmail('user-email-address')) {
        $("#error-alert").alert();
        $("#error-alert").fadeTo(2000, 500).slideUp(500, function() {
            $("#error-alert").slideUp(500);
        });
        return false;
    }
    email = $("#user-email-address").val();
    localStorage.setItem('userEmailAddress', email);
    emailAddress = email;
    $("#success-alert").alert();
    $("#success-alert").fadeTo(2000, 500).slideUp(500, function() {
        $("#success-alert").slideUp(500);
    });
    return true;
}

function restore_options() {
    var emailAddress = localStorage.getItem('userEmailAddress');
    $('#user-email-address').val(emailAddress);
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    saveOptions);