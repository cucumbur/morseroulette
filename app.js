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

// / route for ease of testing on dev machine
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
});

// /morseroulette route for sites that need .html (like itch)
app.get('/morseroulette/index.html', function (req, res) {
  res.sendFile(__dirname + '/index.html')
});

// /morseroulette route for production
app.get('/morseroulette', function (req, res) {
  res.sendFile(__dirname + '/index.html')
});



io.on('connection', function(socket){
  // Log the user id upon connection
  console.log('User ' + socket.id + " connected");
  socket.on('disconnect', function(){
    if (socket.matched){
      console.log("Sending signal that partner disconnected now.");
      socket.to(socket.morseroom).broadcast.emit('partner_disconnect');
    } else {
      waiting.pop(waiting.find(function(sock){return sock.id == socket.id;}));
    }
    console.log('User ' + socket.id + " disconnected");
  });



  // Connect with waiting user if the queue is not empty
  function tryMatch(){
    console.log(socket.id + " is searching for a match");
    socket.matched = false;
    socket.emit('matching');
    if (waiting.length > 0){
      //TODO: this is a stack not a queue, so popping could make people wait a long time...
      //FIXME: Not sure if socket is properly removed from queue on disconnect while waiting
      var other_socket = io.sockets.connected[waiting.pop()];
      if (other_socket && (!socket.matched && !other_socket.matched)) {
        console.log('Matched ' + socket.id + ' with ' + other_socket.id);
        socket.matched = true;
        other_socket.matched = true;
        // Create a private room from the two sock ids
        var room_name = 'r_id1' + socket.id + 'r_id2'+ other_socket.id;
        socket.join(room_name);
        other_socket.join(room_name);
        socket.morseroom = room_name;
        other_socket.morseroom = room_name;
        socket.to(room_name).emit('matched');
        socket.emit('matched');
      }
    } else {
      // Add this socket to the matchmaking queue if it is empty
      waiting.push(socket.id);
    }
  }
  tryMatch();


  // re-enter matchmaking when partner disconnects and leave the old room
  socket.on('partner_disconnect', function(){
    console.log(socket.id + " had their partner disconnect and will now enter matchmaking");
    socket.leave(socket.morseroom);
    tryMatch();
  });


  socket.on('morse_on', function(){
    if (socket.matched){
      socket.to(socket.morseroom).broadcast.emit('morse_on');
    }
  });
  socket.on('morse_off', function(){
    if (socket.matched){
      socket.to(socket.morseroom).broadcast.emit('morse_off');
    }
  });

  // This takes the list of rooms and makes sure it leaves the proper
  // room when their partner disconnects. (ie the id1id2 room)
  function selectMatchedRoom(socket) {
    var rooms = socket.rooms;
    if (rooms[1] != socket.id) {
      return rooms[1];
    }
    return rooms[0];
  }



});

http.listen(port, function () {
  console.log('Morseroulette server listening on ' + port);
});

// TODO:  Use namespaces or rooms so that all unmatched sockets will be placed
//        in one room, all matched ones are in their own room. This way,
//        already matched sockets wont get "new_user" messages
// TODO:  Disable morse_on and morse_off when not matchmaked
