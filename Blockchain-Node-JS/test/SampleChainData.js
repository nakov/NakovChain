const Transaction = require("../src/Transaction");
const Utils = require("../src/Utils");
const config = require('../src/Config');

const alicePrivateKey = '7af3f7cf01c366b608b590fa80b96bdb93b8dae18d8c3f267553086159ce30a0';
const aliceAddress = Utils.privateKeyToAddress(alicePrivateKey);

const bobPrivateKey = '6e3cdf06255683112a7474e75758a3855b6ffc4969294af259fe8fd20041abed';
const bobAddress = Utils.privateKeyToAddress(bobPrivateKey);

const minerPrivateKey = 'dd75955d3a8e0c0bbacc01f8452a70cf6c27c436a5a8bf0d53dba97a8de9a299';
const minerAddress = Utils.privateKeyToAddress(minerPrivateKey);

let aliceFaucetTran = new Transaction(
    config.faucetAddress,        // fromAddress
    aliceAddress,                // toAddress
    50000,                       // transactionValue
    config.minTransactionFee,    // fee
    "2018-01-01T00:01:23.456Z",  // dateCreated
    config.faucetPublicKey       // senderPubKey
);
aliceFaucetTran.sign(config.faucetPrivateKey);

let bobFaucetTran = new Transaction(
    config.faucetAddress,        // fromAddress
    bobAddress,                  // toAddress
    50000,                       // transactionValue
    config.minTransactionFee,    // fee
    "2018-01-01T00:02:34.567Z",  // dateCreated
    config.faucetPublicKey       // senderPubKey
);
bobFaucetTran.sign(config.faucetPrivateKey);

function insertSampleChainData(chain) {
    chain.addNewTransaction(aliceFaucetTran);
    chain.addNewTransaction(bobFaucetTran);

    let oldDifficulty = chain.difficulty;
    chain.difficulty = 0;

    let nextBlock = chain.getMiningJob(minerAddress);
    nextBlock.dateCreated = "2018-01-01T00:05:27.890Z";
    nextBlock.nonce = 1111111;
    nextBlock.calculateBlockHash();
    chain.submitMinedBlock(
        nextBlock.blockDataHash, nextBlock.dateCreated, nextBlock.nonce);

    chain.difficulty = oldDifficulty;
}

module.exports = {
    insertSampleChainData
};
