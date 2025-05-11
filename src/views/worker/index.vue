<template>
    <div class="category-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>工人管理</span>
            <!-- <el-button type="primary" @click="handleAdd">新增分类</el-button> -->
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <el-form :inline="true" :model="queryParams" class="search-form">
          <el-form-item label="分类名称">
            <el-input v-model="queryParams.searchKey" placeholder="请输入关键词" clearable />
          </el-form-item>
          <!-- <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item> -->
          <el-form-item>
            <el-button type="primary" @click="handleQuery">搜索</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        
        <!-- 分类列表 -->
        <el-table :data="categoryList" v-loading="loading" border>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="nickname" label="发帖人" width="120" />
          <el-table-column prop="title" label="帖子标题" width="120" />
          <el-table-column prop="content" label="帖子内容" width="200" />
          <!-- <el-table-column prop="sort" label="排序" width="80" /> -->
          <!-- <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === '1' ? 'success' : 'danger'">
                {{ scope.row.status === '1' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column> -->
          <!-- <el-table-column prop="createTime" label="创建时间" width="180" /> -->
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <!-- <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button> -->
              <!-- <el-button 
                :type="scope.row.status === '1' ? 'warning' : 'success'" 
                size="small" 
                @click="handleStatusChange(scope.row)"
              >
                {{ scope.row.status === '1' ? '禁用' : '启用' }}
              </el-button> -->
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
      
      <!-- 添加/编辑分类对话框 -->


         
    </div>
  </template>
  
  <script>
  import { reactive, ref, toRefs, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import service from '@/utils/request'
  
  export default {
    name: 'CategoryManagement',
    setup() {
      const formRef = ref(null)
      const loading = ref(false)
      const submitLoading = ref(false)
      const dialogVisible = ref(false)
      const dialogType = ref('add')
      
      const state = reactive({
        // 查询参数
        queryParams: {
          pageNum: 1,
          pageSize: 10,
          searchKey: '',
        //   status: ''
        },
        // 分类列表数据
        categoryList: [],
        // 总记录数
        total: 0,
        // 表单数据
        form: {
          id: null,
          typeName: '',
          sort: 0,
        //   status: '1',
          remark: ''
        },
        
        // 表单校验规则
        rules: {
          typeName: [
            { required: true, message: '请输入分类名称', trigger: 'blur' },
            { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
          ],
          sort: [
            { required: true, message: '请输入排序值', trigger: 'blur' }
          ]
        }
      })
      
      // 获取分类列表数据
      const getList = () => {
        
      }
      
      // 搜索按钮点击事件
      const handleQuery = () => {
        state.queryParams.pageNum = 1
        getInitList()
      }
      
      // 重置按钮点击事件
      const resetQuery = () => {
        state.queryParams = {
          pageNum: 1,
          pageSize: 10,
          name: '',
          status: ''
        }
        getList()
      }
      
      // 每页条数改变
      const handleSizeChange = (val) => {
        state.queryParams.pageSize = val
        getInitList()
      }
      
      // 当前页改变
      const handleCurrentChange = (val) => {
        state.queryParams.pageNum = val
        getInitList()
      }
      
      // 新增按钮点击事件
      const handleAdd = () => {
        dialogType.value = 'add'
        dialogVisible.value = true
        state.form = {
          id: null,
          typeName: '',
          sort: 0,
          status: '1',
          remark: ''
        }
      }
      
      // 编辑按钮点击事件
     
      
      // 提交表单
      const submitForm = () => {
        formRef.value.validate((valid) => {
          if (valid) {
            submitLoading.value = true
            if(dialogType.value === 'add') {
              service.post("/admin/category/add", state.form).then((res) => {
                console.log(res)
                if(res.code === 200) {
                  ElMessage.success('添加成功')
                  dialogVisible.value = false
                  submitLoading.value = false
                  getInitList()
                }
              })
            }
          }
        })
      }
      
      // 状态切换
      const handleStatusChange = (row) => {
       
      }
      
      // 删除按钮点击事件
      const handleDelete = (row) => {
        ElMessageBox.confirm(`确认要删除「${row.title}」吗？`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 模拟删除请求
          service.delete("/admin/discuss/delete/"+ row.id).then((res) => {
            if(res.code === 200) {
              ElMessage.success('删除成功')
              getInitList()
            }
          })
        }).catch(() => {
          ElMessage.info('已取消删除')
        })
      }
      const getInitList = () => {
        loading.value = true
        service.post("/admin/discuss/page", state.queryParams).then((res) => {
          console.log(res)
          if(res.code === 200) {
            state.categoryList = res.data.records
            state.total = res.data.total
          }
        })
        loading.value = false
      }
      onMounted(() => {
        getInitList()
      })
      
      return {
        formRef,
        loading,
        submitLoading,
        dialogVisible,
        dialogType,
        handleQuery,
        resetQuery,
        handleSizeChange,
        handleCurrentChange,
        handleAdd,
        submitForm,
        handleStatusChange,
        handleDelete,
        ...toRefs(state)
      }
    }
  }
  </script>
  
  <style scoped>
  .category-container {
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
  </style>