const config = require('./Config');

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

function isValidDate(dateISO) {
    if (typeof(dateISO) !== 'string')
        return false;
    if (! isoDateRegEx.test(dateISO))
        return false;
    let date = new Date(dateISO);
    if (isNaN(date))
        return false;
    let year = date.getUTCFullYear();
    return (year >= 2018) && (year <= 2100);
}

function isValidSignatureFormat(signature) {
    if (! Array.isArray(signature))
        return false;
    if (signature.length !== 2)
        return false;
    let validNum0 = /^[0-9a-f]{1,65}$/.test(signature[0]);
    let validNum1 = /^[0-9a-f]{1,65}$/.test(signature[1]);
    return validNum0 && validNum1;
}

function isValidDifficulty(blockHash, difficulty) {
    for (let i = 0; i<difficulty; i++)
        if (blockHash[i] !== '0')
            return false;
    return true;
}

module.exports = {
    isValidAddress,
    isValidPublicKey,
    isValidTransferValue,
    isValidFee,
    isValidDate,
    isValidSignatureFormat,
    isValidDifficulty
};
