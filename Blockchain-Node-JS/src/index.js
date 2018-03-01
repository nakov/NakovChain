const node = require('./Node');
const serverHost = process.env.HTTP_HOST || "localhost";
const serverPort = process.env.HTTP_PORT || 5555;
node.init(serverHost, serverPort);
node.startServer();
