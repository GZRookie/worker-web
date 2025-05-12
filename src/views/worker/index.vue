<template>
  <div class="user-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar" style="display: flex">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="工人姓名">
          <el-input v-model="queryParams.searchKey" placeholder="请输入关键词" clearable />
        </el-form-item>

        <el-form-item label="角色" prop="roleId" style="width:250px">
          <el-select v-model="queryParams.roleId" placeholder="请选择角色" clearable>
            <el-option 
              v-for="item in roleOptions" 
              :key="item.id" 
              :label="item.roleName" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>
         
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="operation-buttons">
        <el-button type="primary" @click="downloadTemplate">模版下载</el-button>
        <el-button type="primary" @click="handleImport">批量导入</el-button>
        <el-button type="primary" @click="handleAdd">新增工人</el-button>
      </div>
    </div>
    <!-- 工人列表 -->
    <el-table :data="categoryList" style="width: 100%; height: calc(100vh - 180px);" v-loading="loading" border>
      <el-table-column prop="num" label="序号" width="80" align="center" />
      <el-table-column prop="name" label="姓名" width="120" align="center" />
      <el-table-column prop="gender" label="性别" width="80" align="center">
        <template #default="scope">
          {{ scope.row.gender === 1 ? '男' : scope.row.gender === 0 ? '女' : '其他' }}
        </template>
      </el-table-column>
      <el-table-column prop="roleName" label="工种" width="120" align="center" />
      <el-table-column prop="phoneNum" label="电话号码" width="120" align="center" />
      <el-table-column prop="workerNo" label="工号" width="120" align="center" />
      <el-table-column prop="idCard" label="身份证号" width="180" align="center" />
      <el-table-column prop="emergencyContact" label="紧急联系人" width="120" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status == 1 ? 'success' : 'danger'">
              {{ scope.row.status == 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      <el-table-column label="操作" width="500" fixed="right" align="center">
        <template #default="scope">
          <el-button type="success" size="small" @click="handleCheck(scope.row,1)">上班打卡</el-button>
          <el-button type="success" size="small" @click="handleCheck(scope.row,2)">下班打卡</el-button>
          <el-button type="success" size="small" @click="qingjia(scope.row)">请假</el-button>
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          <el-button :type="scope.row.status == 1 ? 'danger' : 'success'" size="small" @click="forbidden(scope.row)">{{scope.row.status == 1 ? '禁用' : '启用'}}</el-button>
        </template>

      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.offset"
        v-model:page-size="queryParams.limit"
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
          {{ queryParams.limit }}/页
        </template>
        <template #jumper>
          跳转至
          <el-input
            class="el-pagination__jump"
            size="small"
            :model-value="queryParams.offset"
            @change="handleCurrentChange"
          />
          页
        </template>
      </el-pagination>
    </div>

      <!-- 导入工人信息对话框 -->
      <el-dialog
        title="批量导入工人信息"
        v-model="importDialogVisible"
        width="500px"
        @close="importDialogVisible = false"
      >
        <div class="import-container">
          <el-upload
            class="upload-demo"
            drag
            action=""
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".xlsx,.xls"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请上传Excel文件(.xlsx, .xls)，<a href="javascript:;" @click="downloadTemplate">下载模板</a>
              </div>
            </template>
          </el-upload>
          <div class="selected-file" v-if="importFile">
            <p>已选择文件: {{ importFile.name }}</p>
          </div>
        </div>
        <template #footer>
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="importLoading" @click="submitImport" :disabled="!importFile">上传导入</el-button>
        </template>
      </el-dialog>
      
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

      <!-- 请假对话框 -->
      <el-dialog
        title="申请请假"
        v-model="leaveDialogVisible"
        width="500px"
        @close="leaveDialogVisible = false"
      >
        <el-form
          ref="leaveFormRef"
          :model="leaveForm"
          :rules="leaveRules"
          label-width="100px"
        >
          <el-form-item label="工人姓名" prop="workerName">
            <el-input v-model="leaveForm.workerName" disabled />
          </el-form-item>
          <el-form-item label="请假类型" prop="leaveType">
            <el-select v-model="leaveForm.leaveType" placeholder="请选择请假类型">
              <el-option :label="'事假'" :value="1" />
              <el-option :label="'病假'" :value="2" />
              <el-option :label="'年假'" :value="3" />
              <el-option :label="'其他'" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="leaveForm.startTime"
              type="datetime"
              placeholder="请选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="leaveForm.endTime"
              type="datetime"
              placeholder="请选择结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="请假原因" prop="reason">
            <el-input
              v-model="leaveForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入请假原因"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="leaveDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="leaveSubmitLoading" @click="submitLeave">提交</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { reactive, ref, toRefs, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { UploadFilled } from '@element-plus/icons-vue'
  import service from '@/utils/request'
  
  export default {
    name: 'CategoryManagement',
    setup() {
      const formRef = ref(null)
      const leaveFormRef = ref(null)
      const loading = ref(false)
      const submitLoading = ref(false)
      const importLoading = ref(false)
      const leaveSubmitLoading = ref(false)
      const dialogVisible = ref(false)
      const importDialogVisible = ref(false)
      const leaveDialogVisible = ref(false)
      const dialogType = ref('add')
      const roleOptions = ref([])
      const importFile = ref(null)

      
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
        
        // 请假表单数据
        leaveForm: {
          id: null,
          workerId: null,
          workerName: '',
          leaveType: 1,
          startTime: '',
          endTime: '',
          reason: ''
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
            { required: true, message: '请输入电话号码', trigger: 'blur' }
          ],
          idCard: [
            { required: true, message: '请输入身份证号', trigger: 'blur' }
          ]
        },
        
        // 请假表单校验规则
        leaveRules: {
          leaveType: [
            { required: true, message: '请选择请假类型', trigger: 'change' }
          ],
          startTime: [
            { required: true, message: '请选择开始时间', trigger: 'change' }
          ],
          endTime: [
            { required: true, message: '请选择结束时间', trigger: 'change' }
          ],
          reason: [
            { required: true, message: '请输入请假原因', trigger: 'blur' },
            { min: 2, max: 200, message: '长度在 2 到 200 个字符', trigger: 'blur' }
          ]
        }
      })
      
      // 获取分类列表数据
      const getList = () => {
        
      }

      // 请假按钮点击事件
      const qingjia = (row)=>{
        leaveDialogVisible.value = true
        // 填充工人信息
        state.leaveForm = {
          id: null,
          workerId: row.id,
          workerName: row.name,
          leaveType: 1,
          startTime: '',
          endTime: '',
          reason: ''
        }
      }
      
      // 提交请假申请
      const submitLeave = () => {
        leaveFormRef.value.validate((valid) => {
          if (valid) {
            leaveSubmitLoading.value = true
            
            // 准备提交数据
            const submitData = {
              workerId: state.leaveForm.workerId,
              leaveType: state.leaveForm.leaveType,
              startTime: state.leaveForm.startTime,
              endTime: state.leaveForm.endTime,
              reason: state.leaveForm.reason
            }
            
            // 如果是编辑状态，添加id字段
            if (state.leaveForm.id) {
              submitData.id = state.leaveForm.id
            }
            
            service.post('/attendance/leave/apply', submitData).then((res) => {
              if(res.code === 2000) {
                ElMessage.success('请假申请提交成功')
                leaveDialogVisible.value = false
                getInitList() // 刷新列表
              } else {
                ElMessage.error(res.message || '请假申请提交失败')
              }
              leaveSubmitLoading.value = false
            }).catch(() => {
              leaveSubmitLoading.value = false
              ElMessage.error('系统错误，请稍后再试')
            })
          }
        })
      }

      const handleCheck = (row, type)=>{
        console.log("daka")
        console.log(row, type)
        service.post('/attendance/check',{
          workerId : row.id,
          clockType: type
        }).then(res=>{
          if(res.code==2000){
            ElMessage("打卡成功")
          }
        })
      }

      const downloadTemplate = async () => {
  try {
    const res = await service.get("/worker/info/export/template", {
      responseType: 'blob' // 关键：指定响应类型为二进制数据
    });
    
    // 创建一个临时的URL对象
    const url = window.URL.createObjectURL(new Blob([res.data]));
    
    // 创建一个隐藏的<a>标签用于下载

      const contentDisposition = res.headers['content-disposition'];
    let fileName = 'template.xlsx';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename=(.+)/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
    }

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName); // 设置下载文件名
    
    // 触发点击下载
    document.body.appendChild(link);
    link.click();
    
    // 清理临时对象
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('文件下载完成');
  } catch (error) {
    console.error('下载失败:', error);
  }
};

      // 处理导入按钮点击事件
      const handleImport = () => {
        importDialogVisible.value = true;
        importFile.value = null;
      }
      
      // 处理文件选择变化
      const handleFileChange = (file) => {
        importFile.value = file.raw;
        console.log('已选择文件:', file.raw.name);
      }
      
      // 提交导入Excel
      const submitImport = async () => {
        if (!importFile.value) {
          ElMessage.warning('请先选择要导入的Excel文件');
          return;
        }
        
        importLoading.value = true;
        
        try {
          const formData = new FormData();
          formData.append('file', importFile.value);
          
          const res = await service.post('/worker/info/import', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (res.code === 2000) {
            ElMessage.success('导入成功');
            importDialogVisible.value = false;
            getInitList(); // 刷新列表
          } else {
            ElMessage.error(res.message || '导入失败');
          }
        } catch (error) {
          console.error('导入出错:', error);
          ElMessage.error('系统错误，请稍后再试');
        } finally {
          importLoading.value = false;
        }
      }
      
      // const downloadTemplate = async ()=>{
      //    const res = await service.get("/worker/info/export/template")
      //    console.log('---down')
      //    console.log(res)
      // }

      const forbidden = (row)=>{
        console.log("stop")
        

        service.post('/worker/info/enable', {
          id: row.id,
          status: row.status === 1 ? 0 : 1
        }).then(res=>{
          getInitList()
        })
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
        getInitList()
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
      const handleEdit = (row) => {
        dialogType.value = 'edit'
        dialogVisible.value = true
        // 复制工人数据到表单
        state.form = {
          id: row.id,
          name: row.name,
          roleId: row.roleId,
          gender: row.gender,
          phoneNum: row.phoneNum,
          idCard: row.idCard,
          emergencyContact: row.emergencyContact
        }
        // 获取角色列表
        getRoleList()
      }
     
      
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
            } else if(dialogType.value === 'edit') {
              // 编辑工人信息
              service.post("/worker/info/edit", state.form).then((res) => {
                console.log(res)
                if(res.code === 2000) {
                  ElMessage.success('编辑成功')
                  dialogVisible.value = false
                  submitLoading.value = false
                  getInitList()
                } else {
                  ElMessage.error(res.message || '编辑失败')
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
        ElMessageBox.confirm(`确认要删除吗？`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 模拟删除请求
          service.get("/worker/info/delete/"+ row.id).then((res) => {
            if(res.code === 2000) {
              ElMessage.success('删除成功')
              
            }
            getInitList()
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
        let data = {
          name: state.queryParams.searchKey,
          ...state.queryParams
        }
        service.post("/worker/info/page",data ).then((res) => {
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
        forbidden,
        roleOptions,
        handleQuery,
        resetQuery,
        handleSizeChange,
        handleCurrentChange,
        handleAdd,
        handleEdit,
        handleCheck,
        submitForm,
        downloadTemplate,
        handleImport,
        handleFileChange,
        submitImport,
        importFile,
        importDialogVisible,
        importLoading,
        leaveFormRef,
        leaveDialogVisible,
        leaveSubmitLoading,
        submitLeave,
        qingjia,
        handleStatusChange,
        handleDelete,
        ...toRefs(state)
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

<style scoped>
.import-container {
  padding: 20px;
  text-align: center;
}

.selected-file {
  margin-top: 15px;
  padding: 10px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
}
</style>