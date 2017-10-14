'use strict';

var logger = require('winston');
var url = require('url');

// render a page
function render(view, title, nav, params){
  var callback = function(req, res, next){
    res.render(view, {'title': title, 'nav': nav, 'profile': req.user ? req.user.profile : null, 'params': params});
  }
  return callback;
}
module.exports.render = render;
