/*
* @Author: naoyeye
* @Date:   2018-03-20 14:48:09
* @Last Modified by:   hanjiyun
* @Last Modified time: 2019-01-26 23:13:38
*/

const AV = require('leanengine')
// const TABLE_NAME = 'TestUser'
const TABLE_NAME = 'Robot'
const USER_OBJECT = AV.Object.extend(TABLE_NAME)


class USER {

  constructor() {
  //   this.id = 0,
  //   this.alias = ''
  //   this.name = ''
  //   this.image = ''
  //   this.intro = ''
  //   this.status = '0' // 0=未运行 1=运行中 2=已暂停
  //   this.accessToken = null
  //   this.refreshToken = null
    this.search = search
  }

  /* 查询用户 */
  search(query, limitValue=1, callback) {
    if (!query) {
      callback && callback({
        'error': 1,
        'message': '缺少查询条件',
        'data': null
      })
      return
    }

    let Q = new AV.Query(USER_OBJECT)

    // 如果 limit 是个数字
    if (!isNaN(limitValue)) {
      Q.limit(parseInt(limitValue, 10))
    }

    // 将查询条件转为数组
    const _queryList = Object.entries(query)

    // 只有一个查询条件时
    if (_queryList.length === 1) {
      Q.equalTo(_queryList[0][0], _queryList[0][1])

      Q.find().then((results) => {
        if (results.length > 0) {
          let user = results[0]._serverData // 暂时都是取第 1 个

          user.id = results[0].id
          user.createdAt = results[0].createdAt
          user.updatedAt = results[0].updatedAt

          callback && callback({
            'error': 0,
            'message': '',
            'data': user
          })
        } else {
          callback && callback({
            'error': 1,
            'message': '没有此用户',
            'data': null
          })
        }
      })
    // 多个查询条件
    } else {
      let limitQStr = ''

      if (!isNaN(limitValue)) {
        limitQStr =  `limit ${limitValue}`
      }

      let CQL = `select * from ${TABLE_NAME} ${limitQStr} where`

      _queryList.map((item, index) => {
        CQL += ` ${_queryList[index][0]}="${_queryList[index][1]}" and`
      })

      // 裁剪最后的 and
      CQL = CQL.substr(0, CQL.length - 3)

      console.log('CQL - ', CQL)

      AV.Query.doCloudQuery(CQL).then((data) => {
        let user = results[0]._serverData // 暂时都是取第 1 个

        user.id = results[0].id
        user.createdAt = results[0].createdAt
        user.updatedAt = results[0].updatedAt

        callback && callback({
          'error': 0,
          'message': '',
          'data': user
        })
      }, (error) => {
        callback && callback({
          'error': 1,
          'message': '没有此用户',
          'data': null
        })
      });
    }
  }


  /* 创建用户 */
  create(userObj, callback) {
    const _userPropList = Object.entries(userObj)

    // console.log('_userPropList = ', _userPropList)

    // console.log('创建新用户')
    let user = new USER_OBJECT();

    _userPropList.map((item, index) => {
      console.log('item = ', item)
      console.log(item[0], item[1])
      user.set(item[0], item[1])
    })

    console.log('new user = ', user)
    // user.set("id", userObj.id)
    // user.set("password", userObj.password)

    user.save().then((userObject) => {
      console.log('创建成功', userObject)
      callback && callback({
        'error': 0,
        'message': '',
        'data': userObject
      })
    }, (error) => {
      console.error("创建存储失败", error)
      callback && callback({
        'error': 1,
        'message': error,
        'data': null
      })
    })
  }


  /* 更新用户  */
  update(query, newValue, callback) {
    let _valueList =  Object.entries(newValue)
    let newValueStr = ''
    _valueList.map((item, index) => {
      newValueStr += ` ${_valueList[index][0]}="${_valueList[index][1]}",`
    })
    newValueStr = newValueStr.substr(0, newValueStr.length - 1)

    let _queryList = Object.entries(query)
    let newQueryStr = ''
    _queryList.map((item, index) => {
      newQueryStr += `${_queryList[index][0]}="${_queryList[index][1]}" and`
    })
    newQueryStr = newQueryStr.substr(0, newQueryStr.length - 4)

    let CQL = `update ${TABLE_NAME} set ${newValueStr} where ${newQueryStr}`

    console.log('CQL - ', CQL)


    AV.Query.doCloudQuery(CQL).then(function (data) {
      // data 中的 results 是本次查询返回的结果，AV.Object 实例列表
      const results = data.results
      console.log('update results = ', results)

      callback && callback({
        'error': 0,
        'message': '',
        'data': results
      })
    }, function (error) {
      // 异常处理
      console.error(error)
      callback && callback({
        'error': 1,
        'message': '更新出错',
        'data': error
      })
    })
  }

  remove() {

  }

  isAdmin() {

  }
}


module.exports = USER
// export USER




