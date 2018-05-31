/*
* @Author: hanjiyun
* @Date:   2018-05-31 13:44:07
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-05-31 13:46:45
*/

'use strict';
var router = require('express').Router();
var AV = require('leanengine');

// var Todo = AV.Object.extend('Todo');

// 新增
router.post('/new', function(req, res, next) {
  var content = req.body.content;
  // var todo = new Todo();
  // todo.set('content', content);
  // todo.save().then(function(todo) {
  //   res.redirect('/todos');
  // }).catch(next);

  var data = {
    age: content.age,
    name: content.name
  }

  res.json(data);
});

module.exports = router;