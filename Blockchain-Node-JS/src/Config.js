const Block = require("./Block");
const Transaction = require("./Transaction");
const Utils = require("./Utils");

const faucetPrivateKey = 'd816f0c72ecc7dc1f0a8d5294676098ea0d5ee826f5c13c7026952ff8ea24fe4';
const faucetPublicKey = Utils.privateKeyToPublicKey(faucetPrivateKey);
const faucetAddress = Utils.publicKeyToAddress(faucetPublicKey);

const nullAddress = "0000000000000000000000000000000000000000";
const nullPubKey = "00000000000000000000000000000000000000000000000000000000000000000";
const nullSignature = [
    "0000000000000000000000000000000000000000000000000000000000000000",
    "0000000000000000000000000000000000000000000000000000000000000000"
];

const genesisDate = "2018-01-01T00:00:00.000Z";
const genesisFaucetTransaction = new Transaction(
    nullAddress,   // fromAddress
    faucetAddress, // toAddress
    1000000000000, // transactionValue
    0,             // fee
    genesisDate,   // dateCreated
    nullPubKey,    // senderPubKey
    undefined,     // transactionDataHash
    nullSignature, // senderSignature
    0,             // minedInBlockIndex
    true           // transferSuccessful
);

const genesisBlock = new Block(
    0,           // block index
    [genesisFaucetTransaction], // transactions array
    0,           // difficulty
    undefined,   // previous block hash
    nullAddress, // mined by (address)
    undefined,   // block data hash
    0,           // nonce
    genesisDate, // date created
    undefined    // block hash
);

module.exports = {
    defaultServerHost: "localhost",
    defaultServerPort: 5555,
    faucetPrivateKey,
    faucetPublicKey,
    faucetAddress,
    nullAddress,
    nullPubKey,
    nullSignature,
    startDifficulty: 5,
    minTransactionFee: 10,
    maxTransactionFee: 1000000,
    blockReward: 5000000,
    maxTransferValue: 10000000000000,
    genesisBlock
};
