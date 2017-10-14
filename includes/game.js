var logger = require('winston');
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
  db_StudySets.count({'id': code}).
  exec(function(err, n){
    logger.log('info', 'hope');
    if(err){
      logger.log('info', err);
      return fail();
    }
    if(n < 1){
      fail();
    } else {
      db_StudySets.find({'id': code}).
      select('name questions').
      exec(function(err, studyset){
        var roomcode = Math.random().toString(36).slice(6).toUpperCase();
        rooms[roomcode] = new Room(roomcode, studyset);
        logger.log('info', 'created new room ' + roomcode);
        success(roomcode);
      });
    }
  });
}
module.exports.createRoom = createRoom;
