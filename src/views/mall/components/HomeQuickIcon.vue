<template>
  <span v-if="entry.icon" class="home-quick-icon" :style="sizeStyle">
    <StorageImage :src="entry.icon" :width="size" :height="size" fit="cover" :preview="false" />
  </span>
  <span v-else class="home-quick-icon" :style="[sizeStyle, { color: action.color, background: action.bg }]">
    <el-icon :size="Math.round(size * 0.5)">
      <component :is="action.icon" />
    </el-icon>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Coin, Grid, Lightning, Shop, Ticket, UserFilled } from '@element-plus/icons-vue'
import StorageImage from '@/components/mall/StorageImage.vue'

type ActionKey = 'seckill' | 'group' | 'coupons' | 'pointsMall' | 'shops' | 'products'

const ACTIONS: Record<ActionKey, { icon: typeof Lightning; color: string; bg: string }> = {
  seckill: { icon: Lightning, color: '#be412b', bg: '#f9ebe7' },
  group: { icon: UserFilled, color: '#24634f', bg: '#e8f2ed' },
  coupons: { icon: Ticket, color: '#986019', bg: '#fbf0de' },
  pointsMall: { icon: Coin, color: '#5b4a86', bg: '#efecf7' },
  shops: { icon: Shop, color: '#315c67', bg: '#e8eff2' },
  products: { icon: Grid, color: '#65726a', bg: '#eef2ef' },
}

const TARGET_ACTIONS: Record<string, ActionKey> = {
  '/pages/seckill/list': 'seckill',
  '/pages/group-buy/list': 'group',
  '/pages/coupons/center': 'coupons',
  '/pages/coupons/list': 'coupons',
  '/pages/points-mall/list': 'pointsMall',
  '/pages/shop/list': 'shops',
  '/pages/product/list': 'products',
}

const props = withDefaults(defineProps<{
  entry: { icon?: string | null; target?: string | null; type?: number }
  size?: number
}>(), {
  size: 38,
})

const action = computed(() => {
  const target = String(props.entry.target || '').trim()
  const key = TARGET_ACTIONS[target] || (Number(props.entry.type) === 2 ? 'group' : 'seckill')
  return ACTIONS[key]
})

const sizeStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
</script>

<style scoped>
.home-quick-icon {
  display: inline-grid;
  flex: 0 0 auto;
  overflow: hidden;
  place-items: center;
  border-radius: 10px 3px 10px 3px;
}

.home-quick-icon :deep(.el-image) {
  display: block;
  width: 100%;
  height: 100%;
}

.home-quick-icon :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
