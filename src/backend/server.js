import http from 'http';
import path from 'path';
import sirv from 'sirv';

import WebSocket from 'ws';
import WebSocketServerWrapper from 'ws-server-wrapper';

const HOST = 'localhost';
const PORT = process.env.PORT || 54733;
const SERVER_URL = `http://${HOST}:${PORT}`;

// serve up public folder
const assets = sirv(path.join(__dirname, 'public'));

// setup http server
const httpServer = http.createServer(function onRequest(req, res) {
	assets(req, res);
});

// setup ws server
const wss = new WebSocketServerWrapper(new WebSocket.Server({ server: httpServer }));

export { SERVER_URL, HOST, PORT, httpServer, wss };
