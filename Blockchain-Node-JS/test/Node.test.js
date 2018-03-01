const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('Node', () => {
    const node = require('../src/Node');
    const app = node.app;

    beforeEach(() => {
        const serverHost = process.env.HTTP_HOST || "localhost";
        const serverPort = process.env.HTTP_PORT || 5555;
        node.init(serverHost, serverPort);
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
            expect(res.body).to.have.property('blocks');
            expect(res.body.nodeUrl).to.be.equal('http://localhost:5555');
            expect(res.body.blocks).to.be.equal(1);
            req.app.close();
        });
    });
});