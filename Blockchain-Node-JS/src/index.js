const program = require('commander')
    .option('-h, --host [host]', 'Server hostname / IP', 'localhost')
    .option('-p, --port [port]', 'Port number', 5555)
    .parse(process.argv);

const config = require('./Config');
const Blockchain = require("./Blockchain");
let chain = new Blockchain(config.genesisBlock, config.startDifficulty);

const SampleChainData = require('../test/SampleChainData');
SampleChainData.insertSampleChainData(chain);

const node = require('./Node');
node.init(program.host, program.port, chain);
node.startServer();
