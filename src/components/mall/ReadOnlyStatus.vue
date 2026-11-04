<template>
  <span class="read-only-status" :class="`is-${tone}`">
    <i></i>
    <span><slot /></span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}>(), {
  tone: 'neutral',
})
</script>

<style scoped>
.read-only-status {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--mall-muted, #65726a);
  font-size: 12px;
  white-space: nowrap;
}

.read-only-status > i {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: currentColor;
}

.read-only-status.is-success { color: var(--mall-brand, #24634f); }
.read-only-status.is-warning { color: #986019; }
.read-only-status.is-danger { color: #b6403a; }
.read-only-status.is-info { color: #376d80; }
</style>
