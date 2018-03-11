/*
* @Author: hanjiyun
* @Date:   2019-01-26 19:02:03
* @Last Modified by:   hanjiyun
* @Last Modified time: 2019-01-26 19:21:41
*/

/*
* @Author: naoyeye
* @Date:   2018-03-11 18:07:29
* @Last Modified by:   hanjiyun
* @Last Modified time: 2019-01-26 18:59:53
*/

const DABENGOU_ID = '175248276' // 大笨狗
const DABENJI_ID = '67736974'   // 大笨鸡

module.exports = {
  // 可以用来登录的豆瓣帐号 id
  userId: [
    DABENGOU_ID,
    DABENJI_ID,
  ],

  homeUrl: 'https://doubanbot.leanapp.cn/', // 你的应用主页

  botList: [
    {
      id: 'your id',
      alias: 'username',
      name: '昵称',
      image: '头像',
      intro: '简介'
    },
  ],

  // user pass recipient 任意一项不填，都可以关闭邮件发送
  mailer: {
    user: 'yourGmail@gmail.com', // 必须是 gmail
    pass: '',
    recipient: [''] // 另一个你自己的邮箱，用来接报时收报错信息
  }
}


