const CryptoJS = require("crypto-js");

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
                paid)
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
            this.transactionDataHash = Transaction.calculateDataHash(this);

        // SenderSignature: hex_number[2]
        this.senderSignature = senderSignature;

        // MinedInBlockIndex: number
        this.minedInBlockIndex = minedInBlockIndex;

        // Paid: bool
        this.paid = paid;
    }

    static calculateDataHash(transaction) {
        let tranData = {
            'from': transaction.fromAddress,
            'to': transaction.toAddress,
            'senderPubKey': transaction.senderPubKey,
            'value': transaction.value,
            'fee': transaction.fee,
            'dateCreated': transaction.dateCreated
        };
        let tranDataJSON = JSON.stringify(tranData);
        let tranDataHash = CryptoJS.SHA256(tranDataJSON).toString();
        return tranDataHash;
    }
};
