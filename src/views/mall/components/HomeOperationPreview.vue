<template>
  <el-drawer v-model="visible" class="home-operation-preview" size="500px" :with-header="false">
    <div class="preview-head">
      <div>
        <span class="preview-kicker">APP HOME PREVIEW</span>
        <strong>App 首屏预览</strong>
      </div>
      <el-button link class="preview-close" aria-label="关闭预览" @click="visible = false">
        <el-icon :size="18"><Close /></el-icon>
      </el-button>
    </div>

    <div class="preview-note">
      <el-icon><View /></el-icon>
      <span>当前展示 <b>{{ banners.length }}</b> 张已启用 Banner（15:8 全宽轮播）和 <b>{{ entries.length }}</b> 个快捷入口；Banner 与入口均按排序从小到大展示{{ overflowCount > 0 ? `，另有 ${overflowCount} 个已启用入口超出前 10 个展示位` : '' }}。</span>
    </div>

    <div v-loading="loading" class="preview-phone">
      <div class="phone-status"><span>9:41</span><span>···</span></div>
      <div class="phone-topbar">
        <b>YEAH<span>MALL</span></b>
        <span class="phone-search"><el-icon><Search /></el-icon>搜索商品</span>
      </div>

      <div v-if="activeBanner" class="phone-banner-wrap">
        <button type="button" class="phone-banner" aria-label="预览 Banner 跳转" @click="openBanner">
          <StorageImage :src="activeBanner.imageUrl" width="100%" height="100%" fit="cover" :preview="false" />
        </button>
        <span class="phone-dots">
          <button
            v-for="(banner, index) in banners"
            :key="banner.id"
            type="button"
            :class="{ active: index === bannerIndex }"
            :aria-label="`切换到第 ${index + 1} 张 Banner`"
            @click="bannerIndex = index"
          />
        </span>
      </div>
      <div v-else class="phone-banner-empty">暂无已启用 Banner</div>

      <div v-if="quickRows.length" class="phone-quick">
        <div
          v-for="(row, rowIndex) in quickRows"
          :key="rowIndex"
          class="phone-quick-row"
          :style="{ gridTemplateColumns: `repeat(${row.count}, minmax(0, 1fr))` }"
        >
          <button v-for="entry in row.items" :key="entry.id" type="button" @click="openEntry(entry)">
            <span class="phone-quick-icon"><HomeQuickIcon :entry="entry" :size="20" /></span>
            <span>{{ entry.name }}</span>
          </button>
        </div>
      </div>
      <div v-else class="phone-quick-empty">暂无已启用的快捷入口</div>

      <div class="phone-placeholder">
        <i />
        <b>精选好物</b>
        <small>商品推荐不受首页运营配置影响</small>
      </div>
    </div>

    <div class="preview-actions">
      <el-button @click="visible = false">关闭</el-button>
      <el-button @click="configure('banner')">配置 Banner</el-button>
      <el-button type="primary" @click="configure('quick-entry')">配置快捷入口</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Search, View } from '@element-plus/icons-vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import HomeQuickIcon from './HomeQuickIcon.vue'
import { queryPlatformBanners, type BannerRecord } from '@/api/mall/banner'
import { queryQuickEntryList, type QuickEntryRecord } from '@/api/mall/quickEntry'
import { getRequestErrorMessage } from '@/utils/error'
import { buildConditions } from '@/utils/query'

defineOptions({ name: 'HomeOperationPreview' })

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  configure: [tab: 'banner' | 'quick-entry']
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const loading = ref(false)
const banners = ref<BannerRecord[]>([])
const entries = ref<QuickEntryRecord[]>([])
const enabledEntryTotal = ref(0)
const bannerIndex = ref(0)

const activeBanner = computed(() => banners.value[bannerIndex.value] || banners.value[0] || null)
const overflowCount = computed(() => Math.max(enabledEntryTotal.value - 10, 0))

const quickRows = computed(() => {
  const items = entries.value
  if (!items.length) return []
  if (items.length <= 4) return [{ items, count: Math.max(items.length, 1) }]
  const first = Math.ceil(items.length / 2)
  return [
    { items: items.slice(0, first), count: first },
    { items: items.slice(first), count: first },
  ]
})

watch(() => props.modelValue, (open) => {
  if (open) void loadPreview()
})

watch(
  () => banners.value.length,
  (length) => {
    if (bannerIndex.value >= length) bannerIndex.value = 0
  },
)

async function loadPreview() {
  loading.value = true
  try {
    const [bannerResponse, entryResponse] = await Promise.all([
      queryPlatformBanners({
        current: 1,
        size: 100,
        conditions_: buildConditions([
          { field: 'isEnabled', operator: 'eq', value: true },
          { field: 'sort', operator: 'sort', value: 'asc' },
          { field: 'id', operator: 'sort', value: 'asc' },
        ]),
      }),
      queryQuickEntryList({
        current: 1,
        size: 100,
        conditions_: buildConditions([
          { field: 'isEnabled', operator: 'eq', value: true },
          { field: 'sort', operator: 'sort', value: 'asc' },
          { field: 'createTime', operator: 'sort', value: 'desc' },
        ]),
      }),
    ])
    banners.value = bannerResponse.data?.records || []
    const allEntries = entryResponse.data?.records || []
    enabledEntryTotal.value = Number(entryResponse.data?.total || allEntries.length)
    entries.value = allEntries.slice(0, 10)
    bannerIndex.value = 0
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '预览数据加载失败')
  } finally {
    loading.value = false
  }
}

function openBanner() {
  if (!activeBanner.value) return
  ElMessage.info(activeBanner.value.target ? `Banner 将跳转至 ${activeBanner.value.target}` : '该 Banner 未配置跳转')
}

function openEntry(entry: QuickEntryRecord) {
  ElMessage.info(entry.target ? `「${entry.name}」将跳转至 ${entry.target}` : `「${entry.name}」按内置动作跳转`)
}

function configure(tab: 'banner' | 'quick-entry') {
  visible.value = false
  emit('configure', tab)
}
</script>

<style scoped>
:global(.home-operation-preview .el-drawer__body) {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.preview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.preview-kicker {
  display: block;
  margin-bottom: 4px;
  color: var(--ym-muted);
  font-family: var(--ym-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.preview-head strong {
  display: block;
  color: var(--ym-ink);
  font-size: 19px;
  font-weight: 700;
}

.preview-close {
  color: var(--ym-muted);
}

.preview-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 12px 0 14px;
  padding: 9px 11px;
  color: var(--ym-muted);
  border: 1px solid var(--ym-line);
  border-radius: 6px;
  background: #fbfdfb;
  font-size: 11px;
  line-height: 1.5;
}

.preview-note .el-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--ym-brand);
}

.preview-note b {
  color: var(--ym-ink-secondary);
  font-weight: 600;
}

.preview-phone {
  position: relative;
  width: 330px;
  min-height: 480px;
  margin: 0 auto 16px;
  padding: 0 0 12px;
  overflow: hidden;
  border: 6px solid #14231c;
  border-radius: 26px;
  background: var(--ym-paper);
  box-shadow: 0 18px 40px rgba(20, 37, 29, 0.18);
}

.phone-status {
  display: flex;
  height: 24px;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 16px 2px;
  color: var(--ym-ink);
  font: 600 9px var(--ym-font-mono);
}

.phone-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 8px;
  background: #fff;
}

.phone-topbar b {
  color: var(--ym-brand);
  font-size: 13px;
  letter-spacing: 0.02em;
}

.phone-topbar b span {
  color: var(--ym-ink);
}

.phone-search {
  display: flex;
  flex: 1;
  height: 26px;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  color: var(--ym-muted);
  border: 1px solid var(--ym-line);
  border-radius: 13px;
  background: #fff;
  font-size: 10px;
}

.phone-banner-wrap {
  position: relative;
  margin: 0 0 10px;
}

.phone-banner {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 0;
  aspect-ratio: 15 / 8;
  background: #1c4b3b;
  cursor: pointer;
}

.phone-banner :deep(.el-image) {
  position: absolute;
  inset: 0;
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.phone-banner :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.phone-dots {
  position: absolute;
  right: 0;
  bottom: 7px;
  left: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.phone-dots button {
  width: 5px;
  height: 5px;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
}

.phone-dots button.active {
  width: 12px;
  background: #fff;
}

.phone-banner-empty {
  display: grid;
  width: 100%;
  height: auto;
  margin: 0 0 10px;
  place-items: center;
  color: var(--ym-muted);
  border-top: 1px dashed var(--ym-line-strong);
  border-bottom: 1px dashed var(--ym-line-strong);
  background: #fff;
  aspect-ratio: 15 / 8;
  font-size: 11px;
}

.phone-quick {
  padding: 2px 10px 10px;
}

.phone-quick-row {
  display: grid;
  gap: 2px;
}

.phone-quick-row + .phone-quick-row {
  margin-top: 8px;
}

.phone-quick button {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
  color: var(--ym-ink-secondary);
  border: 0;
  background: none;
  font-size: 9px;
  cursor: pointer;
}

.phone-quick button > span:last-child {
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-quick-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  background: var(--ym-brand-soft, #e8f2ed);
}

.phone-quick-icon :deep(.home-quick-icon) {
  border-radius: 7px 2px 7px 2px;
}

.phone-quick-empty {
  margin: 0 10px 10px;
  padding: 10px;
  color: var(--ym-muted);
  border: 1px dashed var(--ym-line);
  border-radius: 8px;
  background: #fff;
  font-size: 10px;
  text-align: center;
}

.phone-placeholder {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 2px 10px 0;
  padding-top: 10px;
  border-top: 1px solid var(--ym-line);
}

.phone-placeholder i {
  display: inline-block;
  width: 4px;
  height: 13px;
  border-radius: 2px;
  background: var(--ym-brand);
}

.phone-placeholder b {
  color: var(--ym-ink);
  font-size: 12px;
}

.phone-placeholder small {
  color: var(--ym-muted);
  font-size: 9px;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}
</style>
