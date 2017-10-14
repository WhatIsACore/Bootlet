'use strict';

var addButton = document.getElementById('add-button');
var inputSets = document.getElementById('input-sets');
var submitButton = document.getElementById('submit-button');
var setname = document.getElementById('setname');

addButton.addEventListener('click', function(){
  inputSets.innerHTML += `
    <div class='input-set'>
      <input type='text' maxlength='40' class='form-input term' placeholder='term'>
      <input type='text' maxlength='40' class='form-input definition' placeholder='definition'>
    </div>
  `;
});

submitButton.addEventListener('click', function(){
  var inputSet = document.getElementsByClassName('input-set');
  if(setname.value.length > 0
  && inputSet[0].children[0].value.length > 0
  && inputSet[0].children[1].value.length > 0){
    var data = new FormData();
    data.append('name', setname.value);
    for(var i in inputSet) if(inputSet[i].children){
      var s = inputSet[i].children;
      if(s[0].value.length > 0 && s[1].value.length > 0){
        data.append('inputset'+i, {
          question: s[0].value,
          answer: s[1].value
        });
      }
    }
    var req = new XMLHttpRequest();
    req.open('POST', '/submit', true);
    req.onreadystatechange = function(){
      if(req.readyState == XMLHttpRequest.DONE){
      }
    }
    req.send(data);
  }
});
