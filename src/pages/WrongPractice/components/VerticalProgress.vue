<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    current: number
    total: number
  }>()

  const percent = computed(() => {
    if (props.total === 0) return 0
    return Math.min(100, Math.round((props.current / props.total) * 100))
  })
</script>

<template>
  <div class="vertical-progress">
    <!-- 数值 -->
    <div class="progress-value">
      <div class="current">{{ current }}</div>
      <div class="slash">/</div>
      <div class="total">{{ total }}</div>
    </div>

    <!-- 轨道 -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ height: percent + '%' }" />
    </div>

    <!-- 提示 -->
    <div class="progress-tip">已完成 {{ current }} 题</div>
  </div>
</template>

<style scoped>
  .vertical-progress {
    position: fixed;
    right: 28px;
    top: 50%;
    transform: translateY(-50%);
    width: 64px;
    padding: 14px 10px 16px;

    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    border-radius: 18px;

    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    z-index: 20;
  }

  /* 数字 */
  .progress-value {
    display: flex;
    align-items: baseline;
    gap: 2px;
    font-variant-numeric: tabular-nums;
  }

  .progress-value .current {
    font-size: 20px;
    font-weight: 600;
    color: #409eff; /* element-plus primary */
  }

  .progress-value .slash {
    font-size: 12px;
    color: #909399;
  }

  .progress-value .total {
    font-size: 12px;
    color: #909399;
  }

  /* 轨道 */
  .progress-track {
    width: 8px;
    height: 160px;
    background: #ebeef5;
    border-radius: 999px;
    position: relative;
    overflow: hidden;
  }

  /* 填充 */
  .progress-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;

    border-radius: 999px;

    background: linear-gradient(180deg, #79bbff 0%, #409eff 60%, #337ecc 100%);

    transition: height 0.35s ease;
  }

  /* 提示 */
  .progress-tip {
    font-size: 12px;
    color: #606266;
    text-align: center;
  }
</style>
