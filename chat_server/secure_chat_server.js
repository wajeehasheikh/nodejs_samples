#!/usr/bin/env node

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

/* Application version */
var version = '0.1'

/* Initialize ExpressJS "app" */
var app = express(express.logger()); 

app.configure(function () {
  /* Use Cookie middle ware */
  app.use(express.cookieParser('test'));

  /* Use session middle ware */
  app.use(express.session({secret: 'secret', key: 'express.sid'}));
  
  /* Custom middleware to check for and set cookies */
  app.use(function (req, res, next) {
    /* Check if the client has sent a cookie */
    var cookie = req.signedCookies.cookieName;
    console.log(clc.yellow('   debug - Cookie: ' + cookie + ", URL: " + req.url));

    if (cookie === undefined) {
      res.cookie('cookieName', 123456789, {maxAge: 900000, httpOnly: false, signed: true});
      console.log(clc.yellow('   debug - Cookie created successfully'));
      authenticated = false;
    } else {
      /* The cookie is already present */ 
      console.log(clc.yellow('   debug - Cookie exists: ' + cookie));
      authenticated = true;
    } 
    
    /* Invoke the next middleware */
    next();
  });
  
  /* Use the Static middleware to specify that all static content is
     to be served from the "./public" directory */
  app.use(express.static(__dirname + '/public'));
});

/* Specify directories */


/* Specify that the template engine we are using is Jade and set
   the template directory */
app.set('view engine', 'jade');
app.engine('jade', jade.__express);
app.set('views', __dirname + '/tpl');

/* Render view on default GET */
app.get('/', function(req, res){
    if(!authenticated) {
        res.render('secure_login');
    } else {
        res.render('secure_page');
    }
});

/* Render the chat page if everything is in order */
app.get('/success', function(req, res){
    res.render('secure_page');
});

/* Create HTTP server  */
var http_server = http.createServer(app).listen(80, function() {
    console.log(clc.yellow('   debug - HTTP server running...'));
});

/* Create HTTPS server */
var https_server = https.createServer(options, app).listen(443, function() {
    console.log(clc.yellow('   debug - HTTPS server running...'));
});

/* Create the socket.io server */
var server = io.listen(https_server);
console.log(clc.yellow('   debug - socket.io server running')); 

/* Connection handling */
server.sockets.on('connection', function (socket) {
    /* Print client particulars */
    var address = socket.handshake.address.address;
    var port = socket.handshake.address.port;
    console.log(clc.yellow('   debug - New connection from ' + address + ':' + port));

    /* On 'send' event from client */
    socket.on('send', function (data) {
        data.message = address + ':' + port + '> ' + data.message;
        server.sockets.emit('message', data);
    });

    /* On 'login' evemt from client */
    socket.on('login', function (data) {
        console.log(clc.yellow('   debug - Data <<' + data.username + ',' + data.password + '>>  from ' + socket.handshake.address.address  + ':' +  socket.handshake.address.port));
        console.log(clc.yellow('   debug - Authenticated: ' + authenticated));
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