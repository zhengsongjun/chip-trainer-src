<script setup lang="ts">
  /**
   * 纯展示组件
   * HIGH 筹码（德州扑克赢家标识）
   */
</script>

<template>
  <div class="high-chip">HIGH</div>
</template>

<style scoped>
  .high-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    height: 22px;
    padding: 0 12px;

    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;

    color: #ffffff;
    background: #d32f2f; /* 德州常见深红 */

    border-radius: 12px;

    /* 贴桌面的轻阴影 */
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.18);

    user-select: none;
  }
</style>
