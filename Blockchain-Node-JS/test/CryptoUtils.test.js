const chai = require('chai');
const expect = chai.expect;

describe('CryptoUtils', () => {
    const CryptoUtils = require('../src/CryptoUtils');

    describe('sign / verify signature', () => {
        it('should correctly sign messages and verify signatures', () => {
            let privKey = '2f445ff86ec6375b4950cfbd61eea02e65833ead44811d30ace36dd2aff74186';
            let pubKey = CryptoUtils.privateKeyToPublicKey(privKey);
            let data = "some data for signing";
            let signature = CryptoUtils.signData(data, privKey);
            let validSignature = CryptoUtils.verifySignature(data, pubKey, signature);
            expect(validSignature).to.be.equal(true);
            let changedData = "changed data after signing";
            let invalidSignature = CryptoUtils.verifySignature(
                changedData, pubKey, signature);
            expect(invalidSignature).to.be.equal(false);
        });
    });
});
