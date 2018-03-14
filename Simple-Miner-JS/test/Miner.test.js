const chai = require('chai');
const expect = chai.expect;

describe('Miner', () => {
    const miner = require('../src/Miner');

    describe('mine()', () => {
        it('should mine correct proof-of-work hash', async () => {
            let block = {
                difficulty: 1,
                blockDataHash:
                    "5dad5ffd5f5e0f5f3ecc37d24f7ffc90f2eca4ac8e2120501db5be5b85068007"
            };
            await miner.mine(block);
            expect(block).to.have.property('nonce');
            expect(block).to.have.property('dateCreated');
            expect(block).to.have.property('blockHash');
            let isValidDifficulty = miner.isValidDifficulty(
                block.blockHash, block.difficulty);
            expect(isValidDifficulty).to.be.true;
        });
    });
});
