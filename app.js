var express = require('express');
var debug = require('debug')('my-application');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var GitHubApi = require('github');
var github = new GitHubApi({
  version: '3.0.0'
});
github.authenticate({
  type: 'oauth',
  token: process.env.github
});

var routes = require('./routes/index');

var app = express();

app.set('port', process.env.PORT || 3000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
if (app.get('env') !== 'development') {
  app.enable('view cache');
}
app.set('trust proxy', 1);
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
var sessionConfig = {
  store: new RedisStore({
    host:process.env.redis,
    port:6379,
    pass:''
  }),
  secret: process.env.SECRET,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: null
  },
  resave: false,
  saveUninitialized: false
};

if (app.get('env') !== 'production') {
  sessionConfig.cookie.secure = false;
  sessionConfig.cookie.maxAge = 31536000000;
}

app.use(session(sessionConfig));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  var err = new Error('Страница не найдена');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  if (err.status !== 404) {
    github.issues.create({
      user: 'pomeo',
      repo: 'insalescallmaker',
      title: err.message.toString(),
      body: JSON.stringify(err.stack).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
      assignee: 'pomeo',
      labels: ['bug', 'programmer error']
    });
  }
  res.render('error', {
    message: err.message,
    error: {}
  });
});


var server = app.listen(app.get('port'), function() {
               debug('Express server listening on port ' + server.address().port);
             });
