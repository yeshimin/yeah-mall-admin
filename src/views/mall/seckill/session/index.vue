<template>
  <div class="seckill-session-manage">
    <el-form ref="searchFormRef" :model="queryParams" label-position="left" label-width="80px" inline class="mb8">
      <el-form-item label="场次名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入场次名称"
          clearable
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="场次状态">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择场次状态"
          clearable
          style="width: 200px"
        >
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetQuery">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增场次
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="sessionList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="name" label="场次名称" width="200" />
      <el-table-column prop="beginTime" label="开始时间" width="180" />
      <el-table-column prop="endTime" label="结束时间" width="180" />
      <el-table-column prop="sort" label="排序" width="100" />
      <el-table-column prop="isEnabled" label="是否启用" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.isEnabled"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)" plain>
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row.id)" plain>
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" style="margin-top: 20px; text-align: right;">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="Number(pagination.total)"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="场次名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入场次名称" />
        </el-form-item>
        <el-form-item label="开始时间" prop="beginTime">
          <el-date-picker
            v-model="form.beginTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="form.sort"
            :min="1"
            :max="999"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="是否启用" prop="isEnabled">
          <el-switch v-model="form.isEnabled" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { createSeckillSession, updateSeckillSession, deleteSeckillSession, querySeckillSessionList } from '@/api/mall/seckill'

// 路由相关
const route = useRoute()
const router = useRouter()
const activityId = computed(() => route.query.activityId)
const activityName = computed(() => decodeURIComponent(route.query.activityName || '秒杀活动'))

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增场次')
const formRef = ref(null)

// 查询参数
const queryParams = reactive({
  name: '',
  status: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 表单数据
const form = reactive({
  id: '',
  activityId: '',
  name: '',
  beginTime: '',
  endTime: '',
  sort: 1,
  isEnabled: true,
  remark: ''
})

// 表单规则
const rules = reactive({
  name: [{ required: true, message: '请输入场次名称', trigger: 'blur' }],
  beginTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
})

// 场次列表
const sessionList = ref([])

// 模拟数据
const mockSessionList = [
  {
    id: 1,
    activityId: activityId.value,
    name: '上午场',
    startTime: '2026-02-14 10:00:00',
    endTime: '2026-02-14 12:00:00',
    sort: 1,
    status: 1,
    description: '上午10点-12点场次'
  },
  {
    id: 2,
    activityId: activityId.value,
    name: '下午场',
    startTime: '2026-02-14 14:00:00',
    endTime: '2026-02-14 16:00:00',
    sort: 2,
    status: 1,
    description: '下午14点-16点场次'
  },
  {
    id: 3,
    activityId: activityId.value,
    name: '晚上场',
    startTime: '2026-02-14 19:00:00',
    endTime: '2026-02-14 21:00:00',
    sort: 3,
    status: 0,
    description: '晚上19点-21点场次'
  }
]

// 初始化
onMounted(() => {
  getList()
})

// 格式化日期时间
function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取场次列表
function getList() {
  loading.value = true
  const params = {
    conditions_: `sort:sort:asc`,
    activityId: activityId.value,
    size: pagination.size,
    current: pagination.current
  }

  // 合并查询参数
  if (queryParams.name) {
    params.conditions_ += `,name:${queryParams.name}:like`
  }
  if (queryParams.status) {
    params.conditions_ += `,isEnabled:${queryParams.status === '1' ? true : false}:eq`
  }

  querySeckillSessionList(params)
    .then(response => {
      const data = response.data
      sessionList.value = data.records || []
      pagination.total = Number(data.total) || 0
      pagination.current = Number(data.current) || 1
      pagination.size = Number(data.size) || 10
    })
    .catch(error => {
      ElMessage.error('获取场次列表失败: ' + (error.message || '未知错误'))
      sessionList.value = []
      pagination.total = 0
    })
    .finally(() => {
      loading.value = false
    })
}

// 新增场次
function handleAdd() {
  dialogTitle.value = '新增场次'
  form.id = ''
  form.activityId = activityId.value
  form.name = ''
  form.beginTime = ''
  form.endTime = ''
  form.sort = 1
  form.isEnabled = true
  form.remark = ''
  dialogVisible.value = true
}

// 编辑场次
function handleEdit(row) {
  dialogTitle.value = '编辑场次'
  Object.assign(form, row)
  dialogVisible.value = true
}

// 提交表单
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      const submitData = {
        activityId: form.activityId,
        name: form.name,
        beginTime: formatDateTime(form.beginTime),
        endTime: formatDateTime(form.endTime),
        sort: form.sort,
        isEnabled: form.isEnabled,
        remark: form.remark
      }

      if (form.id) {
        // 编辑
        updateSeckillSession({ ...submitData, id: form.id })
          .then(() => {
            ElMessage.success('编辑成功')
            dialogVisible.value = false
            getList()
          })
          .catch(error => {
            ElMessage.error('编辑失败: ' + (error.message || '未知错误'))
          })
          .finally(() => {
            loading.value = false
          })
      } else {
        // 新增
        createSeckillSession(submitData)
          .then(() => {
            ElMessage.success('新增成功')
            dialogVisible.value = false
            getList()
          })
          .catch(error => {
            ElMessage.error('新增失败: ' + (error.message || '未知错误'))
          })
          .finally(() => {
            loading.value = false
          })
      }
    }
  })
}

// 删除场次
function handleDelete(id) {
  ElMessageBox.confirm('确定要删除该场次吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    deleteSeckillSession(id)
      .then(() => {
        ElMessage.success('删除成功')
        getList()
      })
      .catch(error => {
        ElMessage.error('删除失败: ' + (error.message || '未知错误'))
      })
      .finally(() => {
        loading.value = false
      })
  })
}

// 状态变更
function handleStatusChange(row) {
  loading.value = true
  updateSeckillSession({
    id: row.id,
    isEnabled: row.isEnabled
  })
    .then(() => {
      ElMessage.success('状态更新成功')
    })
    .catch(error => {
      ElMessage.error('状态更新失败: ' + (error.message || '未知错误'))
      // 恢复原状态
      row.isEnabled = !row.isEnabled
    })
    .finally(() => {
      loading.value = false
    })
}

// 查询
function handleQuery() {
  pagination.current = 1
  getList()
}

// 重置
function resetQuery() {
  Object.assign(queryParams, {
    name: '',
    status: ''
  })
  handleQuery()
}

// 分页大小变化
function handleSizeChange(size) {
  pagination.size = size
  getList()
}

// 当前页码变化
function handleCurrentChange(current) {
  pagination.current = current
  getList()
}
</script>

<style lang="scss" scoped>
.seckill-session-manage {
  padding: 20px;
}

.mb8 {
  margin-bottom: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  text-align: right;
}
</style>