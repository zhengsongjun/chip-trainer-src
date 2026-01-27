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
    <!-- ================= 训练类型选择 ================= -->
    <div class="ui-panel training-type-panel">
      <el-select v-model="trainingType" size="default" placeholder="选择训练类型">
        <el-option label="筹码反应" value="chip" />
        <el-option label="牌面分析" value="board" />
      </el-select>
    </div>

    <!-- ================= 时间范围 ================= -->
    <TimeRangeSelector v-model="range" />

    <!-- ================= 核心指标 ================= -->
    <StatCards :summary="summary" />

    <!-- ================= 趋势分析 ================= -->
    <div class="stats-section">
      <DailyVolumeChart :data="daily" />
    </div>

    <div class="stats-section">
      <AccuracyTrendChart :data="accuracyTrend" />
    </div>
  </div>
</template>

<style scoped>
  .training-stats-page {
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: var(--space-8);
  }

  .stats-section {
    margin-top: var(--space-6);
  }

  .training-type-panel {
    margin-bottom: var(--space-6);
  }
</style>
