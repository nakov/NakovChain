const CryptoJS = require("crypto-js");
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');

function publicKeyToAddress(pubKey) {
    let address = CryptoJS.RIPEMD160(pubKey).toString();
    return address;
}

function privateKeyToPublicKey(privKey) {
    let keyPair = secp256k1.keyFromPrivate(privKey);
    let pubKey = keyPair.getPublic().getX().toString(16) +
        (keyPair.getPublic().getY().isOdd() ? "1" : "0");
    return pubKey;
}

function privateKeyToAddress(privKey) {
    let pubKey = privateKeyToPublicKey(privKey);
    let address = publicKeyToAddress(pubKey);
    return address;
}

function signData(data, privKey) {
    let keyPair = secp256k1.keyFromPrivate(privKey);
    let signature = keyPair.sign(data);
    return [signature.r.toString(16), signature.s.toString(16)];
}

function decompressPublicKey(pubKeyCompressed) {
    let pubKeyX = pubKeyCompressed.substring(0, 64);
    let pubKeyYOdd = parseInt(pubKeyCompressed.substring(64));
    let pubKeyPoint = secp256k1.curve.pointFromX(pubKeyX, pubKeyYOdd);
    return pubKeyPoint;
}

function verifySignature(data, publicKey, signature) {
    let pubKeyPoint = decompressPublicKey(publicKey);
    let keyPair = secp256k1.keyPair({pub: pubKeyPoint});
    let valid = keyPair.verify(data, {r: signature[0], s: signature[1]});
    return valid;
}

function sha256(data) {
    return CryptoJS.SHA256(data).toString();
}

module.exports = {
    publicKeyToAddress,
    privateKeyToPublicKey,
    privateKeyToAddress,
    signData,
    verifySignature,
    sha256
};
