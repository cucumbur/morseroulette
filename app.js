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

  socket.on('keydown', function(){
    socket.broadcast.emit('keydown');
  });
  socket.on('keyup', function(){
    socket.broadcast.emit('keyup');
  });


});

http.listen(port, function () {
  console.log('Space Morse server listening on ' + port);
});
