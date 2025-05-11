<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :span="8">
        <el-card>
          <div class="user-profile">
            <div class="user-avatar-container">
              <el-avatar :size="100" :src="userInfo.avatar" />
              <div class="user-avatar-upload">
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handleAvatarChange"
                >
                  <el-button size="small" type="primary">更换头像</el-button>
                </el-upload>
              </div>
            </div>
            <div class="user-info">
              <h2>{{ userInfo.nickname }}</h2>
              <p>{{ userInfo.role }}</p>
              <p>{{ userInfo.email }}</p>
              <p>上次登录：{{ userInfo.lastLogin }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 个人信息编辑 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>
          
          <el-tabs v-model="activeTab">
            <!-- 基本信息 -->
            <el-tab-pane label="基本信息" name="basic">
              <el-form :model="basicForm" :rules="basicRules" ref="basicFormRef" label-width="100px">
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="basicForm.username" disabled />
                </el-form-item>
                <el-form-item label="昵称" prop="nickname">
                  <el-input v-model="basicForm.nickname" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item label="性别" prop="gender">
                  <el-radio-group v-model="basicForm.gender">
                    <el-radio label="male">男</el-radio>
                    <el-radio label="female">女</el-radio>
                    <el-radio label="other">保密</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="手机号码" prop="phone">
                  <el-input v-model="basicForm.phone" placeholder="请输入手机号码" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="basicForm.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="个人简介" prop="bio">
                  <el-input v-model="basicForm.bio" type="textarea" rows="4" placeholder="请输入个人简介" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submitBasicForm" :loading="basicLoading">保存</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <!-- 修改密码 -->
            <el-tab-pane label="修改密码" name="password">
              <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
                <el-form-item label="当前密码" prop="oldPassword">
                  <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submitPasswordForm" :loading="passwordLoading">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <!-- 账号绑定 -->
            <el-tab-pane label="账号绑定" name="binding">
              <div class="binding-list">
                <div class="binding-item">
                  <div class="binding-icon wechat">
                    <el-icon><ChatDotRound /></el-icon>
                  </div>
                  <div class="binding-info">
                    <div class="binding-name">微信</div>
                    <div class="binding-status">{{ userInfo.wechatBound ? '已绑定' : '未绑定' }}</div>
                  </div>
                  <div class="binding-action">
                    <el-button type="primary" size="small" plain v-if="!userInfo.wechatBound">绑定</el-button>
                    <el-button type="danger" size="small" plain v-else>解绑</el-button>
                  </div>
                </div>
                
                <div class="binding-item">
                  <div class="binding-icon qq">
                    <el-icon><ChatLineRound /></el-icon>
                  </div>
                  <div class="binding-info">
                    <div class="binding-name">QQ</div>
                    <div class="binding-status">{{ userInfo.qqBound ? '已绑定' : '未绑定' }}</div>
                  </div>
                  <div class="binding-action">
                    <el-button type="primary" size="small" plain v-if="!userInfo.qqBound">绑定</el-button>
                    <el-button type="danger" size="small" plain v-else>解绑</el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { reactive, ref, toRefs } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, ChatLineRound } from '@element-plus/icons-vue'

export default {
  name: 'UserProfile',
  components: {
    ChatDotRound,
    ChatLineRound
  },
  setup() {
    const basicFormRef = ref(null)
    const passwordFormRef = ref(null)
    const activeTab = ref('basic')
    const basicLoading = ref(false)
    const passwordLoading = ref(false)
    
    const state = reactive({
      // 用户信息
      userInfo: {
        username: 'admin',
        nickname: '管理员',
        role: '超级管理员',
        email: 'admin@example.com',
        lastLogin: '2023-06-15 10:30:45',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        wechatBound: true,
        qqBound: false
      },
      // 基本信息表单
      basicForm: {
        username: 'admin',
        nickname: '管理员',
        gender: 'male',
        phone: '13800138000',
        email: 'admin@example.com',
        bio: '这是一个超级管理员账号'
      },
      // 基本信息表单校验规则
      basicRules: {
        nickname: [
          { required: true, message: '请输入昵称', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },
      // 密码表单
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      // 密码表单校验规则
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入当前密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value !== state.passwordForm.newPassword) {
                callback(new Error('两次输入的密码不一致'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      }
    })
    
    // 头像上传
    const handleAvatarChange = (file) => {
      // 模拟上传
      const reader = new FileReader()
      reader.readAsDataURL(file.raw)
      reader.onload = () => {
        state.userInfo.avatar = reader.result
        ElMessage.success('头像上传成功')
      }
    }
    
    // 提交基本信息表单
    const submitBasicForm = () => {
      basicFormRef.value.validate((valid) => {
        if (valid) {
          basicLoading.value = true
          // 模拟提交请求
          setTimeout(() => {
            state.userInfo.nickname = state.basicForm.nickname
            state.userInfo.email = state.basicForm.email
            ElMessage.success('个人信息更新成功')
            basicLoading.value = false
          }, 1000)
        }
      })
    }
    
    // 提交密码表单
    const submitPasswordForm = () => {
      passwordFormRef.value.validate((valid) => {
        if (valid) {
          passwordLoading.value = true
          // 模拟提交请求
          setTimeout(() => {
            ElMessage.success('密码修改成功')
            state.passwordForm = {
              oldPassword: '',
              newPassword: '',
              confirmPassword: ''
            }
            passwordLoading.value = false
          }, 1000)
        }
      })
    }
    
    return {
      basicFormRef,
      passwordFormRef,
      activeTab,
      basicLoading,
      passwordLoading,
      handleAvatarChange,
      submitBasicForm,
      submitPasswordForm,
      ...toRefs(state)
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.user-avatar-container {
  position: relative;
  margin-bottom: 20px;
  text-align: center;
}

.user-avatar-upload {
  margin-top: 15px;
}

.user-info {
  text-align: center;
}

.user-info h2 {
  margin: 10px 0;
  font-size: 20px;
}

.user-info p {
  margin: 5px 0;
  color: #606266;
}

.card-header {
  font-weight: bold;
}

.binding-list {
  padding: 10px 0;
}

.binding-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.binding-item:last-child {
  border-bottom: none;
}

.binding-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.binding-icon .el-icon {
  font-size: 20px;
  color: white;
}

.wechat {
  background-color: #07c160;
}

.qq {
  background-color: #12b7f5;
}

.binding-info {
  flex: 1;
}

.binding-name {
  font-size: 16px;
  margin-bottom: 5px;
}

.binding-status {
  font-size: 14px;
  color: #909399;
}
</style>