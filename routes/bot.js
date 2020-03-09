/*
* @Author: hanjiyun
* @Date:   2019-01-26 23:05:08
* @Last Modified by:   hanjiyun
* @Last Modified time: 2019-02-07 16:31:21
*/


'use strict';
const router = require('express').Router()
const LeanRequest = require('./../utils/lean-request')
// const USER = require('./../models/user')

module.exports = (app) => {
  /* create new bot */
  router.get('/new', (req, res, next) => {
    res.render('newbot', {
      user: req.currentUser && req.currentUser.attributes || null,
    })
  })

  router.post('/new', (req, res, next) => {
    const optionsData = req.body
    LeanRequest('Robot', 'post',JSON.stringify(optionsData)).then(data => {
      if (req.query.raw === 'true') {
        res.json(data)
        return
      }

      let currentUser = req.currentUser
      let botAlias = data.alias

      // 关联
      syncUserBotRelation(currentUser, data, (resp) => {
        console.log('resp = ', resp)
        res.redirect(`/bot/${botAlias}`)
      })
    }).catch(err => {
      res.render(err)
    })
  })

  /* show bot detail */
  router.get('/:botname', (req, res, next) => {
    let botname = req.params.botname
    if (!botname) {
      res.status(404)
      res.render('404')
      return
    }

    if (botname === 'new') {
      res.redirect('/bot/new')
      return
    }

    console.log()

    let condition = `where=${JSON.stringify({alias: botname})}`

    LeanRequest('Robot', 'get', condition).then(data => {
      if (req.query.raw === 'true') {
        res.json(data)
        return
      }

      console.log('data.results = ', data.results)

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


function syncUserBotRelation(user, bot, callback) {
  LeanRequest('User_Bot_Relation', 'post', JSON.stringify({
    userId: user.id,
    botId: bot.objectId
  })).then(resp => {
    callback(resp)
  })
}
