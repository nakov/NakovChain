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
            this.blockDataHash = Block.calculateBlockDataHash(this);

        // Nonce: number
        this.nonce = nonce;

        // DateCreated: timestamp
        this.dateCreated = dateCreated;

        // BlockHash: hex_number
        this.blockHash = blockHash;

        // Calculate the block hash if it is missing
        if (this.blockHash === undefined)
            this.blockHash = Block.calculateBlockHash(this);
    }

    static calculateBlockDataHash(block) {
        let blockData = {
            'index': block.index,
            'transactions': block.transactions.map(t => Object({
                'from': t.fromAddress,
                'to': t.toAddress,
                'value': t.value,
                'fee': t.fee,
                'dateCreated': t.dateCreated,
                'senderPubKey': t.senderPubKey,
                'transactionDataHash': t.senderSignature,
                'senderSignature': t.senderSignature,
                'minedInBlockIndex': t.minedInBlockIndex,
                'paid': t.paid,
            })),
            'difficulty': block.difficulty,
            'prevBlockHash': block.prevBlockHash,
            'minedBy': block.minedBy
        };
        let blockDataJSON = JSON.stringify(blockData);
        let blockDataHash = CryptoJS.SHA256(blockDataJSON).toString();
        return blockDataHash;
    }

    static calculateBlockHash(block) {
        let data = `${block.blockDataHash}|${block.dateCreated}|${block.nonce}`;
        let blockHash = CryptoJS.SHA256(data).toString();
        return blockHash;
    }
};
