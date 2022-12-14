var HESK_FUNCTIONS;
if (!HESK_FUNCTIONS) {
    HESK_FUNCTIONS = {};
}

var heskKBfailed = false;
var heskKBquery = '';
HESK_FUNCTIONS.getKbSearchSuggestions = function($input, callback) {
    var d = document.form1;
    var s = $input.val();

    if (s !== '' && (heskKBquery !== s || heskKBfailed === true) )
    {
        var params = "q=" + encodeURIComponent(s);
        heskKBquery = s;

        $.ajax({
            url: 'suggest_articles.php',
            method: 'POST',
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            data: params,
            success: function(data) {
                heskKBfailed = false;
                callback(data);
            },
            error: function(jqXHR, status, err) {
                console.error(err);
                heskKBfailed = true;
            }
        });
    }

    setTimeout(function() { HESK_FUNCTIONS.getKbSearchSuggestions($input, callback); }, 2000);
};

HESK_FUNCTIONS.getKbTicketSuggestions = function($subject, $message, callback) {
    var d = document.form1;
    var s = $subject.val();
    var m = $message.val();
    var query = s + " " + m;

    if (s !== '' && m !== '' && (heskKBquery !== query || heskKBfailed === true) )
    {
        var params = "q=" + encodeURIComponent(query);
        heskKBquery = query;

        $.ajax({
            url: 'suggest_articles.php',
            method: 'POST',
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            data: params,
            success: function(data) {
                heskKBfailed = false;
                callback(data);
            },
            error: function(jqXHR, status, err) {
                console.error(err);
                heskKBfailed = true;
            }
        });
    }

    setTimeout(function() { HESK_FUNCTIONS.getKbTicketSuggestions($subject, $message, callback); }, 2000);
};

HESK_FUNCTIONS.openWindow = function(PAGE,HGT,WDT) {
    var heskWin = window.open(PAGE,"Hesk_window","height="+HGT+",width="+WDT+",menubar=0,location=0,toolbar=0,status=0,resizable=1,scrollbars=1");
    heskWin.focus();
};

HESK_FUNCTIONS.suggestEmail = function(emailField, displayDiv, isAdmin, allowMultiple) {
    var email = document.getElementById(emailField).value;
    var element = document.getElementById(displayDiv);
    var path = isAdmin ? '../suggest_email.php' : 'suggest_email.php';

    if (email !== '') {
        var params = "e=" + encodeURIComponent(email) + "&ef=" + encodeURIComponent(emailField) + "&dd=" + encodeURIComponent(displayDiv);

        if (allowMultiple) {
            params += "&am=1";
        }


        /*
        {0}: Div ID
        {1}: Suggestion message (i.e. "Did you mean hesk@example.com?")
        {2}: Original email
        {3}: Suggested email (pre-escaped)
        {4}: "Yes, fix it"
        {5}: "No, leave it"
         */
        var responseFormat =
            '<div class="alert warning" id="{0}" style="display: block">' +
                '<div class="alert__inner">' +
                    '<p>' +
                        '<p>{1}</p>' +
                        '<a class="link" href="javascript:" onclick="HESK_FUNCTIONS.applyEmailSuggestion(\'{0}\', \'' + emailField + '\', \'{2}\', \'{3}\')">' +
                            '{4}' +
                        '</a> | ' +
                        '<a class="link" href="javascript:void(0);" onclick="document.getElementById(\'{0}\').style.display=\'none\';">' +
                            '{5}' +
                        '</a>' +
                    '</p>' +
                '</div>' +
            '</div>';

        $.ajax({
            url: path,
            method: 'POST',
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            data: params,
            success: function(data) {
                var $displayDiv = $('#' + displayDiv);
                $displayDiv.html('');
                if (!data.length) {
                    $displayDiv.hide();
                } else {
                    $displayDiv.show();
                }
                $.each(data, function() {
                    $displayDiv.append(responseFormat
                        .replace(/\{0}/g, this.id)
                        .replace(/\{1}/g, this.suggestText)
                        .replace(/\{2}/g, this.originalAddress)
                        .replace(/\{3}/g, this.formattedSuggestedEmail)
                        .replace(/\{4}/g, this.yesResponseText)
                        .replace(/\{5}/g, this.noResponseText));
                });
            },
            error: function(jqXHR, status, err) {
                console.error(err);
            }
        });
    }
};

HESK_FUNCTIONS.applyEmailSuggestion = function(emailTypoId, emailField, originalEmail, formattedSuggestedEmail) {
    var eml = document.getElementById(emailField).value;
    var regex = new RegExp(originalEmail, "gi");
    document.getElementById(emailField).value = eml.replace(regex, formattedSuggestedEmail);
    document.getElementById(emailTypoId).style.display = 'none';
};

HESK_FUNCTIONS.rate = function(url, elementId) {
    if (url.length === 0) {
        return false;
    }

    var element = document.getElementById(elementId);

    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'text',
        success: function(resp) {
            element.innerHTML = resp;
        },
        error: function(jqXHR, statusText, err) {
            console.error(err);
        }
    });
}

// Not namespaced for reverse compatibility with drag-and-drop attachments
function outputAttachmentIdHolder(value, id) {
    $('#attachment-holder-' + id).append('<input type="hidden" name="attachments[]" value="' + value + '">');
}

function removeAttachment(id, fileKey, isAdmin) {
    var prefix = isAdmin ? '../' : '';
    $('input[name="attachments[]"][value="' + fileKey + '"]').remove();
    $.ajax({
        url: prefix + 'upload_attachment.php?action=delete&fileKey=' + encodeURIComponent(fileKey),
        method: 'GET'
    });
}