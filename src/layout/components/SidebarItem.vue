<template>
  <div v-if="!item.hidden">
    <!-- 有子菜单的情况 -->
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <router-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)">
          <el-icon v-if="onlyOneChild.meta.icon">
            <component :is="onlyOneChild.meta.icon"></component>
          </el-icon>
          <span>{{ onlyOneChild.meta.title }}</span>
        </el-menu-item>
      </router-link>
    </template>
    
    <!-- 没有子菜单的情况 -->
    <el-sub-menu v-else :index="resolvePath(item.path)">
      <template #title>
        <el-icon v-if="item.meta && item.meta.icon">
          <component :is="item.meta.icon"></component>
        </el-icon>
        <span v-if="item.meta && item.meta.title">{{ item.meta.title }}</span>
      </template>
      
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>
  </div>
</template>

<script>
import { ref } from 'vue'
import path from 'path-browserify'

export default {
  name: 'SidebarItem',
  props: {
    item: {
      type: Object,
      required: true
    },
    basePath: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const onlyOneChild = ref(null)

    const hasOneShowingChild = (children = [], parent) => {
      const showingChildren = children.filter(item => {
        if (item.hidden) {
          return false
        } else {
          // 临时设置（如果只有一个子路由，则将其作为父路由）
          onlyOneChild.value = item
          return true
        }
      })

      // 当只有一个子路由时，默认显示子路由
      if (showingChildren.length === 1) {
        return true
      }

      // 如果没有要显示的子路由，则显示父路由
      if (showingChildren.length === 0) {
        onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
        return true
      }

      return false
    }

    const resolvePath = (routePath) => {
      if (routePath.startsWith('/')) {
        return routePath
      }
      return path.resolve(props.basePath, routePath)
    }

    return {
      onlyOneChild,
      hasOneShowingChild,
      resolvePath
    }
  }
}
</script>

<style scoped>
.el-menu-item.is-active {
  background-color: #1890ff !important;
  color: #fff !important;
}

.el-menu-item {
  height: 50px;
  line-height: 50px;
  padding: 0 20px !important;
  transition: all 0.3s;
}

.el-menu-item:hover {
  background-color: rgba(24, 144, 255, 0.1) !important;
}

.el-sub-menu :deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  padding: 0 20px !important;
}

.el-sub-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(24, 144, 255, 0.1) !important;
}

/* 修复子菜单靠右显示 */
:deep(.el-menu--inline) .el-menu-item {
  padding-left: 48px !important;
}

/* 确保子菜单有适当的缩进 */
:deep(.el-menu--inline) {
  padding-left: 10px;
}

/* 添加子菜单前的竖线，增强层级感 */
:deep(.el-menu--inline) .el-menu-item::before {
  content: '';
  position: absolute;
  left: 24px;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #909399;
}

.el-icon {
  margin-right: 10px;
  font-size: 18px;
  vertical-align: middle;
}

/* 修复路由链接样式 */
a {
  text-decoration: none;
  color: inherit;
  display: block;
  width: 100%;
}
</style>