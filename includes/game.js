var logger = require('winston');
var mongoose = require('mongoose');
var db_StudySets = require('../models/studysets');

var rooms = {};
var Room = function(code, studyset){
  this.code = code;
  this.name = studyset.name;
  this.questions = shuffle(studyset.questions);
  this.created = Date.now();
  this.players = [];
  this.lobbystate = 0; // 0 = lobby, 1 = game, 2 = results
  this.questionstage = 0; // 0 = question, 1 = answering, 2 = results
  this.answered = 0;
  this.curquestion = -1;
  this.timer = 0;
  this.winner = null;
  this.timeout;
}
Room.prototype.checkVotes = function(){
  if(this.players.length > 1 && this.lobbystate === 0){
    var votes = 0;
    for(var i = 0, j = this.players.length; i < j; i++){
      if(this.players[i].vote) votes++;
    }
    if(votes === this.players.length){
      setTimeout(function(self){
        self.lobbystate = 1;
        self.initializeGame();
      }, 500, this);
    }
  }
}
Room.prototype.initializeGame = function(){
  for(var i = 0, j = this.players.length; i < j; i++){
    this.players[i].socket.emit('gamestarted');
  }
  this.startPhase0();
}
Room.prototype.startPhase0 = function(){
  this.phase = 0;
  this.answered = 0;
  this.curquestion++;
  var q = this.curquestion;
  this.timer = Date.now();

  for(var i = 0, j = this.players.length; i < j; i++){
    this.players[i].socket.emit('shuffle', this.questions);
    this.players[i].answer = -1;
    this.players[i].answerrank = 6;
    this.players[i].socket.emit('phase0', q);
  }
  this.timeout = setTimeout(function(self){
    self.startPhase1();
  }, 3000, this);
}
Room.prototype.startPhase1 = function(){
  this.phase = 1;
  this.timer = Date.now();

  var answers = [];
  answers.push(this.curquestion);
  var l = this.questions.length;

  while(answers.length < 4){
    var n = Math.floor(Math.random() * l);
    if(answers.indexOf(n) === -1) answers.push(n);
  }

  for(var i = 0, j = this.players.length; i < j; i++)
    this.players[i].socket.emit('phase1', shuffle(answers));

  this.timeout = setTimeout(function(self){
    self.startPhase2();
  }, 8000, this);
}
Room.prototype.startPhase2 = function(){
  this.phase = 2;
  var rank = 1;
  this.players.sort(function(a, b){
    return a.answerrank - b.answerrank;
  });

  for(var i = 0, j = this.players.length; i < j; i++){
    var p = this.players[i];
    if(p.answer === this.curquestion){
      var inc = Math.floor((10 / (rank+1)) - 0.1);
      p.score += inc;
      p.socket.emit('phase2', true, rank, inc, p.score);
      rank++;
    } else {
      p.socket.emit('phase2', false, false, 0, p.score);
    }
  }

  this.timeout = setTimeout(function(self){
    self.evaluate();
  }, 4000, this);
}
Room.prototype.evaluate = function(){
  this.players.sort(function(a, b){
    return a.score - b.score;
  });
  for(var i = 0, j = this.players.length; i < j; i++){
    var p = this.players[i];
    if(p.score > 30){
      this.winner = p.id;
      break;
    }
  }
  if(this.winner != null){
    this.lobbystate = 2;
    this.showResults();
  } else {
    if(this.curquestion >= this.questions.length - 1){
      this.questions = shuffle(this.questions);
      this.curquestion = -1;
    }
    this.startPhase0();
  }
}
Room.prototype.showResults = function(){
  var res = [];
  for(var i = 0, j = this.players.length; i < j; i++)
    res.push({
      username: p.username,
      id: p.id,
      score: p.score
    });
  for(var i = 0, j = this.players.length; i < j; i++)
    this.players[i].socket.emit('results', res);
}

var Player = function(username, socket, id){
  this.username = username;
  this.socket = socket;
  this.id = id;
  this.vote = false;
  this.score = 0;
  this.answer = -1;
  this.answerrank = 6;
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
      rooms[roomcode] = new Room(roomcode, studyset);
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

  if(r && r.lobbystate === 0 && r.players.length < 5){

    var currentPlayerList = [];
    for(var i = 0, j = r.players.length; i < j; i++){
      r.players[i].socket.emit('newplayer', socket.id, username);
      currentPlayerList.push({
        id: r.players[i].id,
        username: r.players[i].username,
        vote: r.players[i].vote
      });
    }

    socket.emit('joinsuccess', currentPlayerList, {id: id, username: username}, r.name);
    r.players.push(p);

    socket.on('vote', function(){
      p.vote = true;
      for(var i = 0, j = r.players.length; i < j; i++)
        r.players[i].socket.emit('vote', socket.id);

      r.checkVotes();
    });

    socket.on('answer', function(n){
      if(p.answer !== n){
        p.answer = n;
        p.answerrank = r.answered;
        r.answered++;
      }

      var answered = 0;
      for(var i = 0, j = r.players.length; i < j; i++)
        if(r.players[i].answer !== -1) answered++;

      if(answered === r.players.length && r.phase === 1)
        setInterval(function(self){
          if(self.phase === 1){
            clearTimeout(self.timeout);
            self.startPhase2();
          }
        }, 500, this);

    });

    socket.on('disconnect', function(){
      for(var i = 0, j = r.players.length; i < j; i++)
        if(r.players[i].id === socket.id){
          r.players.splice(i, 1);
          break;
        }

      for(var i = 0, j = r.players.length; i < j; i++)
        r.players[i].socket.emit('playerdisconnect', socket.id);

      r.checkVotes();

      if(r.players.length < 1){
        clearTimeout(rooms[r.code].timeout);
        delete rooms[r.code];
      }

      socket.disconnect();
    });

  } else {
    socket.emit('joinfail');
    socket.disconnect();
  }
}
module.exports.connectClient = connectClient;

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while(0 !== currentIndex){
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
