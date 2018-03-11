/*
* @Author: naoyeye
* @Date:   2018-03-11 18:07:29
* @Last Modified by:   naoyeye
* @Last Modified time: 2018-03-11 20:15:54
*/

module.exports = {
    userId: ['175248276', 'post-rocker'], // 可以用来登录的豆瓣帐号 id
    homeUrl: 'https://dabengou.leanapp.cn/', // 你的应用主页，跟豆瓣 API 中填写的保持一致
    douban: {
        apiKey: '0d2c3144d6d595f4278493ce8480c1dc',
        Secret: '68e53d4534c02ea4',
        redirect_uri: 'https://dabengou.leanapp.cn/auth/douban/callback', // 跟豆瓣 API 中填写的保持一致。后面必须是 auth/douban/callback
        scope: 'douban_basic_common,shuo_basic_w,shuo_basic_r' // 跟豆瓣 API 中选择的保持一致，建议选这三个
    },

    // user pass recipient 任意一项不填，都可以关闭邮件发送
    mailer: {
        user: 'yourGmail@gmail.com', // 必须是 gmail
        pass: '',
        recipient: [''] // 另一个你自己的邮箱，用来接报时收报错信息
    }
};