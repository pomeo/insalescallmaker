/* jshint node:true */
/* jshint laxbreak:true */
var express    = require('express'),
    router     = express.Router(),
    _          = require('lodash'),
    mongoose   = require('mongoose'),
    Schema     = mongoose.Schema,
    moment     = require('moment'),
    hat        = require('hat'),
    crypto     = require('crypto'),
    winston    = require('winston'),
    Logentries = require('winston-logentries');

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
      if (a) {
        log('Магазин id=' + a.insalesid + ' Создаём сессию и перебрасываем на главную');
        req.session.insalesid = a.insalesid;
        res.redirect('/');
      } else {
        log('Ошибка автологина. Неправильный token при переходе из insales', 'warn');
        res.render('index', {
          msg : 'Ошибка автологина'
        });
      }
    });
  } else {
    var insid = req.session.insalesid || req.query.insales_id;
    log('Магазин id=' + insid + ' Попытка входа магазина');
    if ((req.query.insales_id &&
         (req.query.insales_id !== '')) ||
        req.session.insalesid !== undefined) {
      Apps.findOne({insalesid:insid}, function(err, app) {
        if (app.enabled === true) {
          if (req.session.insalesid) {
            res.render('index');
          } else {
            log('Авторизация ' + req.query.insales_id);
            var id = hat();
            app.autologin = crypto.createHash('md5')
                            .update(id + app.token)
                            .digest('hex');
            app.save(function (err) {
              if (err) {
                res.send(err, 500);
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
          res.render('index', {
            msg : 'Приложение не установлено для данного магазина'
          });
        }
      });
    } else {
      res.render('index', {
        msg : 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти'
      });
    }
  }
});

router.get('/install', function(req, res) {
  if ((req.query.shop !== '') &&
      (req.query.token !== '') &&
      (req.query.insales_id !== '') &&
      req.query.shop &&
      req.query.token &&
      req.query.insales_id) {
    Apps.findOne({insalesid:req.query.insales_id}, function(err, a) {
      if (_.isNull(a)) {
        var app = new Apps({
          insalesid  : req.query.insales_id,
          insalesurl : req.query.shop,
          token      : crypto.createHash('md5')
                       .update(req.query.token + process.env.insalessecret)
                       .digest('hex'),
          created_at : moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
          updated_at : moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
          enabled    : true
        });
        app.save(function (err) {
          if (err) {
            log('Магазин id=' + req.query.insales_id + ' Ошибка: ' + err, 'error');
            res.status(500).send({ error: err });
          } else {
            log('Магазин id=' + req.query.insales_id + ' Установлен');
            res.sendStatus(200);
            // jobs.create('syncall', {
            //   id: req.query.insales_id
            // }).delay(600).priority('normal').save();
            // log('Магазин id=' + req.query.insales_id + ' После установки отправка задания в очередь на синхронизацию');
            // jobs.create('pay', {
            //   id: req.query.insales_id
            // }).delay(600).priority('normal').save();
            // log('Магазин id=' + req.query.insales_id + ' После установки отправка задания в очередь на проверку оплаты');
          }
        });
      } else {
        if (a.enabled === true) {
          res.status(403).send('Приложение уже установленно');
        } else {
          a.token = crypto.createHash('md5')
                    .update(req.query.token + process.env.insalessecret)
                    .digest('hex');
          a.updated_at = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
          a.enabled = true;
          a.save(function (err) {
            if (err) {
              log('Магазин id=' + req.query.insales_id + ' Ошибка: ' + err, 'error');
              res.status(500).send({ error: err });
            } else {
              log('Магазин id=' + req.query.insales_id + ' Установлен');
              res.sendStatus(200);
              // jobs.create('syncall', {
              //   id: a.insalesid
              // }).delay(600).priority('normal').save();
              // log('Магазин id=' + req.query.insales_id + ' После установки отправка задания в очередь на синхронизацию');
              // jobs.create('pay', {
              //   id: a.insalesid
              // }).delay(600).priority('normal').save();
              // log('Магазин id=' + req.query.insales_id + ' После установки отправка задания в очередь на проверку оплаты');
            }
          });
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
