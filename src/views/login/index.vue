<template>
  <div class="login-container">
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      auto-complete="on"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">建筑工人信息管理系统</h3>
      </div>

      <el-form-item prop="phoneNum">
        <el-input
          v-model="loginForm.phoneNum"
          placeholder="账号"
          type="text"
          tabindex="1"
          auto-complete="on"
        >
          <template #prefix>
            <el-icon class="input-icon"><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          :type="passwordVisible ? 'text' : 'password'"
          placeholder="密码"
          tabindex="2"
          auto-complete="on"
          @keyup.enter="handleLogin"
        >
          <template #prefix>
            <el-icon class="input-icon"><Lock /></el-icon>
          </template>
          <template #suffix>
            <el-icon class="input-icon" @click="passwordVisible = !passwordVisible">
              <View v-if="passwordVisible" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-button :loading="loading" type="primary" style="width: 100%; margin-bottom: 30px" @click="handleLogin">
        登录
      </el-button>
    </el-form>
  </div>
</template>

<script>
import { reactive, ref, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import service from '@/utils/request'

export default {
  name: 'UserLogin',
  components: {
    User,
    Lock,
    View,
    Hide
  },
  setup() {
    const router = useRouter()
    const loginFormRef = ref(null)
    const loading = ref(false)
    const passwordVisible = ref(false)

    const state = reactive({
      loginForm: {
        phoneNum: '16666688888',
        password: '123456'
      },
      loginRules: {
        phoneNum: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      }
    })

    const handleLogin = () => {
      if (!loginFormRef.value) return
      
      loginFormRef.value.validate(valid => {
        if (valid) {
          loading.value = true
          // 模拟登录请求
          

          service.post('/admin/user/login', state.loginForm).then(res => {
            console.log(res)
          localStorage.setItem('tokenValue', res.data.tokenValue)
          localStorage.setItem('adminUserId', res.data.adminUserId)

          // 登录成功提示
          ElMessage({
            message: '登录成功',
            type:'success'
          })
          // 去查询权限
          
          service.get('/admin/user/permission').then(res=>{
            console.log('permission', res.data)
          });
          console.log('puuuu')
          router.push('/')

          
        }).catch(err => {
          console.log(err)
        }).finally(() => {
          loading.value = false
        })

          // service.post('/admin/user/login', state.loginForm).then(res => {
    
          //   localStorage.setItem('tokenValue', res.data.token)
          //   localStorage.setItem('adminUserId', res.data.adminUserId)

          //   // 登录成功提示
          //   ElMessage({
          //     message: '登录成功',
          //     type:'success'
          //   })
          //   // 去查询权限

          //   // 跳转到首页
          //   router.push('/')
          // }).catch(err => {
          //   console.log(err)
          // }).finally(() => {
          //   loading.value = false
          // })

  
        }
      })
    }

    return {
      loginFormRef,
      loading,
      passwordVisible,
      handleLogin,
      ...toRefs(state)
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  background-color: #2d3a4b;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form {
  position: relative;
  width: 520px;
  max-width: 100%;
  padding: 160px 35px 0;
  margin: 0 auto;
  overflow: hidden;
}

.title-container {
  position: relative;
  margin-bottom: 30px;
}

.title {
  font-size: 26px;
  color: #eee;
  margin: 0 auto 40px auto;
  text-align: center;
  font-weight: bold;
}

.el-form-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  color: #454545;
  margin-bottom: 20px;
}

.input-icon {
  color: #889aa4;
}

/* 修复输入框样式 */
:deep(.el-input__wrapper) {
  background-color: transparent !important;
  box-shadow: none !important;
  padding: 0;
}

:deep(.el-input__inner) {
  background: transparent;
  border: 0px;
  -webkit-appearance: none;
  border-radius: 0px;
  padding: 12px 5px 12px 15px;
  color: #fff;
  height: 47px;
  caret-color: #fff;
}

:deep(.el-input__inner::placeholder) {
  color: #889aa4;
}

:deep(.el-button) {
  border-radius: 5px;
  font-size: 16px;
}
</style>