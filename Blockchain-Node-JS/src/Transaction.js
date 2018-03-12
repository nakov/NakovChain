const CryptoUtils = require("./CryptoUtils");

module.exports = class Transaction {
    constructor(from,
                to,
                value,
                fee,
                dateCreated,
                data,
                senderPubKey,
                transactionDataHash,
                senderSignature,
                minedInBlockIndex,
                transferSuccessful)
    {
        this.from = from; // Sender address: 40 hex digits
        this.to = to; // Recipient address: 40 hex digits
        this.value = value; // Transfer value: integer
        this.fee = fee; // Mining fee: integer
        this.dateCreated = dateCreated;   // ISO-8601 string
        this.data = data;  // Optional data (e.g. payload or comments): string
        this.senderPubKey = senderPubKey; // 65 hex digits
        this.transactionDataHash = transactionDataHash; // 64 hex digits

        // Calculate the transaction data hash if it is missing
        if (this.transactionDataHash === undefined)
            this.calculateDataHash();

        this.senderSignature = senderSignature; // hex_number[2][64]
        this.minedInBlockIndex = minedInBlockIndex; // integer
        this.transferSuccessful = transferSuccessful; // bool
    }

    calculateDataHash() {
        let tranData = {
            'from': this.from,
            'to': this.to,
            'value': this.value,
            'fee': this.fee,
            'dateCreated': this.dateCreated,
            'data': this.data,
            'senderPubKey': this.senderPubKey
        };
        let tranDataJSON = JSON.stringify(tranData);
        this.transactionDataHash = CryptoUtils.sha256(tranDataJSON);
    }

    sign(privateKey) {
        this.senderSignature = CryptoUtils.signData(
            this.transactionDataHash, privateKey);
    }

    verifySignature() {
        return CryptoUtils.verifySignature(this.transactionDataHash,
            this.senderPubKey, this.senderSignature);
    }
};
