/*
* @Author: naoyeye
* @Date:   2018-03-19 20:35:42
* @Last Modified by:   naoyeye
* @Last Modified time: 2018-03-19 22:06:06
*/

'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var config = require('./../config/app-config');
var url = require('url');
var request = require('request');
var curl = require('curlrequest');
var schedule = require('node-schedule');

var animalName = '鸡';
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


if (!String.repeat) {
    String.prototype.repeat = function (l) {
        return new Array(l + 1).join(this);
    }
}


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

          });
        })


        isLaunched = true;

        var data = {
          currentUser: true,
          tryLogged: true,
          message: `欢迎大笨${animalName}，嘻嘻嘻嘻嘻！`,
          imageUrl: enableImage ?  imageUrl : '',
          config: config
        }

        res.render('index', data);


      } else {
        var data = {
          currentUser: true,
          tryLogged: true,
          message: `欢迎大笨${animalName}，哈哈哈哈哈哈！`,
          imageUrl: enableImage ?  imageUrl : '',
          config: config
        }
        res.render('index', data);
      }

    } else {
      var data = {
        currentUser: false,
        tryLogged: true,
        message: `你不是大笨${animalName}`,
        imageUrl: enableImage ?  imageUrl : '',
          config: config
      }
      res.render('index', data);
    }

  } else {
    var data = {
      currentUser: false,
      tryLogged: false,
      message: `你是大笨${animalName}吗？不是大笨狗不要点下面的按钮。`,
      imageUrl: enableImage ?  imageUrl : '',
      config: config
    }
    res.render('index', data);
  }
});



module.exports = router;
