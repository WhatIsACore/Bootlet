var logger = require('winston');
var mongoose = require('mongoose');
var db_StudySets = require('../models/studysets')

var rooms = {};
var Room = function(code, studyset){
  this.code = code;
  this.name = studyset.name;
  this.questions = studyset.questions;
  this.created = Date.now();
  this.players = [];
  this.lobbystate = 0; // 0 = lobby, 1 = game, 2 = results
  this.questionstage = 0; // 0 = question, 1 = answering, 2 = results
}
Room.prototype.checkVotes = function(){
  if(this.players.length > 1 && this.state === 0){
    var votes = 0;
    for(var i = 0, j = this.players.length; i < j; i++){
      if(this.players[i].vote) votes++;
    }
    if(votes * 2 > this.players.length){
      this.lobbystate = 1;
    }
  }
}
var Player = function(username, socket, id){
  this.username = username;
  this.socket = socket;
  this.id = id;
  this.vote = false;
  this.score = 0;
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
      var roomcode = Math.random().toString(36).substr(2, 6).toUpperCase();
      rooms[roomcode] = new Room(roomcode, code);
      logger.log('info', 'created new room ' + roomcode);
      success(roomcode);
    }
  });
}
module.exports.createRoom = createRoom;

function connectClient(code, socket, username){
  var id = Math.round(Math.random()*100000);
  var p = new Player(username, socket, id);
  socket.player = p;
  socket.id = id;
  var r = rooms[code];

  if(r && r.lobbystate === 0 && r.sockets.length < 5){
    r.players.push(socket);

    var currentPlayerList = [];
    for(var i = 0, j = r.players.length; i < j; i++){
      r.players[i].socket.emit('newplayer', socket.id, username);
      currentPlayerList.push([r.players[i].id, r.players[i].socket.username]);
    }
    socket.emit('joinsuccess', currentPlayerList);
    r.players.push(p);

    socket.on('vote', function(){
      socket.player.vote = true;
      r.checkVotes();
    });

    socket.on('disconnect', function(){
      for(var i = 0, j = r.players.length; i < j; i++){
        if(r.players[i].id === socket.id){
          r.players.splice(i, 1);
          break;
        }
      }
      for(var i = 0, j = r.players.length; i < j; i++){
        r.players[i].socket.emit('playerdisconnect', socket.id);
      }
      socket.disconnect();
    });

  } else {
    socket.emit('joinfail');
    socket.disconnect();
  }
}
module.exports.connectClient = connectClient;
