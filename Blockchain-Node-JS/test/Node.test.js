const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('Node', () => {
    const config = require('../src/Config');
    const node = require('../src/Node');
    const app = node.app;

    beforeEach(() => {
        const Blockchain = require("../src/Blockchain");
        let chain = new Blockchain(config.genesisBlock, config.startDifficulty);
        node.init(config.defaultServerHost, config.defaultServerPort, chain);
    });

    describe('GET /', () => {
        it('should return 200 OK', async () => {
            let req = chai.request(app).get('/');
            let res = await req;
            expect(res).to.have.status(200);
            req.app.close();
        });
    });

    describe('GET /info', () => {
        it('should return correct node info', async () => {
            let req = chai.request(app).get('/info');
            let res = await req;
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.have.property('nodeUrl');
            expect(res.body).to.have.property('blocksCount');
            expect(res.body.nodeUrl).to.be.equal('http://localhost:5555');
            expect(res.body.blocksCount).to.be.equal(1);
            req.app.close();
        });
    });
});
