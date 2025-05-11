<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container">
      <div class="logo-container">
        <h1 class="logo-title">建筑工人信息管理系统</h1>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <sidebar-item 
          v-for="route in routes" 
          :key="route.path" 
          :item="route" 
          :base-path="route.path" 
        />
      </el-menu>
    </div>
    
    <!-- 主区域 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <div class="navbar">
        <div class="right-menu">
          <el-dropdown trigger="click">
            <div class="avatar-wrapper">
              <img src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="user-avatar">
              <i class="el-icon-caret-bottom" />
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <!-- <el-dropdown-item @click="$router.push('/user/profile')">
                  个人中心
                </el-dropdown-item> -->
                <el-dropdown-item divided @click="logout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="app-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import { computed, reactive, toRefs, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SidebarItem from './components/SidebarItem.vue'

export default {
  name: 'AppLayout',
  components: {
    SidebarItem
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const filteredRoutes = ref([])
    
    // 私有路由需要线下权限与路由路径的映射关系
    const permissionToRoute = {
      'system:user': '/user',
      'system:role': '/role',
      'system:worker': '/worker',
      'system:wage': '/finance',  // 注意这里只映射到父路由
      'system:salary': '/finance', // 注意这里只映射到父路由
      'system:attendance': '/attendance'
    }
    
    // 筛选用户可访问的路由
    const filterRoutesByPermissions = () => {
      const userPermissions = localStorage.getItem('userPermissions')
      let permissionCodes = []
      
      if (userPermissions) {
        try {
          const permissions = JSON.parse(userPermissions)
          permissionCodes = permissions.map(p => p.code)
          console.log('用户权限码:', permissionCodes)
        } catch (e) {
          console.error('解析用户权限失败:', e)
        }
      }
      
      // 公共路由和首页始终可见
      const publicPaths = ['/', '/dashboard', '/login']
      
      // 过滤路由
      const allRoutes = router.options.routes
      
      // 第一步：过滤出有权限的一级路由
      filteredRoutes.value = allRoutes.filter(route => {
        // 首页和登录页始终显示
        if (publicPaths.includes(route.path)) {
          return true
        }
        
        // 如果这个路由有子路由，检查是否有任何一个子路由有权限
        if (route.children && route.children.length > 0) {
          // 对于有子路由的情况，只要有任何一个子路由有权限，就显示父路由
          const hasPermissionChild = route.children.some(child => {
            // 构建完整的子路由路径
            const fullChildPath = route.path + '/' + child.path
            
            // 检查子路由是否有权限
            return permissionCodes.some(code => {
              // 特殊处理 finance 相关权限
              if (code === 'system:wage' && fullChildPath.includes('/finance/wage')) {
                return true
              }
              if (code === 'system:salary' && fullChildPath.includes('/finance/salary')) {
                return true
              }
              
              const routePath = permissionToRoute[code]
              return routePath && (routePath === route.path)
            })
          })
          
          return hasPermissionChild
        }
        
        // 对于没有子路由的情况，直接检查路由本身是否有权限
        return permissionCodes.some(code => {
          const routePath = permissionToRoute[code]
          return routePath && (routePath === route.path)
        })
      })
      
      // 第二步：过滤每个路由的子路由，只保留有权限的子路由
      filteredRoutes.value.forEach(route => {
        if (route.children && route.children.length > 0) {
          route.children = route.children.filter(child => {
            // 如果是首页，始终保留
            if (route.path === '/' && child.path === 'dashboard') {
              return true
            }
            
            // 检查子路由是否有权限
            const fullChildPath = route.path + '/' + child.path
            return permissionCodes.some(code => {
              // 特殊处理 finance 相关权限
              if (code === 'system:wage' && fullChildPath.includes('/finance/wage')) {
                return true
              }
              if (code === 'system:salary' && fullChildPath.includes('/finance/salary')) {
                return true
              }
              
              const routePath = permissionToRoute[code]
              return routePath && routePath.startsWith(route.path)
            })
          })
        }
      })
    }
    
    onMounted(() => {
      filterRoutesByPermissions()
    })
    
    const activeMenu = computed(() => {
      return route.path
    })
    
    const logout = () => {
      localStorage.removeItem('tokenValue')
      localStorage.removeItem('adminUserId')
      localStorage.removeItem('userPermissions')
      router.push('/login')
    }
    
    return {
      routes: filteredRoutes,
      activeMenu,
      logout
    }
  }
}
</script>

<style scoped>
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100%;
}

.sidebar-container {
  width: 210px;
  height: 100%;
  background: #304156;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b3649;
}

.logo-title {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
}

.main-container {
  flex: 1;
  margin-left: 210px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  position: relative;
}

.navbar {
  height: 50px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 15px;
}

.right-menu {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 5px;
}

.app-main {
  padding: 20px;
  flex: 1;
  background: #f0f2f5;
  position: relative;
  overflow: auto;
}
</style>