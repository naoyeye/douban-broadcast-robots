/*
* @Author: naoyeye
* @Date:   2018-03-11 18:03:33
* @Last Modified by:   naoyeye
* @Last Modified time: 2018-03-19 20:28:26
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
var latestPriceUSD = 0;
var latestPriceCNY = 0
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


        var autoGetBitcoinPrice = schedule.scheduleJob("*/28 * * * *", function() {
          request.get({
            url: 'https://www.bitstamp.net/api/v2/ticker/btcusd/',
            method: 'GET'
          }, function (err, data) {
            var _data = JSON.parse(data.body);
            // console.log('_data - ', _data)
            latestPriceUSD = _data.last
            // console.log('latestPrice = ', latestPrice)

            // var autoPostStatusTask = schedule.scheduleJob('*/50 * * * *', function () {
              var d = new Date();
              var localTime = d.getTime();
              var localOffset = d.getTimezoneOffset() * 60000;
              var utc = localTime + localOffset;
              var offset = 8;
              var beijing = utc + (3600000 * offset);
              date = new Date(beijing);

              // console.log('latestPriceUSD = ', latestPriceUSD)

              if (latestPriceUSD) {
                // 获取人民币美元汇率
                request.get({
                  url: 'http://api.k780.com/?app=finance.rate&scur=USD&tcur=CNY&appkey=32282&sign=4f0a02693e7a594ea448e2d62264242c',
                  method: 'GET'
                }, function (rateErr, rateData) {
                  var _data = JSON.parse(rateData.body);
                  // console.log('_data - ', _data)
                  if (_data.success === '1') {
                    latestPriceCNY = (latestPriceUSD * _data.result.rate).toFixed(2);
                    var text = '1₿ ≈ $' + latestPriceUSD + ' ≈ ￥' + latestPriceCNY;
                    postToDouban(accessToken, refresh_token, text, date, function (err, httpResponse, body) {

                    });
                  }
                });
              }

            // });
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
        if (err && err.code === 106) {
            console.error(date + '\r\nHoly fuck! Clock fail! We need to refresh token!', err);

            refreshToken(refresh_token, text, date, callback);


            console.log('===========');
        } else if (err || typeof body.code !== 'undefined') {
            console.error(date + '\r\nFuck! Clock fail!, Error:', err, '\r\n Body:', body);
            mailSender('FxxK dabenji!', body, function (mailError, mailResponse) {
                console.log('Sender feedback:', mailError, mailResponse);
            });
            console.log('===========');
        } else {
            console.log('LOL clock success! ' + text);
            // console.log('===========');
            // console.log('body = ', body)
        }

        if (callback && typeof callback === 'function') {
            callback(err, httpResponse, body);
        }
    });

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
