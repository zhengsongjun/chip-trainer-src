<script setup lang="ts">
  import { computed } from 'vue'
  import { Document, CircleCheck, Timer } from '@element-plus/icons-vue'

  interface Summary {
    totalQuestions: number
    accuracy: number // 0~1
    avgAnswerTimeMs: number // ms
    medianAnswerTimeMs: number // ms
  }

  const props = defineProps<{
    summary: Summary | null
  }>()

  const accuracyPercent = computed(() =>
    props.summary ? Math.round(props.summary.accuracy * 100) : 0
  )

  const avgTimeSec = computed(() =>
    props.summary ? Math.round(props.summary.avgAnswerTimeMs / 100) / 10 : 0
  )

  const medianTimeSec = computed(() =>
    props.summary ? Math.round(props.summary.medianAnswerTimeMs / 100) / 10 : 0
  )
</script>

<template>
  <div class="stat-cards">
    <div class="ui-panel stat-card">
      <div class="stat-header">
        <el-icon class="stat-icon"><Document /></el-icon>
        <span class="stat-title">练习题数</span>
      </div>
      <div class="stat-value stat-neutral">
        {{ props.summary?.totalQuestions ?? 0 }}
      </div>
    </div>

    <div class="ui-panel stat-card">
      <div class="stat-header">
        <el-icon class="stat-icon success"><CircleCheck /></el-icon>
        <span class="stat-title">总正确率</span>
      </div>
      <div class="stat-value stat-success">{{ accuracyPercent }}%</div>
    </div>

    <div class="ui-panel stat-card">
      <div class="stat-header">
        <el-icon class="stat-icon time"><Timer /></el-icon>
        <span class="stat-title">平均答题时间</span>
      </div>
      <div class="stat-value stat-time">{{ avgTimeSec }} s</div>
    </div>

    <div class="ui-panel stat-card">
      <div class="stat-header">
        <el-icon class="stat-icon time"><Timer /></el-icon>
        <span class="stat-title">中位答题时间</span>
      </div>
      <div class="stat-value stat-time">{{ medianTimeSec }} s</div>
    </div>
  </div>
</template>

<style scoped>
  .stat-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .stat-card {
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* 标题行 */
  .stat-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stat-title {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1;
  }

  /* icon：弱存在感 */
  .stat-icon {
    font-size: 14px;
    color: var(--color-text-placeholder);
  }

  .stat-icon.success {
    color: var(--stat-success);
    opacity: 0.8;
  }

  .stat-icon.time {
    color: var(--stat-time);
    opacity: 0.8;
  }

  /* 数值 */
  .stat-value {
    margin-top: 12px;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
  }

  .stat-neutral {
    color: var(--stat-neutral);
  }

  .stat-success {
    color: var(--stat-success);
  }

  .stat-time {
    color: var(--stat-time);
  }
</style>
