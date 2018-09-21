/*
* @Author: naoyeye
* @Date:   2018-03-11 18:03:33
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-09-21 19:51:22
*/


'use strict';
var router = require('express').Router();
var run = require('./douban-broadcast-bot.js')

var isLaunched = false;

router.get('/', function(req, res, next) {
    if (!isLaunched) {

      console.log('大笨狗开工啦！');

      run();

      // 启动成功改变状态
      isLaunched = true;

      // 渲染页面
      res.render('index', {
        currentUser: true,
        tryLogged: true,
        message: '欢迎大笨狗，嘻嘻嘻嘻嘻！',
        imageUrl: ''
      })

    } else {
      console.log('自动脚本已经启动了')
      res.render('index', {
        currentUser: true,
        tryLogged: true,
        message: '欢迎大笨狗，哈哈哈哈哈哈！',
        imageUrl: ''
      });
    }
});


module.exports = router;
