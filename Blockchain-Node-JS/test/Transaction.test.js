const chai = require('chai');
const expect = chai.expect;

describe('Transaction', () => {
    const Transaction = require('../src/Transaction');
    const CryptoUtils = require('../src/CryptoUtils');

    describe('calculateDataHash()', () => {
        it('should calculate correct data hash', () => {
            let tran = new Transaction(
                "aa5d9d47474b26927827c88a162b2e150349e10f", // fromAddress
                "3d5c0bfbbb3dd69e7f04d80e6f206f0b54b7eb88", // toAddress
                50000,                                      // transactionValue
                20,                                         // fee
                "2018-03-01T20:11:58.441Z",                 // dateCreated
                "f73df83ca0f807528a83bfacf2a935f8c7a37a5b5ce06e393707b798804c71b01",    // senderPubKey
            );
            tran.calculateDataHash();
            expect(tran.transactionDataHash).to.be.equal("df3afcd0dc6adc26af62465b6ce5921e30c175d27910f47d584bdfa5c8705726");
        });
    });

    describe('sign(privateKey)', () => {
        it('should calculate correct signature', () => {
            let senderPrivKey =
                "7e4670ae70c98d24f3662c172dc510a085578b9ccc717e6c2f4e547edd960a34";
            let senderPubKey = CryptoUtils.privateKeyToPublicKey(senderPrivKey);
            let senderAddress = CryptoUtils.publicKeyToAddress(senderPubKey);
            let tran = new Transaction(
                senderAddress,                              // fromAddress
                "f51362b7351ef62253a227a77751ad9b2302f911", // toAddress
                25000,                                      // transactionValue
                10,                                         // fee
                "2018-02-10T17:53:48.972Z",                 // dateCreated
                senderPubKey,                               // senderPubKey
            );
            tran.sign(senderPrivKey);
            expect(tran.senderSignature.length).to.be.equal(2);
            expect(tran.senderSignature[0]).to.be.equal(
                "78d57e5d94fc2986dc71aa8350b079ab1cdf076eb700b1db1801ddeafd856e00");
            expect(tran.senderSignature[1]).to.be.equal(
                "fb18dc9aed571cd84cecb90fb6cc4714bb2c9497abfa442625466a581450a159"
            );
        });
    });
});
