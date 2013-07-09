var http = require('http')
var util = require('util');
var net = require('net');

var tcp_server = net.createServer(function (socket) {
  util.puts("Connection from " + socket.remoteAddress);
  socket.write("Hello World\n");
  socket.end();

  socket.on('end', function () {
  });
});

var http_server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello World\n");
});

http_server.listen(8000);
tcp_server.listen(7000);

console.log("HTTP server listening on port 8000");
console.log("TCP server listening on port 7000");

