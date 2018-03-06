const config = require('./Config');

const serverHost = process.env.HTTP_HOST || config.defaultServerHost;
const serverPort = process.env.HTTP_PORT || config.defaultServerPort;

const Blockchain = require("./Blockchain");
let chain = new Blockchain(config.genesisBlock, config.startDifficulty);

const SampleChainData = require('../test/SampleChainData');
SampleChainData.insertSampleChainData(chain);

const node = require('./Node');
node.init(serverHost, serverPort, chain);
node.startServer();
