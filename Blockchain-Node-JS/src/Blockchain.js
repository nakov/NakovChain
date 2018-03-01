module.exports = class Blockchain {
    constructor(genesisBlock, startDifficulty) {
        // Blocks: Block[]
        this.blocks = [genesisBlock];

        // PendingTransactions: Transaction[]
        this.pendingTransactions = [];

        // Difficulty: number
        this.difficulty = startDifficulty;

        // MiningJobs: map(blockDataHash => Block)
        this.miningJobs = {};
    }

    calcCumulativeDifficulty() {
        let difficulty = 0;
        for (let block of this.blocks) {
            difficulty += block.difficulty;
        }
        return difficulty;
    }

    getTransactionByHash(tranHash) {
        let allTransactions =
            this.getConfirmedTransactions()
            .concat(this.pendingTransactions);
        let tran = allTransactions.filter(t => t.transactionHash === tranHash);
        if (tran.length > 0)
            return tran[0];
        return undefined;
    }

    getPendingTransactions() {
        return this.pendingTransactions;
    }

    getConfirmedTransactions() {
        let transactions = [];
        for (let block of this.blocks) {
            transactions.push.apply(transactions, block.transactions);
        }
        return transactions;
    }

    getTransactionHistory(address) {
        // TODO
    }

    getAccountBalance(address) {
        // TODO
    }

    addNewTransaction(transactionData) {
        // TODO: validate transaction & add to pending transactions

        return { 'TODO': 'TODO' };
    }

    addNewBlock(blockInfo) {
        // TODO: validate the new block and eventually add it to the chain
    }

    submitMinedBlock(blockDataHash, dateCreated, nonce) {
        // TODO: build the block, verify it and broadcast it to all peers
        let blockCandidate = this.miningJobs(blockDataHash);
        if (blockDataHash == undefined)
            return {
                status: "not found",
                errorMsg: "Block not found or already mined"
            };
        // TODO: ...
    }

};
