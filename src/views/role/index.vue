<template>
    <div class="user-container">
      <!-- 搜索和操作栏 -->
      <div class="operation-bar" style="display: flex">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="角色名">
            <el-input v-model="searchForm.searchKey" placeholder="请输入关键字" clearable />
          </el-form-item>
  
    
          <el-form-item label="状态" style="width: 150px">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
  
        
        </el-form>
        <div class="operation-buttons">
          <el-button type="primary" @click="handleAdd">新增角色</el-button>
        </div>
      </div>
  
      <!-- 用户列表 -->
      <el-table :data="userList" style="width: 100%; height: calc(100vh - 180px);" v-loading="loading" border>
        <el-table-column prop="num" label="序号" width="80" align="center" />
        <el-table-column prop="roleName" label="角色" width="250" align="center" />
      
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status == 1 ? 'success' : 'danger'">
              {{ scope.row.status == 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="300" align="center" />
        <el-table-column  label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button v-if="!scope.row.isWorker" type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button v-if="!scope.row.isWorker" type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            <el-button v-if="!scope.row.isWorker" :type="scope.row.status == 1 ? 'danger' : 'success'" size="small" @click="forbidden(scope.row)">{{scope.row.status == 1 ? '禁用' : '启用'}}</el-button>
          </template>
        </el-table-column>
      </el-table>
  
     

       <!-- 分页 -->
       <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        >
          
          <template #jumper>
            跳转至
            <el-input
              class="el-pagination__jump"
              size="small"
              :model-value="currentPage"
              @change="handleCurrentChange"
            />
            页
          </template>
        </el-pagination>
      </div>
  
      <!-- 用户表单弹窗 -->
      <el-dialog
        :title="dialogTitle"
        v-model="dialogVisible"
        width="500px"
        @close="resetForm"
      >
        <el-form
          ref="userFormRef"
          :model="userForm"
          :rules="rules"
          label-width="80px"
        >
          <el-form-item label="角色名称" prop="id">
            <el-input v-model="userForm.roleName" placeholder="" />
          </el-form-item>
  
      
          <el-form-item label="权限" prop="type" style="width:250px">
            <el-select v-model="userForm.roleId" placeholder="请选择权限" multiple>
              <el-option 
                v-for="item in permissionList" 
                :key="item.id" 
                :label="item.name || item.name" 
                :value="item.id" 
              />
            </el-select>
            <!-- <small v-if="roleOptions.length === 0" style="color: #999; margin-left: 10px">加载中...</small> -->
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="userForm.status">
              <el-radio v-for="item2 in statuslist" :key="item2.value" :label="item2.label" :value="item2.value"/>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import service from '@/utils/request'
  
  export default {
    name: 'UserManagement',
    setup() {
  
      const permissionList = ref([])
      // 搜索表单
      const options = ref([
        { value: 0, label: '普通用户' },
        { value: 1, label: '管理员' }
      ])
      const statuslist = ref([
        { value: 1, label: '启用' },
        { value: 0, label: '禁用' }
      ])
      const searchForm = reactive({
        // offset: 1,
        // limit: 10,
        keyWords: "",
        roleId: null,
        status: null
      })
      const roleOptions = ref([])
  
      // 表格数据
      const loading = ref(false)
      const userList = ref([])
      const currentPage = ref(1)
      const pageSize = ref(10)
      const total = ref(0)
  
      // 弹窗表单
      const dialogVisible = ref(false)
      const dialogTitle = ref('')
      const userFormRef = ref(null)
      const userForm = reactive({
        id: '',
        roleId: '',
        realName: '',
        roleName: '',
        phoneNum: '',
        password: '',
        status: 1,
        requestType: 0
      })
  
      // 表单验证规则
      const rules = {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
      //   phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
        role: [{ required: true, message: '请选择角色', trigger: 'change' }]
      }
  
      const forbidden = (row)=>{
        service.post('/role/enable', {
          id: row.id,
          status: row.status === 1 ? 0 : 1
        }).then(res=>{
           getUserList();
        })
    }
      // 获取用户列表
      const getUserList = async () => {
        loading.value = true
        try {
          const res = await service.post('/role/page', {
              offset: currentPage.value,
              limit: pageSize.value,
              roleName: searchForm.searchKey,
              ...searchForm
            
            }
           
        )
          userList.value = res.data.data
          total.value = res.data.count
        } catch (error) {
          console.error('获取用户列表失败:', error)
          ElMessage.error('获取用户列表失败')
        } finally {
          loading.value = false
        }
      }
  
      // 搜索
      const handleSearch = () => {
        currentPage.value = 1
        getUserList()
      }
  
      // 重置搜索
      const resetSearch = () => {
        searchForm.username = ''
        searchForm.searchKey = ''
        searchForm.status = null
        searchForm.roleId = null
        handleSearch()
      }
  
    
  
      // 新增用户
      const handleAdd = () => {
        dialogTitle.value = '新增角色'
        dialogVisible.value = true
        resetForm()
        userForm.requestType = 1
      
      }
  

      const handleEdit = async (row) => {
  try {
    dialogTitle.value = '编辑角色';
    
    // 使用更安全的方式复制属性
   // 不要重新赋值，而是修改属性
Object.assign(userForm, {
  ...row,
  type: Number(row.type) || 0,
  status: Number(row.status) || 0,
  requestType: 2
});
    
    dialogVisible.value = true;
    
    // 更安全的API调用方式
    const res = await service.get('/role/show', {
      params: { roleId: row.id }
    });
    
    // 更健壮的数据处理
    userForm.roleId = Array.isArray(res?.data) 
      ? res.data.map(r => r.id) 
      : [];
      
  } catch (error) {
    console.error('编辑角色失败:', error);
    // 可以添加用户提示，如:
    // ElMessage.error('获取角色信息失败');
  }
}
      // 编辑用户
      // const handleEdit = async (row) => {
      //   dialogTitle.value = '编辑角色';
      //   Object.assign(userForm, row);
      //   userForm.type = parseInt(row.type); // 确保类型为数字
      //   userForm.status = parseInt(row.status); // 确保状态为数字
      //   dialogVisible.value = true;
      //   // 调用回显
      //   const res = await service.get('/role/show?roleId='+row.id)
      //   let ids = res.data.map(r=>r.id)
      //   userForm.roleId = ids
        
      //   userForm.requestType = 2;
       
      // }
  
      // 删除用户
      const handleDelete = (row) => {
        ElMessageBox.confirm('确认删除该角色吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          try {
            service.post(`/role/delete`, {
              ids: [row.id],
              delete : 1
            }).then(res=>{
              if(res.code == 2000){
               ElMessage.success('删除成功')
               getUserList()
            }
            })
            
            
            
          } catch (error) {
            console.error('删除角色失败:', error)
            ElMessage.error('删除用户失败')
          }
        }).catch(err=>{
          
        })
      }
  
      // 提交表单
      const submitForm = async () => {
        if (!userFormRef.value) return
        await userFormRef.value.validate(async (valid) => {
          if (valid) {
            userForm.permissionIds = userForm.roleId
            if(userForm.requestType == 1){
              const res = await service.post('/role/add', userForm)
              if(res.code == 2000){
                ElMessage.success('新增成功')
              }
            }
            if(userForm.requestType == 2){
              const res = await service.post('/role/edit', userForm)
              if(res.code === 2000){
                ElMessage.success('修改成功')
              }
              
            }
           
            dialogVisible.value = false;
          
          }
        })
      }
  
      // 重置表单
      const resetForm = () => {
        if (userFormRef.value) {
          userFormRef.value.resetFields()
        }
        Object.assign(userForm, {
          id: '',
          roleId: '',
          realName: '',
          phoneNum: '',
          password: '',
          status: '1'
        })
      }
  
      // 分页
      const handleSizeChange = (val) => {
        pageSize.value = val
        getUserList()
      }
  
      const handleCurrentChange = (val) => {
        currentPage.value = val
        getUserList()
      }
  
      const getRoleList = () => {
        service.get('/role/list').then(res => {
           let cres= res.data || [];
           roleOptions.value = cres.filter(i=>i.isWorker==false)
        }).catch(err => {
          console.error('获取角色列表失败：', err)
          ElMessage.error('获取角色列表失败')
        })
      }

      const getPermissionList = () =>{
        service.get('/permission/list').then(res => {
           let cres= res.data || [];
           permissionList.value = cres
        }).catch(err => {
          console.error('获取角色列表失败：', err)
          ElMessage.error('获取角色列表失败')
        })
      }
  
      onMounted(() => {
        getUserList()
        getPermissionList()
      })
  
      return {
        searchForm,
        roleOptions,
        loading,
        forbidden,
        userList,
        currentPage,
        pageSize,
        total,
        permissionList,
        dialogVisible,
        dialogTitle,
        userFormRef,
        userForm,
        rules,
        statuslist,
        options,
        handleSearch,
        resetSearch,
        handleAdd,
        handleEdit,
        handleDelete,
        submitForm,
        handleSizeChange,
        handleCurrentChange
      }
    }
  }
  </script>
  
  <style scoped>
  .user-container {
    padding: 20px;
  }
  
  .operation-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  
  .search-form {
    flex: 1;
  }
  
  .operation-buttons {
    margin-left: 20px;
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  /* 添加以下样式使表格内容居中 */
  :deep(.el-table) {
    width: 100%;
    height: calc(100vh - 180px);
  }

  :deep(.el-table__body) {
    width: 100% !important;
  }

  :deep(.el-table__header) {
    width: 100% !important;
  }

  :deep(.el-table .cell) {
    text-align: center;
  }

  :deep(.el-table th) {
    text-align: center;
  }
  </style>