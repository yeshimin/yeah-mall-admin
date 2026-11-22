<template>
  <div class="mc-tabs">
    <button
      v-for="item in TABS"
      :key="item.key"
      type="button"
      :class="item.key === active ? 'active' : ''"
      @click="goTab(item)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  active: {
    type: String,
    required: true,
  },
})

const TABS = [
  { key: 'coupon', label: '优惠券', path: '/mall/mch-coupon/list' },
  { key: 'receive', label: '领取记录', path: '/mall/mch-coupon/receive' },
  { key: 'usage', label: '使用记录', path: '/mall/mch-coupon/record' },
]

const router = useRouter()

function goTab(item) {
  if (router.currentRoute.value.path === item.path) return
  router.push(item.path)
}
</script>