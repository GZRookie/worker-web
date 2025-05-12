<template>
  <div class="salary-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar" style="display: flex">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="工人姓名">
          <el-input v-model="searchForm.workerName" placeholder="请输入工人姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工资记录列表 -->
    <el-table :data="salaryList" style="width: 100%; height: calc(100vh - 180px);" v-loading="loading" border>
      <el-table-column prop="num" label="序号" width="80" align="center" />
      <el-table-column prop="workerName" label="工人姓名" width="120" align="center" />
      <el-table-column prop="workerNo" label="工号" width="120" align="center" />
      <el-table-column prop="roleName" label="工种" width="120" align="center" />
      <el-table-column prop="dailyWage" label="日薪(元)" width="120" align="center">
        <template #default="scope">
          {{ scope.row.dailyWage.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="workDays" label="工作天数" width="120" align="center" />
      <el-table-column prop="totalSalary" label="总工资(元)" width="150" align="center">
        <template #default="scope">
          {{ scope.row.totalSalary.toFixed(2) }}
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
        <template #total>
          共计 {{ total }} 条
        </template>
        <template #sizes>
          {{ pageSize }}/页
        </template>
        <template #jumper>
          跳转至
          <el-input
            class="el-pagination__jump"
            size="small"
            :model-value="currentPage"
            @change="handleJumperChange"
          />
          页
        </template>
      </el-pagination>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/utils/request'

export default {
  name: 'SalaryManagement',
  setup() {
    const loading = ref(false)
    const salaryList = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('编辑工资记录')
    const salaryFormRef = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    
    // 搜索表单
    const searchForm = reactive({
      workerName: ''
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
      workDays: [
        { required: true, message: '请输入工作天数', trigger: 'blur' }
      ]
    })
    
    // 获取工资记录列表
    const getSalaryList = () => {
      loading.value = true
      const params = {
        offset: currentPage.value,
        limit: pageSize.value,
        workerName: searchForm.workerName
      }
      
      service.post('/salary/record/page', params)
        .then(res => {
          if (res.code === 2000) {
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
    
    // 搜索
    const handleSearch = () => {
      currentPage.value = 1
      getSalaryList()
    }
    
    // 重置搜索
    const resetSearch = () => {
      searchForm.workerName = ''
      handleSearch()
    }
    
    // 处理跳转页码变化
    const handleJumperChange = (val) => {
      currentPage.value = parseInt(val) || 1
      getSalaryList()
    }
    
    // 计算总工资
    const calculateTotal = () => {
      salaryForm.totalSalary = salaryForm.dailyWage * salaryForm.workDays
    }
    
    // 提交表单
    const submitForm = () => {
      salaryFormRef.value.validate(valid => {
        if (valid) {
          const method = 'post'
          const url = `/salary/record/edit`
          
          service[method](url, salaryForm)
            .then(res => {
              if (res.code === 2000) {
                ElMessage.success('更新成功')
                dialogVisible.value = false
                getSalaryList()
              } else {
                ElMessage.error(res.message || '更新失败')
              }
            })
            .catch(err => {
              console.error('更新失败', err)
              ElMessage.error('更新失败')
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
      handleSearch,
      resetSearch,
      calculateTotal,
      submitForm,
      resetForm,
      handleSizeChange,
      handleCurrentChange,
      handleJumperChange
    }
  }
}
</script>

<style scoped>
.salary-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-pagination__jump) {
  width: 50px;
  margin: 0 5px;
}

/* 添加表格高度限制，使其占满全屏 */
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