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

// get last word in path from url
function getPath(requrl){
  requrl = url.parse(requrl).pathname.split('/');
  return requrl[requrl.length-1];
}
module.exports.getPath = getPath;
