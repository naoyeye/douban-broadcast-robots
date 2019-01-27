'use strict';

var url = require('url')
var request = require('request')
var curl = require('curlrequest')
var AV = require('leanengine')

var router = require('express').Router()
var config = require('./../config/app-config')

const USER = require('./../models/user')

const LeanRequest = require('./../utils/lean-request')

module.exports = function(app) {

  // 首页
  router.get('/', (req, res, next) => {
    // 读取全部机器人账号
    LeanRequest('Robot', 'get').then(data => {
      if (req.query.raw === 'true') {
        res.json(data)
        return
      }

      res.render('home', {
        bots: data.results,
        user: req.currentUser && req.currentUser.attributes || null
      })
    }).catch(err => {
      res.render(err)
    })
  })


  /*
  // 请求豆瓣授权
  app.get('/auth/douban', function (req, res, next) {
    const parsedUrl = url.parse(req.url, true)
    const botname = parsedUrl.query.botname

    const redirectUrl = `https://www.douban.com/service/auth2/auth?client_id=${config.douban.apiKey}&redirect_uri=${encodeURIComponent(config.douban.redirect_uri + '?botname=' + botname)}&response_type=code&scope=${config.douban.scope}`

    res.redirect(redirectUrl)
  })


  // 豆瓣授权回调
  router.get('/auth/douban/callback', function (req, res, next) {
    const parsedUrl = url.parse(req.url, true)

    console.log(parsedUrl.query)
    
    if (!parsedUrl.query || !parsedUrl.query.code) {
      console.error("Missing code in querystring. The url looks like " + req.url)
      res.redirect('/');
      return;
    }

    const code = parsedUrl.query && parsedUrl.query.code
    const botname = parsedUrl.query.botname

    const oauth = {
      grant_type: 'authorization_code',
      code: code,
      client_id: config.douban.apiKey,
      client_secret: config.douban.Secret,
      redirect_uri: config.douban.redirect_uri
    }

    // get accessToken
    curl.request({
      url: 'https://www.douban.com/service/auth2/token',
      method: 'POST',
      data: oauth
    }, function (err, parts) {
      let _parts = parts.split('\r\n')
      const data = JSON.parse(_parts.pop())

      console.log('拿到了豆瓣登录授权： ', data)

      // 先获取 objectId
      // 然后更新 alias 为 botname 的用户，设置其 access_token 和 refresh_token、 expires_in
      _USER.search({ alias: botname }, 1, (resp) => {
        if (!resp.error) {
          console.log('resp = ', resp)
          let objectId = resp.data.id

          bots.forEach(bot => {
            if (bot.alias === botname) {
              bot.status = '运行中'
            }
          })

          _USER.update({ objectId: objectId }, {
            doubanAccessToken: data.access_token,
            doubanRefreshToken: data.refresh_token,
            doubanExpiresIn: data.expires_in,
            botStatus: '1' // 设置为「运行中」
          }, (result) => {
            console.log('拿到了： ', result)
            res.redirect('/' + botname)
          })
        }
      })



    })
  })
  */

  return router
}

