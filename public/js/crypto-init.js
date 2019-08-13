/** Post a message to the worker and return a promise that will resolve with the response */
function getWebWorkerResponse (messageType, messagePayload) {
    return new Promise((resolve, reject) => {
        // Generate random message id to identify the corresponding event callback
        const messageId = uuidv4();

        // Post the message to the webWorker
        CHAT.cryptoWorker.postMessage([messageType, messageId].concat(messagePayload)); // why concat??

        // Create a handler for the webworker message event
        const handler = (ev) => {
            // Only handle messages with the matching message id
            if (ev.data[0] == messageId) {
                // Remove the event listener once the listener has been called
                ev.currentTarget.removeEventListener(ev.target, handler);

                // Resolve the promise with the message payload
                resolve(ev.data[1]);
            }
        }

        // Assign the handler to the worker 'message' event.
        CHAT.cryptoWorker.addEventListener('message', handler);
    });
}

async function InitWebWorker () {
    return new Promise(async (resolve, reject) => {
        // Initialize crypto webworker thread
        CHAT.cryptoWorker = new Worker('/js/workers/crypto-worker.js');

        // Generate keypair and join default room
        CHAT.originPublicKey = await getWebWorkerResponse('generate-keys');
        // console.log('InitWebWorker - Keypair Generated (originPublicKey): ', CHAT.originPublicKey);

        // init socket (will be done after this function call)
        resolve();
    });
}

/** Get key snippet for display purposes */
function getKeySnippet (key) {
    return key.slice(400, 416);
}

