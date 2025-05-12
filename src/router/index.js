import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

// 公共路由
const publicRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        name: 'Dashboard',
        meta: { title: '首页', icon: 'el-icon-s-home' }
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    hidden: true
  },
  {
    path: '/user',
    component: Layout,
    redirect: '/user/info',
    name: 'User',
    meta: { title: '用户管理', icon: 'el-icon-user' },
    children: [
      {
        path: 'info',
        component: () => import('@/views/user/index.vue'),
        name: 'UserInfo',
        meta: { title: '用户管理', icon: 'el-icon-user' }
      }
   
    ]
  },
  {
    path: '/role',
    component: Layout,
    redirect: '/role/list',
    name: 'role',
    meta: { title: '角色管理', icon: 'el-icon-user' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/role/index.vue'),
        name: 'roleList',
        meta: { title: '角色管理', icon: 'el-icon-user' }
      }
   
    ]
  },
  {

    path: '/worker',
    component: Layout,
    redirect: '/worker/list',
    name: 'worker',
    meta: { title: '工人管理', icon: 'el-icon-user' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/worker/index.vue'),
        name: 'wokerList',
        meta: { title: '工人管理', icon: 'el-icon-user' }
      }
   
    ]
  },
  {
    path: '/finance',
    component: Layout,
    redirect: '/finance/wage',
    name: 'Finance',
    meta: { title: '财务管理', icon: 'el-icon-user' },
    children: [
      {
        path: 'wage',
        component: () => import('@/views/finance/wage.vue'),
        name: 'Wage',
        meta: { title: '工种薪资' }
      },
      {
        path: 'salary',
        component: () => import('@/views/finance/salary.vue'),
        name: 'Salary',
        meta: { title: '工资记录' }
      }
    ]
  },
  {
    path: '/attendance',
    component: Layout,
    redirect: '/attendance/record',
    name: 'Attendance',
    meta: { title: '考勤管理', icon: 'el-icon-user' },
    children: [
      {
        path: 'record',
        component: () => import('@/views/attendance/record.vue'),
        name: 'AttendanceRecord',
        meta: { title: '考勤记录', icon: 'el-icon-user' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: publicRoutes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 获取token
  const token = localStorage.getItem('tokenValue')
  
  // 如果有token或者访问的是登录页，直接放行
  if (token || to.path === '/login') {
    next()
  } else {
    // 否则重定向到登录页
    next('/login')
  }
})

export default router