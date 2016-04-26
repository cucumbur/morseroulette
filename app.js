var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var program = require('commander');

var port = 3010

// Command line option handler
program
  .version(0.2.0)
  .option('p, --port <n>', 'Set server port number', parseInt)
  .parse(process.argv);
if (program.port) {
  port = program.port
}


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('morse-on', function(){
    socket.broadcast.emit('morse-on');
  });
  socket.on('morse-off', function(){
    socket.broadcast.emit('morse-off');
  });


});

http.listen(port, function () {
  console.log('Morseroulette server listening on ' + port);
});
