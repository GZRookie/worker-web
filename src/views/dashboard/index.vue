<template>
  <div class="welcome-page">
    <el-card class="welcome-card">
      <h1 class="welcome-title">欢迎登录工人信息管理系统</h1>
      <p class="welcome-subtitle">在这里，您可以高效管理工人信息，开启便捷工作之旅。</p>
    </el-card>
  </div>
</template>

<script setup>
// 无需复杂逻辑，这里仅为保持代码结构完整性
</script>

<style scoped>
.welcome-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5; /* 背景颜色 */
}

.welcome-card {
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 卡片阴影 */
  border-radius: 10px;
  background-color: #fff;
  text-align: center;
}

.welcome-title {
  font-size: 36px;
  color: #303133;
  margin-bottom: 20px;
}

.welcome-subtitle {
  font-size: 18px;
  color: #606266;
}
</style>