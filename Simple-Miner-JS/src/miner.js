const logger = require("js-logging").colorConsole();
const axios = require("axios");
const CryptoJS = require("crypto-js");

const program = require('commander')
    .option('-h, --host [host]', 'Node hostname / IP', 'localhost')
    .option('-p, --port [port]', 'Node port number', 5555)
    .option('-a, --address [port]', 'Miner blockchain address',
        "84ede81c58f5c490fc6e1a3035789eef897b5b35")
    .parse(process.argv);
let nodeUrl = `http://${program.host}:${program.port}`;
let miningJobUrl = `${nodeUrl}/mining/get-mining-job/${program.address}`;
let submitMinedBlockUrl = `${nodeUrl}/mining/submit-mined-block`;

async function startMining() {
    while(true) {
        try {
            let nextBlock = (await axios.get(miningJobUrl)).data;
            logger.debug("Taken mining job: " + JSON.stringify(nextBlock));
            await mine(nextBlock);
            logger.info("Mined a block: " + nextBlock.blockHash);
            await submitMinedJob(nextBlock);
        } catch (error) {
            logger.error(error);
            if (error.response)
                logger.error("Returned response from node: " +
                    JSON.stringify(error.response.data));
        }
    }
}

async function mine(nextBlock) {
    nextBlock.dateCreated = (new Date()).toISOString();
    nextBlock.nonce = 0;
    do {
        nextBlock.nonce++;
        let data =
            `${nextBlock.blockDataHash}|${nextBlock.dateCreated}|${nextBlock.nonce}`;
        nextBlock.blockHash = CryptoJS.SHA256(data).toString();
    } while (!isValidDifficulty(nextBlock.blockHash, nextBlock.difficulty));
}

async function submitMinedJob(nextBlock) {
    let submitResult = (await axios.post(submitMinedBlockUrl, nextBlock)).data;
    if (submitResult.message)
        logger.debug(submitResult.message);
    else
        logger.error(submitResult.errorMsg);
}

function isValidDifficulty(blockHash, difficulty) {
    for (let i = 0; i<difficulty; i++)
        if (blockHash[i] !== '0')
            return false;
    return true;
}

startMining();
