#!/usr/bin/env node

/* Setup dependencies */
var jade = require('jade');
var io = require('socket.io');
var express = require('express');
var clc = require('cli-color');

/* Port to listen on */
var port = 17231;

/* Application version */
var version = '0.1'

/* Initialize ExpressJS "app" */
var app = express(); 

/* Specify directories */
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/tpl');

/* Specify that the template engine we are using is Jade */
app.set('view engine', 'jade');
app.engine('jade', jade.__express);

/* Render view on default GET */
app.get('/', function(req, res){
    res.render('page');
});

var server = io.listen(app.listen(port));
console.log('Listening on port ' + port); 

/* Chat message handling */
server.sockets.on('connection', function (socket) {
    var address = socket.handshake.address.address;
    var port = socket.handshake.address.port;
    console.log(clc.blue('   debug - New connection from ' + address + ':' + port));

    socket.emit('message', { message: 'Browser Chat Client v' + version});
    
    socket.on('send', function (data) {
        data.message = address + ':' + port + '> ' + data.message;
        server.sockets.emit('message', data);
    });

    socket.on('data', function (data) {
        util.puts('Data <<' + data + '>>  from ' + socket.handshake.address.address  + ':' +  socket.handshake.address.port);
    });
});
