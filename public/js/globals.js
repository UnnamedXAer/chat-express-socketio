const APP = {
    title: 'sszat',
    header_height: "50px", /* if change update style.css */
    version: "1.1.2",
    environment: ""
};
var socket = null;
var settings = {
    'userId': "",
    'nick': "",
    'theme': "light",
    'message-font-size': "1em",
    'audio-volume': 1,
    'show-body-in-notifications': true,
    'push-notifications': true,
    'play-audio': true,
    'notification-permission-state': 'Notification' in window ? Notification.permission : 'denied'
};

var CHAT = {
    panels: {
        settingsOpened: false,
        userListOpened: false
    },
    menus: {
        timeout: {}
    },
    messages: [],
    isTyping: false,
    lastTypeTime: null,
    typingTimeout: null,
    usersOnline: [],
    lastMessages: [],
    lastMessagesCurrIdx: 0,
    currentMessage: "",
    currentFiles: [],
    filesPreviewOpened: false,
    typingUsers: [],
    cryptoWorker: null,
    originPublicKey: null
};