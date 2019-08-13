function toDate(date) {
    const options = {month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false};
    if (date instanceof Date) {
        return date.toLocaleString(navigator.language, options);
    }
    else {
        return new Date().toLocaleString(navigator.language, options);
    }
}

function jsUcfirst(string) 
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function urlify(text) {
    const urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });
}

function playSound(src) {
    if (settings['play-audio'] && !document.hasFocus()) {
        const sound = new Audio();
        sound.volume = settings['audio-volume'];
        sound.src = src;
        sound.play().catch(err => console.log(err));
    }
}

function alertByTitle(txt) {
    document.title = txt;
    const titleUpdateInterval = setInterval(() => {
        if (document.title == APP.title)
            document.title = txt;
        else {
            document.title = APP.title;
        }
    }, 1000);

    setTimeout(() => {
        clearInterval(titleUpdateInterval);
        document.title = APP.title;
    }, 5000)
}

function updateTheme () {

    const themes = ['light', 'dark', 'slategrey'];

    themes.forEach(theme => {
        if (theme != settings['theme']) {
            $('html').removeClass('theme-'+theme);
        }
        else {
            $('html').addClass('theme-'+theme);
        }
    });
}

function sendNotificationToDesktop(msg) {
    var notification = new Notification(msg.title, {
        body: (settings['show-body-in-notifications'] ? msg.body : ""),
        icon: msg.iconUrl,
        image: msg.image
    });

    setTimeout(notification.close.bind(notification), 4000);
}

function notifyDesktop(msg) {
    if (settings['push-notifications']) {
        // Let's check if the browser supports notifications
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
        }

        // Let's check whether notification permissions have already been granted
        else if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            sendNotificationToDesktop(msg);
        }

        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    sendNotificationToDesktop(msg);
                }
            });
        }
    }
}

function imgThumbClickHandler (ev) {
    $('.mask-file').toggleClass('show-mask');
    $('body').append( () => {
        const $img = $(`<img src="${ev.target.src}">`);
        const $div = $(`<div class="full-screen-img" ></div>`);
        $div.append($img);
        $div.click((ev) => {
            $('.full-screen-img').animate({
                opacity: 0.01
            }, 500, (param) => {
                $('.full-screen-img').remove();
                $('.mask-file').toggleClass('show-mask');
            });
        });

        return $div;
    });
}

function getSelectedText() {
    var text = "";
    if (typeof window.getSelection != "undefined") {
        text = window.getSelection().toString();
    } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
        text = document.selection.createRange().text;
    }
    return text;
}

function timeoutToggleDisplayElement ($element, $parent, $toggler, time) {
    clearChatTimeout($element.selector);
    return setTimeout(() => {
        //prevent from disappearing when moved to another element
        if ($element.parent()[0] == $parent[0] && !$element.hasClass('display-none')) {
            if (!$element.is(":hover")  && !$toggler.is(':hover')) {
                $element.addClass('display-none');
            }
            else {
                CHAT.menus.timeout[$element.selector] = timeoutToggleDisplayElement($element, $parent, $toggler, time);
            }
        }
        else {
            // do nothing
        }
    }, time);
}

let counter = 0;
function clearChatTimeout (name) {
    clearTimeout(CHAT.menus.timeout[name]);
    CHAT.menus.timeout[name] = null;
}

function selectTextInElement ($element) {
    const element = $element[0];
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
}

function getMessageTextForClipboard ($element) {
    const selection = window.getSelection();
    const selectedTextParent = selection.focusNode.parentNode;
    let selectedText = '';

    if (selectedTextParent == $element[0]) {
        // selected text in target message.
        selectedText  = selection.toString();

        if (selectedText == "") { // no text selected 
            selectedText = selection.focusNode.nodeValue;
        }
    }
    else {
        // selection is not in target message.
        selectedText = $element.text();
    }
    //set text to clipboard
    return selectedText;
}

function toggleAsidePanels (ev) {
    if (CHAT.panels.userListOpened) hideUsersList();
    if (CHAT.panels.settingsOpened) hideSettings();
    $('.mask-aside').removeClass('show-mask').addClass('hide-mask'); // here we only close everything
}

function toggleSettings () {
    if (CHAT.panels.settingsOpened) {
        hideSettings();
        if (!CHAT.panels.userListOpened) 
            $('.mask-aside').removeClass('show-mask').addClass('hide-mask');
    }
    else {
        showSettings();
        if (!CHAT.panels.userListOpened) 
            $('.mask-aside').removeClass('hide-mask').addClass('show-mask');
    }
}

function showSettings () {
    $('#settings-toggler').addClass('settings-toggler-open').removeClass('settings-toggler-close');
    $('#settings-wrapper').addClass('aside-move-right').removeClass('aside-move-left');
    CHAT.panels.settingsOpened = true;
}

function hideSettings () {
    $('#settings-toggler').addClass('settings-toggler-close').removeClass('settings-toggler-open');
    $('#settings-wrapper').addClass('aside-move-left').removeClass('aside-move-right');
    CHAT.panels.settingsOpened = false;
}

function userListTogglerClickHandler (ev) {

    if (CHAT.panels.userListOpened) {
        hideUsersList();
        if (!CHAT.panels.settingsOpened)
            $('.mask-aside').removeClass('show-mask').addClass('hide-mask');   
    }
    else {
        showUsersList();
        if (!CHAT.panels.settingsOpened)
            $('.mask-aside').removeClass('hide-mask').addClass('show-mask'); 
    }
}

function hideUsersList () {
    $('#user-list-toggler').removeClass('user-list-toggler-opened').addClass('user-list-toggler-closed');
    $('#user-list-wrapper').toggleClass('aside-move-left aside-move-right');
    CHAT.panels.userListOpened = false;
}

function showUsersList () {
    $('#user-list-toggler').removeClass('user-list-toggler-closed').addClass('user-list-toggler-opened');
    $('#user-list-wrapper').toggleClass('aside-move-left aside-move-right');
    CHAT.panels.userListOpened = true;
}

function switchClickHandler (ev) {
    const $target = $(ev.currentTarget);

    isOn = $target.hasClass('switch-on');

    toggleSwitch($target, !isOn);
    updateSettingsProp(ev.currentTarget.id, !isOn).then(value => console.log(value));
}

function toggleSwitch ($element, turnOn) {
    if (turnOn) {
        $element.removeClass('switch-off').addClass('switch-on');
    }
    else {
        $element.removeClass('switch-on').addClass('switch-off');        
    }
}