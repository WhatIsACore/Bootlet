var logger = require('winston');
var mongoose = require('mongoose');
var db_StudySets = require('../models/studysets')

var rooms = {};
var Room = function(code, studyset){
  this.code = code;
  this.name = studyset.name;
  this.questions = studyset.questions;
  this.created = Date.now();
  this.sockets = [];
  this.lobbystate = 0; // 0 = lobby, 1 = game, 2 = results
  this.questionstage = 0; // 0 = question, 1 = answering, 2 = results
}
Room.prototype.checkVotes = function(){
  if(this.sockets.length > 1 && this.state === 0){
    var votes = 0;
    for(var i = 0, j = this.sockets.length; i < j; i++){
      if(this.sockets[i].vote) votes++;
    }
    if(votes * 2 > this.sockets.length){
      this.lobbystate = 1;
    }
  }
}

function verify(code, fail, success){
  if(rooms[code]){
    success();
  } else {
    fail();
  }
}
module.exports.verify = verify;

function createRoom(code, fail, success){
  db_StudySets.findOne({
    'id': code
  }).
  select({
    '_id': 0
  }).
  exec(function(err, studyset){
    if(err){
      logger.log('info', err);
      return fail();
    }
    if(studyset == null){
      fail();
    } else {
      var roomcode = Math.random().toString(36).slice(6).toUpperCase();
      rooms[roomcode] = new Room(roomcode, code);
      logger.log('info', 'created new room ' + roomcode);
      success(roomcode);
    }
  });
}
module.exports.createRoom = createRoom;

function connectClient(code, socket, username){
  socket.username = username;
  var r = rooms[code];
  if(r && r.lobbystate === 0 && r.sockets.length < 5){
    r.sockets.push(socket);
    socket.score = 0;
    socket.vote = false;
    var currentPlayerList = [];
    for(var i = 0, j = r.sockets.length; i < j; i++){
      r.sockets[i].emit('newplayer', socket.username);
      currentPlayerList.push(r.sockets[i].username);
    }
    socket.emit('joinsuccess', currentPlayerList);

    socket.on('vote', function(){
      socket.vote = true;
      r.checkVotes();
    });

  } else {
    socket.emit('joinfail');
  }
}
module.exports.connectClient = connectClient;
