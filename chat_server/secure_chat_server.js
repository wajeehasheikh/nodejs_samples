#!/usr/bin/env node

// Note to my idiot self: Cookies are used for http/https state saving, Socket.io session authorization is for websocket connection authentication.

/* Setup dependencies */
var jade = require('jade');
var io = require('socket.io');
var express = require('express');
var https = require('https');
var http = require('http');
var clc = require('cli-color');
var fs = require('fs');
var util = require('util');
var connect =  require('connect');
var cookie  =   require('cookie');

var authenticated = false;

/* Specify keys and certificates */
var options = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt'),
  ca: fs.readFileSync('cert/ca.crt')
};

/* Port to listen on */
var port = 17231;

/* Application version */
var version = '0.1'

/* Initialize ExpressJS "app" */
var app = express(express.logger()); 

//==============================================================================
app.use(express.cookieParser());
app.use(express.session({secret: 'secret', key: 'express.sid'}));
app.use(function (req, res, next) {
  // check if client sent cookie
  var cookie = req.cookies.cookieName;
  console.log(clc.red("cookie: " + cookie + ", url: " + req.url));
  if (cookie === undefined)
  {
    res.cookie('cookieName', 123456789, { maxAge: 900000, httpOnly: false });
    console.log(clc.red('Cookie created successfully'));
    authenticated = false;
  } 
  else
  {
    // yes, cookie was already present 
    console.log(clc.red('Cookie exists: ' + cookie));
    authenticated = true;
  } 
  next(); // <-- important!
});
//==============================================================================

/* Specify directories */
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/tpl');

/* Specify that the template engine we are using is Jade */
app.set('view engine', 'jade');
app.engine('jade', jade.__express);

/* Render view on default GET */
app.get('/', function(req, res){
    if(!authenticated) {
        res.render('secure_login');
    } else {
        res.render('secure_page');
    }
});

app.get('/success', function(req, res){
    res.render('secure_page');
});

/* Create HTTP server  */
var http_server = http.createServer(app).listen(80, function() {
    console.log('HTTP server running...');
});

/* Create HTTPS server */
var https_server = https.createServer(options, app).listen(443, function() {
    console.log('HTTPS server running...');
});

var server = io.listen(https_server);
console.log('Listening on port ' + port); 

/* Chat message handling */
server.sockets.on('connection', function (socket) {
    var address = socket.handshake.address.address;
    var port = socket.handshake.address.port;
    console.log(clc.blue('   debug - New connection from ' + address + ':' + port));

    socket.on('send', function (data) {
        data.message = address + ':' + port + '> ' + data.message;
        server.sockets.emit('message', data);
    });

    socket.on('login', function (data) {
        console.log(clc.blue('   debug - Data <<' + data.username + ',' + data.password + '>>  from ' + socket.handshake.address.address  + ':' +  socket.handshake.address.port));
        console.log(clc.blue('   debug - Authenticated: ' + authenticated));
        socket.emit('redirect', { toUrl: 'success'});
    });
});

/* ... */
server.set('authorization', function (handshakeData, accept) {
  if (handshakeData.headers.cookie) {
    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
    console.log(clc.blue('   debug - URL: ' + handshakeData.url));
    console.log(clc.blue('   debug - Something happened, cookie eaten: ' + connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret')));
  }
  else
  {
    console.log(clc.blue('   debug - No cookie transmitted...'));
  }
      accept(null, true);
      //accept('ooga booga', false);
});