const chai = require('chai');
const expect = chai.expect;

describe('Blockchain', () => {
    const Blockchain = require('../src/Blockchain');
    const config = require('../src/Config');
    let chain = new Blockchain(config.genesisBlock, config.startDifficulty);
    const SampleChainData = require('./SampleChainData');
    SampleChainData.insertSampleChainData(chain);

    describe('Blockchain class component tests', () => {
        it('should insert transactions, mine and calculate correct balances', () => {
            let balances = chain.calcAllConfirmedBalances();
            expect(balances["f3a1e69b6176052fcc4a3248f1c5a91dea308ca9"])
                .to.be.equal(999998799980);
            expect(balances["84ede81c58f5c490fc6e1a3035789eef897b5b35"])
                .to.be.equal(10000060);
            expect(balances["a1de0763f26176c6d68cc77e0a1c2c42045f2314"])
                .to.be.equal(99960);
            expect(balances["b3d72ad831b3e9cdbdaeda5ff4ae8e9cf182e548"])
                .to.be.equal(1100000);
            expect(chain.pendingTransactions.length).to.be.equal(1);
        });
    });
});
