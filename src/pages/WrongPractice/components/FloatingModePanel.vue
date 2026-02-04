<script setup lang="ts">
  defineProps<{
    modeLabel: string
  }>()
</script>

<template>
  <div class="floating-panel">
    <div class="label">当前模式</div>
    <div class="value">
      {{ modeLabel }}
    </div>
  </div>
</template>

<style scoped>
  .floating-panel {
    width: 140px;
    padding: 12px 16px;
    border-radius: 14px;
    /* 毛玻璃核心 */
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    /* 细边框 + 阴影 */
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);

    /* 动效 */
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .floating-panel:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  .label {
    font-size: 12px;
    color: #6b7280; /* 灰 */
    margin-bottom: 4px;
    user-select: none;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    color: #111827; /* 深色 */
    white-space: nowrap;
  }
</style>
