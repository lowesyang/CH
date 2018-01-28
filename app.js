let axios = require('axios')

const LOGIN_URL = "http://api.eobzz.com/httpApi.do?action=loginIn&uid=账号&pwd=密码"
const GET_PHONE_URL = "http://api.eobzz.com/httpApi.do?action=getMobilenum&pid=38100&uid=tracyxiang5&token="
const GET_CODE_URL = "http://api.eobzz.com/httpApi.do?action=getVcodeAndReleaseMobile&uid=tracyxiang5"
const BLACK_LIST_URL = "http://api.eobzz.com/httpApi.do?action=addIgnoreList&uid=tracyxiang5&pid=38100"

const CHECK_REGISTER_URL = "https://candy.one/api/user/is_register"
const VERIFY_CODE = "https://candy.one/api/passport/verify-code"
const VERIFY_CODE_LOGIN = "https://candy.one/api/passport/verify-code-login"

const SET_PSWD_URL = "https://candy.one/api/passport/set-password"

const NUM_REG = /\d{6}/g

async function Start() {
  try {
    let res = await axios.get(LOGIN_URL)
    res = res.data
    let token = res.split('|')[1]
    console.log(`登录成功 Token:${token}`)
    // let phoneRes = await rq({})
    // console.log(phoneRes)

    while (1) {
      console.log("Start a new loop to get candy")
      let res = await axios.get(GET_PHONE_URL + token)
      if (res.data === 'no_data') {
        console.log("No other phone number available.")
        break
      }
      let phone = res.data.split('|')[0]
      console.log(`Get a new phone number:${phone}`)
      console.log("Start to register")
      res = await axios.post(CHECK_REGISTER_URL, {
        country_code: "cn",
        phone: `+86${phone}`
      })
      if (res.data.hasPas) {
        // has registed, change a phone
        console.log("The phone number has registed. Reget a new number")
        await axios.get(BLACK_LIST_URL + `&token=${token}&mobiles=${phone}`)
        continue
      }
      // Request candy. to fetch code
      console.log("Request to get verify code.")
      res = await axios.post(VERIFY_CODE, {
        phone: `+86${phone}`,
        country_code: "cn"
      })
      if (res.data.code != 1) {
        console.log("Failed to request Candy site for verify code.")
        continue
      }
      let login = new Promise((resolve, reject) => {
        let intv = setInterval(async () => {
          try {
            console.log("Start to fetch verify_code from API.")
            let res = await axios.get(GET_CODE_URL + `&token=${token}&mobile=${phone}`)
            console.log(res.data)
            if (res.data !== 'not_receive') {
              clearInterval(intv)
              let msg = res.data.split('|')[1]
              let code = msg.match(NUM_REG)[0]
              console.log(`Get verify code of ${phone}: ${code}`)
              res = await axios.post(VERIFY_CODE_LOGIN, {
                code,
                phone: `+86${phone}`,
                country_code: 'cn',
                inviter_id: '3421208',
                // platform: 3,
                // scene: 'login',
                // session: '0152JIZgtMjy7iQLwB8JakWSDNcD98ob1rRTF6PqmyyNWvMTombwR_bUOdT9VlPAYK4ui9VUtvTdlBAsTRDRJRBbXMIlE49STVclA7FFvX2pQGwOzde3qpYrPnQt9P4osE8HnQ_GJozNCl5I80mPelurUIerRZ-eZy1G-LP8x6gjgQmki5i33Fvy2lWFm51Vx1HE83ymk9JwFDecJal2QhEdEVLjYdN9qjCLJRQ-Q0hkUrhCzFZQcTOiYwj8yQSzpUVhZkv1BUGXY2ywYtYip6DbhlW_pLVnZ0V1Ue4zmWguekvbIOUeC4yEiD7_blhB90DxOKzLm473JwX62SCtTI-mcrJCF8Sp5h5lcmirRHjx1EzMKWa9cyE-wK27Z2tlJGkIHO8bPKFZIHwVLLMKr4RwoYKzFbwq6rL35Ydepn-ZU',
                // sig: '05a1C7nT4bR5hcbZlAujcdyRwtEYMaG1S18fPHCJpLhDweFmtXl_lvRTlmN27fijCrE-8jND828U90YWZwmY7xZ5EnYQ9T5oC0nsShqZ9OROpiGp4-RSlo2wwzH2kqN58cK2GoAkAAJOg26J18tMQPvK406RM__zQ9dmDgm3jv3Tf8ZLrDnJYUvrbF6xs1H2nknAaArEkBmOPhG8A5mpB8gZMA5-_PSNx26v2JxF0rqsK11rLcgAwFdTUrxJTzwSK1ENdIfUeCNtvBvguQAms653r-G4aariNKIw2w8XAFFavPXuABCMmE6o5AsZxpIhXsPw5NDOfoNVQJ4YbBKzXauU6O1oWU8cChObsxDOFWFQea91SOxycpj386_uDgabxVyIx4RW0HVFZYrrQmY8R0aLQnLy_WQVQv7KREDmh-2ocZrxGnXXjdE-Il-QjZn4NyUctUHvJUuz_we2SU1g5I_3X9ZPfFXrz_3wYgP15f57ZcmVDY1QDKClNeiRPi33l_02Sp5pYN_I8yHVthnZmzIbk3em2CB0Q8i39TF6afgEvVlab27uktY-mbXCqqGS8kquTmUhzAZHjk2_yCrYuuxXv1pnneiyx8OXaHQqm_Zj7vX5jpbSG1cN2wwqAcGPq_JXean2soIbj6VtC82455uKSJNLQOpVbx9oL-DCS63wZDG-FpqstUMyxZtx4rt1yk8d_1XDhk2BGsJSkwfvimYkp_vuu3RNKBvQlu7ID9GymGxkLYDOyr9SDd3ry4y6BW',
                // token: 'FFFF00000000017A31CA:1517157165741:0.7394663147854661'
              })
              if (res.data.code) {
                let accessToken = res.data.data.access_token
                console.log(`Get access token:${accessToken}`)
                res = await axios({
                  method: 'post',
                  url: SET_PSWD_URL,
                  headers: {
                    'x-access-token': accessToken
                  },
                  data: {
                    country_code: 'cn',
                    password: '123456',
                    password2: '123456',
                    phone: `+86${phone}`
                  }
                })
                if (res.data.code) {
                  console.log(`${phone} 登录成功，邀请成功.`)
                  await axios.get(BLACK_LIST_URL + `&token=${token}&mobiles=${phone}`)
                  resolve()
                } else {
                  console.log("${phone} 登录失败，设置密码失败。")
                  resolve()
                }
              }
            }
          } catch (e) {
            console.log(e)
          }
        }, 3000)
      })
      await login
    }
  } catch (e) {
    console.error(e)
  }
}

Start()