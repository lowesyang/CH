const axios = require('axios')

const LOGIN_URL = 'http://api.eobzz.com/api/do.php?action=loginIn'
const GET_PHONE_URL = 'http://api.eobzz.com/api/do.php?action=getPhone&'
const GET_CODE_URL = "http://api.eobzz.com/api/do.php?action=getMessage"
const BLACK_LIST_URL = "http://api.eobzz.com/api/do.php?action=addBlacklist"

const NUM_REG = /\d{6}/g

class Suma {
  /** Options Example
   * {
   *  uid 用户名
   *  pwd 密码
   *  pid 项目id
   * }
   */
  constructor(options) {
    this.uid = options.uid
    this.pwd = options.pwd
    this.pid = options.pid
    this.token = null
  }

  async login() {
    try {
      let res = await axios.get(LOGIN_URL + `&name=${this.uid}&password=${this.pwd}`)
      res = res.data.split('|')
      if (res[0] == 1) {
        this.token = res[1]
      } else {
        throw res[1]
      }
    } catch (e) {
      console.log(e)
    }
  }

  async getPhone() {
    try {
      let res = await axios.get(GET_PHONE_URL + `&pid=${this.pid}&token=${this.token}`)
      res = res.data.split('|')
      if (res[0] == 1) {
        return res[1]
      } else {
        throw res[1]
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Get verify code
  async getCode(phone) {
    try {
      let res = await axios.get(GET_CODE_URL + `&sid=${this.pid}&phone=${phone}&token=${this.token}`)
      res = res.data.split('|')
      if (res[0] == 1) {
        let msg = res[1]
        let code = msg.match(NUM_REG)
        code = code && code[0]
        if (!code) throw new Error('No verify code in message')
        else return code
      } else {
        throw res[1]
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Add phone number to blacklist
  async addBlack(phone) {
    try {
      let res = await axios.get(BLACK_LIST_URL + `&sid=${this.pid}&phone=${phone}&token=${this.token}`)
      res = res.data.split('|')
      return res[0] == 1
    }
  }
}