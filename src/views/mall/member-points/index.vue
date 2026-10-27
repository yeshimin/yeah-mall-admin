<template>
  <div class="mall-page points-manage">
    <el-tabs v-model="activeTab" @tab-change="loadCurrentTab">
      <el-tab-pane label="积分流水" name="ledger">
        <el-form :inline="true">
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
          <el-button type="primary" @click="loadLedger(true)">查询</el-button>
          <el-button @click="resetLedger">重置</el-button>
        </el-form>

        <el-table v-loading="loading" :data="ledger">
          <el-table-column prop="memberId" label="会员ID" min-width="180" />
          <el-table-column prop="description" label="说明" min-width="160" />
          <el-table-column prop="changePoints" label="变动" width="100">
            <template #default="{ row }">
              <span :class="row.changePoints >= 0 ? 'plus' : 'minus'">
                {{ row.changePoints >= 0 ? '+' : '' }}{{ row.changePoints }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balanceBefore" label="变动前" width="100" />
          <el-table-column prop="balanceAfter" label="变动后" width="100" />
          <el-table-column prop="bizNo" label="业务单号" min-width="150" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="180" />
        </el-table>

        <MallPagination
          :total="ledgerPage.total"
          :page="ledgerPage.current"
          :limit="ledgerPage.size"
          @pagination="onLedgerPageChange"
        />
      </el-tab-pane>

      <el-tab-pane label="积分规则" name="rule">
        <el-table v-loading="loading" :data="rules">
          <el-table-column prop="name" label="规则" width="130" />
          <el-table-column prop="code" label="编码" width="160" />
          <el-table-column label="计算方式" width="120">
            <template #default="{ row }">
              {{ row.calcType === MEMBER_POINTS_RULE_CALC_TYPE.FIXED ? '固定积分' : '按金额比例' }}
            </template>
          </el-table-column>
          <el-table-column label="规则值" width="140">
            <template #default="{ row }">
              {{ row.calcType === MEMBER_POINTS_RULE_CALC_TYPE.FIXED ? `${row.fixedPoints} 积分` : `每元 ${row.pointsPerYuan} 积分` }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="220" />
          <el-table-column label="状态" width="90">
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import MallPagination from '@/components/mall/MallPagination.vue'
import { queryPointsLedger, queryPointsRules, updatePointsRule } from '@/api/mall/memberPoints'
import { MEMBER_POINTS_BIZ_TYPE_OPTIONS, MEMBER_POINTS_RULE_CALC_TYPE } from '@/constants/memberPoints'

const activeTab = ref('ledger')
const route = useRoute()
const loading = ref(false)
const ledger = ref<any[]>([])
const rules = ref<any[]>([])
const ledgerQuery = reactive({ memberId: '', bizType: '' })
const ledgerPage = reactive({ current: 1, size: 10, total: 0 })
const ruleDialog = reactive({ visible: false, form: {} as any })

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
  await updatePointsRule(ruleDialog.form)
  ElMessage.success('保存成功')
  ruleDialog.visible = false
  loadRules()
}

onMounted(() => {
  if (route.query.tab === 'ledger') {
    ledgerQuery.memberId = String(route.query.memberId || '')
  }
  loadLedger(true)
})
</script>

<style scoped>
.points-manage :deep(.el-select) {
  width: 150px;
}

.plus {
  color: #d64b25;
  font-weight: 600;
}

.minus {
  color: #46776a;
  font-weight: 600;
}
</style>
