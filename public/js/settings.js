const getLocalStorageSettings = () => {
    
    const nick = localStorage.getItem('nick');
    settings['nick'] = nick ? nick : `dumb_user_${uuidv4()}`;
        
    settings['theme'] = localStorage.getItem('theme');
    
    const messageFontSize = localStorage.getItem('message-font-size');
    settings['message-font-size'] = (messageFontSize ? messageFontSize : '1em');
    
    const playAudio = localStorage.getItem('play-audio');
    settings['play-audio'] = (playAudio == 'false' ? false : true);

    const audioVolume = localStorage.getItem('audio-volume');
    settings['audio-volume'] = audioVolume ? audioVolume : 1;

    const pushNotifications = localStorage.getItem('push-notifications');
    settings['push-notifications'] = pushNotifications == 'false' ? false : true;

    const showBodyInNotifications = localStorage.getItem('show-body-in-notifications');
    settings['show-body-in-notifications'] = showBodyInNotifications == 'false' ? false : true;
    
    updateSettingsFields();

    setMessagesFontSize(messageFontSize)
    if (settings['theme']) {
        updateTheme();
    }
}

function updateSettingsProp(propName, value) {
    return new Promise((resolve, reject) => {
        localStorage.setItem(propName, value);
        settings[propName] = value;
        resolve(value);
    });
}

function updateSettingsFields() {
    $('#nick')
        .val(settings['nick'])
        .blur(settingsNickBlurHandler);
    // todo css for themes
    $('#theme')
        .val(settings['theme'])
        .change(settingsThemeChangeHandler);
    $('#message-font-size')
        .val(settings['message-font-size'])
        .blur(settingsMessageFontSizeBlurHandler);
    $('#play-audio')
        .addClass(settings['play-audio'] ? 'switch-on' : 'switch-off')
        .removeClass(settings['play-audio'] ? 'switch-off' : 'switch-on')
        .change(settingsPlayAudioChangeHandler);
    $('#audio-volume')
        .val(settings['audio-volume'])
        .change(settingsVolumeChangeHandler);
    $('#push-notifications')
        .addClass(settings['push-notifications'] ? 'switch-on' : 'switch-off')
        .removeClass(settings['push-notifications'] ? 'switch-off' : 'switch-on')
        .change(settingsPushNotificationsChangeHandler);
    $('#show-body-in-notifications')
        .addClass(settings['show-body-in-notifications'] ? 'switch-on' : 'switch-off')
        .removeClass(settings['show-body-in-notifications'] ? 'switch-off' : 'switch-on')
        .change(settingsBodyInNotifyChangeHandler);
    $('#notification-permission-state')
        .val(settings['notification-permission-state'])
        .click(settingsNotificationPermissionsClick);
}

async function updatePlaceholderAsync(nick) {
    if (!nick) {
        $('#send-input')[0].placeholder = "Are you so dumb that you can't even set your nick?";
    }
    else {
        $('#send-input')[0].placeholder = jsUcfirst(nick) + ", type here Your message and press Enter or send button.";
    }
}

function settingsNickBlurHandler (ev) {
    const nick = $('#nick').val();
    if (nick == '') {
        nick =  `dumb_user_${uuidv4()}`;
    }
    updatePlaceholderAsync(nick);
    localStorage.setItem('nick', nick);
    settings["nick"] = nick;
    $(`#${settings["userId"]}`).text(nick);

    socket.emit('user-data-change', 'nick', nick); // todo mb send "user"
}

function settingsThemeChangeHandler (ev) {
    const theme = ev.target.value;
    localStorage.setItem('theme', theme);
    settings["theme"] = theme;
    updateTheme();
}

function settingsPlayAudioChangeHandler (ev) {
    const playAudio = ev.target.checked;
    localStorage.setItem('play-audio', playAudio);
    settings['play-audio'] = playAudio;
}

function settingsVolumeChangeHandler(ev) {
    const audioVolume = ev.target.value;
    localStorage.setItem('audio-volume', audioVolume);
    settings['audio-volume'] = audioVolume;
}

function settingsPushNotificationsChangeHandler (ev) {
    const pushNotifications = ev.target.checked;
    localStorage.setItem('push-notifications', pushNotifications);
    settings['push-notifications'] = pushNotifications;
}

function settingsBodyInNotifyChangeHandler (ev) {
    const showBodyInNotifications = ev.target.checked;
    localStorage.setItem('show-body-in-notifications', showBodyInNotifications);
    settings['show-body-in-notifications'] = showBodyInNotifications;
}

function settingsNotificationPermissionsClick (ev) {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            $("#notification-permission-state").val(permission);
            settings['notification-permission-state'] = permission;
        });
    }
    else {
        alert("This browser does not support desktop notification.");
    }
}

function setMessagesFontSize(size) {
    localStorage.setItem('message-font-size', size);
    settings['message-font-size'] = size;
    $('.message-text').css("font-size", size);
    $('#send-input').css("font-size", size);
}

function settingsMessageFontSizeBlurHandler(ev) {
    let messageFontSize = ev.target.value;
    if (messageFontSize == "") {
        messageFontSize = '1em';
    }
    setMessagesFontSize(messageFontSize);
}