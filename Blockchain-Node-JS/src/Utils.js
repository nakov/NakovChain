const CryptoJS = require("crypto-js");
const EC = require('elliptic').ec;

function publicKeyToAddress(pubKey) {
    let address = CryptoJS.RIPEMD160(pubKey).toString();
    return address;
}

function privateKeyToPublicKey(privKey) {
    let ec = new EC('secp256k1');
    let keyPair = ec.keyFromPrivate(privKey);
    let pubKey = keyPair.getPublic().getX().toString(16) +
        (keyPair.getPublic().getY().isOdd() ? "1" : "0");
    return pubKey;
}

function privateKeyToAddress(privKey) {
    let pubKey = privateKeyToPublicKey(privKey);
    let address = publicKeyToAddress(pubKey);
    return address;
}

module.exports = {
    publicKeyToAddress,
    privateKeyToPublicKey,
    privateKeyToAddress
};
