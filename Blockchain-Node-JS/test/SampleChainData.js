const Transaction = require("../src/Transaction");
const CryptoUtils = require("../src/CryptoUtils");
const config = require('../src/Config');

const alicePrivateKey = '7af3f7cf01c366b608b590fa80b96bdb93b8dae18d8c3f267553086159ce30a0';
const aliceAddress = CryptoUtils.privateKeyToAddress(alicePrivateKey);
const alicePubKey = CryptoUtils.privateKeyToPublicKey(alicePrivateKey);

const bobPrivateKey = '540e6d801169f47e11f16f07b9b92a33b0aae821feede9b0614d9b49a426cda8';
const bobAddress = CryptoUtils.privateKeyToAddress(bobPrivateKey);

const minerPrivateKey = 'dd75955d3a8e0c0bbacc01f8452a70cf6c27c436a5a8bf0d53dba97a8de9a299';
const minerAddress = CryptoUtils.privateKeyToAddress(minerPrivateKey);

const peterPrivateKey = '2f445ff86ec6375b4950cfbd61eea02e65833ead44811d30ace36dd2aff74186';
const peterAddress = CryptoUtils.privateKeyToAddress(peterPrivateKey);
const peterPubKey = CryptoUtils.privateKeyToPublicKey(peterPrivateKey);

let aliceFaucetTran = new Transaction(
    config.faucetAddress,       // from address
    aliceAddress,               // to address
    500000,                     // value of transfer
    config.minTransactionFee,   // fee
    "2018-01-01T00:01:23.456Z", // dateCreated
    config.faucetPublicKey      // senderPubKey
);
aliceFaucetTran.sign(config.faucetPrivateKey);

let bobFaucetTran = new Transaction(
    config.faucetAddress,       // from address
    bobAddress,                 // to address
    700000,                     // value of transfer
    config.minTransactionFee,   // fee
    "2018-01-01T00:02:34.567Z", // dateCreated
    config.faucetPublicKey      // senderPubKey
);
bobFaucetTran.sign(config.faucetPrivateKey);

let aliceToBobTranOK = new Transaction(
    aliceAddress,               // from address
    bobAddress,                 // to address
    9999,                       // value of transfer
    20,                         // fee
    "2018-01-01T00:01:24.567Z", // dateCreated
    alicePubKey                 // senderPubKey
);
aliceToBobTranOK.sign(alicePrivateKey);

let aliceToBobTranNoFunds = new Transaction(
    aliceAddress,               // from address
    bobAddress,                 // to address
    1234567890,                 // value of transfer
    20,                         // fee
    "2018-01-01T00:01:25.678Z", // dateCreated
    alicePubKey                 // senderPubKey
);
aliceToBobTranNoFunds.sign(alicePrivateKey);

let peterToBobTranZeroBalance = new Transaction(
    peterAddress,               // from address
    bobAddress,                 // to address
    8888888,                    // value of transfer
    config.minTransactionFee,   // fee
    "2018-01-01T00:02:12.345Z", // dateCreated
    peterPubKey                 // senderPubKey
);
peterToBobTranZeroBalance.sign(peterPrivateKey);

let alicePendingFaucetTran = new Transaction(
    config.faucetAddress,       // from address
    aliceAddress,               // to address
    400000,                     // value of transfer
    config.minTransactionFee,   // fee
    "2018-01-01T00:02:45.371Z", // dateCreated
    config.faucetPublicKey      // senderPubKey
);
alicePendingFaucetTran.sign(config.faucetPrivateKey);

function insertSampleChainData(chain) {

    function insertTransaction(chain, transactionData) {
        let result = chain.addNewTransaction(transactionData);
        if (result.errorMsg)
            throw new Error(result.errorMsg);
    }

    function mineTheNextBlock() {
        let oldDifficulty = chain.difficulty;
        chain.difficulty = 0;

        let nextBlock = chain.getMiningJob(minerAddress);
        let miningHour = ('' + chain.blocks.length).padStart(2, '0');
        nextBlock.dateCreated = "2018-01-01T00:" + miningHour + ":00.000Z";
        nextBlock.nonce = 1111111;
        nextBlock.calculateBlockHash();
        let result = chain.submitMinedBlock(nextBlock.blockDataHash,
            nextBlock.dateCreated, nextBlock.nonce, nextBlock.blockHash);
        if (result.errorMsg)
            throw new Error(result.errorMsg);

        chain.difficulty = oldDifficulty;
    }

    insertTransaction(chain, aliceFaucetTran);
    insertTransaction(chain, bobFaucetTran);

    mineTheNextBlock();

    insertTransaction(chain, aliceToBobTranOK);
    insertTransaction(chain, peterToBobTranZeroBalance);
    insertTransaction(chain, aliceToBobTranNoFunds);

    mineTheNextBlock();

    insertTransaction(chain, alicePendingFaucetTran);
}

module.exports = {
    insertSampleChainData
};
