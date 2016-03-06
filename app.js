#!/usr/bin/env node
var conf = require('./conf');
var https = require('https');
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

/*
app.get('/ask', function(req, res, next) {
	res.render('ask', {title: 'Demandes', children: [{id: 42, name: 'Toto'}]});
});
*/

//app.post('/ask', function(req, res, next) {
app.get('/ask', function(req, res, next) {
	/*
	for (c in clients) {
		if (clients[c].upgradeReq.session.name == 'Titi') {
			var msg = req.body;
			msg.parent = req.session.name;
			clients[c].send(JSON.stringify(msg));
		}
	}
	*/
	var o = {
		hostname: conf.host, port: 443,
		path: conf.path, method: 'POST',
		rejectUnauthorized: false, requestCert: true,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'key='+conf.key,
		},
	};
	console.log(o.headers.Authorization);
	var b = '';
	var r = https.request(o, function(r) {
		if (r.statusCode == 200) {
			r.on('data', function (c) {b += c;});
			r.on('end', function (c) {
				res.end(b);
			});
		}
		else
			console.log('HTTP error '+r.statusCode);
	});
	r.on('error', function (e) {
		console.log('connection error: '+e);
	});
	var d = {data: {title: "Titre", message: "Youhouhou"}, to: conf.dest};
	r.end(JSON.stringify(d));
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
