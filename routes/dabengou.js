/*
* @Author: naoyeye
* @Date:   2018-03-11 18:03:33
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-09-05 15:56:41
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
var latestPriceEOS = 0;
var latestPriceETH = 0;
var latestPriceHT = 0;
var point = 30; // 第几分钟时发布广播

const PromisifyGET = (options) => {
  return new Promise((resolve, reject) => {
    request.get(options, (err, httpResponse, body) => {
      if (err || httpResponse.statusCode !== 200) {
        reject(err)
        return
      }
      resolve(JSON.parse(body))
    })
  })
}

router.get('/', function(req, res, next) {
  if (accessToken) {
    if (config.userId.indexOf(currentUserId) >= 0) {
      if (!isLaunched) {
        // 定时任务
        const ScheduleJob = schedule.scheduleJob(`*/${point} * * * *`, () => {

          // api 请求列表
          const apiRequestList = [
            // btc-usd
            PromisifyGET({
              url: 'https://www.bitstamp.net/api/v2/ticker/btcusd/'
            }),
            // eos-usd
            PromisifyGET({
              url: 'https://api.coinmarketcap.com/v2/ticker/1765/?convert=USD'
            }),
            // eth-usd
            PromisifyGET({
              url: 'https://api.coinmarketcap.com/v2/ticker/1027/?convert=USD'
            }),
            // ht-btc
            PromisifyGET({
              url: 'https://api.coinmarketcap.com/v2/ticker/2502/?convert=BTC'
            })
          ]

          Promise.all(apiRequestList).then(resList => {
            const latestPriceBTC = `${resList[0].last}`
            const latestPriceEOS = `${parseFloat(resList[1].data.quotes.USD.price).toFixed(2)}`
            const latestPriceETH = `${parseFloat(resList[2].data.quotes.USD.price).toFixed(2)}`
            const latestPriceHT = `${resList[3].data.quotes.BTC.price}`

            const text = `1 btc ≈ $${latestPriceBTC}\r\n1 eos ≈ $${latestPriceEOS}\r\n1 eth ≈ $${latestPriceETH}\r\n1 ht ≈ ₿${latestPriceHT}`

            // 发送到豆瓣广播
            postToDouban(accessToken, refresh_token, text, (err, httpResponse, body) => {})

          }).catch(errList => {
            if (errList[0]) {
              console.error('获取 btc/usd 失败')
            }
            if (errList[1]) {
              console.error('获取 eos/usd 失败')
            }
            if (errList[2]) {
              console.error('获取 eth/usd 失败')
            }
            if (errList[3]) {
              console.error('获取 ht/btc 失败')
            }
          })
        })

        // 启动成功改变状态
        isLaunched = true;

        // 渲染页面
        res.render('index', {
          currentUser: true,
          tryLogged: true,
          message: '欢迎大笨狗，嘻嘻嘻嘻嘻！',
          imageUrl: enableImage ?  imageUrl : ''
        })

      } else {
        res.render('index', {
          currentUser: true,
          tryLogged: true,
          message: '欢迎大笨狗，哈哈哈哈哈哈！',
          imageUrl: enableImage ?  imageUrl : ''
        });
      }

    } else {
      res.render('index', {
        currentUser: false,
        tryLogged: true,
        message: '你不是大笨狗',
        imageUrl: enableImage ?  imageUrl : ''
      });
    }
  } else {
    res.render('index', {
      currentUser: false,
      tryLogged: false,
      message: '你是大笨狗吗？不是大笨狗不要点下面的按钮。',
      imageUrl: enableImage ?  imageUrl : ''
    });
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


function postToDouban (accessToken, refresh_token, text, callback) {

  const d = new Date();
  const localTime = d.getTime();
  const localOffset = d.getTimezoneOffset() * 60000;
  const utc = localTime + localOffset;
  const offset = 8;
  const beijing = utc + (3600000 * offset);
  date = new Date(beijing);

  // 带图版
  var r = request.post('https://api.douban.com/shuo/v2/statuses/', {
        method: 'POST',
        headers: {'Authorization': 'Bearer ' + accessToken},
        // timeout: 70000 // 7秒超时吧
    }, function (err, httpResponse, body) {
      console.log(typeof body, 'body = ', body)
      console.log('body.code = ', body.code, typeof body.code)

      if (body.code === 106) {
        console.error(date + '\r\nHoly fuck! Clock fail! We need to refresh token!', err);

        refreshToken(refresh_token, text, callback);

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


function refreshToken (refresh_token, text, callback) {
    var client_id = config.douban.apiKey;
    var client_secret = config.douban.Secret;
    var redirect_uri = config.douban.redirect_uri;

    request.post({
        url: 'https://www.douban.com/service/auth2/token?client_id=' + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirect_uri + '&grant_type=refresh_token&refresh_token=' + refresh_token,
    }, function (error, response, resBody) {
        if (!error && response.statusCode === 200) {
            accessToken = resBody.access_token;
            refresh_token = resBody.refresh_token;
            postToDouban(accessToken, refresh_token, text, function () {
              console.log('刷新 token 并广播成功');
            });
        } else {
            console.error(date + 'refresh_token fail!', error, resBody);
        }
    });
}

module.exports = router;
