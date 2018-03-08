module.exports = class MiningJob {
    constructor(index, expectedReward, transactions, transactionsHash, prevBlockHash, difficulty){
        this.index = index;
        this.reward = expectedReward;
        this.transactions = transactions;
        this.transactionsHash = transactionsHash;
        this.prevBlockHash = prevBlockHash;
        this.currentDifficulty = difficulty;
    }
};
