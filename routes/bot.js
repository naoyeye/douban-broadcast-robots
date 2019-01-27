/*
* @Author: hanjiyun
* @Date:   2019-01-26 23:05:08
* @Last Modified by:   hanjiyun
* @Last Modified time: 2019-01-27 22:15:31
*/


'use strict';
const router = require('express').Router()
const LeanRequest = require('./../utils/lean-request')
// const USER = require('./../models/user')

module.exports = (app) => {
  router.get('/', (req, res, next) => {
    let botName = req.query.name
    // 新建帐号
    LeanRequest('Robot', 'get', JSON.stringify({alis: botName})).then(data => {
      if (req.query.raw === 'true') {
        res.json(data)
        return
      }

      const bot = data.results[0]

      res.render('bot', {
        user: req.currentUser && req.currentUser.attributes || null,
        bot
      })

    }).catch(err => {
      res.render(err)
    })
  })


  return router
}