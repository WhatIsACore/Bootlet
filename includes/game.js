var mongoose = require('mongoose');
var db_StudySets = require('../models/studysets')

var rooms = {};
var Room = function(code, studyset){
  this.code = code;
  this.studyset = studyset;
  this.created = Date.now();
  this.sockets = {};
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
    id: code
  }).
  exec(function(err, studyset){
    if(err) logger.log('info', err);
    if(!result){
      fail();
    } else {
      var roomcode = Math.random().toString(36).slice(6);
      rooms[roomcode] = new Room(roomcode, code);
      success(roomcode);
    }
  });
}
