const Block = require("./Block");
const Transaction = require("./Transaction");
const ValidationUtils = require("./ValidationUtils");
const CryptoUtils = require("./CryptoUtils");
const config = require("./Config");
const logger = require("js-logging").colorConsole();

module.exports = class Blockchain {
    constructor(genesisBlock, startDifficulty) {
        this.blocks = [genesisBlock]; // Block[]
        this.pendingTransactions = []; // Transaction[]
        this.currentDifficulty = startDifficulty; // integer
        this.miningJobs = {}; // map(blockDataHash => Block)
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
        if (!ValidationUtils.isValidAddress(address)) {
            return { errorMsg: "Invalid address" };
        }

        let transactions = this.getAllTransactions();
        let transactionsByAddress = transactions.filter(
            t => t.from === address || t.to === address);
        transactionsByAddress.sort((a, b) =>
            a.dateCreated.localeCompare(b.dateCreated));
        return transactionsByAddress;
    }

    getAccountBalance(address) {
        if (!ValidationUtils.isValidAddress(address)) {
            return { errorMsg: "Invalid address" };
        }

        let transactions = this.getTransactionHistory(address);
        let balance = {
            "safeBalance": 0,
            "confirmedBalance": 0,
            "pendingBalance": 0
        };
        for (let tran of transactions) {
            let confirmsCount = 0;
            if (typeof(tran.minedInBlockIndex) === 'number') {
                confirmsCount = this.blocks.length - tran.minedInBlockIndex + 1;
            }
            if (tran.from === address) {
                // Funds spent -> subtract value and fee
                balance.pendingBalance -= tran.fee;
                if (confirmsCount === 0 || tran.transferSuccessful)
                    balance.pendingBalance -= tran.value;
                if (confirmsCount >= 1) {
                    balance.confirmedBalance -= tran.fee;
                    if (tran.transferSuccessful)
                        balance.confirmedBalance -= tran.value;
                }
                if (confirmsCount >= config.safeConfirmCount) {
                    balance.safeBalance -= tran.fee;
                    if (tran.transferSuccessful)
                        balance.safeBalance -= tran.value;
                }
            }
            if (tran.to === address) {
                // Funds received --> add value and fee
                if (confirmsCount === 0 || tran.transferSuccessful)
                    balance.pendingBalance += tran.value;
                if (confirmsCount >= 1 && tran.transferSuccessful)
                    balance.confirmedBalance += tran.value;
                if (confirmsCount >= config.safeConfirmCount && tran.transferSuccessful)
                    balance.safeBalance += tran.value;
            }
        }

        return balance;
    }

    findTransactionByDataHash(transactionDataHash) {
        let allTransactions = this.getAllTransactions();
        let matchingTransactions = allTransactions.filter(
            t => t.transactionDataHash === transactionDataHash);
        return matchingTransactions[0];
    }

    addNewTransaction(tranData) {
        // Validate the transaction & add it to the pending transactions
        if (! ValidationUtils.isValidAddress(tranData.from))
            return {errorMsg: "Invalid sender address: " + tranData.from};
        if (! ValidationUtils.isValidAddress(tranData.to))
            return {errorMsg: "Invalid recipient address: " + tranData.to};
        if (! ValidationUtils.isValidPublicKey(tranData.senderPubKey))
            return {errorMsg: "Invalid public key: " + tranData.senderPubKey};
        let senderAddr = CryptoUtils.publicKeyToAddress(tranData.senderPubKey);
        if (senderAddr !== tranData.from)
            return {errorMsg: "The public key should match the sender address"};
        if (! ValidationUtils.isValidTransferValue(tranData.value))
            return {errorMsg: "Invalid transfer value: " + tranData.value};
        if (! ValidationUtils.isValidFee(tranData.fee))
            return {errorMsg: "Invalid transaction fee: " + tranData.fee};
        if (! ValidationUtils.isValidDate(tranData.dateCreated))
            return {errorMsg: "Invalid date: " + tranData.dateCreated};
        if (! ValidationUtils.isValidSignatureFormat(tranData.senderSignature))
            return {errorMsg: 'Invalid or missing signature. Expected signature format: ["hexnum", "hexnum"]'};

        let tran = new Transaction(
            tranData.from,
            tranData.to,
            tranData.value,
            tranData.fee,
            tranData.dateCreated,
            tranData.data,
            tranData.senderPubKey,
            undefined, // the transactionDataHash is auto-calculated
            tranData.senderSignature
        );

        // Check for duplicated transactions (to avoid "replay attack")
        if (this.findTransactionByDataHash(tran.transactionDataHash))
            return {errorMsg: "Duplicated transaction: " + tran.transactionDataHash};

        if (! tran.verifySignature())
            return {errorMsg: "Invalid signature: " + tranData.senderSignature};

        let balances = this.getAccountBalance(tran.from);
        if (balances.confirmedBalance < tran.value + tran.fee)
            return {errorMsg: "Unsufficient sender balance at address: " + tran.from};

        this.pendingTransactions.push(tran);
        logger.debug("Added pending transaction: " + JSON.stringify(tran));

        return tran;
    }

    // @return map(address -> balance)
    calcAllConfirmedBalances() {
        let transactions = this.getConfirmedTransactions();
        let balances = {};
        for (let tran of transactions) {
            balances[tran.from] = balances[tran.from] || 0;
            balances[tran.to] = balances[tran.to] || 0;
            balances[tran.from] -= tran.fee;
            if (tran.transferSuccessful) {
                balances[tran.from] -= tran.value;
                balances[tran.to] += tran.value;
            }
        }
        return balances;
    }

    getMiningJob(minerAddress) {
        let nextBlockIndex = this.blocks.length;

        // Deep clone all pending transactions & sort them by fee
        let transactions = JSON.parse(JSON.stringify(this.getPendingTransactions()));
        transactions.sort((a, b) => b.fee - a.fee); // sort descending by fee

        // Prepare the coinbase transaction -> it will collect all tx fees
        let coinbaseTransaction = new Transaction(
            config.nullAddress,       // from (address)
            minerAddress,             // to (address)
            config.blockReward,       // value (of transfer)
            0,                        // fee (for mining)
            new Date().toISOString(), // dateCreated
            "coinbase tx",            // data (payload / comments)
            config.nullPubKey,        // senderPubKey
            undefined,                // transactionDataHash
            config.nullSignature,     // senderSignature
            nextBlockIndex,           // minedInBlockIndex
            true
        );

        // Execute all pending transactions (after paying their fees)
        // Transfer the requested values if the balance is sufficient
        let balances = this.calcAllConfirmedBalances();
        for (let tran of transactions) {
            balances[tran.from] = balances[tran.from] || 0;
            balances[tran.to] = balances[tran.to] || 0;
            if (balances[tran.from] >= tran.fee) {
                tran.minedInBlockIndex = nextBlockIndex;

                // The transaction sender pays the processing fee
                balances[tran.from] -= tran.fee;
                coinbaseTransaction.value += tran.fee;

                // Transfer the requested value: sender -> recipient
                if (balances[tran.from] >= tran.value) {
                    balances[tran.from] -= tran.value;
                    balances[tran.to] += tran.value;
                    tran.transferSuccessful = true;
                } else {
                    tran.transferSuccessful = false;
                }
            }
            else {
                // The transaction cannot be mined due to insufficient
                // balance to pay the transaction fee -> drop it
                this.removePendingTransactions([tran]);
                transactions = transactions.filter(t => t !== tran);
            }
        }

        // Insert the coinbase transaction, holding the block reward + tx fees
        coinbaseTransaction.calculateDataHash();
        transactions.unshift(coinbaseTransaction);

        // Prepare the next block candidate (block template)
        let prevBlockHash = this.blocks[this.blocks.length-1].blockHash;
        let nextBlockCandidate = new Block(
            nextBlockIndex,
            transactions,
            this.currentDifficulty,
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
        if (! ValidationUtils.isValidDifficulty(
                newBlock.blockHash, newBlock.difficulty))
            return { errorMsg: "The calculated block hash does not match the block difficulty" };

        newBlock = this.extendChain(newBlock);

        if (!newBlock.errorMsg)
            logger.debug("Mined a new block: " + JSON.stringify(newBlock));
        return newBlock;
    }

    extendChain(newBlock) {
        if (newBlock.index !== this.blocks.length)
            return { errorMsg: "The submitted block was already mined by someone else" };

        let prevBlock = this.blocks[this.blocks.length - 1];
        if (prevBlock.blockHash !== newBlock.prevBlockHash)
            return { errorMsg: "Incorrect prevBlockHash" };

        // The block is correct --> accept it
        this.blocks.push(newBlock);
        this.miningJobs = {}; // Invalidate all mining jobs
        this.removePendingTransactions(newBlock.transactions);
        return newBlock;
    }

    processLongerChain(blocks) {
        // TODO: validate the chain (it should be longer, should hold valid blocks, each block should hold valid transactions, etc.
        this.blocks = blocks;
        this.removePendingTransactions(this.getConfirmedTransactions());
        logger.info("Chain sync successful. Block count = " + blocks.length);
        return true;
    }

    removePendingTransactions(transactionsToRemove) {
        let tranHashesToRemove = new Set();
        for (let t of transactionsToRemove)
            tranHashesToRemove.add(t.transactionDataHash);
        this.pendingTransactions = this.pendingTransactions.filter(
            t => !tranHashesToRemove.has(t.transactionDataHash));
    }

    mineNextBlock(minerAddress, difficulty) {
        // Prepare the next block for mining
        let oldDifficulty = this.currentDifficulty;
        this.currentDifficulty = difficulty;
        let nextBlock = this.getMiningJob(minerAddress);
        this.currentDifficulty = oldDifficulty;

        // Mine the next block
        nextBlock.dateCreated = (new Date()).toISOString();
        nextBlock.nonce = 0;
        do {
            nextBlock.nonce++;
            nextBlock.calculateBlockHash();
        } while (!ValidationUtils.isValidDifficulty(nextBlock.blockHash, difficulty));

        // Submit the mined block
        let newBlock = this.submitMinedBlock(nextBlock.blockDataHash,
            nextBlock.dateCreated, nextBlock.nonce, nextBlock.blockHash);
        return newBlock;
    }
};
