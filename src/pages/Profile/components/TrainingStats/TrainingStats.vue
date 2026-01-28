<script setup lang="ts">
  import { ref, onMounted, nextTick, watchEffect, computed } from 'vue'

  import TimeRangeSelector from './TimeRangeSelector.vue'
  import StatCards from './StatCards.vue'
  import DailyVolumeChart from './DailyVolumeChart.vue'
  import AccuracyTrendChart from './AccuracyTrendChart.vue'
  import ErrorAnalysisTabs from './ErrorAnalysisTabs/ErrorAnalysisTabs.vue'
  import PracticeTimeDistribution from './PracticeTimeDistribution.vue'
  import { useTrainingAnalysis } from '@/composables/useTrainingAnalysis'
  import { useUserStore } from '@/stores/user'
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
  const { summary, daily, accuracyTrend, chipStructure, answerDiff } = useTrainingAnalysis({
    userId,
    range,
  })
  watchEffect(() => {
    console.log('summary', summary.value)
    console.log('daliy', daily.value)
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
      <el-select
        v-model="trainingType"
        size="default"
        placeholder="选择训练类型"
        class="training-type-select"
      >
        <el-option label="筹码反应" value="chip" />
        <el-option label="牌面分析" value="board" />
      </el-select>

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
      <div class="chart-panel">
        <DailyVolumeChart :data="daily" />
      </div>

      <div class="chart-panel">
        <AccuracyTrendChart :data="accuracyTrend" />
      </div>
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
    align-items: flex-start; /* 关键 */
    justify-content: space-between;
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
  }

  .chart-panel {
    min-height: 320px;
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
</style>
