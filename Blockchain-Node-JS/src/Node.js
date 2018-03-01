let node = {
    // The `node` object holds the node data:
    // `host` - the external host / IP address to connect to this node
    // `port` - listening TCP port number
    // `selfUrl` - the external base URL of the REST endpoints
    // `peers` - a list of URLs of the peers, directly connected to this node
    // `chain` - the blockchain (blocks, transactions, balances, block candidates)
};

node.init = function(serverHost, serverPort) {
    node.host = serverHost;
    node.port = serverPort;
    node.selfUrl = `http://${serverHost}:${serverPort}`;
    node.peers = [];

    const Block = require("./Block");
    const Transaction = require("./Transaction");
    const Utils = require("./Utils");

    const faucetPrivateKey = 'd816f0c72ecc7dc1f0a8d5294676098ea0d5ee826f5c13c7026952ff8ea24fe4';
    const faucetAddress = Utils.privateKeyToAddress(faucetPrivateKey);
    const nullAddress = "0000000000000000000000000000000000000000";
    const nullPubKey = "00000000000000000000000000000000000000000000000000000000000000000";
    const nullSignature = [
        "0000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000000000000000000000000000000000"
    ];
    const startDifficulty = 5;
    const genesisDate = "2018-01-01T00:00:00.000Z";
    const genesisBlock = new Block(
        0, // block index
        [
            new Transaction(
                nullAddress,   // fromAddress
                faucetAddress, // toAddress
                1000000000000, // transactionValue
                0,             // fee
                genesisDate,   // dateReceived
                nullPubKey,    // senderPubKey
                undefined,     // transactionDataHash
                nullSignature, // senderSignature
                0,             // minedInBlockIndex
                true           // paid
            )
        ], // transactions array
        0,           // difficulty
        undefined,   // previous block hash
        nullAddress, // mined by (address)
        undefined,   // block data hash
        0,           // nonce
        genesisDate, // date created
        undefined    // block hash
    );

    const Blockchain = require("./Blockchain");
    node.chain = new Blockchain(genesisBlock, startDifficulty);
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
    res.json(node);
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
        res.status(HttpStatus.NOT_FOUND).json({});
});

app.get('/address/:address/transactions', (req, res) => {
    let address = req.params.address;
    let tranHistory = node.getTransactionHistory(address);
    if (balance.transactions)
        res.json(tranHistory);
    else
        res.status(HttpStatus.NOT_FOUND).json(tranHistory);
});

app.get('/address/:address/balance', (req, res) => {
    let address = req.params.address;
    let balance = node.getAccountBalance(address);
    if (balance.confirmedBalance)
        res.json(balance);
    else
        res.status(HttpStatus.NOT_FOUND).json(balance);
});

app.post('/transactions/send', (req, res) => {
    let sendResult = node.sendNewTransaction(req.body);
    if (sendResult.transactionHash)
        res.status(HttpStatus.CREATED).json(sendResult);
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
        res.status(409).json({ message: "Cannot add peer: " + peerUrl});
});

app.get('/mining/get-mining-job/:address', (req, res) => {
    let address = req.params.address;
    let blockCandidate = getMiningJob(address);
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
    let result = node.chain.submitMinedBlock(blockDataHash, dateCreated, nonce);
    if (result.errorMsg)
        res.status(HttpStatus.BAD_REQUEST);
    res.json(result);
});

node.startServer = function() {
    server = app.listen(node.port, () => {
        console.log(`Server started at ${node.selfUrl}`);
    });
    return server;
};

node.app = app;

module.exports = node;
