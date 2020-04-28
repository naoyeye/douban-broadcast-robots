/*
* @Author: hanjiyun
* @Date:   2018-09-21 16:25:08
* @Last Modified by:   hanjiyun
* @Last Modified time: 2020-04-28 17:27:26
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
var point = 59; // 第几分钟时发布广播


const PromisifyGET = (options) => {
  return new Promise((resolve, reject) => {
    request.get({
      url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${options.symbol}&convert=${options.convert}`,
      headers: {
        'X-CMC_PRO_API_KEY': '0d70c8aa-aa90-4cc6-8cb6-7cfb3a1235f1'
      },
      json: true,
      gzip: true
    }, (err, httpResponse, body) => {
      if (err || httpResponse.statusCode !== 200 ||
        // coinmarketcap api:
        // https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyQuotesLatest
        (body.status && body.status.error_code !== 0 || !body.data) ) {
        reject(err)
        return
      }
      resolve(body)
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
        'User-Agent': 'mozilla/5.0 (iphone; cpu iphone os 5_1_1 like mac os x) applewebkit/534.46 (khtml, like gecko) mobile/9b206 com.douban.frodo/5.0',
        'Referer': `https://m.douban.com/status/`,
        'Origin': 'https://m.douban.com',
        'Host': 'm.douban.com',
        'Cookie': process.env.cookie,
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'Content-Type': 'application/x-www-form-urlencoded',
        'DNT': 1,
        'Connection': 'keep-alive',
        'X-Requested-With': 'XMLHttpRequest',
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
        console.error('----> \n', new Date(), 'postBroadcast ERR. Code: ', err.error.code)
        console.error('Err msg: ', JSON.stringify(err))
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
              console.error(new Date(), 'ERR, posting try more than 5 times')
            }
            break;
        }
      } else {
        // console.error('----> \n', new Date(), 'postBroadcast ERR: ', err)
        console.error('Err msg: ', JSON.stringify(err))
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
      symbol: 'BTC',
      convert: 'USD'
    }),
    // eos-usd
    PromisifyGET({
      symbol: 'EOS',
      convert: 'USD'
    }),
    // eth-usd
    PromisifyGET({
      symbol: 'ETH',
      convert: 'USD'
    }),
    // ht-usd
    PromisifyGET({
      symbol: 'HT',
      convert: 'USD'
    })
  ]

  Promise.all(apiRequestList).then(resList => {
    console.log('resList = ', resList)
    // console.log('resList - ', resList)
    const latestPriceBTC = `${parseFloat(resList[0].data.BTC.quote.USD.price).toFixed(2)}`
    const latestPriceEOS = `${parseFloat(resList[1].data.EOS.quote.USD.price).toFixed(2)}`
    const latestPriceETH = `${parseFloat(resList[2].data.ETH.quote.USD.price).toFixed(2)}`
    const latestPriceHT = `${parseFloat(resList[3].data.HT.quote.USD.price).toFixed(4)}`

    const text = `1 btc ≈ $${latestPriceBTC}\r\n1 eos ≈ $${latestPriceEOS}\r\n1 eth ≈ $${latestPriceETH}\r\n1 ht ≈ $${latestPriceHT}`

    postBroadcast(text)

  }).catch(errList => {
    console.log('errList - ', errList)

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
      console.error('获取 ht/usd 失败')
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
