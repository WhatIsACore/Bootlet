'use strict';

var gameCode = document.getElementById('game-code');
var studyCode = document.getElementById('study-code');
var enterGame = document.getElementById('enter-game');
var enterCreateGame = document.getElementById('enter-create-game');
var newStudySet = document.getElementById('new-study-set');

enterGame.addEventListener('click', function(){
  if(gameCode.value.length === 6){

    var req = new XMLHttpRequest();
    req.open('GET', '/checkroom/' + gameCode.value.toUpperCase(), true);
    req.onreadystatechange = function(){
      if(req.readyState == XMLHttpRequest.DONE){
        if(req.responseText === 'false' || !req.responseText){
          rejectRoom();
        } else {
          window.location.href = '/room/' + gameCode.value.toUpperCase();
        }
      }
    }
    req.send();

  } else {
    rejectRoom();
  }
});
function rejectRoom(){
  enterGame.innerHTML = 'Bad Code';
  setTimeout(function(){
    enterGame.innerHTML = 'Enter';
  }, 1500)
}

enterCreateGame.addEventListener('click', function(){
  if(studyCode.value.length === 6){

    var req = new XMLHttpRequest();
    req.open('GET', '/checkstudyset/' + studyCode.value.toUpperCase(), true);
    req.onreadystatechange = function(){
      if(req.readyState == XMLHttpRequest.DONE){
        if(req.responseText === 'false' || !req.responseText){
          rejectGame();
        } else {
          window.location.href = '/room/' + req.responseText;
        }
      }
    }
    req.send();

  } else {
    rejectGame();
  }
});
function rejectGame(){
  enterCreateGame.innerHTML = 'Bad Code';
  setTimeout(function(){
    enterCreateGame.innerHTML = 'Enter';
  }, 2000)
}

newStudySet.addEventListener('click', function(){
  window.location.href = '/create';
})

var buttons = document.getElementsByClassName('form-button');
var forms = document.getElementsByClassName('form');
var target;
for(var i in buttons)
  if(buttons[i].children)
    buttons[i].addEventListener('click', function(){
      if(this.dataset.target){
        var enabled = document.getElementsByClassName('enabled')[0];
        enabled.className = 'form fading';
        target = this.dataset.target;
        setTimeout(function(){
          for(var i in forms)
            if(forms[i].children)
              forms[i].className = 'form';
          document.getElementById(target).className = 'form enabled';
        }, 300);
      }
    })
