const CryptoJS = require("crypto-js");

module.exports = class Block {
    constructor(index,
                transactions,
                difficulty,
                prevBlockHash,
                minedBy,
                blockDataHash,
                nonce,
                dateCreated,
                blockHash)
    {
        // Index: number
        this.index = index;

        // Transactions: Transaction[]
        this.transactions = transactions;

        // Difficulty: number
        this.difficulty = difficulty;

        // PrevBlockHash: hex_number
        this.prevBlockHash = prevBlockHash;

        // MinedBy: address
        this.minedBy = minedBy;

        // BlockDataHash: address
        this.blockDataHash = blockDataHash;

        // Calculate the block data hash if it is missing
        if (this.blockDataHash === undefined)
            this.blockDataHash = this.calculateBlockDataHash();

        // Nonce: number
        this.nonce = nonce;

        // DateCreated: timestamp
        this.dateCreated = dateCreated;

        // BlockHash: hex_number
        this.blockHash = blockHash;

        // Calculate the block hash if it is missing
        if (this.blockHash === undefined)
            this.blockHash = this.calculateBlockHash();
    }

    calculateBlockDataHash() {
        let blockData = {
            'index': this.index,
            'transactions': this.transactions.map(t => Object({
                'from': t.fromAddress,
                'to': t.toAddress,
                'value': t.value,
                'fee': t.fee,
                'dateCreated': t.dateCreated,
                'senderPubKey': t.senderPubKey,
                'transactionDataHash': t.senderSignature,
                'senderSignature': t.senderSignature,
                'minedInBlockIndex': t.minedInBlockIndex,
                'transferSuccessful': t.transferSuccessful,
            })),
            'difficulty': this.difficulty,
            'prevBlockHash': this.prevBlockHash,
            'minedBy': this.minedBy
        };
        let blockDataJSON = JSON.stringify(blockData);
        this.blockDataHash = CryptoJS.SHA256(blockDataJSON).toString();
    }

    calculateBlockHash() {
        let data = `${this.blockDataHash}|${this.dateCreated}|${this.nonce}`;
        this.blockHash = CryptoJS.SHA256(data).toString();
    }
};
