const chai = require('chai');
const expect = chai.expect;

describe('Transaction', () => {
    const Transaction = require('../src/Transaction');

    describe('calculateDataHash(transaction)', () => {
        it('should return correct data hash', () => {
            let tran = new Transaction(
                "aa5d9d47474b26927827c88a162b2e150349e10f", // fromAddress
                "3d5c0bfbbb3dd69e7f04d80e6f206f0b54b7eb88", // toAddress
                50000,                                      // transactionValue
                20,                                         // fee
                "2018-03-01T20:11:58.441Z",                 // dateReceived
                "f73df83ca0f807528a83bfacf2a935f8c7a37a5b5ce06e393707b798804c71b01",    // senderPubKey
            );
            let tranDataHash = Transaction.calculateDataHash(tran);
            expect(tranDataHash).to.be.equal("0e45c340a7e63c987d2f331ca656768f723f8c7bf902de91ac9b34dd837b6f5e");
        });
    });
});