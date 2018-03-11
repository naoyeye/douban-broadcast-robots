/*
* @Author: naoyeye
* @Date:   2018-03-11 18:03:33
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-07-09 12:06:40
*/


'use strict'
const router = require('express').Router()

const config = require('./../config/app-config')
const url = require('url')
const request = require('request')
const schedule = require('node-schedule')

// const USER = require('./../models/user')

module.exports = function(app) {

  // 从 config 中选出 大笨狗
  const botConfig = config.botList.filter((bot) => {
    return bot.id === '175248276'
  })[0]


  // var animalName = botConfig.name;

  // let accessToken = null
  // let refreshToken = null
  // let currentUserId = null

  let date
  let isLaunched = false
  let latestPriceUSD = 0
  let latestPriceCNY = 0
  const point = 30 // 第几分钟时发布广播
  const rule = `*/${point} * * * *` // schedule 的规则

  // const _USER = new USER()

  // 机器人页
  router.get('/', function(req, res, next) {



    // // 先查下数据库里是不是有这个机器人用户了
    // _USER.search({ 'dounbanId': botConfig.id }, 1, (resp) => {
    //   if (!resp.error) {
    //     // 有的话就直接 render 页面
    //     console.log('user = ', resp.data)

    //     res.render('bot', {
    //       tryLogged: true,
    //       message: resp.data.doubanAccessToken ? '已授权登录' : '未授权登录',
    //       logged: !!resp.data.doubanAccessToken, // 标记为授权登录了
    //       user: resp.data
    //     })

    //   } else {
    //     // 没有就先创建
    //     _USER.create({
    //       'dounbanId': botConfig.id,
    //       'username': botConfig.name,
    //       'password': 'testpassword',
    //       'intro': botConfig.intro,
    //       'botStatus': '0', // 未运行
    //       'image': botConfig.image,
    //       'alias': botConfig.alias,
    //       'doubanAccessToken': botConfig.accessToken || '',
    //       'doubanRefreshToken': botConfig.refreshToken || ''
    //     }, (newUserResp) => {
    //       //  render 页面
    //       res.render('bot', {
    //         tryLogged: false,
    //         message: '这是欢迎信息',
    //         logged: false,
    //         user: newUserResp.data
    //       })
    //     })
    //   }
    // })
  })





  // router.use('/reAuth', function (req, res, next) {
  //     // 清空
  //     app.set('accessToken', null);
  //     app.set('refreshToken', null);
  //     app.set('currentUserId', null);

  //     res.redirect('/');
  // });


  function postToDouban(accessToken, refreshToken, text, date, callback) {
    var r = request.post('https://api.douban.com/shuo/v2/statuses/', {
        method: 'POST',
        headers: {'Authorization': 'Bearer ' + accessToken},
        // timeout: 70000 // 7秒超时吧
      }, function(err, httpResponse, body) {
        if (err && err.code === 106) {
          console.error(date + '\r\nHoly fuck! Clock fail! We need to refresh token!', err);

          refreshTokenHandle(refreshToken, text, date, callback);
          console.log('===========');
        } else if (err || typeof body.code !== 'undefined') {
          console.error(date + '\r\nFuck! Clock fail!, Error:', err, '\r\n Body:', body);
          // mailSender('FxxK dabenji!', body, function (mailError, mailResponse) {
          //     console.log('Sender feedback:', mailError, mailResponse);
          // });
          console.log('===========');
        } else {
          console.log('LOL clock success! ' + text);
        }

        if (callback && typeof callback === 'function') {
          callback(err, httpResponse, body);
        }
      }
    );

    var form = r.form();
    form.append('text', text);
  }



  function refreshTokenHandle(refreshToken, text, date, callback) {
    var client_id = config.douban.apiKey;
    var client_secret = config.douban.Secret;
    var redirect_uri = config.douban.redirect_uri;

    request.post({
      url: 'https://www.douban.com/service/auth2/token?client_id=' + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirect_uri + '&grant_type=refreshToken&refreshToken=' + refreshToken,
    }, function (error, response, resBody) {
      if (!error && response.statusCode === 200) {
        
        accessToken = resBody.access_token;
        refreshToken = resBody.refresh_token;

        app.set('accessToken', accessToken);
        app.set('refreshToken', refreshToken);

        postToDouban(accessToken, refreshToken, text, date, function () {
          console.log('刷新 token 并广播成功');
        });
      } else {
        console.error(date + 'refreshToken fail!', error, resBody);
      }
    });
  }




  return router
}







