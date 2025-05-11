<template>
  <div class="salary-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="工人姓名">
          <el-input v-model="searchForm.workerName" placeholder="请输入工人姓名" clearable />
        </el-form-item>
        <el-form-item label="工种">
          <el-select v-model="searchForm.roleId" placeholder="请选择工种" clearable>
            <el-option 
              v-for="item in roleOptions" 
              :key="item.roleId" 
              :label="item.roleName" 
              :value="item.roleId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="operation-buttons">
        <el-button type="primary" @click="handleAdd">新增工资记录</el-button>
      </div>
    </div>

    <!-- 工资记录列表 -->
    <el-table :data="salaryList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="workerName" label="工人姓名" width="120" />
      <el-table-column prop="workerNo" label="工号" width="120" />
      <el-table-column prop="roleName" label="工种" width="120" />
      <el-table-column prop="dailyWage" label="日薪(元)" width="120">
        <template #default="scope">
          {{ scope.row.dailyWage.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="workDays" label="工作天数" width="120" />
      <el-table-column prop="totalSalary" label="总工资(元)" width="150">
        <template #default="scope">
          {{ scope.row.totalSalary.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
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
      />
    </div>

    <!-- 工资记录表单弹窗 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="salaryFormRef"
        :model="salaryForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="工人" prop="workerId">
          <el-select v-model="salaryForm.workerId" placeholder="请选择工人" @change="handleWorkerChange">
            <el-option 
              v-for="item in workerOptions" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工种" prop="roleId">
          <el-select v-model="salaryForm.roleId" placeholder="请选择工种" @change="handleRoleChange">
            <el-option 
              v-for="item in roleOptions" 
              :key="item.roleId" 
              :label="item.roleName" 
              :value="item.roleId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日薪(元)" prop="dailyWage">
          <el-input-number v-model="salaryForm.dailyWage" :precision="2" :step="10" :min="0" disabled />
        </el-form-item>
        <el-form-item label="工作天数" prop="workDays">
          <el-input-number v-model="salaryForm.workDays" :min="0" :max="31" @change="calculateTotal" />
        </el-form-item>
        <el-form-item label="总工资(元)" prop="totalSalary">
          <el-input-number v-model="salaryForm.totalSalary" :precision="2" :step="100" :min="0" disabled />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/utils/request'

export default {
  name: 'SalaryManagement',
  setup() {
    const loading = ref(false)
    const salaryList = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('新增工资记录')
    const salaryFormRef = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const roleOptions = ref([])
    const workerOptions = ref([])
    
    // 搜索表单
    const searchForm = reactive({
      workerName: '',
      roleId: null
    })
    
    // 表单数据
    const salaryForm = reactive({
      id: null,
      workerId: null,
      workerName: '',
      roleId: null,
      roleName: '',
      workerNo: '',
      dailyWage: 0,
      workDays: 0,
      totalSalary: 0
    })
    
    // 表单验证规则
    const rules = reactive({
      workerId: [
        { required: true, message: '请选择工人', trigger: 'change' }
      ],
      roleId: [
        { required: true, message: '请选择工种', trigger: 'change' }
      ],
      workDays: [
        { required: true, message: '请输入工作天数', trigger: 'blur' }
      ]
    })
    
    // 获取工资记录列表
    const getSalaryList = () => {
      loading.value = true
      const params = {
        pageNum: currentPage.value,
        pageSize: pageSize.value,
        workerName: searchForm.workerName,
        roleId: searchForm.roleId
      }
      
      service.get('/salary/record/list', { params })
        .then(res => {
          if (res.code === 0) {
            salaryList.value = res.data.data || []
            total.value = res.data.count || 0
          } else {
            ElMessage.error(res.message || '获取工资记录列表失败')
          }
        })
        .catch(err => {
          console.error('获取工资记录列表失败', err)
          ElMessage.error('获取工资记录列表失败')
        })
        .finally(() => {
          loading.value = false
        })
    }
    
    // 获取工种列表
    const getRoleList = () => {
      service.get('/salary/wage/list')
        .then(res => {
          if (res.code === 2000) {
            roleOptions.value = res.data || []
          }
        })
        .catch(err => {
          console.error('获取工种列表失败', err)
        })
    }
    
    // 获取工人列表
    const getWorkerList = () => {
      service.get('/worker/list', { params: { pageSize: 1000 } })
        .then(res => {
          if (res.code === 0) {
            workerOptions.value = (res.data.data || []).map(item => ({
              id: item.id,
              name: item.name,
              workerNo: item.workerNo
            }))
          }
        })
        .catch(err => {
          console.error('获取工人列表失败', err)
        })
    }
    
    // 搜索
    const handleSearch = () => {
      currentPage.value = 1
      getSalaryList()
    }
    
    // 重置搜索
    const resetSearch = () => {
      searchForm.workerName = ''
      searchForm.roleId = null
      handleSearch()
    }
    
    // 新增工资记录
    const handleAdd = () => {
      dialogTitle.value = '新增工资记录'
      resetForm()
      dialogVisible.value = true
    }
    
    // 编辑工资记录
    const handleEdit = (row) => {
      dialogTitle.value = '编辑工资记录'
      Object.keys(salaryForm).forEach(key => {
        salaryForm[key] = row[key]
      })
      dialogVisible.value = true
    }
    
    // 删除工资记录
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除该工资记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        service.delete(`/salary/record/${row.id}`)
          .then(res => {
            if (res.code === 0) {
              ElMessage.success('删除成功')
              getSalaryList()
            } else {
              ElMessage.error(res.message || '删除失败')
            }
          })
          .catch(err => {
            console.error('删除失败', err)
            ElMessage.error('删除失败')
          })
      }).catch(() => {
        // 取消删除
      })
    }
    
    // 工人选择变更
    const handleWorkerChange = (workerId) => {
      const worker = workerOptions.value.find(item => item.id === workerId)
      if (worker) {
        salaryForm.workerName = worker.name
        salaryForm.workerNo = worker.workerNo
      }
    }
    
    // 工种选择变更
    const handleRoleChange = (roleId) => {
      const role = roleOptions.value.find(item => item.roleId === roleId)
      if (role) {
        salaryForm.roleName = role.roleName
        salaryForm.dailyWage = role.dailyWage
        calculateTotal()
      }
    }
    
    // 计算总工资
    const calculateTotal = () => {
      salaryForm.totalSalary = salaryForm.dailyWage * salaryForm.workDays
    }
    
    // 提交表单
    const submitForm = () => {
      salaryFormRef.value.validate(valid => {
        if (valid) {
          const isEdit = salaryForm.id !== null
          const method = isEdit ? 'put' : 'post'
          const url = isEdit ? `/salary/record/${salaryForm.id}` : '/salary/record'
          
          service[method](url, salaryForm)
            .then(res => {
              if (res.code === 0) {
                ElMessage.success(isEdit ? '更新成功' : '添加成功')
                dialogVisible.value = false
                getSalaryList()
              } else {
                ElMessage.error(res.message || (isEdit ? '更新失败' : '添加失败'))
              }
            })
            .catch(err => {
              console.error(isEdit ? '更新失败' : '添加失败', err)
              ElMessage.error(isEdit ? '更新失败' : '添加失败')
            })
        }
      })
    }
    
    // 重置表单
    const resetForm = () => {
      Object.keys(salaryForm).forEach(key => {
        if (key === 'id' || key === 'workerId' || key === 'roleId') {
          salaryForm[key] = null
        } else if (key === 'dailyWage' || key === 'workDays' || key === 'totalSalary') {
          salaryForm[key] = 0
        } else {
          salaryForm[key] = ''
        }
      })
      
      if (salaryFormRef.value) {
        salaryFormRef.value.resetFields()
      }
    }
    
    // 分页大小变化
    const handleSizeChange = (size) => {
      pageSize.value = size
      getSalaryList()
    }
    
    // 当前页变化
    const handleCurrentChange = (page) => {
      currentPage.value = page
      getSalaryList()
    }
    
    // 页面加载时获取数据
    onMounted(() => {
      getSalaryList()
      getRoleList()
      getWorkerList()
    })
    
    return {
      loading,
      salaryList,
      dialogVisible,
      dialogTitle,
      salaryForm,
      salaryFormRef,
      searchForm,
      rules,
      currentPage,
      pageSize,
      total,
      roleOptions,
      workerOptions,
      handleSearch,
      resetSearch,
      handleAdd,
      handleEdit,
      handleDelete,
      handleWorkerChange,
      handleRoleChange,
      calculateTotal,
      submitForm,
      resetForm,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.salary-container {
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
</style>