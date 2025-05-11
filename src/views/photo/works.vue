<template>
  <div class="works-container">
    <el-card>
      <template #header>
        <!-- <div class="card-header">
          <span>作品管理</span>
          <el-button type="primary" @click="handleAdd">新增作品</el-button>
        </div> -->
      </template>
      
      <!-- 搜索区域 -->
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="作品搜索">
          <el-input v-model="queryParams.searchKey" placeholder="请输入作品标题或内容" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select style="width: 120px;" v-model="queryParams.typeName" placeholder="请选择分类" clearable>
            <el-option 
              v-for="item in categoryOptions" 
              :key="item.typeName" 
              :label="item.typeName" 
              :value="item.typeName" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 作品列表 -->
      <el-table :data="worksList" v-loading="loading" border>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" width="180" show-overflow-tooltip />
        <el-table-column label="封面图" width="120">
          <template #default="scope">
            <el-image 
              style="width: 80px; height: 80px" 
              :src="getFirstImage(scope.row.images)" 
              fit="cover"
            
            />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="发布者" width="120" />
        <el-table-column prop="typeName" label="分类" width="120" />
        <el-table-column prop="address" label="地址" width="180" show-overflow-tooltip />
        <!-- <el-table-column prop="watchCount" label="浏览量" width="100" /> -->
        <el-table-column prop="likeCount" label="点赞数" width="100" />
        <el-table-column prop="commentCount" label="评论数" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        :total="total"
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <!-- 添加/编辑作品对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="700px" append-to-body>
      <el-form ref="worksFormRef" :model="worksForm" :rules="rules" label-width="100px">
        <el-form-item label="作品标题" prop="title">
          <el-input v-model="worksForm.title" placeholder="请输入作品标题" :disabled="dialog.isView" />
        </el-form-item>
        <el-form-item label="作品分类" prop="type_name">
          <el-select v-model="worksForm.type_name" placeholder="请选择分类" style="width: 100%" :disabled="dialog.isView">
            <el-option 
              v-for="item in categoryOptions" 
              :key="item.name" 
              :label="item.name" 
              :value="item.name" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="作品内容" prop="content">
          <el-input v-model="worksForm.content" type="textarea" rows="4" placeholder="请输入作品内容" :disabled="dialog.isView" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="worksForm.address" placeholder="请输入地址" :disabled="dialog.isView" />
        </el-form-item>
        <el-form-item label="经纬度" required>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item prop="longitude">
                <el-input v-model="worksForm.longitude" placeholder="经度" :disabled="dialog.isView" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="latitude">
                <el-input v-model="worksForm.latitude" placeholder="纬度" :disabled="dialog.isView" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="作品图片" prop="images">
          <el-upload
            v-if="!dialog.isView"
            v-model:file-list="fileList"
            action="/api/admin/upload"
            list-type="picture-card"
            :headers="headers"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            multiple
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div v-else class="image-preview-container">
            <el-image
              v-for="(url, index) in worksForm.images"
              :key="index"
              :src="url"
              fit="cover"
              class="preview-image"
              :preview-src-list="worksForm.images"
            />
          </div>
        </el-form-item>
        <!-- <el-form-item v-if="dialog.isView" label="浏览量">
          <span>{{ worksForm.watchCount || 0 }}</span>
        </el-form-item> -->
        <el-form-item v-if="dialog.isView" label="点赞数">
          <span>{{ worksForm.likeCount || 0 }}</span>
        </el-form-item>
        <el-form-item v-if="dialog.isView" label="评论数">
          <span>{{ worksForm.commentCount || 0 }}</span>
        </el-form-item>
        <el-form-item v-if="dialog.isView" label="收藏数">
          <span>{{ worksForm.collectCount || 0 }}</span>
        </el-form-item>
        <el-form-item v-if="dialog.isView" label="创建时间">
          <span>{{ worksForm.createdAt }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">关闭</el-button>
          <el-button v-if="!dialog.isView" type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { reactive, ref, toRefs, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import service from '@/utils/request'

export default {
  name: 'PhotoWorks',
  components: {
    Plus
  },
  setup() {
    const worksFormRef = ref(null)
    
    const state = reactive({
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: '',
        type_name: '',
        searchKey: ''   
      },
      // 作品列表数据
      worksList: [],
      // 分类选项
      categoryOptions: [],
      // 总数
      total: 0,
      // 加载状态
      loading: false,
      // 对话框状态
      dialog: {
        visible: false,
        title: '',
        isView: false // 添加查看模式标志
      },
      // 表单数据
      worksForm: {
        id: undefined,
        title: '',
        content: '',
        type_name: '',
        address: '',
        longitude: '',
        latitude: '',
        images: [],
        watchCount: 0,
        likeCount: 0,
        commentCount: 0,
        collectCount: 0,
        createdAt: ''
      },
      // 文件列表
      fileList: [],
      // 上传请求头
      headers: {
        token: localStorage.getItem('token')
      },
      // 表单验证规则
      rules: {
        title: [
          { required: true, message: '请输入作品标题', trigger: 'blur' },
          { max: 100, message: '标题长度不能超过100个字符', trigger: 'blur' }
        ],
        type_name: [
          { required: true, message: '请选择作品分类', trigger: 'change' }
        ],
        content: [
          { required: true, message: '请输入作品内容', trigger: 'blur' }
        ],
        address: [
          { required: true, message: '请输入地址', trigger: 'blur' }
        ],
        longitude: [
          { required: true, message: '请输入经度', trigger: 'blur' },
          { pattern: /^-?([0-9]|[1-9][0-9]|1[0-7][0-9]|180)(\.\d+)?$/, message: '请输入有效的经度', trigger: 'blur' }
        ],
        latitude: [
          { required: true, message: '请输入纬度', trigger: 'blur' },
          { pattern: /^-?([0-9]|[1-8][0-9]|90)(\.\d+)?$/, message: '请输入有效的纬度', trigger: 'blur' }
        ]
      }
    })
    
    // 获取作品列表
    const getList = () => {
      state.loading = true
      service.post('/admin/posts/page', 
         state.queryParams).then(res => {
         if(res.code === 200) {
           state.worksList = res.data.records
           state.total = res.data.total
         }
      }).finally(() => {
        state.loading = false
      })
    }
    
    // 获取分类列表
    const getCategoryList = () => {
      service.get('/admin/category/list').then(res => {
        state.categoryOptions = res.data
      })
    }
    
    // 搜索按钮点击事件
    const handleQuery = () => {
      state.queryParams.pageNum = 1
      getList()
    }
    
    // 重置按钮点击事件
    const resetQuery = () => {
      state.queryParams.searchKey = ''
      state.queryParams.typeName = ''
      handleQuery()
    }
    
    // 每页条数改变
    const handleSizeChange = (val) => {
      state.queryParams.pageSize = val
      getList()
    }
    
    // 当前页改变
    const handleCurrentChange = (val) => {
      state.queryParams.pageNum = val
      getList()
    }
    
    // 新增按钮点击事件
    const handleAdd = () => {
      resetForm()
      state.dialog.title = '新增作品'
      state.dialog.visible = true
    }
    
    // 编辑按钮点击事件
    const handleEdit = (row) => {
      resetForm()
      state.dialog.title = '编辑作品'
      state.dialog.isView = false
      state.dialog.visible = true
      
      // 获取作品详情
      service.get(`/admin/works/detail/${row.id}`).then(res => {
        state.worksForm = res.data
        // 处理图片列表
        if (res.data.images && res.data.images.length > 0) {
          state.fileList = res.data.images.map((url, index) => {
            return {
              name: `图片${index + 1}`,
              url: url
            }
          })
        }
      })
    }
    
    // 查看按钮点击事件
    const handleView = (row) => {
      resetForm()
      state.dialog.title = '查看作品详情'
      state.dialog.isView = true
      state.dialog.visible = true
      
      // 直接使用行数据，不再请求后端
      state.worksForm = {
        id: row.id,
        title: row.title,
        content: row.content,
        type_name: row.typeName,
        address: row.address,
        longitude: row.longitude,
        latitude: row.latitude,
        images: row.images || [],
        watchCount: row.watchCount || 0,
        likeCount: row.likeCount || 0,
        commentCount: row.commentCount || 0,
        collectCount: row.collectCount || 0,
        createdAt: row.createdAt
      }
      
      // 处理图片列表
      if (row.images && row.images.length > 0) {
        state.fileList = row.images.map((url, index) => {
          return {
            name: `图片${index + 1}`,
            url: url
          }
        })
      }
    }
    
    // 删除按钮点击事件
    const handleDelete = (row) => {
      ElMessageBox.confirm(`确认删除作品"${row.title}"？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        service.delete(`/admin/posts/delete/${row.id}`).then(res => {
          ElMessage.success('删除成功')
          getList()
        })
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    // 重置表单
    const resetForm = () => {
      state.worksForm = {
        id: undefined,
        title: '',
        content: '',
        type_name: '',
        address: '',
        longitude: '',
        latitude: '',
        images: [],
        watchCount: 0,
        likeCount: 0,
        commentCount: 0,
        collectCount: 0,
        createdAt: ''
      }
      state.fileList = []
      if (worksFormRef.value) {
        worksFormRef.value.resetFields()
      }
    }
    
    // 提交表单
    const submitForm = () => {
      worksFormRef.value.validate((valid) => {
        if (valid) {
          // 处理图片数据
          state.worksForm.images = state.fileList.map(file => file.url || file.response.data)
          
          const method = state.worksForm.id ? 'put' : 'post'
          const url = state.worksForm.id ? '/admin/works/update' : '/admin/works/add'
          
          service[method](url, state.worksForm).then(res => {
            ElMessage.success(`${state.worksForm.id ? '更新' : '添加'}成功`)
            state.dialog.visible = false
            getList()
          })
        }
      })
    }
    
    // 上传成功回调
    const handleUploadSuccess = (response, file) => {
      if (response.code === 200) {
        ElMessage.success('上传成功')
      } else {
        ElMessage.error(response.message || '上传失败')
      }
    }
    
    // 移除图片
    const handleRemove = (file) => {
      const index = state.fileList.indexOf(file)
      if (index !== -1) {
        state.fileList.splice(index, 1)
      }
    }
    
    // 获取第一张图片作为封面
    const getFirstImage = (images) => {
        console.log(images)
      if (images && images.length > 0) {
        return images[0]
      }
      return ''
    }
    
    // 获取图片列表用于预览
    const getImageList = (images) => {
      return images || []
    }
    
    // 页面加载时初始化数据
    onMounted(() => {
      getList()
      getCategoryList()
    })
    
    return {
      ...toRefs(state),
      worksFormRef,
      handleQuery,
      resetQuery,
      handleSizeChange,
      handleCurrentChange,
      handleAdd,
      handleEdit,
      handleView, // 添加查看函数
      handleDelete,
      submitForm,
      handleUploadSuccess,
      handleRemove,
      getFirstImage,
      getImageList
    }
  }
}
</script>

<style scoped>
.works-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 图片预览容器样式 */
.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-image {
  width: 150px;
  height: 150px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
}

/* 添加以下全局样式修复预览图层级问题 */
</style>

<!-- 添加全局样式，确保图片预览在最顶层 -->
<style>
/* 图片预览器样式 - 确保最高层级 */
.el-image-viewer__wrapper {
  z-index: 2999 !important;
}

/* 确保对话框在合适的层级 */
.el-dialog__wrapper {
  z-index: 2000 !important;
}

/* 确保下拉菜单和日期选择器等弹出组件在对话框之上 */
.el-select__popper,
.el-picker__popper {
  z-index: 2100 !important;
}

.el-image {
  position: relative;
  z-index: 1; 
}

.el-table {
  overflow: hidden;
}
</style>