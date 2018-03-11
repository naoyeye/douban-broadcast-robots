/*
* @Author: hanjiyun
* @Date:   2019-01-26 20:04:52
* @Last Modified by:   hanjiyun
* @Last Modified time: 2019-01-26 23:14:21
*/
'use strict';
const router = require('express').Router()
const LeanRequest = require('./../utils/lean-request')


module.exports = (app) => {

  router.get('/', (req, res, next) => {
    res.render('newbot')
  })

  router.post('/', (req, res, next) => {
    const optionsData = req.body

    // console.log('optionsData = ', optionsData)

    // 新建帐号
    LeanRequest('Robot', 'post',JSON.stringify(optionsData)).then(data => {
      if (req.query.raw === 'true') {
        res.json(data)
        return
      }

      res.redirect('/')
    }).catch(err => {
      res.render(err)
    })
  })

  return router
}