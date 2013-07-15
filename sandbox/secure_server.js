
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');

// This line is from the Node.js HTTPS documentation.
var options = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt'),
  ca: fs.readFileSync('cert/ca.crt')
};

// Create a service (the app object is just a callback).
var app = express(express.logger());

app.configure(function() {
    app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
    //res.render('test', {layout: false});
    res.end('hello');
});

// Create an HTTP service.
http.createServer(app).listen(80, function() {
    console.log('HTTP server running...');
});

// Create an HTTPS service identical to the HTTP service.
var server = https.createServer(options, app).listen(443, function() {
    console.log('HTTPS server running...');
});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    console.log('connection');

  var sender = setInterval(function () {
    socket.emit('data', new Date().getTime());
  }, 1000)

  socket.on('disconnect', function() {
    clearInterval(sender);
  })


});
