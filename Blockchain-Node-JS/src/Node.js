const Blockchain = require("./Blockchain");

let node = {
    host: '',    // the external host / IP address to connect to this node
    port: 0,     // listening TCP port number
    selfUrl: '', // the external base URL of the REST endpoints
    peers: [],   // a list of URLs of the peers, directly connected to this node
    chain: new Blockchain() // the blockchain (blocks, transactions, ...)
};

node.init = function(serverHost, serverPort, blockchain) {
    node.host = serverHost;
    node.port = serverPort;
    node.selfUrl = `http://${serverHost}:${serverPort}`;
    node.chain = blockchain;
    node.peers = [];
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
        "about": "NakovChain/0.1-js",
        "nodeUrl": node.selfUrl,
        "peers": node.peers.length,
        "difficulty": node.chain.difficulty,
        "blocks": node.chain.blocks.length,
        "cumulativeDifficulty": node.chain.calcCumulativeDifficulty(),
        "confirmedTransactions": node.chain.getConfirmedTransactions().length,
        "pendingTransactions": node.chain.pendingTransactions.length,
    });
});

app.get('/debug', (req, res) => {
    const config = require('./Config');
    const confirmedBalances = node.chain.calcAllConfirmedBalances();
    res.json({node, config, confirmedBalances});
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
    if (balance.confirmedBalance)
        res.json(balance);
    else
        res.status(HttpStatus.NOT_FOUND).json(balance);
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

app.post('/blocks/notify', (req, res) => {
    node.notifyAboutNewBlock(req.body);
    res.json({ message: "Thank you for the notification." });
});

app.get('/peers', (req, res) => {
    res.json(node.peers);
});

app.post('/peers', (req, res) => {
    let peerUrl = req.body.peerUrl;
    if (node.registerNewPeer(peerUrl))
        res.json({ message: "Added peer: " + peerUrl});
    else
        res.status(409).json({ errorMsg: "Cannot add peer: " + peerUrl});
});

app.get('/mining/get-mining-job/:address', (req, res) => {
    let address = req.params.address;
    let blockCandidate = node.chain.getMiningJob(address);
    res.json({
        index: blockCandidate.index,
        transactionsIncluded: blockCandidate.transactions.length,
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
        res.status(HttpStatus.BAD_REQUEST);
    else {
        res.json({"message":
            `Block accepted, reward paid: ${result.transactions[0].value} microcoins`
        });
        // TODO: notify all peers
    }
});

node.startServer = function() {
    server = app.listen(node.port, () => {
        console.log(`Server started at ${node.selfUrl}`);
    });
    return server;
};

node.app = app;

module.exports = node;
