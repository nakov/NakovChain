const Blockchain = require("./Blockchain");
const logger = require("js-logging").colorConsole();

let node = {
    nodeId: '',  // the nodeId uniquely identifies the
    host: '',    // the external host / IP address to connect to this node
    port: 0,     // listening TCP port number
    selfUrl: '', // the external base URL of the REST endpoints
    peers: {},   // a map(nodeId --> url) of the peers, connected to this node
    chain: new Blockchain() // the blockchain (blocks, transactions, ...)
};

node.init = function(serverHost, serverPort, blockchain) {
    node.host = serverHost;
    node.port = serverPort;
    node.selfUrl = `http://${serverHost}:${serverPort}`;
    node.chain = blockchain;
    node.peers = {};
    node.nodeId = (new Date()).getTime().toString(16) +
        Math.random().toString(16).substring(2);
    node.chainId = node.chain.blocks[0].blockHash;
};

// Create the Express app
const express = require("express");
app = express();

// Enable JSON data in the HTTP request body
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// Enable Cross-Origin Resource Sharing (CORS)
const cors = require('cors');
app.use(cors());

const HttpStatus = require('http-status-codes');
const axios = require("axios");

app.get('/', (req, res) => {
    const listExpressEndpoints = require('express-list-endpoints');
    let endpoints = listExpressEndpoints(app);
    let endPointsAsListItems = endpoints.map(e =>
        `<li>${e.methods} <a href="${e.path}">${e.path}</a></li>`).join('');
    res.send(
        '<h1>NakovChain - Simple Educational Blockchain Network</h1>' +
        `<ul>${endPointsAsListItems}</ul>`);
});

app.get('/info', (req, res) => {
    res.json({
        "about": "NakovChain/0.9-js",
        "nodeId": node.nodeId,
        "chainId": node.chainId,
        "nodeUrl": node.selfUrl,
        "peers": node.peers.length,
        "currentDifficulty": node.chain.currentDifficulty,
        "blocksCount": node.chain.blocks.length,
        "cumulativeDifficulty": node.chain.calcCumulativeDifficulty(),
        "confirmedTransactions": node.chain.getConfirmedTransactions().length,
        "pendingTransactions": node.chain.pendingTransactions.length,
    });
});

app.get('/debug', (req, res) => {
    const config = require('./Config');
    let confirmedBalances = node.chain.calcAllConfirmedBalances();
    res.json({node, config, confirmedBalances});
});

app.get('/debug/mine/:minerAddress/:difficulty', (req, res) => {
    let minerAddress = req.params.minerAddress;
    let difficulty = parseInt(req.params.difficulty) || 3;
    let result = node.chain.mineNextBlock(minerAddress, difficulty);
    if (result.errorMsg)
        res.status(HttpStatus.BAD_REQUEST);
    res.json(result);
});

app.get('/blocks', (req, res) => {
    res.json(node.chain.blocks);
});

app.get('/blocks/:index', (req, res) => {
    let index = req.params.index;
    let block = node.chain.blocks[index];
    if (block)
        res.json(block);
    else
        res.status(HttpStatus.NOT_FOUND).json({errorMsg: "Invalid block index"});
});

app.get('/transactions/pending', (req, res) => {
    res.json(node.chain.getPendingTransactions());
});

app.get('/transactions/confirmed', (req, res) => {
    res.json(node.chain.getConfirmedTransactions());
});

app.get('/transactions/:tranHash', (req, res) => {
    let tranHash = req.params.tranHash;
    let transaction = node.chain.getTransactionByHash(tranHash);
    if (transaction)
        res.json(transaction);
    else
        res.status(HttpStatus.NOT_FOUND).json({errorMsg: "Invalid transaction hash"});
});

app.get('/address/:address/transactions', (req, res) => {
    let address = req.params.address;
    let tranHistory = node.chain.getTransactionHistory(address);
    res.json(tranHistory);
});

app.get('/address/:address/balance', (req, res) => {
    let address = req.params.address;
    let balance = node.chain.getAccountBalance(address);
    if (balance.errorMsg)
        res.status(HttpStatus.NOT_FOUND);
    res.json(balance);
});

app.post('/transactions/send', (req, res) => {
    let sendResult = node.sendNewTransaction(req.body);
    if (sendResult.transactionDataHash) {
        res.status(HttpStatus.CREATED).json({
            transactionDataHash: tran.transactionDataHash
        });
        // TODO: send the transaction to all known peers
    }
    else
        res.status(HttpStatus.BAD_REQUEST).json(sendResult);
});

app.get('/peers', (req, res) => {
    res.json(node.peers);
});

app.post('/peers/connect', (req, res) => {
    let peerUrl = req.body.peerUrl;
    if (peerUrl === undefined)
        return res.status(HttpStatus.BAD_REQUEST)
            .json({errorMsg: "Missing 'peerUrl' in the request body"});

    logger.debug("Trying to connect to peer: " + peerUrl);
    axios.get(peerUrl + "/info")
        .then(function(result) {
            if (node.peers[result.data.nodeId]) {
                logger.debug("Error: already connected to peer: " + peerUrl);
                res.status(HttpStatus.CONFLICT)
                    .json({errorMsg: "Already connected to peer: " + peerUrl});
            }
            else {
                node.peers[result.data.nodeId] = peerUrl;
                logger.debug("Successfully connected to peer: " + peerUrl);
                node.syncChainFromPeerInfo(result.data);
                res.json({message: "Connected to peer: " + peerUrl});

                // Try to connect back the remote peer to self
                axios.post(peerUrl + "/peers/connect", {peerUrl: node.selfUrl})
                    .then(function(){}).catch(function(){})
            }
        })
        .catch(function(error) {
            logger.debug(`Error: connecting to peer: ${peerUrl} failed.`);
            res.status(HttpStatus.BAD_REQUEST).json(
                {errorMsg: "Cannot connect to peer: " + peerUrl});
        });
});

app.get('/mining/get-mining-job/:address', (req, res) => {
    let address = req.params.address;
    let blockCandidate = node.chain.getMiningJob(address);
    res.json({
        index: blockCandidate.index,
        transactionsIncluded: blockCandidate.transactions.length,
        difficulty: blockCandidate.difficulty,
        expectedReward: blockCandidate.transactions[0].value,
        rewardAddress: blockCandidate.transactions[0].to,
        blockDataHash: blockCandidate.blockDataHash,
    });
});

app.post('/mining/submit-mined-block', (req, res) => {
    let blockDataHash = req.body.blockDataHash;
    let dateCreated = req.body.dateCreated;
    let nonce = req.body.nonce;
    let blockHash = req.body.blockHash;
    let result = node.chain.submitMinedBlock(
        blockDataHash, dateCreated, nonce, blockHash);
    if (result.errorMsg)
        res.status(HttpStatus.BAD_REQUEST).json(result);
    else {
        res.json({"message":
            `Block accepted, reward paid: ${result.transactions[0].value} microcoins`
        });
        node.notifyPeersAboutNewBlock();
    }
});

app.post('/blocks/notify-new-block', (req, res) => {
    node.syncChainFromPeerInfo(req.body);
    res.json({ message: "Thank you for the notification." });
});

node.notifyPeersAboutNewBlock = async function() {
    let notification = {
        blocksCount: node.chain.blocks.length,
        cumulativeDifficulty: node.chain.calcCumulativeDifficulty(),
        nodeUrl: node.selfUrl
    };
    for (let nodeId in node.peers) {
        let peerUrl = node.peers[nodeId];
        logger.debug(`Notifying peer ${peerUrl} about the new block`);
        axios.post(peerUrl + "/blocks/notify-new-block", notification)
            .then(function(){}).catch(function(){})
    }
};

node.syncChainFromPeerInfo = async function(peerChainInfo) {
    try {
        let thisChainLen = node.chain.blocks.length;
        let peerChainLen = peerChainInfo.blocksCount;
        let thisChainDiff = node.chain.calcCumulativeDifficulty();
        let peerChainDiff = peerChainInfo.cumulativeDifficulty;
        if (peerChainLen > thisChainLen && peerChainDiff > thisChainDiff) {
            logger.debug(`Chain sync started. Peer: ${peerChainInfo.nodeUrl}. Expected chain length = ${peerChainLen}, expected cummulative difficulty = ${peerChainDiff}.`);
            let blocks = (await axios.get(peerChainInfo.nodeUrl + "/blocks")).data;
            node.chain.processLongerChain(blocks);
        }
    } catch (err) {
        logger.error("Error loading the chain: " + err);
    }
};

node.startServer = function() {
    server = app.listen(node.port, () => {
        logger.info(`Server started at ${node.selfUrl}`);
    });
    return server;
};

node.app = app;

module.exports = node;
