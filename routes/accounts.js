/*
* @Author: hanjiyun
* @Date:   2019-01-27 18:25:48
* @Last Modified by:   hanjiyun
* @Last Modified time: 2019-01-27 23:06:03
*/
const router = require('express').Router()
const AV = require('leanengine')
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true })

module.exports = (app) => {
  /* 登录 */
  router.get('/login', csrfProtection, (req, res, next) => {
    let errMsg = req.query.errMsg
    res.render('accounts/login', {
      errMsg,
      user: req.currentUser ? req.currentUser.attributes : null,
      csrfToken: req.csrfToken()
    })
  })

  router.post('/login', csrfProtection, (req, res, next) => {
    let email = req.body.email
    let password = req.body.password
    if (!email || email.trim().length === 0
      || !password || password.trim().length === 0) {
      return res.redirect(`/accounts/login?errMsg=${encodeURIComponent('用户名或密码不能为空')}`)
    }
    AV.User.logIn(email, password).then((user) => {
      res.saveCurrentUser(user) // 保存当前用户到 Cookie
      res.redirect('/')
    }, (err) => {
      //登录失败，跳转到登录页面
      res.redirect('/accounts/login?errMsg=' + err.rawMessage);
    })
  })

  /* 注册 */
  router.get('/register', csrfProtection, (req, res, next) => {
    let errMsg = req.query.errMsg
    res.render('accounts/register', {
      errMsg,
      user: req.currentUser && req.currentUser.attributes || null,
      csrfToken: req.csrfToken()
    })
  })

  router.post('/register', csrfProtection, (req, res, next) => {
    let username = req.body.username
    let password = req.body.password
    let email = req.body.email
    if (!username || username.trim().length === 0
      || !password || password.trim().length === 0
      || !email || email.trim().length === 0) {
      return res.redirect(`/accounts/register?errMsg=${encodeURIComponent('用户名、邮箱、密码不能为空')}`)
    }
    let user = new AV.User()
    user.set('username', username)
    user.set('password', password)
    user.set('email', email)
    user.signUp().then((user) => {
      // 保存当前用户到 Cookie
      res.saveCurrentUser(user)
      res.redirect('/')
    }, (err) => {
      res.redirect('/accounts/register?errMsg=' + err.rawMessage)
    }).catch(next)
  })

  // 退出
  router.get('/logout', (req, res) => {
    // 从 Cookie 中删除用户
    res.clearCurrentUser()
    res.redirect('/')
  })

  return router
}