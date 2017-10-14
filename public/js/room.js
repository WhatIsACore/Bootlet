'use strict';

var username = document.getElementById('username');
var setUsername = document.getElementById('set-username');
var voteReady = document.getElementById('vote-ready');
var roomName = document.getElementById('room-name');
var joinCode = document.getElementById('join-code');
joinCode.innerHTML = 'Join Code: <br><span class="roomcode-display">' + params.room + '</span>';
var socket;

var question0 = document.getElementById('question0');
var timer0 = document.getElementById('timer0');
var question1 = document.getElementById('question1');
var timer1 = document.getElementById('timer1');
var answers1 = document.getElementById('answers1');
var question2 = document.getElementById('question2');
var result2 = document.getElementById('result2');
var chosen2 = document.getElementById('chosen2');

var panels = document.getElementsByClassName('gamepanel');
function changePanel(target){
  var t = document.getElementById(target);
  for(var i in panels)
    if(panels[i].children)
      panels[i].className = 'gamepanel';
  t.className = 'gamepanel active';
}
var phases = document.getElementsByClassName('game-phase');
function changePhase(target){
  var t = document.getElementById(target);
  for(var i in phases)
    if(phases[i].children)
      phases[i].className = 'game-phase';
  t.className = 'game-phase active';
}

var players = [];
var self;
var Player = function(id, username, vote, self){
  this.id = id;
  this.username = username;
  this.vote = vote;
  this.self = self;
  this.score = 0;
}
var playerlist = document.getElementById('playerlist');

var questions = [];
var curq = 0;
var time = 0;
var interval;

setUsername.addEventListener('click', function(){
  if(username.value.length > 0){
    socket = io();
    var uname = username.value;
    socket.emit('joinroom', params.room, uname);

    socket.on('joinfail', function(){
      changePanel('join-fail');
    });

    socket.on('joinsuccess', function(currentplayerlist, cred, roomname){
      for(var i = 0, j = currentplayerlist.length; i < j; i++){
        var p = currentplayerlist[i];
        players.push(new Player(p.id, p.username, p.vote, false));
      }
      self = new Player(cred.id, cred.username, false, true)
      players.push(self);
      changePanel('lobby');
      updatePlayers();
      roomName.innerHTML = roomname;
    });

    socket.on('newplayer', function(id, name){
      players.push(new Player(id, name, false, false));
      updatePlayers();
    });

    socket.on('playerdisconnect', function(id){
      for(var i = 0, j = players.length; i < j; i++){
        var p = players[i];
        if(p.id === id){
          players.splice(i, 1);
          break;
        }
      }
      updatePlayers();
    });

    socket.on('vote', function(id){
      for(var i = 0, j = players.length; i < j; i++){
        var p = players[i];
        if(p.id === id){
          p.vote = true;
          break;
        }
      }
      updatePlayers();
    });

    socket.on('gamestarted', function(){
      changePanel('game');
    });

    socket.on('shuffle', function(q){
      questions = q;
    });

    socket.on('phase0', function(q){
      changePhase('phase0');
      curq = q;
      time = Date.now();
      question0.innerHTML = questions[curq].question;
      timer0.innerHTML = '';
      interval = setInterval(function(){
        var remainder = 3 - Math.floor((Date.now() - time) / 1000);
        if(remainder > -1){
          timer0.innerHTML = remainder;
        }
      }, 100);
    });

    socket.on('phase1', function(answers){
      changePhase('phase1');
      time = Date.now();
      question1.innerHTML = questions[curq].question;

      var res = '';
      for(var i = 0; i < 4; i++){
        res += '<div class="answer-option" data-value=' + answers[i] + '>';
        res += questions[answers[i]].answer;
        res += '</div>';
      }
      answers1.innerHTML = res;

      clearInterval(interval);
      interval = setInterval(function(){
        var remainder = (8 - (Date.now()-time)/1000) / 8 * 100;
        timer1.style.background = 'linear-gradient(90deg, #000 ' + remainder + '%, #fff ' + remainder + '%)';
      }, 100);
    });

    socket.on('phase2', function(correct, rank, inc){
      changePhase('phase2');
      clearInterval(interval);
    });

    socket.on('disconnect', function(){
      socket.disconnect();
    });
  }
});

voteReady.addEventListener('click', function(){
  voteReady.style.display = 'none';
  socket.emit('vote');
});

function updatePlayers(){
  var res = '';
  for(var i = 0, j = players.length; i < j; i++){
    res += '<div class="player ' + players[i].vote + (players[i].self ? ' self' : '') + '">' + players[i].username + (players[i].vote ? ' (ready)' : '') + '</div>';
  }
  playerlist.innerHTML = res;
}
