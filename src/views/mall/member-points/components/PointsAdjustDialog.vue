<template>
  <el-dialog v-model="visible" :title="type === 'increase' ? '增加积分' : '扣减积分'" width="500px">
    <el-form label-width="100px">
      <el-form-item label="会员">
        <el-input :model-value="`${member.memberName}（${member.memberId}）`" disabled />
      </el-form-item>
      <el-form-item label="当前积分">
        <el-input :model-value="member.balance" disabled />
      </el-form-item>
      <el-form-item label="调整积分" required>
        <el-input-number v-model="form.amount" :min="MEMBER_POINTS_MIN_ADJUSTMENT" :step="MEMBER_POINTS_MIN_ADJUSTMENT" style="width: 100%" />
      </el-form-item>
      <el-form-item label="调整后积分">
        <el-input :model-value="adjustedBalance" disabled />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="选填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">确认调整</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { adjustMemberPoints } from '@/api/mall/memberPoints'
import { MEMBER_POINTS_MIN_ADJUSTMENT } from '@/constants/memberPoints'

const props = defineProps<{
  modelValue: boolean
  type: 'increase' | 'decrease'
  member: { memberId: string; memberName: string; balance: number }
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const saving = ref(false)
const form = reactive({ amount: MEMBER_POINTS_MIN_ADJUSTMENT, remark: '' })
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const adjustedBalance = computed(() => {
  const change = props.type === 'increase' ? form.amount : -form.amount
  return Number(props.member.balance || 0) + Number(change || 0)
})

watch(() => props.modelValue, (value) => {
  if (value) {
    form.amount = MEMBER_POINTS_MIN_ADJUSTMENT
    form.remark = ''
  }
})

async function save() {
  if (!form.amount || form.amount < MEMBER_POINTS_MIN_ADJUSTMENT) {
    ElMessage.warning('调整积分必须大于0')
    return
  }
  if (props.type === 'decrease' && adjustedBalance.value < 0) {
    ElMessage.warning('可用积分不足，不能扣减')
    return
  }
  saving.value = true
  try {
    await adjustMemberPoints({
      memberId: props.member.memberId,
      changePoints: props.type === 'increase' ? form.amount : -form.amount,
      remark: form.remark.trim(),
    })
    ElMessage.success('积分调整成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}
</script>
