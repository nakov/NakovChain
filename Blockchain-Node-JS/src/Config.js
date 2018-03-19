const Block = require("./Block");
const Transaction = require("./Transaction");
const CryptoUtils = require("./CryptoUtils");

const faucetPrivateKey = '838ff8634c41ba62467cc874ca156830ba55efe3e41ceeeeae5f3e77238f4eef';
const faucetPublicKey = CryptoUtils.privateKeyToPublicKey(faucetPrivateKey);
const faucetAddress = CryptoUtils.publicKeyToAddress(faucetPublicKey);

const nullAddress = "0000000000000000000000000000000000000000";
const nullPubKey = "00000000000000000000000000000000000000000000000000000000000000000";
const nullSignature = [
    "0000000000000000000000000000000000000000000000000000000000000000",
    "0000000000000000000000000000000000000000000000000000000000000000"
];

const genesisDate = "2018-01-01T00:00:00.000Z";
const genesisFaucetTransaction = new Transaction(
    nullAddress,   // from address
    faucetAddress, // to Address
    1000000000000, // value of transfer
    0,             // fee for mining
    genesisDate,   // dateCreated
    "genesis tx",  // data (payload)
    nullPubKey,    // senderPubKey
    undefined,     // transactionDataHash
    nullSignature, // senderSignature
    0,             // minedInBlockIndex
    true           // transferSuccessful
);

const genesisBlock = new Block(
    0,           // block index
    [genesisFaucetTransaction], // transactions array
    0,           // currentDifficulty
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
    safeConfirmCount: 3,
    genesisBlock,
};
