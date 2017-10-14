var logger = require('winston');
const config = require('./includes/config');
var routing = require('./includes/routing');

var express = require('express'),
    app = express(),
    serv = require('http').Server(app);

// configure view engine
app.set('views', __dirname + '/public');
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use('/css', express.static('public/css'))
    .use('/js', express.static('public/js'))
    .use('/img', express.static('public/img'))
    .get('/', routing.render('index', false, 'index'))
    .get('/create', routing.render('create', 'Create a Bootlet', 'create'));

// start the server
serv.listen(config.port, function(){
  logger.log('info', 'starting server on port ' + config.port);
});
