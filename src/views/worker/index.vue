<template>
    <div class="category-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>工人管理</span>
            <el-button type="primary" @click="handleAdd">新增工人</el-button>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <el-form :inline="true" :model="queryParams" class="search-form">
          <el-form-item label="分类名称">
            <el-input v-model="queryParams.searchKey" placeholder="请输入关键词" clearable />
          </el-form-item>
         
          <el-form-item>
            <el-button type="primary" @click="handleQuery">搜索</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        
        <!-- 工人列表 -->
        <el-table :data="categoryList" v-loading="loading" border>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="gender" label="性别" width="80">
            <template #default="scope">
              {{ scope.row.gender === 1 ? '男' : scope.row.gender === 0 ? '女' : '其他' }}
            </template>
          </el-table-column>
          <el-table-column prop="phoneNum" label="电话号码" width="120" />
          <el-table-column prop="idCard" label="身份证号" width="180" />
          <el-table-column prop="emergencyContact" label="紧急联系人" width="120" />
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
          v-model:current-page="queryParams.offset"
          v-model:page-size="queryParams.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </el-card>
      
      <!-- 添加/编辑工人对话框 -->
      <el-dialog
        :title="dialogType === 'add' ? '新增工人' : '编辑工人'"
        v-model="dialogVisible"
        width="500px"
        @close="dialogVisible = false"
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="角色" prop="roleId">
            <el-select v-model="form.roleId" placeholder="请选择角色">
              <el-option
                v-for="item in roleOptions"
                :key="item.id"
                :label="item.roleName"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio :label="1">男</el-radio>
              <el-radio :label="0">女</el-radio>
              <el-radio :label="-127">其他</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="电话号码" prop="phoneNum">
            <el-input v-model="form.phoneNum" placeholder="请输入电话号码" />
          </el-form-item>
          <el-form-item label="身份证号" prop="idCard">
            <el-input v-model="form.idCard" placeholder="请输入身份证号" />
          </el-form-item>
          <el-form-item label="紧急联系人" prop="emergencyContact">
            <el-input v-model="form.emergencyContact" placeholder="请输入紧急联系人" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        </template>
      </el-dialog>
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
      const roleOptions = ref([])

      
      const state = reactive({
        // 查询参数
        queryParams: {
          offset: 1,
          limit: 10,
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
          name: '',
          roleId: null,
          gender: -127,
          phoneNum: '',
          idCard: '',
          emergencyContact: ''
        },
        
        // 表单校验规则
        rules: {
          name: [
            { required: true, message: '请输入姓名', trigger: 'blur' },
            { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
          ],
          roleId: [
            { required: true, message: '请选择角色', trigger: 'change' }
          ],
          phoneNum: [
            { required: true, message: '请输入电话号码', trigger: 'blur' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
          ],
          idCard: [
            { required: true, message: '请输入身份证号', trigger: 'blur' },
            { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号码', trigger: 'blur' }
          ]
        }
      })
      
      // 获取分类列表数据
      const getList = () => {
        
      }
      
      // 搜索按钮点击事件
      const handleQuery = () => {
        state.queryParams.offset = 1
        getInitList()
      }
      
      // 重置按钮点击事件
      const resetQuery = () => {
        state.queryParams = {
          offset: 1,
          limit: 10,
          name: '',
          status: ''
        }
        getList()
      }
      
      // 每页条数改变
      const handleSizeChange = (val) => {
        state.queryParams.limit = val
        getInitList()
      }
      
      // 当前页改变
      const handleCurrentChange = (val) => {
        state.queryParams.offset = val
        getInitList()
      }
      
      // 新增按钮点击事件
      const handleAdd = () => {
        dialogType.value = 'add'
        dialogVisible.value = true
        state.form = {
          id: null,
          name: '',
          roleId: null,
          gender: -127,
          phoneNum: '',
          idCard: '',
          emergencyContact: ''
        }
        // 获取角色列表
        getRoleList()
      }
      
    
      
      // 编辑按钮点击事件
     
      
      // 提交表单
      const submitForm = () => {
        formRef.value.validate((valid) => {
          if (valid) {
            submitLoading.value = true
            if(dialogType.value === 'add') {
              service.post("/worker/info/add", state.form).then((res) => {
                console.log(res)
                if(res.code === 2000) {
                  ElMessage.success('添加成功')
                  dialogVisible.value = false
                  submitLoading.value = false
                  getInitList()
                } else {
                  ElMessage.error(res.message || '添加失败')
                }
                submitLoading.value = false
              }).catch(() => {
                submitLoading.value = false
                ElMessage.error('系统错误，请稍后再试')
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

      const getRoleList = () => {
        service.get('/role/list').then(res => {
           let cres= res.data || [];
           roleOptions.value = cres.filter(i=>i.isWorker==true)
        }).catch(err => {
          console.error('获取角色列表失败：', err)
          ElMessage.error('获取角色列表失败')
        })
      }

      const getInitList = () => {
        loading.value = true
        service.post("/worker/info/page", state.queryParams).then((res) => {
          console.log(res)
          if(res.code === 2000) {
            state.categoryList = res.data.data
            state.total = res.data.count
          }
        })
        loading.value = false
      }
      onMounted(() => {
        getInitList()
        getRoleList()
      })
      
      return {
        formRef,
        loading,
        submitLoading,
        dialogVisible,
        dialogType,
        roleOptions,
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