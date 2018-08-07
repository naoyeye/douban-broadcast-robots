/*
* @Author: naoyeye
* @Date:   2018-03-11 18:03:33
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-08-07 14:42:29
*/


'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var config = require('./../config/app-config');
var url = require('url');
var request = require('request');
var curl = require('curlrequest');
var schedule = require('node-schedule');

var date;
var now;
var enableImage = false; // 关闭图片附件

var imageUrl = 'http://dabenji.doubanclock.com/pic/test-small.gif';
var isLaunched = false;

var accessToken = null;
var refresh_token;
var currentUserId;
var latestPriceBTC = 0;
var latestPriceBTC2CNY = 0
var latestPriceEOS = 0;
var latestPriceETH = 0;
var latestPriceHT = 0;
var latestPriceEOS2CNY = 0
var point = 30; // 第几分钟时发布广播


router.get('/', function(req, res, next) {
  if (accessToken) {

    if (config.userId.indexOf(currentUserId) >= 0) {
      if (!isLaunched) {

        // var ruleGetBitcoinPrice = new schedule.RecurrenceRule();
        // ruleGetBitcoinPrice.minute = '*/19 * * * *';

        // var rulePostStatus = new schedule.RecurrenceRule();
        // rulePostStatus.minute = '*/20 * * * *'; // 整点发广播
        
        // var rule = new schedule.RecurrenceRule();
        // rule.minute = new schedule.Range(0, 59, 5);


        var autoGetBitcoinPrice = schedule.scheduleJob("*/30 * * * *", function() {
          request.get({
            url: 'https://www.bitstamp.net/api/v2/ticker/btcusd/',
            method: 'GET'
          }, function (err, data) {
            if (data &&  data.body) {

              var _data = JSON.parse(data.body);

              latestPriceBTC = _data.last

              var d = new Date();
              var localTime = d.getTime();
              var localOffset = d.getTimezoneOffset() * 60000;
              var utc = localTime + localOffset;
              var offset = 8;
              var beijing = utc + (3600000 * offset);
              date = new Date(beijing);


              if (latestPriceBTC) {

                // 获取 EOS 价格
                request.get({
                  url: 'https://chasing-coins.com/api/v1/convert/EOS/USD',
                  method: 'GET'
                }, function (eosError, eosData) {
                  if (!eosError) {
                    latestPriceEOS = JSON.parse(eosData.body).result;

                     // eth
                    if (latestPriceEOS) {
                      request.get({
                         url: 'https://chasing-coins.com/api/v1/convert/ETH/USD',
                         method: 'GET'
                      }, function (ethError, ethData) {
                        if (!ethError) {
                          latestPriceETH = JSON.parse(ethData.body).result;

                          if (latestPriceETH) {
                            // var text = '1 btc ≈ $' + latestPriceBTC;
                            // text += '\r\n1 eos ≈ $' + latestPriceEOS;
                            // text += '\r\n1 eth ≈ $' + latestPriceETH;

                            // postToDouban(accessToken, refresh_token, text, date, function (err, httpResponse, body) {});

                            request.get({
                               url: 'https://chasing-coins.com/api/v1/convert/HT/BTC',
                               method: 'GET'
                            }, function (htError, htData) {
                              latestPriceHT = `${JSON.parse(htData.body).result}`;

                              if (latestPriceHT) {
                                var text = '1 btc ≈ $' + latestPriceBTC;
                                text += '\r\n1 eos ≈ $' + latestPriceEOS;
                                text += '\r\n1 eth ≈ $' + latestPriceETH;
                                text += '\r\n1 ht ≈ ₿' + latestPriceHT;

                                // let textText = `btc = ${latestPriceBTC}, eos = ${latestPriceEOS}, eth = ${latestPriceETH}, ht = ${latestPriceHT}`;
                                // console.log(textText)

                                postToDouban(accessToken, refresh_token, text, date, function (err, httpResponse, body) {});
                              } else {
                                console.error('获取 ht/btc 失败');
                              }
                            })
                          }
                        } else {
                          console.error('获取 eth/usd 失败')
                        }
                      });
                    }
                  } else {
                    console.error('获取 eos/usd 失败')
                  }
                })
              }
            } else {
              console.error('获取 btc/usd 失败')
            }

          });
        })

        isLaunched = true;

        var data = {
          currentUser: true,
          tryLogged: true,
          message: '欢迎大笨狗，嘻嘻嘻嘻嘻！',
          imageUrl: enableImage ?  imageUrl : ''
        }

        res.render('index', data);


      } else {
        var data = {
          currentUser: true,
          tryLogged: true,
          message: '欢迎大笨狗，哈哈哈哈哈哈！',
          imageUrl: enableImage ?  imageUrl : ''
        }
        res.render('index', data);
      }

    } else {
      var data = {
        currentUser: false,
        tryLogged: true,
        message: '你不是大笨狗',
        imageUrl: enableImage ?  imageUrl : ''
      }
      res.render('index', data);
    }

  } else {
    var data = {
      currentUser: false,
      tryLogged: false,
      message: '你是大笨狗吗？不是大笨狗不要点下面的按钮。',
      imageUrl: enableImage ?  imageUrl : ''
    }
    res.render('index', data);
  }
});


router.get('/auth/douban', function (req, res, next) {
  res.redirect('https://www.douban.com/service/auth2/auth?client_id='
    + config.douban.apiKey
    + '&redirect_uri='
    + config.douban.redirect_uri 
    + '&response_type=code&scope=' 
    + config.douban.scope);
});


router.get('/auth/douban/callback', function (req, res, next) {
    var parsedUrl = url.parse(req.url, true);
    
    if (!parsedUrl.query || !parsedUrl.query.code) {
        console.error("Missing code in querystring. The url looks like " + req.url);
        res.redirect('/');
        return;
    }

    var code = parsedUrl.query && parsedUrl.query.code;

    var oauth = {
        grant_type: 'authorization_code',
        code: code,
        client_id: config.douban.apiKey,
        client_secret: config.douban.Secret,
        redirect_uri: config.douban.redirect_uri
    };

    // get accessToken
    curl.request({
        url: 'https://www.douban.com/service/auth2/token',
        method: 'POST',
        data: oauth
    }, function (err, parts) {
        parts = parts.split('\r\n');
        var data = JSON.parse(parts.pop());

        accessToken = data.access_token;
        refresh_token = data.refresh_token;
        currentUserId = data.douban_user_id;

        // console.log('accessToken!!', data.access_token);

        res.redirect('/');

    });
});


router.use('/reAuth', function (req, res, next) {
    accessToken = null;
    refresh_token = null;
    currentUserId = null;

    res.redirect('/');
});


function postToDouban (accessToken, refresh_token, text, date, callback) {
    // 带图版
    var r = request.post('https://api.douban.com/shuo/v2/statuses/', {
            method: 'POST',
            headers: {'Authorization': 'Bearer ' + accessToken},
            // timeout: 70000 // 7秒超时吧
        }, function (err, httpResponse, body) {
          console.log('*****unknown err after postToDouban******')
          console.error(err)
          if (err && err.code === 106) {
              console.error(date + '\r\nHoly fuck! Clock fail! We need to refresh token!', err);

              refreshToken(refresh_token, text, date, callback);


              console.log('===========');
          } else if (err || typeof body.code !== 'undefined') {
              console.error(date + '\r\nFuck! Clock fail!, Error:', err, '\r\n Body:', body);
              // mailSender('FxxK dabenji!', body, function (mailError, mailResponse) {
              //     console.log('Sender feedback:', mailError, mailResponse);
              // });
              console.log('===========');
          } else {
              console.log('LOL clock success! \r\n' + text);
              // console.log('===========');
              // console.log('body = ', body)
          }

          if (callback && typeof callback === 'function') {
              callback(err, httpResponse, body);
          }
      }
    );

    var form = r.form();
    form.append('text', text);
    if (enableImage) {
        form.append('image', request.get(imageUrl));
    }
}


function refreshToken (refresh_token, text, date, callback) {
    var client_id = config.douban.apiKey;
    var client_secret = config.douban.Secret;
    var redirect_uri = config.douban.redirect_uri;

    request.post({
        url: 'https://www.douban.com/service/auth2/token?client_id=' + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirect_uri + '&grant_type=refresh_token&refresh_token=' + refresh_token,
    }, function (error, response, resBody) {
        if (!error && response.statusCode === 200) {
            accessToken = resBody.access_token;
            refresh_token = resBody.refresh_token;
            postToDouban(accessToken, refresh_token, text, date, function () {
              console.log('刷新 token 并广播成功');
            });
        } else {
            console.error(date + 'refresh_token fail!', error, resBody);
        }
    });
}

module.exports = router;
