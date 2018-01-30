const {Builder, By, Key, until} = require('selenium-webdriver')
const {Origin} = require('selenium-webdriver/lib/input')
const axios = require('axios')

const LOGIN_URL = "http://api.eobzz.com/httpApi.do?action=loginIn&uid=账号&pwd=密码"
const GET_PHONE_URL = "http://api.eobzz.com/httpApi.do?action=getMobilenum&pid=38100&uid=tracyxiang5&token="
const GET_CODE_URL = "http://api.eobzz.com/httpApi.do?action=getVcodeAndReleaseMobile&uid=tracyxiang5"
const BLACK_LIST_URL = "http://api.eobzz.com/httpApi.do?action=addIgnoreList&uid=tracyxiang5&pid=38100"

const CHECK_REGISTER_URL = "https://candy.one/api/user/is_register"

const NUM_REG = /\d{6}/g
const MAX_LOOP_TIME = 20

const BABY_LIST = [
  "3421208",
  "3552277",
  "88493",
  "430447",
  "225690"
]

axios.defaults.timeout = 10000

/**
 * Sleep
 * @param duration - seconds
 */
function sleep(duration) {
  let now = Date.now()
  while (1) {
    let d = Date.now()
    if (d - now >= duration * 1000) {
      break
    }
  }
}

/**
 * Start hao yang mao
 */
(async function start() {
  try {
    let res = await axios.get(LOGIN_URL)
    res = res.data
    let token = res.split('|')[1]
    console.log(`登录成功 Token:${token}`)
    let user_ind = -1

    let driver
    while (1) {
      user_ind++
      try {
        // Create a simulate web browser
        driver = await new Builder().forBrowser('firefox').build()

        // Start to fetch phone from api
        let phone
        console.log("Start a new loop to get candy")
        while (1) {
          sleep(1)
          let res = await axios.get(GET_PHONE_URL + token)
          if (res.data === 'no_data') {
            console.log("No other phone number available.")
            return
          }
          let msgArr = res.data.split('|')
          if (msgArr[0] === 'message') {
            console.log(msgArr[1])
            continue
          }
          phone = msgArr[0]
          console.log(`Get a new phone number:${phone}`)
          console.log("Start to check register")
          res = await axios.post(CHECK_REGISTER_URL, {
            country_code: "cn",
            phone: `+86${phone}`
          })
          if (res.data.data.registed) {
            // has registed, change a phone
            console.log("The phone number has registed. Reget a new number")
            await axios.get(BLACK_LIST_URL + `&token=${token}&mobiles=${phone}`)
            continue
          }
          break
        }

        await driver.get('https://candy.one/user/login?id=' + BABY_LIST[parseInt(user_ind % BABY_LIST.length)])
        await driver.findElement(By.name('phone')).sendKeys(phone)
        await driver.findElement(By.xpath('//button[@class="candy-btn"]')).click()
        // Loop to make sure for having clicked submit btn.
        while (1) {
          try {
            await driver.wait(until.elementLocated(By.id('nc_1_n1z')), 2000)
            break
          } catch (e) {
            await driver.findElement(By.xpath('//button[@class="candy-btn"]')).click()
          }
        }
        // Check if verify slide get error or not
        while (1) {
          await driver.actions({bridge: true})
            .move({origin: driver.findElement(By.id('nc_1_n1z'))})
            .press()
            .move({x: 500, y: 0, origin: Origin.POINTER})
            .release()
            .perform()
          try {
            await driver.wait(until.urlContains('code'), 2000)
            break
          } catch (e) {
            let resetBtn = await driver.findElement(By.xpath('//a[@href="javascript:noCaptcha.reset(1)"]'))
            let isDisplay = await resetBtn.isDisplayed()
            if (isDisplay) {
              await resetBtn.click()
              await driver.wait(until.elementLocated(By.id('nc_1_n1z')))
            }
          }
        }

        // Get code from API
        let code
        let loopTime = 0
        while (loopTime < MAX_LOOP_TIME) {
          try {
            console.log("Start to fetch verify_code from API.")
            let res = await axios.get(GET_CODE_URL + `&token=${token}&mobile=${phone}`)
            console.log(res.data)
            if (res.data !== 'not_receive' && res.data.split('|')[0] !== 'message') {
              let msg = res.data.split('|')[1]
              if (!msg) throw(void 666)
              code = msg.match(NUM_REG)
              code = code && code[0]
              if (!code) throw(void 666)
              console.log(`Get verify code of ${phone}: ${code}`)
              break
            }
          } catch (e) {
          }
          loopTime++
          sleep(3)
        }

        if (!code) {
          await driver.quit()
          continue
        }
        await driver.findElement(By.name('code')).sendKeys(code)
        await driver.findElement(By.xpath('//button[@class="candy-btn"]')).click()
        await driver.wait(until.urlContains("setPassword"))
      } catch (e) {
        console.log(e)
      } finally {
        driver.quit()
      }
    }
  } catch (e) {
    console.log(e)
  }
})()
