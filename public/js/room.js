'use strict';

var username = document.getElementById('username');
var setUsername = document.getElementById('set-username');
var voteReady = document.getElementById('vote-ready');
var roomName = document.getElementById('room-name');
var joinCode = document.getElementById('join-code');
joinCode.innerHTML = 'Join Code: ' + params.room;
var socket;

var panels = document.getElementsByClassName('gamepanel');
function changePanel(target){
  var t = document.getElementById(target);
  for(var i in panels)
    if(panels[i].children)
      panels[i].className = 'gamepanel';
  t.className = 'gamepanel active';
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

    socket.on('disconnect', function(){
      socket.disconnect();
    })
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
