<template>
  <div class="mall-page points-manage">
    <el-tabs v-model="activeTab" @tab-change="loadCurrentTab">
      <el-tab-pane label="积分流水" name="ledger">
        <section class="mall-filter-panel points-filter-panel">
        <el-form :inline="true" class="mall-query-form">
          <el-form-item label="会员ID">
            <el-input v-model="ledgerQuery.memberId" clearable />
          </el-form-item>
          <el-form-item label="业务类型">
            <el-select v-model="ledgerQuery.bizType" clearable>
              <el-option
                v-for="item in MEMBER_POINTS_BIZ_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item class="mall-query-actions">
            <el-button @click="resetLedger">重置</el-button>
            <el-button type="primary" icon="Search" @click="loadLedger(true)">查询</el-button>
          </el-form-item>
        </el-form>
        </section>

        <section class="mall-table-panel">
        <el-table data-ym-table="r31" v-loading="loading" :data="ledger" class="points-ledger-table">
          <el-table-column label="会员ID" min-width="150">
            <template #default="{ row }">
              <CopyableText :value="row.memberId" label="会员ID" />
            </template>
          </el-table-column>
          <el-table-column label="业务类型" min-width="110">
            <template #default="{ row }">
              <el-tag :type="bizTypeTone(row.bizType)">{{ bizTypeLabel(row.bizType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
          <el-table-column label="变动" min-width="100" align="right">
            <template #default="{ row }">
              <span :class="row.changePoints >= 0 ? 'plus' : 'minus'">
                {{ row.changePoints >= 0 ? '+' : '' }}{{ formatPoints(row.changePoints) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="变动前" min-width="100" align="right">
            <template #default="{ row }">{{ formatPoints(row.balanceBefore) }}</template>
          </el-table-column>
          <el-table-column label="变动后" min-width="100" align="right">
            <template #default="{ row }">{{ formatPoints(row.balanceAfter) }}</template>
          </el-table-column>
          <el-table-column label="业务单号" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <CopyableText v-if="row.bizNo" :value="row.bizNo" label="业务单号" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="160">
            <template #default="{ row }">
              <span>{{ formatDate(row.createTime) }}</span>
              <small class="points-time-sub">{{ formatTime(row.createTime) }}</small>
            </template>
          </el-table-column>
          <template #empty>
            <div class="points-empty">
              <el-icon><Coin /></el-icon>
              <strong>没有匹配的积分流水</strong>
              <span>调整筛选条件后重试</span>
            </div>
          </template>
        </el-table>

        <MallPagination
          :total="ledgerPage.total"
          :page="ledgerPage.current"
          :limit="ledgerPage.size"
          @pagination="onLedgerPageChange"
        />
        </section>
      </el-tab-pane>

      <el-tab-pane label="积分规则" name="rule">
        <section class="mall-table-panel points-rule-table">
        <el-table data-ym-table="r32" v-loading="loading" :data="rules">
          <el-table-column prop="name" label="规则" min-width="130" />
          <el-table-column prop="code" label="编码" min-width="160" />
          <el-table-column label="计算方式" min-width="120">
            <template #default="{ row }">
              {{ row.calcType === MEMBER_POINTS_RULE_CALC_TYPE.FIXED ? '固定积分' : '按金额比例' }}
            </template>
          </el-table-column>
          <el-table-column label="规则值" min-width="140" align="right">
            <template #default="{ row }">
              {{ row.calcType === MEMBER_POINTS_RULE_CALC_TYPE.FIXED ? `${row.fixedPoints} 积分` : `每元 ${row.pointsPerYuan} 积分` }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="220" />
          <el-table-column label="状态" min-width="90">
            <template #default="{ row }">
              <el-tag :type="row.isEnabled ? 'success' : 'info'">
                {{ row.isEnabled ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row }">
              <el-button link type="primary" @click="openRule(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="ruleDialog.visible" title="编辑积分规则" width="520px">
      <el-form label-width="120px">
        <el-form-item label="规则名称">
          <el-input :model-value="ruleDialog.form.name" disabled />
        </el-form-item>
        <el-form-item v-if="ruleDialog.form.calcType === 1" label="固定积分">
          <el-input-number v-model="ruleDialog.form.fixedPoints" :min="0" :step="1" />
        </el-form-item>
        <el-form-item v-else label="每元积分">
          <el-input-number v-model="ruleDialog.form.pointsPerYuan" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="ruleDialog.form.isEnabled" />
        </el-form-item>
        <el-form-item label="规则说明">
          <el-input v-model="ruleDialog.form.description" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import MallPagination from '@/components/mall/MallPagination.vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import { queryPointsLedger, queryPointsRules, updatePointsRule } from '@/api/mall/memberPoints'
import { MEMBER_POINTS_BIZ_TYPE_OPTIONS, MEMBER_POINTS_RULE_CALC_TYPE } from '@/constants/memberPoints'

const route = useRoute()
const initialTab = route.query.tab === 'rule' || route.query.tab === '积分规则' ? 'rule' : 'ledger'
const activeTab = ref(initialTab)
const loading = ref(false)
const ledger = ref<any[]>([])
const rules = ref<any[]>([])
const ledgerQuery = reactive({ memberId: '', bizType: '' })
const ledgerPage = reactive({ current: 1, size: 10, total: 0 })
const ruleDialog = reactive({ visible: false, form: {} as any })

type TagType = 'success' | 'warning' | 'info' | 'danger'

const BIZ_TYPE_TONES: Record<string, TagType> = {
  REGISTER: 'success',
  ORDER_COMPLETE: 'success',
  ORDER_REFUND: 'danger',
  REVIEW: 'info',
  MANUAL_ADJUST: 'warning',
  POINTS_EXCHANGE: 'info',
  POINTS_CANCEL: 'info',
}

function bizTypeLabel(value?: string) {
  return MEMBER_POINTS_BIZ_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || '-'
}

function bizTypeTone(value?: string): TagType {
  return BIZ_TYPE_TONES[value || ''] || 'info'
}

function formatPoints(value: unknown) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '-'
}

function formatTime(value?: string) {
  return value && value.length > 10 ? value.slice(11) : ''
}

/**
 * 查询积分流水。
 */
async function loadLedger(reset = false) {
  if (reset) {
    ledgerPage.current = 1
  }
  loading.value = true
  try {
    const result: any = await queryPointsLedger({
      ...ledgerQuery,
      current: ledgerPage.current,
      size: ledgerPage.size,
    })
    ledger.value = result.data?.records || []
    ledgerPage.total = Number(result.data?.total || 0)
  } finally {
    loading.value = false
  }
}

/**
 * 查询积分规则。
 */
async function loadRules() {
  loading.value = true
  try {
    const result: any = await queryPointsRules()
    rules.value = result.data || []
  } finally {
    loading.value = false
  }
}

/**
 * 切换积分管理页签。
 */
function loadCurrentTab() {
  if (activeTab.value === 'ledger') {
    loadLedger()
  } else {
    loadRules()
  }
}

/**
 * 处理积分流水分页。
 */
function onLedgerPageChange(value: { page: number; limit: number }) {
  ledgerPage.current = value.page
  ledgerPage.size = value.limit
  loadLedger()
}

/**
 * 重置积分流水筛选条件。
 */
function resetLedger() {
  ledgerQuery.memberId = ''
  ledgerQuery.bizType = ''
  loadLedger(true)
}

/**
 * 打开积分规则编辑窗口。
 */
function openRule(row: any) {
  ruleDialog.form = { ...row }
  ruleDialog.visible = true
}

/**
 * 保存积分规则。
 */
async function saveRule() {
  const form = ruleDialog.form
  if (form.calcType === MEMBER_POINTS_RULE_CALC_TYPE.FIXED) {
    if (form.fixedPoints == null || Number(form.fixedPoints) < 0) {
      ElMessage.warning('固定积分不能小于 0')
      return
    }
  } else if (form.pointsPerYuan == null || Number(form.pointsPerYuan) < 0) {
    ElMessage.warning('每元积分不能小于 0')
    return
  }
  await updatePointsRule(ruleDialog.form)
  ElMessage.success('保存成功')
  ruleDialog.visible = false
  loadRules()
}

onMounted(() => {
  if (activeTab.value === 'ledger') {
    ledgerQuery.memberId = String(route.query.memberId || '')
    loadLedger(true)
  } else {
    loadRules()
  }
})

watch(
  () => [route.query.tab, route.query.memberId],
  () => {
    const nextTab = route.query.tab === 'rule' || route.query.tab === '积分规则' ? 'rule' : 'ledger'
    activeTab.value = nextTab
    if (nextTab === 'ledger') {
      ledgerQuery.memberId = String(route.query.memberId || '')
      loadLedger(true)
    } else {
      loadRules()
    }
  },
)
</script>

<style scoped>
.points-manage :deep(.el-select) {
  width: 150px;
}

.points-filter-panel {
  margin-top: 2px;
}

.points-rule-table {
  margin-top: 2px;
}

.plus {
  color: #d64b25;
  font-weight: 600;
}

.minus {
  color: #46776a;
  font-weight: 600;
}

.points-time-sub {
  display: block;
  margin-top: 4px;
  color: var(--mall-muted, var(--ym-muted));
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
}

.points-empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: var(--mall-muted, var(--ym-muted));
}

.points-empty .el-icon {
  margin-bottom: 3px;
  color: var(--mall-brand, var(--ym-brand));
  font-size: 28px;
}

.points-empty strong {
  color: var(--mall-ink, var(--ym-ink));
  font-size: 13px;
}

.points-empty span {
  font-size: 12px;
}
</style>
