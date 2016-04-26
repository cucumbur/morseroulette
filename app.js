var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 3010
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
  console.log('Space Morse server listening on ' + port);
});
