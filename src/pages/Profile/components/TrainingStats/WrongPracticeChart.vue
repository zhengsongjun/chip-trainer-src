<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
  import * as echarts from 'echarts/core'
  import { BarChart } from 'echarts/charts'
  import { getModeLabel } from '@/utils/countString'
  import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
  } from 'echarts/components'
  import { CanvasRenderer } from 'echarts/renderers'

  /* ========================
   * Types（与你的 useTrainingAnalysis 对齐）
   * ====================== */
  type WrongPracticeDaily = {
    date: string
    total: number
    byMode: Record<string, number>
    bySubMode: Record<string, number>
  }

  /* ========================
   * Props
   * ====================== */
  const props = defineProps<{
    data: WrongPracticeDaily[]
  }>()

  /* ========================
   * ECharts 注册
   * ====================== */
  echarts.use([
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    CanvasRenderer,
  ])

  /* ========================
   * Refs
   * ====================== */
  const chartRef = ref<HTMLDivElement | null>(null)
  let chart: echarts.ECharts | null = null
  let resizeObserver: ResizeObserver | null = null

  /* ========================
   * 数据 → ECharts option
   * ====================== */
  function buildOption(data: WrongPracticeDaily[]): echarts.EChartsOption {
    if (!data.length) {
      return {
        title: {
          text: '错题练习分析',
          left: 'center',
        },
      }
    }

    // X 轴：日期
    const dates = data.map((d) => d.date)

    // 所有 subMode（cash / holdem / tournament ...）
    const subModes = Array.from(new Set(data.flatMap((d) => Object.keys(d.bySubMode || {}))))

    // series（堆叠）
    const series = subModes.map((subMode) => ({
      name: getModeLabel(subMode),
      type: 'bar',
      stack: 'total',
      emphasis: { focus: 'series' },
      data: data.map((d) => d.bySubMode?.[subMode] ?? 0),
    }))

    return {
      title: {
        text: '错题练习统计',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        top: 42,
      },
      grid: {
        top: 80,
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
      },
      series,
    }
  }

  /* ========================
   * Init / Update
   * ====================== */
  function initChart() {
    if (!chartRef.value || chart) return
    chart = echarts.init(chartRef.value)
  }

  function updateChart() {
    if (!chart) return
    const option = buildOption(props.data)
    chart.setOption(option, true)
  }

  /* ========================
   * Lifecycle
   * ====================== */
  onMounted(() => {
    if (!chartRef.value) return

    resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        if (!chart) {
          initChart()
          updateChart()
        } else {
          chart.resize()
        }
      }
    })

    resizeObserver.observe(chartRef.value)
  })

  watch(
    () => props.data,
    () => {
      if (chart) {
        updateChart()
      }
    },
    { deep: true }
  )

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null

    chart?.dispose()
    chart = null
  })
</script>

<template>
  <div class="chart-wrapper">
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<style scoped>
  .chart-wrapper {
    width: 100%;
    height: 100%;
    background: #fff;
    border-radius: 16px;

    /* 四周阴影（与你 KPI 卡片统一） */
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.04),
      0 12px 24px rgba(0, 0, 0, 0.06);
  }

  .chart {
    width: 100%;
    height: 100%;
  }
</style>
