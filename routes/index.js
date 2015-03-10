/* jshint node:true */
/* jshint laxbreak:true */
var express    = require('express'),
    router     = express.Router(),
    _          = require('lodash'),
    mongoose   = require('mongoose'),
    Schema     = mongoose.Schema,
    moment     = require('moment'),
    hat        = require('hat'),
    rest       = require('restler'),
    GitHubApi = require('github'),
    github = new GitHubApi({
      version: '3.0.0'
    }),
    crypto     = require('crypto'),
    cc         = require('coupon-code'),
    winston    = require('winston'),
    Logentries = require('winston-logentries');

github.authenticate({
  type: 'oauth',
  token: process.env.github
});

if (process.env.NODE_ENV === 'development') {
  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
  });
} else {
  var logger = new (winston.Logger)({
    transports: [
      new winston.transports.Logentries({token: process.env.logentries})
    ]
  });
}

router.get('/', function(req, res) {
  if (req.query.token && (req.query.token !== '')) {
    Apps.findOne({autologin:req.query.token}, function(err, a) {
      if (err) {
        log('Магазин id=' + req.query.insales_id + ' Ошибка: ' + err, 'error');
        res.status(500).send({ error: err });
        github.issues.create({
          user: 'pomeo',
          repo: 'insalescallmaker',
          title: 'Ошибка при запросе магазина по id, магазин id=' + req.query.insales_id,
          body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
          assignee: 'pomeo',
          labels: ['bug', 'operational error']
        });
      } else {
        if (a) {
          log('Магазин id=' + a.insalesid + ' Создаём сессию и перебрасываем на главную');
          req.session.insalesid = a.insalesid;
          res.redirect('/');
        } else {
          log('Ошибка автологина. Неправильный token при переходе из insales', 'warn');
          res.render('block', {
            msg : 'Ошибка автологина'
          });
        }
      }
    });
  } else {
    if (process.env.NODE_ENV === 'development') {
      req.session.insalesid = 74112;
    }
    var insid = req.session.insalesid || req.query.insales_id;
    log('Магазин id=' + insid + ' Попытка входа магазина');
    if ((req.query.insales_id &&
         (req.query.insales_id !== '')) ||
        req.session.insalesid !== undefined) {
      Apps.findOne({insalesid:insid}, function(err, app) {
        if (err) {
          log('Магазин id=' + req.query.insales_id + ' Ошибка: ' + err, 'error');
          res.status(500).send({ error: err });
          github.issues.create({
            user: 'pomeo',
            repo: 'insalescallmaker',
            title: 'Ошибка при запросе магазина по id, магазин id=' + insid,
            body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
            assignee: 'pomeo',
            labels: ['bug', 'operational error']
          });
        } else {
          if (app.enabled === true) {
            if (req.session.insalesid) {
              if (app.js === true) {
                res.render('main', {
                  domain : app.domain,
                  name   : app.name,
                  phone  : app.phone,
                  email  : app.email
                });
              } else {
                res.render('index');
              }
            } else {
              log('Авторизация ' + req.query.insales_id);
              var id = hat();
              app.autologin = crypto.createHash('md5')
                              .update(id + app.token)
                              .digest('hex');
              app.save(function (err) {
                if (err) {
                  res.status(500).send({ error: err });
                  github.issues.create({
                    user: 'pomeo',
                    repo: 'insalescallmaker',
                    title: 'Ошибка при сохранении токена автологина, магазин id=' + req.query.insales_id,
                    body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
                    assignee: 'pomeo',
                    labels: ['bug', 'operational error']
                  });
                } else {
                  res.redirect('http://' + app.insalesurl
                              + '/admin/applications/'
                              + process.env.insalesid
                              + '/login?token='
                              + id
                              + '&login=http://callmaker.salesapps.ru');
                }
              });
            }
          } else {
            res.render('block', {
              msg : 'Приложение не установлено для данного магазина'
            });
          }
        }
      });
    } else {
      res.render('block', {
        msg : 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти'
      });
    }
  }
});

router.get('/reg', function(req, res) {
  if (req.session.insalesid) {
    Apps.findOne({insalesid: req.session.insalesid}, function(err, app) {
      if (err) {
        log('Магазин id=' + req.session.insalesid + ' Ошибка: ' + err, 'error');
        res.status(500).send({ error: err });
        github.issues.create({
          user: 'pomeo',
          repo: 'insalescallmaker',
          title: 'Ошибка при запросе магазина по id, магазин id=' + req.session.insalesid,
          body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
          assignee: 'pomeo',
          labels: ['bug', 'operational error']
        });
      } else {
        if (app.enabled === true) {
          if (app.js === true) {
            res.redirect('/');
          } else {
            var errid = cc.generate({ parts : 1, partLen : 6 });
            rest.get('http://' + process.env.insalesid + ':' + app.token + '@' + app.insalesurl + '/admin/account.xml', {
              timeout: 5000
            }).once('timeout', function(ms){
              log('Магазин id=' + app.insalesid + ' #' + errid + ' Ошибка: Таймаут ' + ms + ' ms', 'error');
              res.status(200).send('Ошибка номер #' + errid);
            }).once('error',function(err, response) {
              log('Магазин id=' + app.insalesid + ' #' + errid + ' Ошибка: ' + err, 'error');
              res.status(200).send('Ошибка номер #' + errid);
            }).once('abort',function() {
              log('Магазин id=' + app.insalesid + ' #' + errid + ' Ошибка: Abort', 'error');
              res.status(200).send('Ошибка номер #' + errid);
            }).once('fail',function(data, response) {
              log('Магазин id=' + app.insalesid + ' #' + errid + ' Ошибка: ' + JSON.stringify(data), 'error');
              res.status(200).send('Ошибка номер #' + errid);
            }).once('success',function(data, response) {
              log('Магазин id=' + app.insalesid + ' Успешный запрос: ' + JSON.stringify(data));
              if (_.isUndefined(data.account)) {
                res.render('reg', {
                  domain : '',
                  name   : '',
                  email  : '',
                  phone  : ''
                });
              } else {
                res.render('reg', {
                  domain : data.account['main-host'],
                  name   : data.account.owner.name,
                  email  : data.account.owner.email,
                  phone  : data.account.phone.replace(/\D+/g, "").replace(/^[7]/, "")
                });
              }
            });
          }
        } else {
          res.render('block', {
            msg : 'Приложение не установлено для данного магазина'
          });
        }
      }
    });
  } else {
    res.render('block', {
      msg : 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти'
    });
  }
});

router.post('/reg', function(req, res) {
  if (req.session.insalesid) {
    Apps.findOne({insalesid: req.session.insalesid}, function(err, app) {
      if (err) {
        log('Магазин id=' + req.session.insalesid + ' Ошибка: ' + err, 'error');
        res.status(500).send({ error: err });
        github.issues.create({
          user: 'pomeo',
          repo: 'insalescallmaker',
          title: 'Ошибка при запросе магазина по id, магазин id=' + req.session.insalesid,
          body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
          assignee: 'pomeo',
          labels: ['bug', 'operational error']
        });
      } else {
        if (app.enabled === true) {
          var errid = cc.generate({ parts : 1, partLen : 6 });
          rest.get('http://callmaker.ru/api/company/create/', {
            query: {
              website: req.body.url.toLowerCase(),
              name: req.body.name,
              email: req.body.email.toLowerCase(),
              pass: req.body.pass,
              phone: '7' + req.body.phone,
              referral: 'pomeo@pomeo.ru'
            },
            timeout: 5000
          }).once('timeout', function(ms){
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: Таймаут ' + ms + ' ms', 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('error',function(err, response) {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: ' + err, 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('abort',function() {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: Abort', 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('fail',function(data, response) {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: ' + JSON.stringify(data), 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('success',function(data, response) {
            log('Магазин id=' + req.session.insalesid + ' Успешный запрос: ' + JSON.stringify(data));
            if (data.res == 'ok') {
              var company = {
                insalesid: app.insalesid,
                domain: req.body.url.toLowerCase(),
                email: req.body.email.toLowerCase()
              };
              res.status(200).send('ok');
              installCallmaker(company);
            } else if (data.res == 'err') {
              if (data.descr == 'already_registered') {
                res.status(200).send('Аккаунт уже зарегистирован');
              } else {
                log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: ' + JSON.stringify(data), 'error');
                res.status(200).send('Произошла ошибка номер #' + errid);
              }
            } else {
              log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: ' + JSON.stringify(data), 'error');
              res.status(200).send('Ошибка номер #' + errid);
            }
          });
        } else {
          res.status(403).send('Приложение не установлено для данного магазина');
        }
      }
    });
  } else {
    res.status(403).send('Вход возможен только из панели администратора insales.ru');
  }
});

router.get('/login', function(req, res) {
  if (req.session.insalesid) {
    Apps.findOne({insalesid: req.session.insalesid}, function(err, app) {
      if (err) {
        log('Магазин id=' + req.session.insalesid + ' Ошибка: ' + err, 'error');
        res.status(500).send({ error: err });
        github.issues.create({
          user: 'pomeo',
          repo: 'insalescallmaker',
          title: 'Ошибка при запросе магазина по id, магазин id=' + req.session.insalesid,
          body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
          assignee: 'pomeo',
          labels: ['bug', 'operational error']
        });
      } else {
        if (app.enabled === true) {
          if (app.js === true) {
            res.redirect('/');
          } else {
            res.render('login', {
              domain : app.domain
            });
          }
        } else {
          res.render('block', {
            msg : 'Приложение не установлено для данного магазина'
          });
        }
      }
    });
  } else {
    res.render('block', {
      msg : 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти'
    });
  }
});

router.post('/login', function(req, res) {
  if (req.session.insalesid) {
    Apps.findOne({insalesid: req.session.insalesid}, function(err, app) {
      if (err) {
        log('Магазин id=' + req.session.insalesid + ' Ошибка: ' + err, 'error');
        res.status(500).send({ error: err });
        github.issues.create({
          user: 'pomeo',
          repo: 'insalescallmaker',
          title: 'Ошибка при запросе магазина по id, магазин id=' + req.session.insalesid,
          body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
          assignee: 'pomeo',
          labels: ['bug', 'operational error']
        });
      } else {
        if (app.enabled === true) {
          var errid = cc.generate({ parts : 1, partLen : 6 });
          rest.get('http://callmaker.ru/api/company/login/', {
            query: {
              login: req.body.email.toLowerCase(),
              pass: req.body.pass
            },
            timeout: 5000
          }).once('timeout', function(ms){
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: Таймаут ' + ms + ' ms', 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('error',function(err, response) {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: ' + err, 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('abort',function() {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: Abort', 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('fail',function(data, response) {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: ' + JSON.stringify(data), 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('success',function(data, response) {
            log('Магазин id=' + req.session.insalesid + ' Успешный запрос: ' + JSON.stringify(data));
            if (data.res == 'ok') {
              var company = {
                domain: '',
                insalesid: app.insalesid,
                email: req.body.email.toLowerCase()
              };
              res.status(200).send('ok');
              installCallmaker(company);
            } else if (data.res == 'err') {
              res.status(200).send('err');
            } else {
              res.status(200).send('Ошибка номер #' + errid);
            }
          });
        } else {
          res.status(403).send('Приложение не установлено для данного магазина');
        }
      }
    });
  } else {
    res.status(403).send('Вход возможен только из панели администратора insales.ru');
  }
});

router.get('/remember', function(req, res) {
  if (req.session.insalesid) {
    Apps.findOne({insalesid: req.session.insalesid}, function(err, app) {
      if (err) {
        log('Магазин id=' + req.session.insalesid + ' Ошибка: ' + err, 'error');
        res.status(500).send({ error: err });
        github.issues.create({
          user: 'pomeo',
          repo: 'insalescallmaker',
          title: 'Ошибка при запросе магазина по id, магазин id=' + req.session.insalesid,
          body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
          assignee: 'pomeo',
          labels: ['bug', 'operational error']
        });
      } else {
        if (app.enabled === true) {
          if (app.js === true) {
            res.redirect('/');
          } else {
            res.render('remember', {
              domain : app.domain
            });
          }
        } else {
          res.render('block', {
            msg : 'Приложение не установлено для данного магазина'
          });
        }
      }
    });
  } else {
    res.render('block', {
      msg : 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти'
    });
  }
});

router.post('/remember', function(req, res) {
  if (req.session.insalesid) {
    Apps.findOne({insalesid: req.session.insalesid}, function(err, app) {
      if (err) {
        log('Магазин id=' + req.session.insalesid + ' Ошибка: ' + err, 'error');
        res.status(500).send({ error: err });
        github.issues.create({
          user: 'pomeo',
          repo: 'insalescallmaker',
          title: 'Ошибка при запросе магазина по id, магазин id=' + req.session.insalesid,
          body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
          assignee: 'pomeo',
          labels: ['bug', 'operational error']
        });
      } else {
        if (app.enabled === true) {
          var errid = cc.generate({ parts : 1, partLen : 6 });
          rest.get('http://callmaker.ru/api/resetpass/', {
            query: {
              login: req.body.email.toLowerCase()
            },
            timeout: 5000
          }).once('timeout', function(ms){
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: Таймаут ' + ms + ' ms', 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('error',function(err, response) {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: ' + err, 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('abort',function() {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: Abort', 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('fail',function(data, response) {
            log('Магазин id=' + req.session.insalesid + ' #' + errid + ' Ошибка: ' + JSON.stringify(data), 'error');
            res.status(200).send('Ошибка номер #' + errid);
          }).once('success',function(data, response) {
            log('Магазин id=' + req.session.insalesid + ' Успешный запрос: ' + JSON.stringify(data));
            if (data.res == 'ok') {
              res.status(200).send('ok');
            } else {
              res.status(200).send('Ошибка номер #' + errid);
            }
          });
        } else {
          res.status(403).send('Приложение не установлено для данного магазина');
        }
      }
    });
  } else {
    res.status(403).send('Вход возможен только из панели администратора insales.ru');
  }
});

var installCallmaker = function(opt) {
  Apps.findOne({insalesid: opt.insalesid}, function(err, app) {
    if (err) {
      log('Магазин id=' + opt.insalesid + ' Ошибка: ' + err, 'error');
      github.issues.create({
        user: 'pomeo',
        repo: 'insalescallmaker',
        title: 'Ошибка при запросе магазина по id, магазин id=' + req.session.insalesid,
        body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
        assignee: 'pomeo',
        labels: ['bug', 'operational error']
      });
    } else {
      var errid = cc.generate({ parts : 1, partLen : 6 });
      if (opt.type === 1) {
        rest.get('http://callmaker.ru/api/company/' + opt.email + '/basic/', {
          timeout: 5000
        }).once('timeout', function(ms){
          log('Магазин id=' + opt.insalesid + ' Ошибка: Таймаут ' + ms + ' ms', 'error');
        }).once('error',function(err, response) {
          log('Магазин id=' + opt.insalesid + ' Ошибка: ' + err, 'error');
        }).once('abort',function() {
          log('Магазин id=' + opt.insalesid + ' Ошибка: Abort', 'error');
        }).once('fail',function(data, response) {
          log('Магазин id=' + opt.insalesid + ' Ошибка: ' + JSON.stringify(data), 'error');
        }).once('success',function(data, response) {
          log('Магазин id=' + opt.insalesid + ' Успешный запрос: ' + JSON.stringify(data));
          var xml = 'clbId="' + opt.email + '";'
                  + 'var fileref = document.createElement(\"script\");'
                  + 'fileref.setAttribute(\"type\",\"text/javascript\");'
                  + 'fileref.charset=\'utf-8\';'
                  + 'fileref.async = true;'
                  + 'fileref.setAttribute(\"src\", \"http://callmaker.ru/witget/witget.min.js\");'
                  + 'document.getElementsByTagName(\"head\")[0].appendChild(fileref);';
          var jstag = '<js-tag>'
                    + '<type type="string">JsTag::TextTag</type>'
                    + '<content>' + xml + '</content>'
                    + '</js-tag>';
          rest.post('http://' + process.env.insalesid + ':' + app.token + '@' + app.insalesurl + '/admin/js_tags.xml', {
            data: jstag,
            headers: {
              'Content-Type': 'application/xml'
            }
          }).once('timeout', function(ms){
            log('Магазин id=' + opt.insalesid + ' Ошибка: Таймаут ' + ms + ' ms', 'error');
          }).once('error',function(e, resp) {
            log('Магазин id=' + opt.insalesid + ' Ошибка: ' + e, 'error');
          }).once('abort',function() {
            log('Магазин id=' + opt.insalesid + ' Ошибка: Abort', 'error');
          }).once('fail',function(d, resp) {
            log('Магазин id=' + opt.insalesid + ' Ошибка: ' + JSON.stringify(d), 'error');
          }).once('success',function(d, resp) {
            log('Магазин id=' + opt.insalesid + ' Код JS установлен: ' + JSON.stringify(d));
            if (data.res == 'ok') {
              app.name = data.manager.name;
              app.email = data.manager.email;
              app.phone = data.manager.phone;
              app.js = true;
              app.save(function (err) {
                if (err) {
                  log('Магазин id=' + opt.insalesid + ' Ошибка: ' + err, 'error');
                  github.issues.create({
                    user: 'pomeo',
                    repo: 'insalescallmaker',
                    title: 'Ошибка при сохранении регистрационных данных, магазин id=' + opt.insalesid,
                    body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
                    assignee: 'pomeo',
                    labels: ['bug', 'operational error']
                  });
                } else {
                  log('Магазин id=' + opt.insalesid + ' Регистрационные данные сохранены в базу');
                }
              });
            } else {
              app.name = '';
              app.email = opt.email;
              app.phone = '';
              app.js = true;
              app.save(function (err) {
                if (err) {
                  log('Магазин id=' + opt.insalesid + ' Ошибка: ' + err, 'error');
                  github.issues.create({
                    user: 'pomeo',
                    repo: 'insalescallmaker',
                    title: 'Ошибка при сохранении регистрационных данных, магазин id=' + opt.insalesid,
                    body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
                    assignee: 'pomeo',
                    labels: ['bug', 'operational error']
                  });
                } else {
                  log('Магазин id=' + opt.insalesid + ' Регистрационные данные сохранены в базу');
                }
              });
            }
          });
        });
      } else {

      }
    }
  });
};

router.get('/install', function(req, res) {
  if ((req.query.shop !== '') &&
      (req.query.token !== '') &&
      (req.query.insales_id !== '') &&
      req.query.shop &&
      req.query.token &&
      req.query.insales_id) {
    Apps.findOne({insalesid:req.query.insales_id}, function(err, a) {
      if (err) {
        log('Магазин id=' + req.query.insales_id + ' Ошибка: ' + err, 'error');
        res.status(500).send({ error: err });
        github.issues.create({
          user: 'pomeo',
          repo: 'insalescallmaker',
          title: 'Ошибка при установке приложения, этап запрос из базы данных, магазин id=' + req.query.insales_id,
          body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
          assignee: 'pomeo',
          labels: ['bug', 'operational error']
        });
      } else {
        if (_.isNull(a)) {
          var app = new Apps({
            insalesid  : req.query.insales_id,
            insalesurl : req.query.shop,
            token      : crypto.createHash('md5')
                         .update(req.query.token + process.env.insalessecret)
                         .digest('hex'),
            name       : '',
            email      : '',
            phone      : '',
            domain     : '',
            js         : false,
            created_at : moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
            updated_at : moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
            enabled    : true
          });
          app.save(function (err) {
            if (err) {
              log('Магазин id=' + req.query.insales_id + ' Ошибка: ' + err, 'error');
              res.status(500).send({ error: err });
              github.issues.create({
                user: 'pomeo',
                repo: 'insalescallmaker',
                title: 'Ошибка при установке приложения, этап сохранение нового магазина, магазин id=' + req.query.insales_id,
                body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
                assignee: 'pomeo',
                labels: ['bug', 'operational error']
              });
            } else {
              log('Магазин id=' + req.query.insales_id + ' Установлен');
              res.sendStatus(200);
            }
          });
        } else {
          if (a.enabled === true) {
            res.status(403).send('Приложение уже установленно');
          } else {
            a.token = crypto.createHash('md5')
                      .update(req.query.token + process.env.insalessecret)
                      .digest('hex');
            a.js = false;
            a.name = '';
            a.email = '';
            a.phone = '';
            a.domain = '';
            a.updated_at = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
            a.enabled = true;
            a.save(function (err) {
              if (err) {
                log('Магазин id=' + req.query.insales_id + ' Ошибка: ' + err, 'error');
                res.status(500).send({ error: err });
                github.issues.create({
                  user: 'pomeo',
                  repo: 'insalescallmaker',
                  title: 'Ошибка при установке приложения, этап обновления данных, магазин id=' + req.query.insales_id,
                  body: JSON.stringify(err).replace(/(\\r\\n|\\n|\\r)/gi,"<br />"),
                  assignee: 'pomeo',
                  labels: ['bug', 'operational error']
                });
              } else {
                log('Магазин id=' + req.query.insales_id + ' Установлен');
                res.sendStatus(200);
              }
            });
          }
        }
      }
    });
  } else {
    res.status(403).send('Ошибка установки приложения');
  }
});

router.get('/uninstall', function(req, res) {
  if ((req.query.shop !== '') &&
      (req.query.token !== '') &&
      (req.query.insales_id !== '') &&
      req.query.shop &&
      req.query.token &&
      req.query.insales_id) {
    Apps.findOne({insalesid:req.query.insales_id}, function(err, a) {
      if (a.token == req.query.token) {
        a.js = false;
        a.updated_at = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
        a.enabled = false;
        a.save(function (err) {
          if (err) {
            log('Магазин id=' + req.query.insales_id + ' Ошибка: ' + err, 'error');
            res.status(500).send({ error: err });
          } else {
            log('Магазин id=' + req.query.insales_id + ' Удалён');
            res.sendStatus(200);
          }
        });
      } else {
        res.status(403).send('Ошибка удаления приложения');
      }
    });
  } else {
    res.status(403).send('Ошибка удаления приложения');
  }
});

module.exports = router;

mongoose.connect('mongodb://' + process.env.mongo + '/callmaker');

var AppsSchema = new Schema();

AppsSchema.add({
  insalesid   : { type: Number, unique: true }, // id магазина
  insalesurl  : String, // урл магазина
  token       : String, // ключ доступа к api
  autologin   : String, // сохраняется ключ автологина
  domain      : String, // домен сайта
  name        : String, // имя клиента (также используется для автоматического создания первого менеджера)
  email       : String, // email клиента (его логин)
  phone       : String, // телефон клиента в международном формате (7XXXXXXXXX)
  js          : Boolean, // флаг установки кода callmaker
  created_at  : Date, // дата создания записи
  updated_at  : Date, // дата изменения записи
  enabled     : Boolean // установлено или нет приложение для магазина
});

var Apps = mongoose.model('Apps', AppsSchema);

//Логгер в одном месте, для упрощения перезда на любой логгер.
function log(logMsg, logType) {
  if (logMsg instanceof Error) logger.error(logMsg.stack);
  if (!_.isUndefined(logType)) {
    logger.log(logType, logMsg);
  } else {
    logger.info(logMsg);
  }
}
