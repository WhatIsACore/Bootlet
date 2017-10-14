'use strict';

function moduleAvailable(name){
  try {
    require.resolve(name);
    return true;
  } catch(e){}
  return false;
}

// test for environment by checking existence of keys module (ignored by git) and load the relevant config
// hide secret keys and certificates in either local keys.js module or as heroku environment variables
var Keys;
if(moduleAvailable('./keys')){
  Keys = require('./keys');
} else {
  Keys = process.env;
}

module.exports = {
  mongodb_key: Keys.mongodb_key,
  debug: moduleAvailable('./keys'),
  port: Keys.PORT || 5000,
};
