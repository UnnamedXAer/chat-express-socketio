async function updatePlaceholderAsync (nick) {
    if (!nick) {
        $('#send-input')[0].placeholder = "You are so dumb so you can't even set your nick?"//"Type here Your message and press Enter or send button.";
    }
    else {
        $('#send-input')[0].placeholder = jsUcfirst(nick) + ", type here Your message and press Enter or send button.";
    }
}

async function onChatMessageHandler (msg) {
    const decryptedMsg = {...msg};
    const decryptedText = await getWebWorkerResponse('decrypt', msg.text); // todo try catch somewhere to check if decode not failed
                
    decryptedMsg.text = decryptedText;
    appendMessage(decryptedMsg, false);
}

function postMessage (type, msgText = "", files = []) {
    const msg = {
        time: new Date().toUTCString(),
        text: msgText,
        nick: settings['nick'],
        files: files,
        type: type
    };

    // add message instantly to my UI
    appendMessage({...msg}, true);
    // send message to other users.
    CHAT.usersOnline.forEach(x => {
        if (x.id != settings['userId'])
            sendMsgToUser(msg, x);
    });
}

async function appendMessage (msg, isMy) {   
    const msgClass = isMy ? "message-my" : "message-your";

    switch (msg.type.key) {
        case 'custom':
            break;
        case 'predefined':
            msg.files = [...msg.files];
            msg.files.unshift({data: `/images/${msg.type.value}.png`, type: 'image', msgType: msg.type.key});
            break;
        default:
            break;
    }

    const filesHtml = prepareFilesToDisplayInMessage(msg.files);

    // TODO: make it separate components and set values with .text() (problem when pasting eg. html tags)
    let msgContainer = 
        `<div class="message message-${(isMy ? 'right' : 'left')}" >
            <div class="message-title">
                <a href="http://" target="_blank" rel="noopener noreferrer">${msg.nick}</a><span>${toDate(msg.time)}<span>
            </div>
            <div class="message-content-wrapper ${msgClass}">
                <div class="message-text" style="font-size: ${settings['message-font-size']}" onclick="messageTextClickHandler(event, this)">
                    <p>${urlify(msg.text)}</p>
                </div>
                    ${filesHtml}
            </div>
        </div>`;

    html = `<div class="message-wrapper">${msgContainer}</div>`;

    const $messages = $('#messages'); 
    $messages.append($(html));
    $messages.animate({
        scrollTop: $messages.prop('scrollHeight')
    }, 400);

    if (!isMy) {
        alertByTitle('New Message');
        playSound('/audio/credulous.mp3');
        notifyDesktop({
            title: msg.nick,
            body: /*toDate(msg.time) + '\n'+*/msg.text,
            icon: '../images/send.png',
            // image: '../images/send.png'
        });
    }
}

function sendSubmitHandler (ev) {
    ev.preventDefault();
    const text = $('#send-input').val();

    // do not send empty messages
    if (text == "" && CHAT.currentFiles.length == 0) {
        return;
    }

    addMsgToHistory(text);
    postMessage({key: 'custom', value: ''}, text, CHAT.currentFiles);
    clearSendSection();
}

function clearSendSection () {
    $('#send-input').val('');
    CHAT.currentFiles = [];
    if (CHAT.filesPreviewOpened) {
        toggleSentFilesPreview();
        $('#attachments-preview-send').empty();
    }
}

function addMsgToHistory (msgText) {
    CHAT.currentMessage = "";
    CHAT.lastMessages.unshift(msgText); // add message at the start of array 
    if (CHAT.lastMessages.length > 10) {
        CHAT.lastMessages.pop();
    }
    setLastMessageIdx(0);
}

async function sendMsgToUser (msg, user) {

    const destinationPublicKey = user.publicKey;
    // todo - if no pubicKey ask for it.
    const encryptedText = await getWebWorkerResponse('encrypt', [msg.text, destinationPublicKey]);
    if (encryptedText === false) {
        alert('Could not encrypt Your message.\nThe message will not be sent.');
        return;
    }
    else {
        const encryptedMsg = {
            ...msg,
            text: encryptedText,
            destinationUserId: user.id
        };
    
        socket.emit('chat message', encryptedMsg);
    }
}

function toggleUserTypingText (user, isTyping) {
    if (isTyping) { //todo list of users
        CHAT.typingUsers.push(user);
    }
    else {
        CHAT.typingUsers = CHAT.typingUsers.filter(x => x.id != user /* - userId */);
    }

    if (CHAT.typingUsers.length == 0) {
        $('#user-typing').text("");
    }
    else {
        $('#user-typing').text(CHAT.typingUsers.map(x => x.nick).join(', ') + " typing now..."); // todo - use nick from CHAT.usersOnline???
    }
}

async function startTyping (lastTypeTime) {
    CHAT.lastTypeTime = lastTypeTime;
    if (!CHAT.isTyping) {
        CHAT.isTyping = true;
        socket.emit('user-is-typing', {nick: settings['nick'], id: settings['userId']}); // todo do not emit nick
    }
    checkTyping();
}

function stopTyping () {
    CHAT.isTyping = false;
    socket.emit('user-not-typing', settings['userId']);
}

function checkTyping() {
    clearTimeout(CHAT.typingTimeout);
    CHAT.typingTimeout = null;
    if (CHAT.isTyping && Date.now() - CHAT.lastTypeTime > 1300) {
        stopTyping();
    }
    else {
        CHAT.typingTimeout = setTimeout(checkTyping, 1300);
    }
}

function sendInputOnKeyDownHandler (ev) {

    if (ev.target.value.length > 230) { // todo make something with encode max lengths
        ev.target.parentNode.style.border = '1px solid red';
    }
    else {
        ev.target.parentNode.style.border = "";
    }

    startTyping(Date.now());

    if (ev.keyCode == 38) { // arrow up
        ev.preventDefault();

        if (CHAT.lastMessagesCurrIdx == 0) {
            CHAT.currentMessage = ev.target.value;
        }

        $('#send-input').val(CHAT.lastMessages[CHAT.lastMessagesCurrIdx]);
        setLastMessageIdx(1);
    }
    else if (ev.keyCode == 40) { // arrow down
        ev.preventDefault();

        if (CHAT.lastMessagesCurrIdx == 0) {
            $('#send-input').val(CHAT.currentMessage);
        }
        else {
            setLastMessageIdx(-1);
            $('#send-input').val(CHAT.lastMessages[CHAT.lastMessagesCurrIdx]);
        }
    }
    else if (ev.keyCode == 27) {
        $('#send-input').val("");
        setLastMessageIdx(0);
    }
    else {
        setLastMessageIdx(0);
    }
}

function setLastMessageIdx (param) {

    switch (param) {
        case 1:
            if (CHAT.lastMessagesCurrIdx < CHAT.lastMessages.length-1) {
                CHAT.lastMessagesCurrIdx++;
            }
            break;
        case -1:
            if (CHAT.lastMessagesCurrIdx > 0) {
                CHAT.lastMessagesCurrIdx--;            
            } else {

            }
            break;
        default:
            CHAT.lastMessagesCurrIdx = 0;
            break;
    }
}

function toggleSentFilesPreview () {
    if (!CHAT.filesPreviewOpened) {
        CHAT.filesPreviewOpened = true;
        $('#messages-wrapper').css('height', 'calc(100% - 160px)');
        $('#attachments-preview-send').toggleClass('attachments-preview-opened')//.height('100px');
    }
    else {
        CHAT.filesPreviewOpened = false;
        $('#messages-wrapper').css('height', 'calc(100% - 60px)');
        $('#attachments-preview-send').toggleClass('attachments-preview-opened');
    }
}

function sendInputsWrapperHighlight () {
    $('#send-inputs-wrapper').addClass('send-wrapper-highlight');
}

function removeSendInputsWrapperHighlight () {
    $('#send-inputs-wrapper').removeClass('send-wrapper-highlight');
}

function sendInputBlurHandler (ev) {
    removeSendInputsWrapperHighlight();
    socket.emit('user-not-typing', settings['userId']);
}

function sendInputFocusHandler (ev) {    
    sendInputsWrapperHighlight();
}

function sendInputPasteHandler (ev) {
    ev.stopPropagation();
    ev.preventDefault();
    
    const dataTransfer = ev.type == 'paste' ? ev.originalEvent.clipboardData : ev.originalEvent.dataTransfer;
    
    const $sendInput = $('#send-input');
    const initialValue = $sendInput.val();

    const dataTransferText = dataTransfer.getData('Text');
    if (dataTransferText != "") {
        const selection = getSelection(); // text selected in send-input
        if (selection) {
            const start = $sendInput.prop("selectionStart");
            const end = $sendInput.prop("selectionEnd");
            
            let textBeforeSelection = initialValue.substring(0, start);
            let textAfterSelection = initialValue.substring(end);

            if (dataTransferText.match(/data:image\/([a-zA-Z]*);base64,([^\"]*)/)) {

                // todo - (1) make it function.
                CHAT.currentFiles.id = `${Date.now()}_${parseInt(Math.random()*100, 10)}_${CHAT.currentFiles.length}`;
                CHAT.currentFiles.push({data: dataTransferText, type: 'image'});

                const $img = $(`<img id="img_${CHAT.currentFiles.id}">`);
                
                if (!CHAT.filesPreviewOpened) {
                    toggleSentFilesPreview();
                }

                const $div = $(`<div class="attachment" id="${CHAT.currentFiles.id}"></div>`)
                    .addClass('send-img-thumb')
                    .text('loading...');

                $('#attachments-preview-send').append($div);

                const isJpegOrPng = (dataTransferText.indexOf('data:image/jpeg') != -1 && dataTransferText.indexOf('data:image/png') != -1);

                if (!isJpegOrPng) {
                    $img.addClass('img-thumb-other-types'); //svg+xml / gif...
                }
                else {
                    $img.addClass('img-thumb-jpeg-png');
                }

                $img.click(imgThumbClickHandler);
                $img[0].src = dataTransferText;
                $div.text("").append($img);
                // (1)
            }
            else {
                $sendInput.val(textBeforeSelection + dataTransferText + textAfterSelection);
            }
        }
    }

    const files =  dataTransfer.files;
    if (files && files.length > 0) {
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.

            for(let i = 0; i < files.length; i++) {
                if (files[i].type.match('image.*')) {
                                        
                    const reader = new FileReader();
                    // todo - CHAT.currentFiles.id is done wrong
                    CHAT.currentFiles.id = `${Date.now()}_${i}_${CHAT.currentFiles.length}`;
                    const $img = $(`<img id="img_${CHAT.currentFiles.id}">`);
                    
                    if (!CHAT.filesPreviewOpened) {
                        toggleSentFilesPreview();
                    }

                    const $div = $(`<div class="attachment" id="${CHAT.currentFiles.id}"></div>`)
                        .addClass('send-img-thumb')
                        .text('loading...');

                    $('#attachments-preview-send').append($div);

                    reader.onload = ((thisFile, $divElement, $imgElement) => (progressEvent) => {
                        CHAT.currentFiles.push({data: progressEvent.target.result, type: 'image'});
                        const fileTypeArr = thisFile.type.split('/');
                        if (fileTypeArr[0] == 'image' && (fileTypeArr[1] != 'jpeg' && fileTypeArr[1] != 'png')) { 
                            $imgElement.addClass('img-thumb-other-types'); //svg+xml, gif..
                        }
                        else {
                            $imgElement.addClass('img-thumb-jpeg-png');
                        }

                        $imgElement.click(imgThumbClickHandler);
                        $imgElement[0].src = progressEvent.target.result;
                        $divElement.text("").append($imgElement);
                    })(files[i], $div, $img);

                    reader.readAsDataURL(files[i]);
                }                
            }
        } 
        else {
            alert('The File APIs are not fully supported in this browser.');
        }
    }
}


function sendInputDragoverHandler (ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.originalEvent.dataTransfer.dropEffect = 'copy';
}

// for received messages
function prepareFilesToDisplayInMessage (files) {
    
    let html = "";
    if (files.length == 1) {
        if (files[0].type == 'image' /*.indexOf('data:image') != -1*/) {
            html = `<div class="${files[0].msgType == 'predefined' ? 'predefined-img-thumb' : ""} one-file">
                    <img src="${files[0].data}" onclick="imgThumbClickHandler(event)">
                </div>`;
        }
        else {
            console.warning('not an image type', files[0]);
        }
    }
    else if (files.length > 1) {
        html = '<div class="many-files">';
        for(let i = 0; i < files.length; i++) {
            if (files[i].type = 'image' /*.indexOf('data:image') != -1*/) {

                const isJpegOrPng = (files[i].data.indexOf('data:image/jpeg') != -1 && files[i].data.indexOf('data:image/png') != -1);

                html += `<div class="file-thumb-wrapper img-thumb" ><img class="${isJpegOrPng ? 'img-thumb-jpeg-png' : 'img-thumb-other-types'}" src="${files[i].data}" onclick="imgThumbClickHandler(event)"></div>`;
            }
            else {
                console.warning('not an image type', files[i]);
            }
        }
        html += '</div>'; 
    }
    return html;
}

function toggleFile (ev) {
    $img = $('.full-screen-img');
    if ($img.length > 0) {
        $img.animate({
            opacity: 0.01
        }, 500, (param) => {
            $img.remove();
            $('.mask-file').toggleClass('show-mask');
        });
    }
    else {
        $('.mask-file').toggleClass('show-mask');
    }
}


// message menu
function messageTextClickHandler (ev, target) { // todo make it jQ.event

    let $menu = $('.message-menu');

    const $target = $(target) // .message-text
        .on('mouseleave', messageTextMouseLeaveHandler)
        .on('mouseenter', messageTextMouseEnterHandler)
        .append($menu);

    // display-none must be removed to get width of menu, 
    // I'm using visibility to not blinking with menu when changing position
    $menu
        .css('visibility', 'hidden') 
        .removeClass('display-none');

    const menuWidth = $menu.prop('clientWidth');
    let left = (target.clientWidth/2) - (menuWidth/2); // mb it can be set based on mouse position
    if ($target.parent().hasClass('message-my')){
        if (target.clientWidth < menuWidth) {
            left = -30;
        }
    }
    else {
        if (left < -21) {
            left = -21;
        }
    }
    $menu
        .css('top', (target.clientHeight+10)+"px")
        .css('left', left+"px")
        .css('visibility', 'visible');

    if ($target.parent().parent().is(':last-child')) {
        $messages = $('#messages');
        //scroll here
        $messages.animate({ scrollTop: $messages.prop("scrollHeight")}, 100);
    }
}

function messageTextMouseLeaveHandler (ev) {
    ev.stopPropagation();
    CHAT.menus.timeout['message-menu'] = hideElementTimeout($('.message-menu'), 1000); 
    // todo - there is a problem when u are enter/leave fast message-text na menu with mouse
}

function messageTextMouseEnterHandler (ev) {
    clearChatTimeout('message-menu');
}

function messageMenuMouseEnterHandler (ev) {
    clearChatTimeout('message-menu');
}

function messageMenuMouseLeaveHandler (ev) {
    ev.stopPropagation();
    $menu = $(ev.currentTarget);
    $menu.parent().off('mouseleave');
    CHAT.menus.timeout['message-menu'] = hideElementTimeout($menu, 1000);
}

function hideElementTimeout ($element, timeout) {
    clearChatTimeout('message-menu');
    return setTimeout(() => {
        if (!$element.is(':hover') && !$element.parent().is(':hover')) {
            $element.addClass('display-none');
        }
    }, timeout);
}

function messageMenuClickHandler (ev) {
    ev.stopPropagation();  
}

function messageMenuItemClickHandler (ev) {
    $menu = $(ev.currentTarget).parent();
    switch (ev.currentTarget.id) {
        case 'message-menu-selectall':
            selectTextInElement($menu.prev());
            break;
        case 'message-menu-copy':
            $menu.addClass('display-none');
            var text = getMessageTextForClipboard($menu.prev());
            // navigator.clipboard.writeText is here because must be called from an event.
            navigator.clipboard.writeText(text) 
                .then(() => {
                    console.log('Async: Copying to clipboard was successful!');
                })
                .catch (err => {
                    console.log('Async: Could not copy text: ', err);
                })
                .finally( () => {
                    $menu.addClass('display-none');
                });
            break;
        case 'message-menu-search':
            var text = getMessageTextForClipboard($menu.prev());
            window.open(`https://www.google.com/search?q=${text}`);
            $menu.addClass('display-none');
            break;
        default:
            $menu.addClass('display-none');
            break;
    }
}

// send menu
function sendMenuTogglerClickHandler (ev) {
    toggleSendMenu();
}

function toggleSendMenu () {
    $sendMenuWrapper = $('.sent-menu-items-wrapper').toggleClass('display-none');
    $('#times-list').addClass('display-none');

    if (!$sendMenuWrapper.hasClass('display-none')) {
        timeoutToggleDisplayElement($sendMenuWrapper, $sendMenuWrapper.parent(), $('#send-menu-toggler'), 2000);
    }
}

function sendMenuTogglerBlurHandler (ev) {
    removeSendInputsWrapperHighlight();
}

function sendMenuTogglerFocusHandler (ev) {
    sendInputsWrapperHighlight();
}

function sendMenuTogglerKeyPressHandler (ev) {
    ev.stopPropagation();
    if (ev.keyCode == 27) {
        $('#sent-menu-items-wrapper')
        .animate({
            opacity: 0
        }, 100, /*(param) => {}*/);
    }
}

function sendMenuItemClickHandler (ev) {
    const itemName = ev.currentTarget.id;
    switch (true) {
        case itemName == 'times':
            const $timesList = $('#times-list');
            if ($timesList.hasClass('display-none')) {
                $timesList.removeClass('display-none');
            }
            else {
                $timesList.addClass('display-none');
            }
            break;
        case itemName.substring(0,5) == 'time-':
        case itemName == 'drink':
        case itemName == 'dinner':
        case itemName == 'like':
        case itemName == 'unlike':
        case itemName == 'question':
        case itemName == 'works-for-me':
        case itemName == 'meh':
            postMessage({key: 'predefined', value: itemName});
            toggleSendMenu();
            break;
        case itemName == '':
            break;
        default:
            break;
    }
}
