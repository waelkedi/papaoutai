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

function androidNotify(title, message, url, destination, callback) {
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
				res.write(b); //FIXME
				callback();
			});
		}
		else
			console.log('HTTP error '+r.statusCode);
	});
	r.on('error', function (e) {
		console.log('connection error: '+e);
	});
	console.log(url); //FIXME
	var d = {
		data: {title: title, message: message, additionalData: {url: url}},
		to: destination,
	};
	r.end(JSON.stringify(d));
}

app.post('/ask', function(req, res, next) {
	var msg = req.body;
	msg.parent = "Parent"; //req.session.name;
	req.session.name = msg.parent; //FIXME
	var url = conf.whoami+'/reply?'+querystring.stringify(req.body);
	var descr = 'help meee :('; //FIXME
	androidNotify("Demande", descr, url, conf.help, function() {res.end('envoyé');});
});

app.get('/reply', function(req, res, next) {
	console.log("reply");
	req.session.name = "Aide"; //FIXME
	res.render('reply', {title: 'Réponse', q: req.query});
	console.log("reply");
});

var replies = {};
app.post('/reply', function(req, res, next) {
	var status;
	if (req.body.y)
		status = 'y';
	else if (req.body.p)
		status = 'p';
	else //if (req.body.n)
		status = 'n';
	var replier = req.session.name;
	var data = req.body; //FIXME
	if (req.body.parent in replies) {
		//update
		replies[req.body.parent].push(data);
		for (c in clients) {
			if (clients[c].upgradeReq.session.name == req.body.parent)
				clients[c].send(JSON.stringify(data));
		}
		res.end('envoyé ws');
	}
	else {
		//update & notify once
		replies[req.body.parent] = [data];
		var url = conf.whoami+'/status';
		var descr = 'Des réponses arrivent !';
		androidNotify("Statut de votre demande", descr, url, conf.parent, function() {
			res.end('envoyé notif GCM');
		});
	}
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

var ip = conf.whoami.substr(conf.whoami.indexOf('//')+2);
app.listen(8080, ip, function () {
	console.warn("I think I'm "+ip);
});
