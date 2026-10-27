<template>
  <div class="app-container">
    <el-form :inline="true" class="query-form">
      <el-form-item label="处理状态">
        <el-select v-model="query.status" placeholder="全部" clearable>
          <el-option label="待处理" value="1" />
          <el-option label="处理中" value="2" />
          <el-option label="已解决" value="3" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="load(true)">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form>

    <el-table v-loading="loading" :data="records">
      <el-table-column prop="id" label="ID" width="150" />
      <el-table-column prop="memberId" label="会员ID" width="150" />
      <el-table-column
        prop="content"
        label="反馈内容"
        min-width="260"
        show-overflow-tooltip
      />
      <el-table-column
        prop="contact"
        label="联系方式"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="replyTime" label="回复时间" width="180" />
      <el-table-column prop="createTime" label="提交时间" width="180" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="detail(row)">详情</el-button>
          <el-button link type="primary" @click="openHandle(row)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="page.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="load(true)"
        @current-change="load()"
      />
    </div>

    <el-dialog v-model="detailDialog.visible" title="反馈详情" width="680px">
      <el-descriptions v-if="detailDialog.feedback" :column="2" border>
        <el-descriptions-item label="会员ID">
          {{ detailDialog.feedback.memberId }}
        </el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="statusTagType(detailDialog.feedback.status)">
            {{ statusText(detailDialog.feedback.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系方式">
          {{ detailDialog.feedback.contact || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ detailDialog.feedback.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="反馈内容" :span="2">
          {{ detailDialog.feedback.content }}
        </el-descriptions-item>
        <el-descriptions-item label="平台回复" :span="2">
          {{ detailDialog.feedback.replyContent || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="回复时间" :span="2">
          {{ detailDialog.feedback.replyTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="detailDialog.images.length" class="feedback-images">
        <el-image
          v-for="image in detailDialog.images"
          :key="image"
          :src="getStoragePreviewUrl(image)"
          :preview-src-list="detailDialog.images.map(getStoragePreviewUrl)"
          preview-teleported
          fit="cover"
          class="feedback-image"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="handleDialog.visible" title="处理反馈" width="560px">
      <el-form :model="handleDialog.form" label-width="90px">
        <el-form-item label="处理状态" required>
          <el-select v-model="handleDialog.form.status" style="width: 100%">
            <el-option label="处理中" value="2" />
            <el-option label="已解决" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台回复" :required="handleDialog.form.status === '3'">
          <el-input
            v-model="handleDialog.form.replyContent"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
            placeholder="向用户说明处理结果；标记已解决时必填"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="handleDialog.loading" @click="submitHandle">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getAdminFeedbackDetail, handleAdminFeedback, queryAdminFeedbacks } from '@/api/mall/feedback'

const loading = ref(false)
const records = ref<any[]>([])
const query = reactive({ status: '' })
const page = reactive({ current: 1, size: 10, total: 0 })
const detailDialog = reactive({ visible: false, feedback: null as any, images: [] as string[] })
const handleDialog = reactive({
  visible: false,
  loading: false,
  form: { feedbackId: '', status: '2', replyContent: '' },
})

const statusMap: Record<string, string> = { '1': '待处理', '2': '处理中', '3': '已解决' }

function statusText(status: string | number) {
  return statusMap[String(status)] || '-'
}

function statusTagType(status: string | number) {
  return ({ '1': 'warning', '2': 'primary', '3': 'success' } as Record<string, string>)[String(status)] || 'info'
}

async function load(reset = false) {
  if (reset) {
    page.current = 1
  }
  loading.value = true
  try {
    const result: any = await queryAdminFeedbacks({
      ...query,
      current: page.current,
      size: page.size,
      conditions_: 'createTime:sort:desc',
    })
    records.value = result.data?.records || []
    page.total = Number(result.data?.total || 0)
  } finally {
    loading.value = false
  }
}

function reset() {
  query.status = ''
  load(true)
}

async function detail(row: any) {
  const result: any = await getAdminFeedbackDetail(row.id)
  detailDialog.feedback = result.data?.feedback || null
  detailDialog.images = result.data?.images || []
  detailDialog.visible = true
}

function openHandle(row: any) {
  handleDialog.form.feedbackId = row.id
  handleDialog.form.status = row.status === '3' ? '3' : '2'
  handleDialog.form.replyContent = row.replyContent || ''
  handleDialog.visible = true
}

async function submitHandle() {
  if (handleDialog.form.status === '3' && !handleDialog.form.replyContent.trim()) {
    ElMessage.warning('标记已解决时必须填写平台回复')
    return
  }
  handleDialog.loading = true
  try {
    await handleAdminFeedback({ ...handleDialog.form, replyContent: handleDialog.form.replyContent.trim() })
    ElMessage.success('保存成功')
    handleDialog.visible = false
    load()
  } finally {
    handleDialog.loading = false
  }
}

onMounted(() => load())
</script>

<style scoped>
.query-form :deep(.el-select) {
  width: 140px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.feedback-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.feedback-image {
  width: 96px;
  height: 96px;
  border-radius: 4px;
}
</style>
