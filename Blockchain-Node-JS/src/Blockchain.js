const Transaction = require("./Transaction");
const Block = require("./Block");
const Utils = require("./Utils");
const config = require("./Config");

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
        let allTransactions = this.getAllTransactions();
        let tran = allTransactions.filter(t => t.transactionDataHash === tranHash);
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

    getAllTransactions() {
        let transactions = this.getConfirmedTransactions();
        transactions.push.apply(transactions, this.pendingTransactions);
        return transactions;
    }

    getTransactionHistory(address) {
        let transactions = this.getAllTransactions();
        let transactionsByAddress = transactions.filter(
            t => t.fromAddress === address || t.toAddress === address);
        return transactionsByAddress;
    }

    getAccountBalance(address) {
        let balance = {
            "confirmedBalance": {"confirmations": undefined, "balance": 0},
            "lastMinedBalance": {"confirmations": 1, "balance": 0},
            "pendingBalance": {"confirmations": 0, "balance": 0}
        };
        let transactions = this.getTransactionHistory(address);

        for (let tran of transactions) {
            // TODO
        }

        return balance;
    }

    findTransactionByDataHash(transactionDataHash) {
        let allTransactions = this.getAllTransactions();
        let matchingTransactions = allTransactions.filter(
            t => t.transactionDataHash === transactionDataHash);
        return matchingTransactions[0];
    }

    addNewTransaction(transactionData) {
        // TODO: validate the transaction & add to pending transactions
        if (! Utils.isValidAddress(transactionData.from))
            return {errorMsg: "Invalid sender address: " + transactionData.from};
        if (! Utils.isValidAddress(transactionData.to))
            return {errorMsg: "Invalid recipient address: " + transactionData.to};
        if (! Utils.isValidPublicKey(transactionData.senderPubKey))
            return {errorMsg: "Invalid public key: " + transactionData.senderPubKey};
        if (Utils.publicKeyToAddress(transactionData.senderPubKey) !== tran.from)
            return {errorMsg: "The public key should match the sender address"};
        if (! Utils.isValidTransferValue(transactionData.value))
            return {errorMsg: "Invalid transfer value: " + transactionData.value};
        if (! Utils.isValidFee(transactionData.fee))
            return {errorMsg: "Invalid transaction fee: " + transactionData.fee};
        if (! Utils.isValidDate(transactionData.dateCreated))
            return {errorMsg: "Invalid date: " + transactionData.dateCreated};
        if (! Utils.isValidSignatureFormat(transactionData.senderSignature))
            return {errorMsg: 'Invalid or missing signature. Expected signature format: ["hexnum", "hexnum"]'};

        let tran = new Transaction(
            transactionData.from,
            transactionData.to,
            transactionData.value,
            transactionData.fee,
            transactionData.dateCreated,
            transactionData.senderPubKey,
            undefined, // the transactionDataHash is auto-calculated
            transactionData.senderSignature
        );

        // Check for duplicated transactions (to avoid "replay attack")
        if (this.findTransactionByDataHash(tran.transactionDataHash))
            return {errorMsg: "Duplicated transaction: " + tran.transactionDataHash};

        if (! tran.verifySignature())
            return {errorMsg: "Invalid signature: " + transactionData.senderSignature};

        this.pendingTransactions.push(tran);

        return tran;
    }

    addNewBlock(blockInfo) {
        // TODO: validate the new block and eventually add it to the chain
    }

    // @return map(address -> balance)
    calcAllConfirmedBalances() {
        let transactions = this.getConfirmedTransactions();
        let balances = {};
        for (let tran of transactions) {
            balances[tran.fromAddress] = 0;
            balances[tran.toAddress] = 0;
        }
        for (let tran of transactions) {
            if (tran.transferSuccessful) {
                balances[tran.fromAddress] -= tran.value;
                balances[tran.toAddress] += tran.value;
            }
        }
        return balances;
    }

    getMiningJob(minerAddress) {
        let nextBlockIndex = this.blocks.length + 1;

        // Deep clone all pending transactions & sort them by fee
        let transactions = JSON.parse(JSON.stringify(this.getPendingTransactions()));
        transactions.sort((a, b) => b.fee - a.fee); // sort descending by fee

        // Insert the coinbase transaction, holding the block reward + tx fees
        let coinbaseTransaction = new Transaction(
            config.nullAddress,       // fromAddress
            minerAddress,             // toAddress
            config.blockReward,       // transferValue
            0,                        // fee
            new Date().toISOString(), // dateCreated
            config.nullPubKey,        // senderPubKey
            undefined,                // transactionDataHash
            config.nullSignature,     // senderSignature
            nextBlockIndex,           // minedInBlockIndex
            true
        );
        transactions.forEach(t => coinbaseTransaction.value += t.fee);
        coinbaseTransaction.calculateDataHash();

        // Execute all pending transactions
        // (transfer the requested values if possible)
        let balances = this.calcAllConfirmedBalances();
        for (let tran of transactions) {
            if (balances[tran.fromAddress] === undefined)
                balances[tran.fromAddress] = 0;
            if (balances[tran.toAddress] === undefined)
                balances[tran.toAddress] = 0;
            if (balances[tran.fromAddress] >= tran.value + tran.fee) {
                balances[tran.fromAddress] -= tran.value + tran.fee;
                balances[tran.toAddress] += tran.value;
                tran.transferSuccessful = true;
            } else {
                tran.transferSuccessful = false;
            }
            tran.minedInBlockIndex = nextBlockIndex;
        }

        // Prepare the next block candidate (block template)
        let prevBlockHash = this.blocks[this.blocks.length-1].blockHash;
        let nextBlockCandidate = new Block(
            nextBlockIndex,
            transactions,
            this.difficulty,
            prevBlockHash,
            minerAddress
        );

        this.miningJobs[nextBlockCandidate.blockDataHash] = nextBlockCandidate;
        return nextBlockCandidate;
    }

    submitMinedBlock(blockDataHash, dateCreated, nonce, blockHash) {
        // Find the block candidate by its data hash
        let newBlock = this.miningJobs[blockDataHash];
        if (newBlock === undefined)
            return { errorMsg: "Block not found or already mined" };

        // Build the new block
        newBlock.dateCreated = dateCreated;
        newBlock.nonce = nonce;
        newBlock.calculateBlockHash();

        // Validate the block hash + the proof of work
        if (newBlock.blockHash !== blockHash)
            return { errorMsg: "Block hash is incorrectly calculated" };
        if (! Utils.validateDifficulty(newBlock.blockHash, newBlock.difficulty))
            return { errorMsg: "The calculated block hash does not match the block difficulty" };

        if (this.blocks.length + 1 !== block.index)
            return { errorMsg: "The submitted block was already mined by someone else" };

        // The block is correct --> accept it
        this.blocks.push(newBlock);
        this.miningJobs = {}; // Invalidate all mining jobs
        return newBlock;
    }
};
