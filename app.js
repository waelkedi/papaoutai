#!/usr/bin/env node
var express = require('express');
var app = express();
var expressws = require('express-ws')(app);
var session = require('express-session');
var bodyParser = require('body-parser');
var clients = expressws.getWss('/').clients;

app.use(express.static('static'));
app.use(session({
	secret: 'thisisasecret',
	resave: false,
	saveUninitialized: false,
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.get('/ask', function(req, res, next) {
	res.render('ask', {title: 'Demandes', children: [{id: 42, name: 'Toto'}]});
});

app.post('/ask', function(req, res, next) {
	//console.log(req.body);
	for (c in clients) {
		if (clients[c].upgradeReq.session.name == 'Titi') {
			var msg = req.body;
			msg.parent = req.session.name;
			clients[c].send(JSON.stringify(msg));
		}
	}
	res.end('bouh');
});

app.get('/setsess', function(req, res, next) {
	req.session.name = req.query.name;
	res.send('hello');
});

app.ws('/', function (ws, req) {
	ws.on('message', function (msg) {
		//console.log(msg);
		console.log(msg+", "+req.session.name);
		for (c in clients)
			clients[c].send(msg);
	});
});

app.listen(8080);
