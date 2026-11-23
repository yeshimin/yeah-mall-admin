<template>
  <div class="placeholder-container">
    <div class="placeholder-card">
      <h2>{{ route.meta.title || '页面占位' }}</h2>
      <p>该菜单已从后端动态返回，但当前前端页面尚未正式实现。</p>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="当前路径">{{ route.path }}</el-descriptions-item>
        <el-descriptions-item label="后端组件">
          {{ String(route.meta.backendComponent || '-') }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.placeholder-container {
  display: flex;
  min-height: calc(100vh - 120px);
  align-items: center;
  justify-content: center;
}

.placeholder-card {
  width: min(720px, 100%);
  padding: 32px;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(20, 32, 36, 0.08);
}

.placeholder-card h2 {
  margin: 0 0 12px;
  font-size: 24px;
  color: var(--ym-ink);
}

.placeholder-card p {
  margin: 0 0 20px;
  color: var(--ym-muted);
}
</style>
