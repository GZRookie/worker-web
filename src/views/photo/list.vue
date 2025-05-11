<template>
  <div class="photo-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>照片列表</span>
          <el-button type="primary" @click="handleUpload">上传照片</el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选区域 -->
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="照片名称">
          <el-input v-model="queryParams.name" placeholder="请输入照片名称" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryParams.category" placeholder="请选择分类" clearable>
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 照片列表 -->
      <el-table :data="photoList" v-loading="loading" border>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="预览图" width="120">
          <template #default="scope">
            <el-image 
              style="width: 80px; height: 80px" 
              :src="scope.row.url" 
              fit="cover"
              :preview-src-list="[scope.row.url]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="size" label="大小" width="100" />
        <el-table-column prop="views" label="浏览量" width="100" />
        <el-table-column prop="downloads" label="下载量" width="100" />
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="success" size="small" @click="handlePreview(scope.row)">预览</el-button>
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
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>
    
    <!-- 上传照片对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传照片" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        multiple
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持jpg、png、gif格式的图片文件，且不超过5MB
          </div>
        </template>
      </el-upload>
      <el-form :model="uploadForm" label-width="80px" style="margin-top: 20px;">
        <el-form-item label="分类">
          <el-select v-model="uploadForm.category" placeholder="请选择分类">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" rows="3" placeholder="请输入照片描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploadLoading">上传</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑照片对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑照片信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="照片名称">
          <el-input v-model="editForm.name" placeholder="请输入照片名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="请选择分类">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" rows="3" placeholder="请输入照片描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="editLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 预览照片对话框 -->
    <el-dialog v-model="previewDialogVisible" title="照片预览" width="800px">
      <div class="preview-container">
        <el-image :src="previewUrl" fit="contain" style="width: 100%;" />
      </div>
      <div class="preview-info">
        <p><strong>名称：</strong>{{ previewInfo.name }}</p>
        <p><strong>分类：</strong>{{ previewInfo.category }}</p>
        <p><strong>大小：</strong>{{ previewInfo.size }}</p>
        <p><strong>上传时间：</strong>{{ previewInfo.uploadTime }}</p>
        <p><strong>描述：</strong>{{ previewInfo.description }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { reactive, ref, toRefs, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

export default {
  name: 'PhotoList',
  components: {
    UploadFilled
  },
  setup() {
    const loading = ref(false)
    const uploadLoading = ref(false)
    const editLoading = ref(false)
    const uploadDialogVisible = ref(false)
    const editDialogVisible = ref(false)
    const previewDialogVisible = ref(false)
    const previewUrl = ref('')
    const fileList = ref([])
    
    const state = reactive({
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: '',
        category: '',
        dateRange: []
      },
      // 照片列表数据
      photoList: [],
      // 总记录数
      total: 0,
      // 分类选项
      categoryOptions: [
        { value: '风景', label: '风景' },
        { value: '人物', label: '人物' },
        { value: '动物', label: '动物' },
        { value: '城市', label: '城市' },
        { value: '自然', label: '自然' }
      ],
      // 上传表单
      uploadForm: {
        category: '',
        description: ''
      },
      // 编辑表单
      editForm: {
        id: null,
        name: '',
        category: '',
        description: ''
      },
      // 预览信息
      previewInfo: {}
    })
    
    // 获取照片列表数据
    const getList = () => {
      loading.value = true
      // 模拟接口请求
      setTimeout(() => {
        state.photoList = [
          {
            id: 1,
            name: '海边风景',
            category: '风景',
            size: '2.5MB',
            views: 128,
            downloads: 45,
            uploadTime: '2023-06-15 10:30:45',
            url: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg',
            description: '这是一张美丽的海边风景照片，拍摄于夏威夷海滩。'
          },
          {
            id: 2,
            name: '城市夜景',
            category: '城市',
            size: '3.1MB',
            views: 256,
            downloads: 78,
            uploadTime: '2023-06-14 16:22:30',
            url: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
            description: '这是一张城市夜景照片，展示了现代都市的繁华。'
          },
          {
            id: 3,
            name: '花卉特写',
            category: '自然',
            size: '1.8MB',
            views: 98,
            downloads: 32,
            uploadTime: '2023-06-14 09:15:20',
            url: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
            description: '这是一张花卉特写照片，展示了花朵的精细结构。'
          },
          {
            id: 4,
            name: '动物世界',
            category: '动物',
            size: '4.2MB',
            views: 187,
            downloads: 56,
            uploadTime: '2023-06-13 14:50:10',
            url: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
            description: '这是一张野生动物照片，记录了自然界的生态环境。'
          }
        ]
        state.total = 4
        loading.value = false
      }, 500)
    }
    
    // 搜索按钮点击事件
    const handleQuery = () => {
      state.queryParams.pageNum = 1
      getList()
    }
    
    // 重置按钮点击事件
    const resetQuery = () => {
      state.queryParams = {
        pageNum: 1,
        pageSize: 10,
        name: '',
        category: '',
        dateRange: []
      }
      getList()
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
    
    // 上传按钮点击事件
    const handleUpload = () => {
      uploadDialogVisible.value = true
      state.uploadForm = {
        category: '',
        description: ''
      }
      fileList.value = []
    }
    
    // 文件状态改变事件
    const handleFileChange = (file) => {
      fileList.value.push(file)
    }
    
    // 提交上传
    const submitUpload = () => {
      if (fileList.value.length === 0) {
        ElMessage.warning('请选择要上传的照片')
        return
      }
      
      uploadLoading.value = true
      // 模拟上传请求
      setTimeout(() => {
        ElMessage.success('上传成功')
        uploadDialogVisible.value = false
        uploadLoading.value = false
        getList()
      }, 1000)
    }
    
    // 编辑按钮点击事件
    const handleEdit = (row) => {
      state.editForm = {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description || ''
      }
      editDialogVisible.value = true
    }
    
    // 提交编辑
    const submitEdit = () => {
      editLoading.value = true
      // 模拟编辑请求
      setTimeout(() => {
        ElMessage.success('修改成功')
        editDialogVisible.value = false
        editLoading.value = false
        getList()
      }, 500)
    }
    
    // 预览按钮点击事件
    const handlePreview = (row) => {
      previewUrl.value = row.url
      state.previewInfo = row
      previewDialogVisible.value = true
    }
    
    // 删除按钮点击事件
    const handleDelete = () => {
      ElMessageBox.confirm('确认要删除该照片吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除请求
        setTimeout(() => {
          ElMessage.success('删除成功')
          getList()
        }, 500)
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    onMounted(() => {
      getList()
    })
    
    return {
      loading,
      uploadLoading,
      editLoading,
      uploadDialogVisible,
      editDialogVisible,
      previewDialogVisible,
      previewUrl,
      fileList,
      handleQuery,
      resetQuery,
      handleSizeChange,
      handleCurrentChange,
      handleUpload,
      handleFileChange,
      submitUpload,
      handleEdit,
      submitEdit,
      handlePreview,
      handleDelete,
      ...toRefs(state)
    }
  }
}
</script>

<style scoped>
.photo-list-container {
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

.pagination {
  margin-top: 20px;
  text-align: right;
}

.preview-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.preview-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.preview-info p {
  margin: 8px 0;
}
</style>