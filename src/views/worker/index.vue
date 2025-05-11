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
    <el-table :data="categoryList" style="width: 100%" v-loading="loading">
      <el-table-column prop="num" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="gender" label="性别" width="80">
        <template #default="scope">
          {{ scope.row.gender === 1 ? '男' : scope.row.gender === 0 ? '女' : '其他' }}
        </template>
      </el-table-column>
      <el-table-column prop="roleName" label="工种" width="120" />
      <el-table-column prop="phoneNum" label="电话号码" width="120" />
      <el-table-column prop="workerNo" label="工号" width="120" />
      <el-table-column prop="idCard" label="身份证号" width="180" />
      <el-table-column prop="emergencyContact" label="紧急联系人" width="120" />
      <el-table-column prop="status" label="状态" width="400">
          <template #default="scope">
            <el-tag :type="scope.row.status == 1 ? 'success' : 'danger'">
              {{ scope.row.status == 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      <el-table-column label="操作" width="500" fixed="right">
        <template #default="scope">
          <el-button type="success" size="small" @click="handleCheck(scope.row,1)">上班打卡</el-button>
          <el-button type="success" size="small" @click="handleCheck(scope.row,2)">下班打卡</el-button>
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <!-- <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button> -->
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
      const loading = ref(false)
      const submitLoading = ref(false)
      const importLoading = ref(false)
      const dialogVisible = ref(false)
      const importDialogVisible = ref(false)
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