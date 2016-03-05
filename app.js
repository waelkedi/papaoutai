#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

var serve = serveStatic('static');//, {'index': ['index.html', 'index.htm']});
var clients = [];

var server = http.createServer(function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	var done = finalhandler(request, response);
	serve(request, response, done);
});
server.listen(8080, function() {
	console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
	httpServer: server,
	// You should not use autoAcceptConnections for production 
	// applications, as it defeats all standard cross-origin protection 
	// facilities built into the protocol and the browser.  You should 
	// *always* verify the connection's origin and decide whether or not 
	// to accept it. 
	autoAcceptConnections: false
});

function originIsAllowed(origin) {
	// put logic here to detect whether the specified origin is allowed. 
	return true;
}

wsServer.on('request', function(request) {
	if (!originIsAllowed(request.origin)) {
		// Make sure we only accept requests from an allowed origin 
		request.reject();
		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}

	var connection = request.accept("ws", request.origin);
	console.log((new Date()) + ' Connection accepted.');
	clients.push(connection);
	connection.on('message', function(message) {
		if (message.type !== 'utf8')
			return;
		console.log('Received Message: ' + message.utf8Data);
		//connection.sendUTF(message.utf8Data);
		for (c in clients) {
			clients[c].sendUTF(message.utf8Data);
		}
	});
	connection.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
		clients.splice(clients.indexOf(connection), 1);
	});
});
