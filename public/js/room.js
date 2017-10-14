'use strict';

var username = document.getElementById('username');
var setUsername = document.getElementById('set-username');
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
var Player = function(id, username){
  this.id = id;
  this.username = username;
}

setUsername.addEventListener('click', function(){
  console.log('hmmm');
  if(username.value.length > 0){
    socket = io();
    socket.emit('joinroom', params.code, username);
    console.log('joining room');

    socket.on('joinfail', function(){
      changePanel('join-fail');
    });

    socket.on('joinsuccess', function(playerlist){
      for(var i = 0, j = playerlist.length; i < j; i++){
        var p = playerlist[i];
        players.push(new Player(p[0], p[1]));
        changePanel('lobby');
        updatePlayers();
      }
    });

    socket.on('newplayer', function(id, username){
      players.push(new Player(id, username));
      updatePlayers();
    });

    socket.on('playerdisconnect', function(id){
      for(var i = 0, j = playerlist.length; i < j; i++){
        var p = playerlist[i];
        if(p.id === id){
          playerlist.splice(i, 1);
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

function updatePlayers(){
  document.getElementById('lobby').innerHTML = players;
}
