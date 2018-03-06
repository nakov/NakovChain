const CryptoJS = require("crypto-js");
const Utils = require("./Utils");

module.exports = class Transaction {
    constructor(fromAddress,
                toAddress,
                transferValue,
                fee,
                dateCreated,
                senderPubKey,
                transactionDataHash,
                senderSignature,
                minedInBlockIndex,
                transferSuccessful)
    {
        // From: address
        this.fromAddress = fromAddress;

        // To: address
        this.toAddress = toAddress;

        // Value: number
        this.value = transferValue;

        // Fee: number
        this.fee = fee;

        // DateCreated: timestamp
        this.dateCreated = dateCreated;

        // SenderPubKey: hex_number
        this.senderPubKey = senderPubKey;

        // TransactionDataHash: hex_number
        this.transactionDataHash = transactionDataHash;

        // Calculate the transaction data hash if it is missing
        if (this.transactionDataHash === undefined)
            this.calculateDataHash();

        // SenderSignature: hex_number[2]
        this.senderSignature = senderSignature;

        // MinedInBlockIndex: number
        this.minedInBlockIndex = minedInBlockIndex;

        // TransferSuccessful: bool
        this.transferSuccessful = transferSuccessful;
    }

    calculateDataHash() {
        let tranData = {
            'from': this.fromAddress,
            'to': this.toAddress,
            'senderPubKey': this.senderPubKey,
            'value': this.value,
            'fee': this.fee,
            'dateCreated': this.dateCreated
        };
        let tranDataJSON = JSON.stringify(tranData);
        this.transactionDataHash = CryptoJS.SHA256(tranDataJSON).toString();
    }

    sign(privateKey) {
        this.senderSignature = Utils.signData(
            this.transactionDataHash, privateKey);
    }

    verifySignature() {
        return Utils.verifySignature(this.transactionDataHash,
            this.senderPubKey, this.senderSignature);
    }
};
