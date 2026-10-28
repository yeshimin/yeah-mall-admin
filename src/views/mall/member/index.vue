<template>
  <div class="mall-page member-page">
    <section class="mall-filter-panel">
    <el-form :inline="true" class="mall-query-form">
      <el-form-item label="会员ID">
        <el-input v-model="query.memberId" clearable placeholder="会员ID" />
      </el-form-item>
      <el-form-item label="会员关键词">
        <el-input v-model="query.keyword" clearable placeholder="昵称、账号或手机号" @keyup.enter="loadMembers(true)" />
      </el-form-item>
      <el-form-item class="mall-query-actions">
        <el-button @click="resetQuery">重置</el-button>
        <el-button type="primary" @click="loadMembers(true)">查询</el-button>
      </el-form-item>
    </el-form>
    </section>

    <section class="mall-table-panel">
    <el-table v-loading="loading" :data="members">
      <el-table-column label="会员" min-width="210">
        <template #default="{ row }">
          <div class="member-cell">
            <el-avatar :size="42" :src="avatarUrl(row.avatar)">{{ displayName(row).slice(0, 1) }}</el-avatar>
            <div>
              <strong>{{ displayName(row) }}</strong>
              <p>ID：{{ row.id }}</p>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="account" label="账号" min-width="130">
        <template #default="{ row }">{{ row.account || '-' }}</template>
      </el-table-column>
      <el-table-column prop="mobile" label="手机号" width="140">
        <template #default="{ row }">{{ row.mobile || '-' }}</template>
      </el-table-column>
      <el-table-column prop="pointsBalance" label="可用积分" width="110" />
      <el-table-column prop="totalPointsEarned" label="累计获得" width="110" />
      <el-table-column prop="totalPointsUsed" label="累计使用" width="110" />
      <el-table-column prop="createTime" label="注册时间" width="180" />
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
    </el-table>

    <MallPagination
      :total="page.total"
      :page="page.current"
      :limit="page.size"
      @pagination="changePage"
    />
    </section>

    <el-drawer v-model="detail.visible" title="会员详情" size="520px">
      <el-descriptions v-if="detail.member" :column="1" border>
        <el-descriptions-item label="会员ID">{{ detail.member.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ detail.member.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ detail.member.account || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.member.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ genderText(detail.member.gender) }}</el-descriptions-item>
        <el-descriptions-item label="生日">{{ detail.member.birthday || '-' }}</el-descriptions-item>
        <el-descriptions-item label="可用积分">{{ detail.member.pointsBalance }}</el-descriptions-item>
        <el-descriptions-item label="累计获得">{{ detail.member.totalPointsEarned }}</el-descriptions-item>
        <el-descriptions-item label="累计使用">{{ detail.member.totalPointsUsed }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detail.member.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.member.updateTime }}</el-descriptions-item>
      </el-descriptions>
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
import { ArrowDown } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { queryMembers } from '@/api/mall/member'
import { getMemberGenderText, MEMBER_ACTION } from '@/constants/member'
import PointsAdjustDialog from '../member-points/components/PointsAdjustDialog.vue'

const router = useRouter()
const loading = ref(false)
const members = ref<any[]>([])
const query = reactive({ memberId: '', keyword: '' })
const page = reactive({ current: 1, size: 10, total: 0 })
const detail = reactive({ visible: false, member: null as any })
const adjust = reactive({
  visible: false,
  type: 'increase' as 'increase' | 'decrease',
  member: { memberId: '', memberName: '', balance: 0 },
})

function displayName(row: any) {
  return row.nickname || row.account || `会员${row.id}`
}

function avatarUrl(key?: string) {
  return key ? getStoragePreviewUrl(key) : ''
}

function genderText(value?: number) { return getMemberGenderText(value) }

async function loadMembers(reset = false) {
  if (reset) page.current = 1
  loading.value = true
  try {
    const response: any = await queryMembers({
      memberId: query.memberId || undefined,
      keyword: query.keyword || undefined,
      current: page.current,
      size: page.size,
    })
    members.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.memberId = ''
  query.keyword = ''
  loadMembers(true)
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  loadMembers()
}

function openDetail(row: any) {
  detail.member = row
  detail.visible = true
}

function openAdjust(row: any, type: 'increase' | 'decrease') {
  adjust.type = type
  adjust.member = {
    memberId: row.id,
    memberName: displayName(row),
    balance: Number(row.pointsBalance || 0),
  }
  adjust.visible = true
}

function handleMoreCommand(command: string, row: any) {
  if (command === MEMBER_ACTION.INCREASE_POINTS || command === MEMBER_ACTION.DECREASE_POINTS) {
    openAdjust(row, command === MEMBER_ACTION.INCREASE_POINTS ? 'increase' : 'decrease')
    return
  }
  if (command === MEMBER_ACTION.VIEW_POINTS_LEDGER) {
    router.push({ path: '/mall/member-points', query: { tab: 'ledger', memberId: row.id } })
  }
}

onMounted(() => loadMembers())
</script>

<style scoped>
.member-cell { display: flex; align-items: center; gap: 12px; }
.member-cell strong { color: #303133; font-weight: 600; }
.member-cell p { margin: 4px 0 0; color: #909399; font-size: 12px; }
:deep(.el-dropdown) { margin-left: 12px; vertical-align: middle; }
</style>
