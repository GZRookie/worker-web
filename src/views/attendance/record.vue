<template>
  <div class="attendance-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar" style="display: flex">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="工人姓名">
          <el-input v-model="searchForm.workerName" placeholder="请输入工人姓名" clearable />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="searchForm.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="searchForm.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 考勤记录列表 -->
    <el-table :data="attendanceList" style="width: 100%" v-loading="loading">
      <el-table-column prop="num" label="序号" width="80" align="center" />
      <el-table-column prop="workerName" label="工人姓名" width="120" align="center" />
      <el-table-column prop="clockTypeName" label="打卡类型" width="120" align="center" />
      <el-table-column prop="clockStatusName" label="打卡状态" width="120" align="center" />
      <el-table-column prop="clockTime" label="打卡时间" width="180" align="center" />
      <el-table-column prop="leaveTypeName" label="请假类型" width="120" align="center" />
      <el-table-column prop="leaveStartTime" label="请假开始时间" width="180" align="center" />
      <el-table-column prop="leaveEndTime" label="请假结束时间" width="180" align="center" />
      <el-table-column prop="leaveReason" label="请假原因" min-width="200" align="center" />
      <el-table-column prop="remark" label="备注" min-width="200" align="center" />
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
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import service from '@/utils/request'

export default {
  name: 'AttendanceRecord',
  setup() {
    const loading = ref(false)
    const attendanceList = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    
    // 搜索表单
    const searchForm = reactive({
      workerName: '',
      startDate: '',
      endDate: ''
    })
    
    // 获取考勤记录列表
    const getAttendanceList = () => {
      loading.value = true
      const params = {
        offset: currentPage.value,
        limit: pageSize.value,
        workerName: searchForm.workerName,
        startDate: searchForm.startDate,
        endDate: searchForm.endDate
      }
      
      service.post('/attendance/record/page', params)
        .then(res => {
          if (res.code === 2000) {
            attendanceList.value = res.data.data || []
            total.value = res.data.count || 0
          } else {
            ElMessage.error(res.message || '获取考勤记录列表失败')
          }
        })
        .catch(err => {
          console.error('获取考勤记录列表失败', err)
          ElMessage.error('获取考勤记录列表失败')
        })
        .finally(() => {
          loading.value = false
        })
    }
    
    // 搜索
    const handleSearch = () => {
      currentPage.value = 1
      getAttendanceList()
    }
    
    // 重置搜索
    const resetSearch = () => {
      searchForm.workerName = ''
      searchForm.startDate = ''
      searchForm.endDate = ''
      handleSearch()
    }
    
    // 处理跳转页码变化
    const handleJumperChange = (val) => {
      currentPage.value = parseInt(val) || 1
      getAttendanceList()
    }
    
    // 分页大小变化
    const handleSizeChange = (size) => {
      pageSize.value = size
      getAttendanceList()
    }
    
    // 当前页变化
    const handleCurrentChange = (page) => {
      currentPage.value = page
      getAttendanceList()
    }
    
    // 页面加载时获取数据
    onMounted(() => {
      getAttendanceList()
    })
    
    return {
      loading,
      attendanceList,
      searchForm,
      currentPage,
      pageSize,
      total,
      handleSearch,
      resetSearch,
      handleSizeChange,
      handleCurrentChange,
      handleJumperChange
    }
  }
}
</script>

<style scoped>
.attendance-container {
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

:deep(.el-table .cell) {
  text-align: center;
}

:deep(.el-table th) {
  text-align: center;
}
</style>