const express  = require('express');
const router   = express.Router();
const _        = require('lodash');
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const moment   = require('moment');
const hat      = require('hat');
const rest     = require('restler');
const push     = require('pushover-notifications');
const crypto   = require('crypto');
const cc       = require('coupon-code');
const insales  = require('insales')({
  id: process.env.insalesid,
  secret: process.env.insalessecret,
});
const P        = new push({
  user: process.env.PUSHOVER_USER,
  token: process.env.PUSHOVER_TOKEN,
});
const log      = require('winston-logs')({
  production: {
    logentries: {
      token: process.env.logentries,
    },
  },
  development: {
    'console': {
      colorize: true,
    },
  },
});

function errorNotify(params) {
  const errid = cc.generate({
    parts: 1,
    partLen: 6,
  });
  log.error(`ShopId=${params.id} ${errid} Error: ${JSON.stringify(params.err)}`);
  log.error(`${errid} ${params.msg}`);
  throw new Error(`Ошибка: #${errid}`);
}

mongoose.connect(`mongodb://${process.env.mongo}/callmaker`);

const AppsSchema = new Schema();

AppsSchema.add({
  insalesid  : { type: Number, unique: true }, // id магазина
  insalesurl : String, // урл магазина
  token      : String, // ключ доступа к api
  autologin  : String, // сохраняется ключ автологина
  domain     : String, // домен сайта
  name       : String, // имя клиента (также используется для автоматического создания первого менеджера)
  email      : String, // email клиента (его логин)
  phone      : String, // телефон клиента в международном формате
  js         : Boolean, // флаг установки кода callmaker
  created_at : Date, // дата создания записи
  updated_at : Date, // дата изменения записи
  enabled    : Boolean, // установлено или нет приложение для магазина
});

const Apps = mongoose.model('Apps', AppsSchema);

router.get('/', (req, res) => {
  if (req.query.token && (req.query.token !== '')) {
    Apps.findOne({
      autologin: req.query.token,
    }, (err, a) => {
      if (err) {
        errorNotify({
          id: req.query.insales_id,
          msg: 'Error when get shop info from mongodb',
          err: err,
        });
      } else {
        if (a) {
          log.info(`Магазин id=${a.insalesid} Создаём сессию и перебрасываем на главную`);
          req.session.insalesid = a.insalesid;
          res.redirect('/');
        } else {
          log.warn(`Ошибка автологина. Неправильный token при переходе из insales`);
          res.render('block', {
            msg: 'Ошибка автологина',
          });
        }
      }
    });
  } else {
    if (process.env.NODE_ENV === 'development') {
      req.session.insalesid = 74112;
    }
    const insid = req.session.insalesid || req.query.insales_id;
    log.info(`Магазин id=${insid} Попытка входа магазина`);
    if ((req.query.insales_id &&
         (req.query.insales_id !== '')) ||
        req.session.insalesid !== undefined) {
      Apps.findOne({
        insalesid: insid,
      }, (err, app) => {
        if (err) {
          errorNotify({
            id: req.query.insales_id,
            msg: 'Error when get shop info from mongodb',
            err: err,
          });
        } else {
          if (app.enabled === true) {
            if (req.session.insalesid) {
              if (app.js === true) {
                res.render('main');
              } else {
                res.render('index');
              }
            } else {
              log.info(`Авторизация ${req.query.insales_id}`);
              const id = hat();
              app.autologin = crypto.createHash('md5')
                .update(id + app.token)
                .digest('hex');
              app.save(err => {
                if (err) {
                  errorNotify({
                    id: req.query.insales_id,
                    msg: 'Error when save autologin token',
                    err: err,
                  });
                } else {
                  res.redirect(`http://${app.insalesurl}/admin/applications/${process.env.insalesid}/login?token=${id}&login=http://callmaker.salesapps.ru`);
                }
              });
            }
          } else {
            res.render('block', {
              msg: 'Приложение не установлено для данного магазина',
            });
          }
        }
      });
    } else {
      res.render('block', {
        msg: 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти',
      });
    }
  }
});

router.get('/reg', (req, res) => {
  if (req.session.insalesid) {
    Apps.findOne({
      insalesid: req.session.insalesid,
    }, (err, app) => {
      if (err) {
        errorNotify({
          id: req.query.insales_id,
          msg: 'Error when get shop info from mongodb',
          err: err,
        });
      } else {
        if (app.enabled === true) {
          if (app.js === true) {
            res.redirect('/');
          } else {
            insales.getAccount({
              token: app.token,
              url: app.insalesurl,
            }).then(output => {
              log.info(`Магазин id=${app.insalesid} Успешный запрос: ${JSON.stringify(output.data)}`);
              log.info(`Магазин id=${app.insalesid} Домен: ${output.data.account['main-host']}`);
              if (_.isUndefined(output.data.account)) {
                res.render('reg', {
                  domain : '',
                  name   : '',
                  email  : '',
                  phone  : '',
                });
              } else {
                res.render('reg', {
                  domain : output.data.account['main-host'],
                  name   : output.data.account.owner.name,
                  email  : output.data.account.owner.email,
                  phone  : output.data.account.phone.replace(/\D+/g, ""),
                });
              }
            }).catch(err => {
              log.error(err);
            });
          }
        } else {
          res.render('block', {
            msg: 'Приложение не установлено для данного магазина',
          });
        }
      }
    });
  } else {
    res.render('block', {
      msg: 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти'
    });
  }
});

router.post('/reg', (req, res) => {
  if (req.session.insalesid) {
    Apps.findOne({
      insalesid: req.session.insalesid,
    }, (err, app) => {
      if (err) {
        errorNotify({
          id: req.session.insalesid,
          msg: 'Error when get shop info from mongodb',
          err: err,
        });
      } else {
        if (app.enabled === true) {
          const errid = cc.generate({
            parts: 1,
            partLen: 6,
          });
          rest.get('http://callmaker.ru/api/company/create/', {
            query: {
              website: req.body.url.toLowerCase(),
              name: req.body.name,
              email: req.body.email.toLowerCase(),
              pass: req.body.pass,
              phone: req.body.phonecode + req.body.phone,
              referral: 'pomeo@pomeo.ru',
            },
            timeout: 5000,
          }).once('timeout', ms => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: Таймаут ${ms} ms`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('error', (err, response) => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: ${err}`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('abort', () => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: Abort`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('fail', (data, response) => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: ${JSON.stringify(data)}`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('success', (data, response) => {
            log.error(`Магазин id=${req.session.insalesid} Успешный запрос: ${JSON.stringify(data)}`);
            if (data.res === 'ok') {
              const company = {
                insalesid: app.insalesid,
                domain: req.body.url.toLowerCase(),
                email: req.body.email.toLowerCase(),
              };
              res.status(200).send('ok');
              installCallmaker(company);
            } else if (data.res === 'err') {
              if (data.descr === 'already_registered') {
                res.status(200).send('Аккаунт уже зарегистирован');
              } else if (data.descr === 'wrong_login') {
                res.status(200).send('Неправильный логин');
              } else {
                log.error(`Магазин id=req.session.insalesid #${errid} Ошибка: ${JSON.stringify(data)}`);
                res.status(200).send(`Произошла ошибка номер #${errid}`);
              }
            } else {
              log.error(`Магазин id=req.session.insalesid #${errid} Ошибка: ${JSON.stringify(data)}`);
              res.status(200).send(`Ошибка номер #${errid}`);
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

router.get('/login', (req, res) => {
  if (req.session.insalesid) {
    Apps.findOne({
      insalesid: req.session.insalesid,
    }, (err, app) => {
      if (err) {
        errorNotify({
          id: req.session.insalesid,
          msg: 'Error when get shop info from mongodb',
          err: err,
        });
      } else {
        if (app.enabled === true) {
          if (app.js === true) {
            res.redirect('/');
          } else {
            res.render('login', {
              domain : app.domain,
            });
          }
        } else {
          res.render('block', {
            msg: 'Приложение не установлено для данного магазина',
          });
        }
      }
    });
  } else {
    res.render('block', {
      msg: 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти',
    });
  }
});

router.post('/login', (req, res) => {
  if (req.session.insalesid) {
    Apps.findOne({
      insalesid: req.session.insalesid,
    }, (err, app) => {
      if (err) {
        errorNotify({
          id: req.session.insalesid,
          msg: 'Error when get shop info from mongodb',
          err: err,
        });
      } else {
        if (app.enabled === true) {
          const errid = cc.generate({
            parts: 1,
            partLen: 6,
          });
          rest.get('http://callmaker.ru/api/company/login/', {
            query: {
              login: req.body.email.toLowerCase(),
              pass: req.body.pass,
            },
            timeout: 5000,
          }).once('timeout', ms => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: Таймаут ${ms} ms`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('error', (err, response) => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: ${err}`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('abort', () => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: Abort`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('fail', (data, response) => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: ${JSON.stringify(data)}`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('success', (data, response) => {
            log.info(`Магазин id=${req.session.insalesid} Успешный запрос: ${JSON.stringify(data)}`);
            if (data.res === 'ok') {
              const company = {
                domain: '',
                insalesid: app.insalesid,
                email: req.body.email.toLowerCase(),
              };
              res.status(200).send('ok');
              installCallmaker(company);
            } else if (data.res === 'err') {
              res.status(200).send('err');
            } else {
              log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: ${JSON.stringify(data)}`);
              res.status(200).send(`Ошибка номер #${errid}`);
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

router.get('/remember', (req, res) => {
  if (req.session.insalesid) {
    Apps.findOne({
      insalesid: req.session.insalesid,
    }, (err, app) => {
      if (err) {
        errorNotify({
          id: req.session.insalesid,
          msg: 'Error when get shop info from mongodb',
          err: err,
        });
      } else {
        if (app.enabled === true) {
          if (app.js === true) {
            res.redirect('/');
          } else {
            res.render('remember', {
              domain: app.domain,
            });
          }
        } else {
          res.render('block', {
            msg: 'Приложение не установлено для данного магазина',
          });
        }
      }
    });
  } else {
    res.render('block', {
      msg: 'Вход возможен только из панели администратора insales.ru <span class="uk-icon-long-arrow-right"></span> приложения <span class="uk-icon-long-arrow-right"></span> установленные <span class="uk-icon-long-arrow-right"></span> войти',
    });
  }
});

router.post('/remember', (req, res) => {
  if (req.session.insalesid) {
    Apps.findOne({
      insalesid: req.session.insalesid,
    }, (err, app) => {
      if (err) {
        errorNotify({
          id: req.session.insalesid,
          msg: 'Error when get shop info from mongodb',
          err: err,
        });
      } else {
        if (app.enabled === true) {
          const errid = cc.generate({
            parts: 1,
            partLen: 6,
          });
          rest.get('http://callmaker.ru/api/resetpass/', {
            query: {
              login: req.body.email.toLowerCase(),
            },
            timeout: 5000,
          }).once('timeout', ms => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: Таймаут ${ms} ms`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('error', (err, response) => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: ${err}`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('abort', () => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: Abort`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('fail', (data, response) => {
            log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: ${JSON.stringify(data)}`);
            res.status(200).send(`Ошибка номер #${errid}`);
          }).once('success', (data, response) => {
            log.info(`Магазин id=${req.session.insalesid} Успешный запрос: ${JSON.stringify(data)}`);
            if (data.res === 'ok') {
              res.status(200).send('ok');
            } else {
              log.error(`Магазин id=${req.session.insalesid} #${errid} Ошибка: ${JSON.stringify(data)}`);
              res.status(200).send(`Ошибка номер #${errid}`);
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

function installCallmaker(opt) {
  Apps.findOne({
    insalesid: opt.insalesid,
  }, (err, app) => {
    if (err) {
      errorNotify({
        id: opt.insalesid,
        msg: 'Error when get shop info from mongodb',
        err: err,
      });
    } else {
      const js = `clbId=${opt.email};
        var fileref = document.createElement(\"script\");
        fileref.setAttribute(\"type\",\"text/javascript\");
        fileref.charset=\'utf-8\';
        fileref.async = true;
        fileref.setAttribute(\"src\", \"http://callmaker.ru/witget/witget.min.js\");
        document.getElementsByTagName(\"head\")[0].appendChild(fileref);`;
      insales.createJsTag({
        token: app.token,
        url: app.insalesurl,
        jstag: {
          'js-tag': {
            type: 'JsTag::TextTag',
            content: js,
          },
        },
      }).then(data => {
        log.info(`Магазин id=${opt.insalesid} Код JS установлен: ${JSON.stringify(data.data['text-tag'])}`);
        app.domain = opt.domain;
        app.name = '';
        app.email = '';
        app.phone = '';
        app.js = true;
        app.save(err => {
          if (err) {
            errorNotify({
              id: opt.insalesid,
              msg: 'Error when save reg data to mongodb',
              err: err,
            });
          } else {
            log.info(`Магазин id=${opt.insalesid} Регистрационные данные сохранены в базу`);
            const msg = {
              message: "+1 установка",
              title: "Обратный звонок",
            };
            P.send(msg, (err, result) => {
              if (err) {
                log.error(err);
              } else {
                log.info(result);
              }
            });
          }
        });
      }).catch(err => {
        log.error(err);
      });
    }
  });
}

router.get('/install', (req, res) => {
  if ((req.query.shop !== '') &&
      (req.query.token !== '') &&
      (req.query.insales_id !== '') &&
      req.query.shop &&
      req.query.token &&
      req.query.insales_id) {
    Apps.findOne({
      insalesid: req.query.insales_id,
    }, (err, a) => {
      if (err) {
        errorNotify({
          id: req.query.insales_id,
          msg: 'Error when install shop, step get info from mongodb',
          err: err,
        });
      } else {
        if (_.isNull(a)) {
          const app = new Apps({
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
            enabled    : true,
          });
          app.save(err => {
            if (err) {
              errorNotify({
                id: req.query.insales_id,
                msg: 'Error when install shop, step save info to mongodb',
                err: err,
              });
            } else {
              log.info(`Магазин id=${req.query.insales_id} Установлен`);
              res.sendStatus(200);
            }
          });
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
          a.save(err => {
            if (err) {
              errorNotify({
                id: req.query.insales_id,
                msg: 'Error when install shop, step update info to mongodb',
                err: err,
              });
            } else {
              log.info(`Магазин id=${req.query.insales_id} Установлен`);
              res.sendStatus(200);
            }
          });
        }
      }
    });
  } else {
    res.status(403).send('Ошибка установки приложения');
  }
});

router.get('/uninstall', (req, res) => {
  if ((req.query.shop !== '') &&
      (req.query.token !== '') &&
      (req.query.insales_id !== '') &&
      req.query.shop &&
      req.query.token &&
      req.query.insales_id) {
    Apps.findOne({
      insalesid: req.query.insales_id,
    }, (err, a) => {
      if (a.token === req.query.token) {
        a.js = false;
        a.updated_at = moment().format('ddd, DD MMM YYYY HH:mm:ss ZZ');
        a.enabled = false;
        a.save(err => {
          if (err) {
            errorNotify({
              id: req.query.insales_id,
              msg: 'Error when uninstall app, step update info to mongodb',
              err: err,
            });
          } else {
            log.info(`Магазин id=${req.query.insales_id} Удалён`);
            res.sendStatus(200);
            const msg = {
              message: "-1 установка",
              title: "Обратный звонок",
            };
            P.send(msg, (err, result) => {
              if (err) {
                log.error(err);
              } else {
                log.info(result);
              }
            });
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
