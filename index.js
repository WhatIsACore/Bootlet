var logger = require('winston');
const config = require('./includes/config');
var routing = require('./includes/routing');
var game = require('./includes/game');

// database
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(config.mongodb_key, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  useMongoClient: true
});
var db_StudySets = require('./models/studysets');

var express = require('express'),
    app = express(),
    serv = require('http').Server(app);
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();

// configure view engine
app.set('views', __dirname + '/public');
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(upload.array())
    .use('/css', express.static('public/css'))
    .use('/js', express.static('public/js'))
    .use('/img', express.static('public/img'))
    .post('/submit', function(req, res, next){
      var question = [];
      for(var i in req.body)
        if(i !== 'name'){
          var q = {
            question: req.body[i].question,
            answer: req.body[i].answer
          };
          question.push(q);
        }

      var id = Math.random().toString(36).substr(2, 6).toUpperCase();
      var studySet = {
        name: req.body.name,
        id: id,
        questions: question
      };
      studySet = db_StudySets(studySet);

      studySet.save(function(err){
        if(err){
          res.status(404).send('failed to save to database');
          console.log(err.message);
        } else {
          res.status(200).send(id);
        }
      });
    })
    .get('/', routing.render('index', false, 'index'))
    .get('/create', routing.render('create', 'Create a Bootlet', 'create'))
    .get('/room/*', function(req, res, next){
      game.verify(routing.getPath(req.url), function(){
        res.status(404).redirect('/');
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
      game.createRoom(routing.getPath(req.url), function(){
        res.status(200).send('false');
      }, function(room){
        res.status(200).send(room);
      });
    });

var io = require('socket.io')(serv);
io.on('connection', function(socket){

  socket.on('joinroom', function(code, username){
    game.connectClient(code, socket, username);
  });

  socket.on('disconnect', function(){
    socket.disconnect();
  });

});

// start the server
serv.listen(config.port, function(){
  logger.log('info', 'starting server on port ' + config.port);
});
