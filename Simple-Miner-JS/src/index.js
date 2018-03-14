const program = require('commander')
    .option('-h, --host [host]', 'Node hostname / IP', 'localhost')
    .option('-p, --port [port]', 'Node port number', 5555)
    .option('-a, --address [port]', 'Miner blockchain address',
        "84ede81c58f5c490fc6e1a3035789eef897b5b35")
    .parse(process.argv);

const miner = require('./Miner');
miner.init(program);
miner.startInfiniteMining();
