var logger = require('winston');
const config = require('./includes/config');
var routing = require('./includes/routing');
var game = require('./includes/game');

var express = require('express'),
    app = express(),
    serv = require('http').Server(app);

// database
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(config.mongodb_key, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  useMongoClient: true
});

// configure view engine
app.set('views', __dirname + '/public');
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use('/css', express.static('public/css'))
    .use('/js', express.static('public/js'))
    .use('/img', express.static('public/img'))
    .get('/', routing.render('index', false, 'index'))
    .get('/create', routing.render('create', 'Create a Bootlet', 'create'))
    .get('/room/*', function(req, res, next){
      game.verify(routing.getPath(req.url), function(){
        res.status(404).send('room not found');
      }, function(){
        routing.render('room', 'In Game', 'room', {room: routing.getPath(req.url)})(req, res, next);
      });
    })
    .get('/checkroom/*', function(req, res, next){
      game.verify(routing.getPath(req.url), function(){
        res.status(200).send('false');
      }, function(){
        res.status(200).send('true');
      });
    })
    .get('/checkstudyset/*', function(req, res, next){
      var code = routing.getPath(req.url);
      game.createRoom(code, function(){
        res.status(200).send('false');
      }, function(room){
        res.status(200).send(room);
      });
    });

// start the server
serv.listen(config.port, function(){
  logger.log('info', 'starting server on port ' + config.port);
});
