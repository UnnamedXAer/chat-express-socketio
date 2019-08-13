self.window = self;

// todo jsencrypt.min.js
self.importScripts('/js/3PartApi/jsencrypt.min.js');
// self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/jsencrypt/2.3.1/jsencrypt.min.js');

let crypt = null;
let privateKey = null;

/** Web worker onmessage listener */
onmessage = (ev) => {
    // console.log('crypto-worker.js - onmessage ', ev.data);
    const [ messageType, messageId, text, key ] = ev.data;
    let result;
    switch (messageType) {
        case 'generate-keys':
            result = generateKeypair();
            break;
        case 'encrypt':
            result = encrypt(text, key);
            break;
        case 'decrypt':
            result = decrypt(text);
            break;
        default:
            break;
    }

    // Return result to the UI thread
    // console.log('crypto-worker.js - onmessage - postMessage('+messageId+', "result")');
    postMessage([messageId, result]); // buildIn function
}

/** Generate and store keypair */
function generateKeypair () {
    crypt = new JSEncrypt({default_key_size: 2056});
    privateKey = crypt.getPrivateKey();
    // console.log('generateKeypair (privateKey):', privateKey)
    // Only return the public key, keep the private key hidden
    return crypt.getPublicKey();
}

/** Encrypt the provided string with destination public key */
function encrypt (content, publicKey) {
    crypt.setKey(publicKey);
    const result = crypt.encrypt(content);
    return result;//crypt.encrypt(content);
}

/** Decrypt the provided string with the local private key */
function decrypt (content) {
    crypt.setKey(privateKey);
    const result = crypt.decrypt(content);
    // console.log('decrypt ', result);
    return result;//crypt.decrypt(content);
}