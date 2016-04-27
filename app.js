var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var program = require('commander');

var port = 3010
var waiting = []
// Command line option handler
program
  .version('0.2.0')
  .option('-p, --port <n>', 'Set server port number', parseInt)
  .parse(process.argv);
if (program.port) {
  port = program.port;
}


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
});

io.on('connection', function(socket){
  // Log the user id upon connection
  console.log('User ' + socket.id + " connected");
  socket.on('disconnect', function(){
    console.log('User ' + socket.id + " disconnected");
  });
  socket.matched = false;
  socket.emit('matching');

  // Connect with waiting user if the queue is not empty
  if (waiting.length > 0){
    //TODO: this is a stack not a queue, so popping could make people wait a long time...
    var other_socket = io.sockets.connected[waiting.pop()];
    if (!socket.matched && !other_socket.matched) {
      console.log('Matched ' + socket.id + ' with ' + other_socket.id);
      socket.matched = true;
      other_socket.matched = true;
      // Create a private room from the two sock ids
      var room_name = 'r_id1' + socket.id + 'r_id2'+ other_socket.id;
      socket.join(room_name);
      other_socket.join(room_name);
      socket.to(room_name).emit('matched');
      socket.emit('matched');
    }
  } else {
    // Add this socket to the matchmaking queue if it is empty
    waiting.push(socket.id);
  }

  // Check to see if anyone is waiting in the matchmaking queue, and if so, try connecting to them
  // REVIEW: Is this atomic? Does this cause bugs if multiple people try to matchmake at the same time?


  socket.on('morse_on', function(){
    socket.broadcast.emit('morse_on');
  });
  socket.on('morse_off', function(){
    socket.broadcast.emit('morse_off');
  });

});

http.listen(port, function () {
  console.log('Morseroulette server listening on ' + port);
});

// TODO:  Use namespaces or rooms so that all unmatched sockets will be placed
//        in one room, all matched ones are in their own room. This way,
//        already matched sockets wont get "new_user" messages
// TODO:  Disable morse_on and morse_off when not matchmaked
