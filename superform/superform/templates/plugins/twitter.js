$('input.checkbox').change(function () {
    nameC = $(this).attr('data-namechan');
    idC = $(this).attr('value');
    module = $(this).attr('data-module');
    if ($(this).is(':checked')) {
        initializeTwitterListeners(nameC, idC);
    } else {
        //If the channel is not selected
        removeTwitterListeners(nameC, idC);
    }
});

/**
 * Returns a function that displays the number of chars in the description field of the publication. The
 * function also displays warnings when the number of chars is greater than 279.
 * @param channelName: The name of the channel
 */
function getCharCounter(channelName) {
    function charCounter(event) {
        var text_length = $('#'+channelName+'_descriptionpost').val().length;
        if ($('#'+channelName+'_linkurlpost').val() != '' && $('#'+channelName+'_linkurlpost').val() != null)
            text_length = text_length + 23;
        if (text_length >= 280) {
            $("label[for='" + channelName + "_" + $('#descriptionpost').attr('id') + "'] > a").remove();
            $("label[for='" + channelName + "_" + $('#descriptionpost').attr('id') + "']").append('<a href="#" data-toggle="popover" title="Content too long" data-content="Too many characters for one tweet"><i class="fas fa-exclamation-circle" style="color:orange"></i></a>');
            $("."+channelName+"_status_too_many_chars").remove();
            $("#"+channelName+"_card_body").append('<div class="'+channelName+'_status_too_many_chars"> Too many characters for one tweet! </div>');
            $("#card_body").append('<div class="'+channelName+'_status_too_many_chars">'+channelName+': Too many characters for one tweet! </div>');
            $('[data-toggle="popover"]').popover();
        } else {
            $("label[for='" + channelName + "_" + $('#descriptionpost').attr('id') + "'] > a").remove();
            $("."+channelName+"_status_too_many_chars").remove();
        }
        $('#'+channelName+'_textarea_feedback').html(text_length + '/279');
    }
    return charCounter;
}


/**
 * Initializes the listeners for the Twitter channel given as argument
 * @param channelName: The name of the channel
 * @param channelID: The ID of the channel
 */
function initializeTwitterListeners(channelName, channelID) {
    getCharCounter(channelName)(null);
    $('#'+channelName+'_textarea_feedback').html('0/279');
    $('#'+channelName+'_descriptionpost').on('keyup', getCharCounter(channelName));
    $('#'+channelName+'_linkurlpost').on('keyup', getCharCounter(channelName));
    $('#descriptionpost').on('keyup', getCharCounter(channelName));
    $('#linkurlpost').on('keyup', getCharCounter(channelName));
    $('#li_'+channelName).on('click', getCharCounter(channelName));
    $('#chan_option_'+channelID).on('keyup', getCharCounter(channelName));
}


/**
 * Removes the listeners for the Twitter channel given as argument
 * @param channelName: The name of the channel
 * @param channelID: The ID of the channel
 */
function removeTwitterListeners(channelName, channelID) {
    $('#'+channelName+'_descriptionpost').off('keyup');
    $('#'+channelName+'_linkurlpost').off('keyup');
    $('#descriptionpost').off('keyup');
    $('#linkurlpost').off('keyup');
    $('#li_'+channelName).off('click');
    $('#chan_option_'+channelID).off('keyup');
    $("."+channelName+"_status_too_many_chars").remove();
}

function twitterUpdatePreview(channelName) {
    var text = $('#'+channelName+'_descriptionpost').val();
    var url = $('#'+channelName+'_linkurlpost').val();
    var tweets = splitTweet(text, url);
    var preview_container = $('#'+channelName+'_preview');
    var numberOfTweets = tweets.length;
    console.log(tweets);
    $('.tweet-preview').remove();
    for (var i = 1; i <= numberOfTweets; i++) {
        var tweet = tweets[i-1];
        console.log(tweet);
        var html = `<div class="form-group tweet-preview"><label for="${channelName}_$tweet_{i}">Tweet ${i}/${numberOfTweets}</label><br> <textarea class="form-control" rows="5" id="${channelName}_tweet_${i}" name="${channelName}_tweet_${i}">${tweet}</textarea></div>`;
        preview_container.append(html);
    }
}

function splitTweet(text, url) {
    // the content of the current tweet
    var tweet_list = [];
    var tweet = '';
    var continuationLength = 8;
    // get the different words in the tweet
    words = text.split(" ");
    for (var word of words) {
        // test to add the next word
        var test_tweet = '';
        if (tweet == '') {
            test_tweet = tweet + word;
        } else {
            test_tweet = tweet + ' ' + word;
        }
        // if we can add the next word we add it
        if (test_tweet.length + continuationLength + 3 <= 280) {
            tweet = test_tweet;
        }
        // if we can't publish
        else {
            tweet_list.push(tweet + '\u2026');
            tweet = word;
        }
    }
    tweet_list.push(tweet);
    var numberOfTweets = tweet_list.length;
    if (numberOfTweets > 1) {
        for (var i = 1; i <= numberOfTweets; i++) {
            tweet_list[i-1] = `[${i}/${numberOfTweets}] ` + tweet_list[i-1];
        }
    }
    return tweet_list;

}