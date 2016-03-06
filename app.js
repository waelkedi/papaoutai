#!/usr/bin/env node
var querystring = require('querystring');
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

app.get('/ask', function(req, res, next) {
	res.render('ask', {title: 'Demandes', children: [{id: 42, name: 'Toto'}]});
});

app.post('/ask', function(req, res, next) {
	var msg = req.body;
	msg.parent = "Parent"; //req.session.name;
	/*
	for (c in clients) {
		if (clients[c].upgradeReq.session.name == 'Titi') {
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
	var url = conf.whoami+'/reply?'+querystring.stringify(req.body);
	console.log(url);
	var descr = 'help meee :('; //FIXME
	var d = {
		data: {title: "Demande", message: descr,
			additionalData: {url: url}},
		to: conf.help,
	};
	r.end(JSON.stringify(d));
});

app.get('/reply', function(req, res, next) {
	console.log("reply");
	res.render('reply', {title: 'Réponse', q: req.query});
	console.log("reply");
});
app.post('/reply', function(req, res, next) {

});

app.get('/setsess', function(req, res, next) {
	req.session.name = req.query.name;
	res.send('hello');
});

app.ws('/', function (ws, req) {
	ws.on('message', function (msg) {
		console.log(msg+", "+req.session.name);
		for (c in clients)
			clients[c].send(msg);
	});
});

app.listen(8080, conf.whoami.substr(conf.whoami.indexOf('//')+2), function () {
	console.warn("I think I'm "+conf.whoami);
});
