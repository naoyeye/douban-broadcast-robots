/*
* @Author: hanjiyun
* @Date:   2018-09-21 16:25:08
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-11-22 21:51:43
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
        'Cookie': process.env.cookie,
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
