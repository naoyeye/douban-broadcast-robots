/*
* @Author: hanjiyun
* @Date:   2018-09-21 16:25:08
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-10-22 19:36:25
*/


/**
 * 大笨钟
 * @authors RalfZ (ralfz.zhang@gmail.com)
 * @date    2017-05-01 17:39:51
 * @version 1.0.0
 */
const rp = require('request-promise')
const ns = require('node-schedule')
const request = require('request');

var latestPriceBTC = 0;
var latestPriceEOS = 0;
var latestPriceETH = 0;
var latestPriceHT = 0;
var point = 20; // 第几分钟时发布广播


const PromisifyGET = (options) => {
  return new Promise((resolve, reject) => {
    request.get(options, (err, httpResponse, body) => {
      if (err || httpResponse.statusCode !== 200) {
        reject(err)
        return
      }
      resolve(JSON.parse(body))
    })
  })
}


function postBroadcast(text) {

  console.log('text - ', text)

  let i = 0;
  let tryPost = function() {
    rp.post({
      url: 'https://m.douban.com/rexxar/api/v2/status/create_status',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        'Referer': `https://m.douban.com/status/`,
        'Origin': 'https://m.douban.com',
        'Host': 'm.douban.com',
        'Cookie': `ll="108288"; bid=Vr0BxuvScWw; viewed="1417805"; _vwo_uuid_v2=1F51885829EC8E5F35676E8A61D7CEB8|0a20ca1b31aa8a07bc5260cc095ec9f2; _ga=GA1.2.1771395678.1510888474; _ga=GA1.3.1771395678.1510888474; __yadk_uid=IlhLGT8addwcULd9fDzpaEcxEFYHCMEu; push_doumail_num=0; douban-profile-remind=1; ue="naoyeye@126.com"; __utmv=30149280.17524; douban-fav-remind=1; __utmc=30149280; frodotk="00c6918fb7c2c3940253b4af27484abc"; talionusr="eyJpZCI6ICIxNzUyNDgyNzYiLCAibmFtZSI6ICJcdThjNDZcdTc0ZTNcdTU5MjdcdTdiMjhcdTcyZDcifQ=="; __ads_session=okmmfDIUKgkGtCIAggA=; talionnav_show_app="0"; ap_v=0,6.0; __utma=30149280.1771395678.1510888474.1538635021.1540205417.118; __utmz=30149280.1540205417.118.17.utmcsr=dabengou.leanapp.cn|utmccn=(referral)|utmcmd=referral|utmcct=/; ps=y; dbcl2="175248276:dvGAoVfrnCI"; ck=${process.env.ck}; __utmt=1; push_noty_num=0; __utmb=30149280.51.10.1540205417; Hm_lvt_6d4a8cfea88fa457c3127e14fb5fabc2=1540207043; _gid=GA1.3.1680789569.1540207043; _gat_UA-53594431-4=1; _gat_UA-53594431-6=1; Hm_lpvt_6d4a8cfea88fa457c3127e14fb5fabc2=1540207047`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'DNT': 1,
        'Connection': 'keep-alive',
        'X-Requested-With': 'XMLHttpRequest'
      },
      form: {
        text: text,
        image_urls: null,
        ck: process.env.ck,
        for_mobile: 1
      },
      json: true,
      timeout: 10000,
    }).then(res => {
      console.log('----> \n', new Date(), 'postBroadcast Success')
    }).catch(err => {
      if (err && err.error) {
        console.log('----> \n', new Date(), 'postBroadcast ERR. Code: ', err.error.code)
        console.log('Err msg: ', JSON.stringify(err))
        switch (err.error.code) {
          case 103: // INVALID_ACCESS_TOKEN
          case 106: // ACCESS_TOKEN_HAS_EXPIRED
          case 119: // INVALID_REFRESH_TOKEN
          case 123: // ACCESS_TOKEN_HAS_EXPIRED_SINCE_PASSWORD_CHANGED
            console.log('re posting...')
            authenticate(() => postBroadcast(text));
            break;
          case 'ETIMEDOUT': 
            if(i<5){
              i++;
              tryPost();
            }else{
              console.log(new Date(), 'ERR, posting try more than 5 times')
            }
            break;
        }
      } else {
        console.log('----> \n', new Date(), 'postBroadcast ERR: ', err)
        console.log('Err msg: ', JSON.stringify(err))
      }
    })
  }

  tryPost();
}


function getText() {
  // api 请求列表
  const apiRequestList = [
    // btc-usd
    PromisifyGET({
      url: 'https://www.bitstamp.net/api/v2/ticker/btcusd/'
    }),
    // eos-usd
    PromisifyGET({
      url: 'https://api.coinmarketcap.com/v2/ticker/1765/?convert=USD'
    }),
    // eth-usd
    PromisifyGET({
      url: 'https://api.coinmarketcap.com/v2/ticker/1027/?convert=USD'
    }),
    // ht-btc
    PromisifyGET({
      url: 'https://api.coinmarketcap.com/v2/ticker/2502/?convert=BTC'
    })
  ]

  Promise.all(apiRequestList).then(resList => {
    const latestPriceBTC = `${resList[0].last}`
    const latestPriceEOS = `${parseFloat(resList[1].data.quotes.USD.price).toFixed(2)}`
    const latestPriceETH = `${parseFloat(resList[2].data.quotes.USD.price).toFixed(2)}`
    const latestPriceHT = `${resList[3].data.quotes.BTC.price}`

    const text = `1 btc ≈ $${latestPriceBTC}\r\n1 eos ≈ $${latestPriceEOS}\r\n1 eth ≈ $${latestPriceETH}\r\n1 ht ≈ ₿${latestPriceHT}`

    postBroadcast(text)

  }).catch(errList => {
    if (errList[0]) {
      console.error('获取 btc/usd 失败')
    }
    if (errList[1]) {
      console.error('获取 eos/usd 失败')
    }
    if (errList[2]) {
      console.error('获取 eth/usd 失败')
    }
    if (errList[3]) {
      console.error('获取 ht/btc 失败')
    }

    return '获取币价出错'
  })
}

function run() {

  getText()

  ns.scheduleJob(`*/${point} * * * *`, () => {
    getText()
  })
}


module.exports = run;
