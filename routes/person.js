/*
* @Author: hanjiyun
* @Date:   2018-05-31 13:44:07
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-05-31 14:31:35
*/

'use strict';
var router = require('express').Router();
var AV = require('leanengine');

// var Todo = AV.Object.extend('Todo');

// 新增
router.post('/new', function(req, res, next) {
  var data = req.body;
  console.log('req.body.content - ', req.body)
  // var todo = new Todo();
  // todo.set('content', content);
  // todo.save().then(function(todo) {
  //   res.redirect('/todos');
  // }).catch(next);

  if (!data || !data.name || !data.age) {
    res.json({
      error: 1,
      message: '出错了，后端没有拿到前端传递的数据'
    })
  } else {
    res.json({
      age: data.age,
      name: data.name
    })
  }
});

module.exports = router;