#!/usr/bin/env node
var express = require('express');
var app = express();
var expressws = require('express-ws')(app);
var session = require('express-session');
var clients = expressws.getWss('/').clients;

app.use(express.static('static'));
app.use(session({
	secret: 'thisisasecret',
	resave: false,
	saveUninitialized: false,
}));
app.set('view engine', 'ejs');

app.get('/tpl', function(req, res, next) {
	res.render('test', {title: 'hello'});
});

app.get('/setsess', function(req, res, next) {
	req.session.a = 42;
	res.send('hello');
});

app.ws('/', function (ws, req) {
	ws.on('message', function (msg) {
		//console.log(msg);
		console.log(msg+", "+req.session.a);
		for (c in clients)
			clients[c].send(msg);
	});
});

app.listen(8080);
