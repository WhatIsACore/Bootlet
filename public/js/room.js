'use strict';

var username = document.getElementById('username');
var setUsername = document.getElementById('set-username');
var voteReady = document.getElementById('vote-ready');
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
var Player = function(id, username, vote, self){
  this.id = id;
  this.username = username;
  this.vote = vote;
  this.self = false;
  this.score = 0;
}
var playerlist = document.getElementById('playerlist');

setUsername.addEventListener('click', function(){
  if(username.value.length > 0){
    socket = io();
    socket.emit('joinroom', params.room, username);

    socket.on('joinfail', function(){
      changePanel('join-fail');
    });

    socket.on('joinsuccess', function(playerlist, id, username){
      for(var i = 0, j = playerlist.length; i < j; i++){
        var p = playerlist[i];
        players.push(new Player(p[0], p[1], p[2], false));
        changePanel('lobby');
        updatePlayers();
      }
      players.push(id, username, false, true);
    });

    socket.on('newplayer', function(id, username){
      players.push(new Player(id, username, false));
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
        var p = playerlist[i];
        if(p.id === id){
          players[i].vote = true;
          break;
        }
      }
      updatePlayers();
    });

    socket.on('disconnect', function(){
      socket.disconnect();
    })
  }
});

voteReady.addEventListener('click', function(){
  socket.emit('vote');
});

function updatePlayers(){
  var res = '';
  for(var i = 0, j = players.length; i < j; i++){
    res += '<div class="player ' + players[i].vote + '">' + players[i].username + '</div>';
  }
  playerlist.innerHTML = players;
}
