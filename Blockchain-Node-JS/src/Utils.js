const CryptoJS = require("crypto-js");
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');
const config = require('./Config');

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

function verifySignature(data, publicKey, signature) {
    let key = secp256k1.keyFromPublic(publicKey, 'hex');
    let valid = key.verify(msg, {r: signature[0], s: signature[1]});
    return valid;
}

function isValidAddress(address) {
    if (typeof(address) !== 'string')
        return false;
    return /^[0-9a-f]{40}$/.test(address);
}

function isValidPublicKey(pubKey) {
    if (typeof(pubKey) !== 'string')
        return false;
    return /^[0-9a-f]{65}$/.test(pubKey);
}

function isValidTransferValue(val) {
    if (typeof(val) !== 'number')
        return false;
    if (! Number.isInteger(val))
        return false;
    return (val >= 0) && (val <= config.maxTransferValue);
}

function isValidFee(fee) {
    if (typeof(fee) !== 'number')
        return false;
    if (! Number.isInteger(fee))
        return false;
    return (fee >= config.minTransactionFee) && (fee <= config.maxTransactionFee);
}

const isoDateRegEx =
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{2,6}Z$/;

function isValidDate(date) {
    if (typeof(date) !== 'string')
        return false;
    if (! isoDateRegex.test(date))
        return false;
    let d = Date.parse(date);
    if (Number.isNaN(d))
        return false;
    let year = d.getUTCFullYear();
    return (fee >= 2018) && (fee <= 2100);
}

function isValidSignatureFormat(signature) {
    if (! Array.isArray(signature))
        return false;
    if (signature.length !== 2)
        return false;
    return /^[0-9a-f]{1,65}$/.test(signature);
}

module.exports = {
    publicKeyToAddress,
    privateKeyToPublicKey,
    privateKeyToAddress,
    signData,
    verifySignature,
    isValidAddress,
    isValidPublicKey,
    isValidTransferValue,
    isValidFee,
    isValidDate,
    isValidSignatureFormat,
};
