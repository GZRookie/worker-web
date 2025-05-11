<template>
  <div class="wage-container">
    <!-- 工种薪资列表 -->
    <el-table :data="wageList" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="roleId" label="工种ID" min-width="100" />
      <el-table-column prop="roleName" label="工种名称" min-width="200" />
      <el-table-column prop="dailyWage" label="日薪(元)" min-width="150">
        <template #default="scope">
          {{ scope.row.dailyWage.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 工种薪资表单弹窗 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="wageFormRef"
        :model="wageForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="工种名称" prop="roleName">
          <el-input v-model="wageForm.roleName" placeholder="请输入工种名称" />
        </el-form-item>
        <el-form-item label="日薪(元)" prop="dailyWage">
          <el-input-number v-model="wageForm.dailyWage" :precision="2" :step="10" :min="0" />
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
  name: 'WageManagement',
  setup() {
    const loading = ref(false)
    const wageList = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('编辑工种薪资')
    const wageFormRef = ref(null)
    
    // 表单数据
    const wageForm = reactive({
      roleId: null,
      roleName: '',
      dailyWage: 0
    })
    
    // 表单验证规则
    const rules = reactive({
      roleName: [
        { required: true, message: '请输入工种名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      dailyWage: [
        { required: true, message: '请输入日薪', trigger: 'blur' }
      ]
    })
    
    // 获取工种薪资列表
    const getWageList = () => {
      loading.value = true
      service.get('/salary/wage/list')
        .then(res => {
          if (res.code === 2000) {
            wageList.value = res.data || []
          } else {
            ElMessage.error(res.message || '获取工种薪资列表失败')
          }
        })
        .catch(err => {
          console.error('获取工种薪资列表失败', err)
          ElMessage.error('获取工种薪资列表失败')
        })
        .finally(() => {
          loading.value = false
        })
    }
    
    // 编辑工种薪资
    const handleEdit = (row) => {
      dialogTitle.value = '编辑工种薪资'
      Object.keys(wageForm).forEach(key => {
        wageForm[key] = row[key]
      })
      dialogVisible.value = true
    }
    
    // 提交表单
    const submitForm = () => {
      wageFormRef.value.validate(valid => {
        if (valid) {
          const isEdit = wageForm.roleId !== null
          const method = isEdit ? 'put' : 'post'
          const url = isEdit ? `/salary/wage/${wageForm.roleId}` : '/salary/wage'
          
          service[method](url, wageForm)
            .then(res => {
              if (res.code === 2000) {
                ElMessage.success(isEdit ? '更新成功' : '添加成功')
                dialogVisible.value = false
                getWageList()
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
      wageForm.roleId = null
      wageForm.roleName = ''
      wageForm.dailyWage = 0
      
      if (wageFormRef.value) {
        wageFormRef.value.resetFields()
      }
    }
    
    // 页面加载时获取数据
    onMounted(() => {
      getWageList()
    })
    
    return {
      loading,
      wageList,
      dialogVisible,
      dialogTitle,
      wageForm,
      wageFormRef,
      rules,
      handleEdit,
      submitForm,
      resetForm
    }
  }
}
</script>

<style scoped>
.wage-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

:deep(.el-table) {
  width: 100%;
  height: calc(100vh - 120px);
}

:deep(.el-table__body) {
  width: 100% !important;
}

:deep(.el-table__header) {
  width: 100% !important;
}
</style>