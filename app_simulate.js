const {Builder, By, Key, until, Origin} = require('selenium-webdriver')
const axios = require('axios')

const LOGIN_URL = "http://api.eobzz.com/httpApi.do?action=loginIn&uid=账号&pwd=密码"
const GET_PHONE_URL = "http://api.eobzz.com/httpApi.do?action=getMobilenum&pid=38100&uid=tracyxiang5&token="
const GET_CODE_URL = "http://api.eobzz.com/httpApi.do?action=getVcodeAndReleaseMobile&uid=tracyxiang5"
const BLACK_LIST_URL = "http://api.eobzz.com/httpApi.do?action=addIgnoreList&uid=tracyxiang5&pid=38100"

const CHECK_REGISTER_URL = "https://candy.one/api/user/is_register"

const NUM_REG = /\d{6}/g

async function start() {
  try {
    let res = await axios.get(LOGIN_URL)
    res = res.data
    let token = res.split('|')[1]
    console.log(`登录成功 Token:${token}`)
    let driver
    while (1) {
      try {
        // Create a simulate web browser
        driver = await new Builder().forBrowser('firefox').build()
        let actions = driver.actions()

        // Start to fetch phone from api
        let phone
        console.log("Start a new loop to get candy")
        await new Promise((resolve, reject) => {
          let intv = setInterval(async () => {
            let res = await axios.get(GET_PHONE_URL + token)
            if (res.data === 'no_data') {
              console.log("No other phone number available.")
              clearInterval(intv)
              reject()
              return
            }
            if (res.data.split('|')[0] === 'message') {
              return
            }
            phone = res.data.split('|')[0]
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
              return
            }
            clearInterval(intv)
            resolve()
          }, 1500)
        })


        await driver.get('https://candy.one/user/login?id=3421208')
        await driver.findElement(By.name('phone')).sendKeys(phone)
        // TODO BUG Can not click login btn
        let el = driver.findElement(By.xpath('//button[@class="candy-btn"]'))
        console.log(el)
        await driver.findElement(By.xpath('//button[@class="candy-btn"]')).click()
        let slideEl = driver.findElement(By.className('verifyModal'))
        await driver.wait(until.elementIsVisible(slideEl))
        await actions
          .move({origin: driver.findElement(By.className('btn_slide'))})
          .press()
          .move({x: 483, y: 0, origin: Origin.POINTER})
          .release()
        await driver.wait(until.urlContains('code'))

        // Get code from API
        let code
        await new Promise((resolve, reject) => {
          let intv = setInterval(async () => {
            try {
              console.log("Start to fetch verify_code from API.")
              let res = await axios.get(GET_CODE_URL + `&token=${token}&mobile=${phone}`)
              console.log(res.data)
              if (res.data !== 'not_receive' && res.data.split('|')[0] !== 'message') {
                let msg = res.data.split('|')[1]
                code = msg.match(NUM_REG)
                code = code && code[0]
                if (!code) {
                  return
                }
                console.log(`Get verify code of ${phone}: ${code}`)
                clearInterval(intv)
                resolve()
              }
            } catch (e) {
              console.log(e)
            }
          }, 3000)
        })

        if (!code) {
          await driver.quit()
          continue
        }
        await driver.findElement(By.name('code')).sendKeys(code)
        await driver.findElement(By.xpath('//button[@class="candy-btn"]')).click()
        await driver.wait(until.urlContains("home"))
      } catch (e) {
        console.log(e)
      } finally {
        await driver.quit()
      }
    }
  } catch (e) {
    console.log(e)
  }

}

start()