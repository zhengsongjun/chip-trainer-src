<script setup lang="ts">
  import { ref, onMounted, nextTick, watchEffect, computed } from 'vue'

  import TimeRangeSelector from './TimeRangeSelector.vue'
  import StatCards from './StatCards.vue'
  import DailyVolumeChart from './DailyVolumeChart.vue'
  import AccuracyTrendChart from './AccuracyTrendChart.vue'
  import { useTrainingAnalysis } from './../../composables/useTrainingAnalysis'
  import { useUserStore } from '@/stores/user'
  import WrongPracticeChart from './WrongPracticeChart.vue'
  /* ================= 训练类型选择 ================= */
  const trainingType = ref<'chip' | 'board'>('chip')
  type RangeType = 'all' | '7d' | '30d' | 'custom'
  const userStore = useUserStore()
  const userId = computed(() => userStore.profile?.uid ?? '')
  const range = ref<
    | { type: 'all' }
    | { type: '7d' }
    | { type: '30d' }
    | { type: 'custom'; start: number; end: number }
  >({
    type: '7d',
  })
  const { summary, daily, accuracyTrend, wrongPracticeDaily } = useTrainingAnalysis({
    userId,
    range,
  })

  onMounted(async () => {
    await nextTick()
    // 🔴 关键：等页面真正显示完
    window.dispatchEvent(new Event('resize'))
  })
</script>

<template>
  <div class="training-stats-page">
    <!-- ================= 顶部控制区 ================= -->
    <div class="stats-header">
      <div class="time-panel" :class="{ active: range.type === 'custom' }">
        <TimeRangeSelector v-model="range" />
      </div>
    </div>

    <!-- ================= 核心指标 ================= -->
    <div class="stats-overview">
      <StatCards :summary="summary" />
    </div>

    <!-- ================= 图表分析 ================= -->
    <div class="stats-charts">
      <div class="chart-panel" style="flex: 3">
        <DailyVolumeChart :data="daily" />
      </div>

      <div class="chart-panel" style="flex: 2">
        <AccuracyTrendChart :data="accuracyTrend" />
      </div>
    </div>
    <div class="stats-panel">
      <WrongPracticeChart :data="wrongPracticeDaily" />
    </div>
  </div>
</template>

<style scoped>
  .stats-header :deep(.range-panel) {
    margin-top: 4px;
  }

  .training-type-select {
    width: 200px;
  }

  .stats-header {
    display: flex;
    align-items: center; /* 关键 */
    justify-content: flex-end;
  }

  .range-wrapper {
    display: flex;
    align-items: flex-start;
  }

  .training-type-select {
    width: 200px;
  }

  .stats-overview {
    padding-top: var(--space-4);
    padding-bottom: var(--space-4);
  }

  .stats-charts {
    display: flex;
    gap: 24px;
    height: 360px; /* 👈 关键：控制整行高度 */
  }
  .chart-panel {
    flex: 1;
    height: 100%; /* 👈 关键 */
    min-height: unset; /* 👈 去掉 min-height 干扰 */
    background: #fff;
    border-radius: 16px;
  }

  .time-panel {
    transition: all 0.2s ease;
  }

  /* 默认（非自定义） */
  .time-panel:not(.active) {
    background: transparent;
    box-shadow: none;
    padding: 0;
  }

  /* 自定义时才“变成卡片” */
  .time-panel.active {
    background: #fff;
    padding: 16px 20px;
    border-radius: 16px;
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.04),
      0 12px 24px rgba(0, 0, 0, 0.06);
  }
  .stats-panel {
    margin-top: 24px;
    height: 420px; /* 👈 关键 */
    background: #fff;
    border-radius: 16px;
  }
</style>
