<template>
  <div class="mall-page member-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="loadMembers(true)">
        <el-form-item label="会员关键词">
          <el-input v-model="query.keyword" clearable placeholder="昵称、账号或手机号" @keyup.enter="loadMembers(true)" />
        </el-form-item>
        <el-form-item label="积分范围">
          <el-select v-model="query.pointsRange" clearable placeholder="全部积分">
            <el-option label="0 积分" value="zero" />
            <el-option label="1–999" value="low" />
            <el-option label="1000 以上" value="high" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="query.registerRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="至"
            clearable
          />
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" native-type="submit"><el-icon><Search /></el-icon>查询</el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button :loading="exporting" @click="exportMembers">
          <el-icon><Download /></el-icon>导出结果
        </el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table data-ym-table="r33" v-loading="loading" :data="members">
        <el-table-column label="会员" min-width="200">
          <template #default="{ row }">
            <div class="member-cell">
              <el-avatar :size="42" :src="avatarUrl(row.avatar)">{{ displayName(row).slice(0, 1) }}</el-avatar>
              <div class="member-copy">
                <strong><CopyableText :value="displayName(row)" label="会员名称" /></strong>
                <p>ID <CopyableText :value="row.id" label="会员ID" /></p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="账号" min-width="120">
          <template #default="{ row }">
            <CopyableText v-if="row.account" :value="row.account" label="会员账号" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="手机号" min-width="130">
          <template #default="{ row }">
            <CopyableText v-if="row.mobile" :value="row.mobile" label="手机号" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="可用积分" min-width="92" align="right">
          <template #default="{ row }">{{ formatNumber(row.pointsBalance) }}</template>
        </el-table-column>
        <el-table-column label="累计获得" min-width="92" align="right">
          <template #default="{ row }">{{ formatNumber(row.totalPointsEarned) }}</template>
        </el-table-column>
        <el-table-column label="累计使用" min-width="92" align="right">
          <template #default="{ row }">{{ formatNumber(row.totalPointsUsed) }}</template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="156">
          <template #default="{ row }">
            <span class="member-time">{{ formatDate(row.createTime) }}</span>
            <small class="member-time-sub">{{ formatTime(row.createTime) }}</small>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-dropdown @command="handleMoreCommand($event, row)">
              <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="MEMBER_ACTION.INCREASE_POINTS">增加积分</el-dropdown-item>
                  <el-dropdown-item :command="MEMBER_ACTION.DECREASE_POINTS">扣减积分</el-dropdown-item>
                  <el-dropdown-item :command="MEMBER_ACTION.VIEW_POINTS_LEDGER" divided>积分流水</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <template #empty>
          <div class="member-empty">
            <el-icon><User /></el-icon>
            <strong>没有匹配的会员</strong>
            <span>修改筛选条件后重试</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="page.total"
        :page="page.current"
        :limit="page.size"
        @pagination="changePage"
      />
    </section>

    <el-drawer v-model="detail.visible" class="member-detail-drawer" size="520px">
      <template #header>
        <div class="member-drawer-heading">
          <span>MEMBER PROFILE</span>
          <strong>会员详情</strong>
        </div>
      </template>
      <div v-if="detail.member" class="member-detail">
        <div class="member-profile">
          <el-avatar :size="54" :src="avatarUrl(detail.member.avatar)">
            {{ displayName(detail.member).slice(0, 1) }}
          </el-avatar>
          <div class="member-profile-copy">
            <h3>{{ displayName(detail.member) }}</h3>
            <p>{{ detail.member.account || '-' }} · {{ detail.member.mobile || '-' }}</p>
          </div>
          <el-tag type="success" effect="light">正常</el-tag>
        </div>

        <div class="member-metrics">
          <div class="member-metric">
            <span>可用积分</span>
            <strong>{{ formatNumber(detail.member.pointsBalance) }}</strong>
          </div>
          <div class="member-metric">
            <span>累计获得</span>
            <strong>{{ formatNumber(detail.member.totalPointsEarned) }}</strong>
          </div>
          <div class="member-metric">
            <span>累计使用</span>
            <strong>{{ formatNumber(detail.member.totalPointsUsed) }}</strong>
          </div>
        </div>

        <div class="member-fields">
          <div class="member-field">
            <span>会员ID</span>
            <strong><CopyableText :value="detail.member.id" label="会员ID" /></strong>
          </div>
          <div class="member-field">
            <span>性别</span>
            <strong>{{ genderText(detail.member.gender) }}</strong>
          </div>
          <div class="member-field">
            <span>生日</span>
            <strong>{{ detail.member.birthday || '-' }}</strong>
          </div>
          <div class="member-field">
            <span>注册时间</span>
            <strong>{{ detail.member.createTime || '-' }}</strong>
          </div>
          <div class="member-field">
            <span>最近更新</span>
            <strong>{{ detail.member.updateTime || '-' }}</strong>
          </div>
        </div>

      </div>
      <template #footer>
        <div v-if="detail.member" class="member-detail-actions">
          <el-button @click="openAdjust(detail.member, 'increase')">调整积分</el-button>
          <el-button type="primary" @click="openLedger(detail.member)">查看积分流水</el-button>
        </div>
      </template>
    </el-drawer>

    <PointsAdjustDialog
      v-model="adjust.visible"
      :type="adjust.type"
      :member="adjust.member"
      @saved="loadMembers"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, Download, Search, User } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { queryMembers } from '@/api/mall/member'
import { getMemberGenderText, MEMBER_ACTION } from '@/constants/member'
import PointsAdjustDialog from '../member-points/components/PointsAdjustDialog.vue'

interface MemberRecord {
  id: string | number
  nickname?: string
  account?: string
  mobile?: string
  avatar?: string
  gender?: number
  birthday?: string
  pointsBalance?: number
  totalPointsEarned?: number
  totalPointsUsed?: number
  createTime?: string
  updateTime?: string
}

interface MemberPageResponse {
  data?: {
    records?: MemberRecord[]
    total?: number | string
  }
}

defineOptions({ name: 'MallMemberManage' })

const router = useRouter()
const loading = ref(false)
const exporting = ref(false)
const members = ref<MemberRecord[]>([])
const query = reactive({ keyword: '', pointsRange: '', registerRange: [] as string[] })
const page = reactive({ current: 1, size: 10, total: 0 })
const detail = reactive<{ visible: boolean; member: MemberRecord | null }>({ visible: false, member: null })
const adjust = reactive({
  visible: false,
  type: 'increase' as 'increase' | 'decrease',
  member: { memberId: '', memberName: '', balance: 0 },
})

function displayName(row: MemberRecord) {
  return row.nickname || row.account || `会员${row.id}`
}

function avatarUrl(key?: string) {
  return key ? getStoragePreviewUrl(key) : ''
}

function genderText(value?: number) {
  return getMemberGenderText(value)
}

function formatNumber(value: unknown) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '-'
}

function formatTime(value?: string) {
  return value && value.length > 10 ? value.slice(11) : ''
}

function pointsBounds() {
  if (query.pointsRange === 'zero') {
    return { pointsMin: 0, pointsMax: 0 }
  }
  if (query.pointsRange === 'low') {
    return { pointsMin: 1, pointsMax: 999 }
  }
  if (query.pointsRange === 'high') {
    return { pointsMin: 1000 }
  }
  return {}
}

function buildQuery() {
  const [registerStart, registerEnd] = query.registerRange || []
  return {
    keyword: query.keyword || undefined,
    registerStart: registerStart || undefined,
    registerEnd: registerEnd || undefined,
    ...pointsBounds(),
  }
}

async function loadMembers(reset = false) {
  if (reset) page.current = 1
  loading.value = true
  try {
    const response = await queryMembers({
      ...buildQuery(),
      current: page.current,
      size: page.size,
    }) as MemberPageResponse
    members.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.keyword = ''
  query.pointsRange = ''
  query.registerRange = []
  loadMembers(true)
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  loadMembers()
}

function openDetail(row: MemberRecord) {
  detail.member = row
  detail.visible = true
}

function openAdjust(row: MemberRecord, type: 'increase' | 'decrease') {
  adjust.type = type
  adjust.member = {
    memberId: String(row.id),
    memberName: displayName(row),
    balance: Number(row.pointsBalance || 0),
  }
  adjust.visible = true
}

function openLedger(row: MemberRecord) {
  router.push({ path: '/mall/member-points', query: { tab: 'ledger', memberId: String(row.id) } })
}

function handleMoreCommand(command: string, row: MemberRecord) {
  if (command === MEMBER_ACTION.INCREASE_POINTS || command === MEMBER_ACTION.DECREASE_POINTS) {
    openAdjust(row, command === MEMBER_ACTION.INCREASE_POINTS ? 'increase' : 'decrease')
    return
  }
  if (command === MEMBER_ACTION.VIEW_POINTS_LEDGER) {
    openLedger(row)
  }
}

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

async function exportMembers() {
  exporting.value = true
  try {
    const response = await queryMembers({
      ...buildQuery(),
      current: 1,
      size: 10000,
    }) as MemberPageResponse
    const rows = response.data?.records || []
    if (!rows.length) {
      ElMessage.warning('没有可导出的会员')
      return
    }
    const header = ['会员ID', '昵称', '账号', '手机号', '可用积分', '累计获得', '累计使用', '注册时间']
    const lines = [header.join(','), ...rows.map((row: MemberRecord) => [
      row.id,
      row.nickname || '',
      row.account || '',
      row.mobile || '',
      row.pointsBalance ?? 0,
      row.totalPointsEarned ?? 0,
      row.totalPointsUsed ?? 0,
      row.createTime || '',
    ].map(csvCell).join(','))]
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `会员列表-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    ElMessage.success(`已导出 ${rows.length} 条会员`)
  } catch {
    ElMessage.error('导出会员失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => loadMembers())
</script>

<style scoped>
.member-cell {
  display: flex;
  width: 240px;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin: 0 auto;
  text-align: left;
}

.member-cell :deep(.el-avatar),
.member-profile :deep(.el-avatar) {
  color: var(--mall-brand);
  background: var(--mall-brand-soft);
  font-weight: 600;
}

.member-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
}

.member-copy strong {
  overflow: hidden;
  color: var(--mall-ink);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-copy p {
  display: flex;
  align-items: center;
  gap: 3px;
  margin: 0;
  color: var(--mall-muted);
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
  white-space: nowrap;
}

.member-copy :deep(.copyable-text) {
  color: inherit;
  font: inherit;
}

.member-time {
  display: block;
  color: var(--mall-ink);
  font-size: 12px;
}

.member-time-sub {
  display: block;
  margin-top: 4px;
  color: var(--mall-muted);
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
}

.member-empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: var(--mall-muted);
}

.member-empty .el-icon {
  margin-bottom: 3px;
  color: var(--mall-brand);
  font-size: 28px;
}

.member-empty strong {
  color: var(--mall-ink);
  font-size: 13px;
}

.member-empty span {
  font-size: 12px;
}

.member-drawer-heading {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.member-drawer-heading span {
  color: var(--mall-brand);
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.member-drawer-heading strong {
  color: var(--mall-ink);
  font-size: 19px;
}

.member-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.member-profile {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--ym-line);
}

.member-profile-copy {
  min-width: 0;
}

.member-profile h3 {
  margin: 0;
  color: var(--mall-ink);
  font-size: 18px;
}

.member-profile p {
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--mall-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.member-metric {
  padding: 12px;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: var(--ym-row-hover);
}

.member-metric span {
  color: var(--mall-muted);
  font-size: 11px;
}

.member-metric strong {
  display: block;
  margin-top: 6px;
  color: var(--mall-ink);
  font-family: var(--ym-font-mono, monospace);
  font-size: 18px;
}

.member-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.member-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.member-field span {
  color: var(--mall-muted);
  font-size: 11px;
}

.member-field strong {
  overflow: hidden;
  color: var(--mall-ink);
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.member-page :deep(.mall-query-form .el-select) {
  width: 188px;
}

.member-page :deep(.el-date-editor--daterange) {
  width: 260px;
}

.member-page :deep(.el-dropdown) {
  margin-left: 12px;
  vertical-align: middle;
}
</style>
