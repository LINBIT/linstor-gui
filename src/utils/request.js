import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'
import i18n from '@/lang'

console.log('process.env.VUE_APP_BASE_API', process.env.VUE_APP_BASE_API)
// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 1000 * 60 * 10 // request timeout
})

const handleError = (statsCode, res) => {
  let errorMsg = 'Error'
  switch (statsCode) {
    case 400: {
      console.log(res.msg, res.res)
      errorMsg = i18n.t(res.msg, (res.res || {}))
      break
    }
    case 401: {
      errorMsg = i18n.t('authError')
      MessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
        confirmButtonText: 'Re-Login',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        store.dispatch('user/resetToken').then(() => {
          location.reload()
        })
      })
      break
    }
    case 500: {
      if (Array.isArray(res)) {
        const errorObj = res[res.length - 1] || {}
        errorMsg = errorObj['message']
        if (errorObj['details']) {
          errorMsg += "." + errorObj['details']
        }
      } else {
        errorMsg = i18n.t('systemError')
      }
      break
    }
  }
  return errorMsg
}

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent
    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['Authorization'] = getToken()
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const statsCode = response.status
    const res = response.data
    if (statsCode !== 200 && statsCode !== 201) {
      const errorMsg = handleError(statsCode, res)
      Message({
        message: errorMsg,
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(new Error((errorMsg)))
    } else {
      return response
    }
  },
  error => {
    try {
      const response = JSON.parse(JSON.stringify(error)).response
      const statsCode = response.status
      const res = response.data
      const errorMsg = handleError(statsCode, res)
      Message({
        message: errorMsg,
        type: 'error',
        duration: 5 * 1000
      })
    } catch (e) {
      console.error(e)
    }
    return Promise.reject(error)
  }
)

export default service
