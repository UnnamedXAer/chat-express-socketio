$(() => {
    socket = io();

    socket.on('environment', environment =>  {
        APP.environment = environment;
        if (environment == 'development') {
            $('#force-refresh').removeClass('display-none').click(() => socket.emit('force-refresh'));
        }
        else {
            $('#force-refresh').remove();
        }
    });

    // receive my id
    socket.on('my-id', (id) => settings['userId'] = id);
    
    // receive all connected users
    socket.on('users-already-connected', users => {
        users.forEach(user => {
            updateUsersList(user);
        });
    });

    // user changed eg. nick
    socket.on('user-data-change', user => {
        updateUsersList(user);
    });

    // new user is connected
    socket.on('user-connected', user => {
        updateUsersList(user);
//         sendPublicKey();
    });

    // user disconnected from chat
    socket.on('user-disconnected', id => {
        updateUsersList(id);
        toggleUserTypingText(id, false);
    });

    // message received
    socket.on('chat message', onChatMessageHandler);

    // user just started typing a message
    socket.on('user-is-typing', (user) => {
        toggleUserTypingText(user, true);
    });

    // user is no longer typing message
    socket.on('user-not-typing', (userId) => {
        toggleUserTypingText(userId, false);
    });

    socket.on('force-refresh', () => {
        window.location.reload(false);
    });


    // todo remove if not used
    socket.on('custom-error', (error) => {
        window.alert(error.message);
    });
});

$(document).ready(() => {
    InitWebWorker()
    .then( () => {

        const currentTime = new Date().toUTCString();
        // send that i'm connected
        socket.emit('user-connected', {
            nick: settings['nick'],
            connectedOn: currentTime,
            activeOn: currentTime,
            publicKey: CHAT.originPublicKey
        });
        document.title = APP.title;
        $('#lmask').remove();
    });

    $("html")
        .on('dragover', sendInputDragoverHandler)
        .on('drop', (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
        })
        .attr("lang", navigator.language);

    getLocalStorageSettings();

    $('#settings-toggler').click(toggleSettings);
    $('#settings-items #version-label span').text(APP.version);
    $('.switch').click(switchClickHandler);
    
    $('#user-list-toggler').click(userListTogglerClickHandler);
    
    $('.mask-aside').click(toggleAsidePanels);

    $('.mask-file').click(toggleFile);

    $('#send-input')
        .blur(sendInputBlurHandler)
        .focus(sendInputFocusHandler)
        .keydown(sendInputOnKeyDownHandler)
        .on('paste drop', sendInputPasteHandler)
        .on('dragover', sendInputDragoverHandler);

    $('#send-menu-toggler')
        .blur(sendMenuTogglerBlurHandler)
        .focus(sendMenuTogglerFocusHandler)
        .click(sendMenuTogglerClickHandler);

    // send menu elements
    $('.send-menu-item, .time').click(sendMenuItemClickHandler);

    $('form')
        .submit(sendSubmitHandler)
        .attr('lang', navigator.language);

    $('.message-menu')
        .click(messageMenuClickHandler)
        .on('mouseleave', messageMenuMouseLeaveHandler)
        .on('mouseenter', messageMenuMouseEnterHandler);

    $('.message-menu-item').click(messageMenuItemClickHandler)
});