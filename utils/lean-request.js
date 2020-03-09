const crypto = require('crypto')
const fetch = require('node-fetch')

const LeanRequest = (className, method, optionsData) => {
  let now = Date.now()
  let unsign = now + '' + process.env.LEANCLOUD_APP_MASTER_KEY
  let sign = crypto.createHash('md5').update(unsign).digest('hex')
  sign = `${sign},${now},master`

  return new Promise((resolve, reject) => {
    let options = {
      method: `${method}`,
      headers: {
        'X-LC-Id':  process.env.LEANCLOUD_APP_ID,
        'X-LC-Sign': sign,
        'Content-Type': 'application/json'
      }
    }

    let url = `https://${process.env.LEANCLOUD_APP_NAME}.api.lncld.net/1.1/classes/${className}`

    if (optionsData && method === 'post') {
      options.body = optionsData
      url = `${url}?fetchWhenSave=true`
    } else if (optionsData && method === 'get') {
      url = `${url}?${encodeURI(optionsData)}`
    }

    console.log('url - ', url)

    fetch(url, options)
      .then(res => res.json())
      .then(json => resolve(json))
      .catch(err => reject(err))
  })
}

module.exports = LeanRequest


