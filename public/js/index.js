'use strict';

var buttons = document.getElementsByClassName('form-button');
var forms = document.getElementsByClassName('form');
var target;
for(var i in buttons)
  if(buttons[i].children)
    buttons[i].addEventListener('click', function(){
      var enabled = document.getElementsByClassName('enabled')[0];
      enabled.className = 'form fading';
      target = this.dataset.target;
      setTimeout(function(){
        for(var i in forms)
          if(forms[i].children)
            forms[i].className = 'form';
        document.getElementById(target).className = 'form enabled';
      }, 300);
    })
