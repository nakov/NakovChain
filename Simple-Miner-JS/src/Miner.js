const logger = require("js-logging").colorConsole();
const axios = require("axios");
const CryptoJS = require("crypto-js");

let miner = {};

miner.init = function({host, port, address}) {
    this.nodeUrl = `http://${host}:${port}`;
    this.miningJobUrl = `${this.nodeUrl}/mining/get-mining-job/${address}`;
    this.submitMinedBlockUrl = `${this.nodeUrl}/mining/submit-mined-block`;
};

miner.startInfiniteMining = async function() {
    while(true) {
        try {
            let nextBlock = (await axios.get(this.miningJobUrl)).data;
            logger.debug("Taken mining job: " + JSON.stringify(nextBlock));
            await this.mine(nextBlock);
            logger.info("Mined a block: " + nextBlock.blockHash);
            await this.submitMinedJob(nextBlock);
        } catch (error) {
            logger.error(error);
            if (error.response)
                logger.error("Returned response from node: " +
                    JSON.stringify(error.response.data));
        }
    }
};

miner.mine = async function(nextBlock) {
    nextBlock.dateCreated = (new Date()).toISOString();
    nextBlock.nonce = 0;
    do {
        nextBlock.nonce++;
        let data =
            `${nextBlock.blockDataHash}|${nextBlock.dateCreated}|${nextBlock.nonce}`;
        nextBlock.blockHash = CryptoJS.SHA256(data).toString();
    } while (!this.isValidDifficulty(nextBlock.blockHash, nextBlock.difficulty));
};

miner.submitMinedJob = async function(nextBlock) {
    let submitResult = (await axios.post(this.submitMinedBlockUrl, nextBlock)).data;
    if (submitResult.message)
        logger.debug(submitResult.message + '\n');
    else
        logger.error(submitResult.errorMsg + '\n');
};

miner.isValidDifficulty = function(blockHash, difficulty) {
    for (let i = 0; i<difficulty; i++)
        if (blockHash[i] !== '0')
            return false;
    return true;
};

module.exports = miner;
