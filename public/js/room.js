'use strict';

var username = document.getElementById('username');
setUsername = document.getElementById('set-username');
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
  if(username.value.length > 0){
    socket = io();
    socket.emit('joinroom', params.code, username);

    socket.on('joinfail', function(){
      changePanel('join-fail');
    });

    socket.on('joinsuccess', function(playerlist){
      for(var i = 0, j = playerlist.length; i < j; i++){
        var p = playerlist[i];
        players.push(new Player(p[0], p[1]));
      }
    });

    socket.on('disconnect', function(){
      socket.disconnect();
    })
  }
});
