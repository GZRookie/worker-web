import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || '/api', // url基础地址
  timeout: 10000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('tokenValue')
    if (token) {
      // 让每个请求携带token
      config.headers['Authorization'] = `${token}`
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    if(response.config.url.includes('/export/template')){
      return response;
    }
    const res = response.data
    console.log(res)
    // 401: 未登录或token过期
    if (res.code === 4001) {
      // 清除token
      localStorage.removeItem('tokenValue')
      localStorage.removeItem('adminUserId')
      // 跳转到登录页
      router.push('/login')
    }
    
    // 如果返回的状态码不是200，说明接口请求有误
    if (res.code !== 2000 && res.code != 200) {
      
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 5 * 1000
      })
      return res;
      
      
      
      return Promise.reject(res.msg || '请求失败')
    } else {
      return res
    }
  },
  error => {
    console.log('请求错误', error)
    if (error.response.status === 401) {
      // 清除token
      localStorage.removeItem('tokenValue')
      localStorage.removeItem('adminUserId')
      console.log('登录过期')
      // 跳转到登录页
      router.push('/login')
      return Promise.reject('登录过期')
    }
    ElMessage({
      message: error.message || '请求失败',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service