<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
  import * as echarts from 'echarts'
  import { getModeLabel } from '@/utils/countString'

  const chartRef = ref<HTMLDivElement | null>(null)

  let chart: echarts.ECharts | null = null
  let observer: ResizeObserver | null = null

  const props = defineProps<{
    data: {
      date: string
      byMode: Record<
        string,
        {
          questions: number
          correct: number
          wrong: number
        }
      >
    }[]
  }>()

  watch(
    () => props.data,
    () => {
      if (!chart) return

      chart.setOption({
        xAxis: {
          data: props.data.map((d) => d.date),
        },
        series: [
          {
            data: props.data.map((d) => d.accuracy),
          },
        ],
      })
    },
    { deep: true }
  )

  function initChart() {
    if (!chartRef.value || chart) return
    const allModes = Array.from(new Set(props.data.flatMap((d) => Object.keys(d.byMode))))
    chart = echarts.init(chartRef.value)
    chart.setOption({
      grid: {
        top: 24,
        left: 40,
        right: 20,
        bottom: 30,
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v: number) => `${v}%`,
      },
      xAxis: {
        type: 'category',
        data: props.data.map((d) => d.date),
        axisTick: { show: false },
        axisLine: {
          lineStyle: { color: '#dcdfe6' },
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
        splitLine: {
          lineStyle: { color: '#ebeef5' },
        },
      },
      legend: {
        top: 0,
      },
      series: allModes.map((mode) => ({
        name: getModeLabel(mode), // legend 用
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: props.data.map((d) => {
          const m = d.byMode[mode]
          if (!m || m.questions === 0) return 0
          return Math.round((m.correct / m.questions) * 100)
        }),
      })),
    })
  }

  onMounted(() => {
    if (!chartRef.value) return

    observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect

      // ✅ 只有在“真实可见 + 有尺寸”时才初始化 / resize
      if (width > 0 && height > 0) {
        initChart()
        chart?.resize()
      }
    })

    observer.observe(chartRef.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    chart?.dispose()
    chart = null
  })
</script>

<template>
  <div class="ui-panel">
    <h3 class="section-title">正确率趋势</h3>
    <div ref="chartRef" class="chart-container" />
  </div>
</template>

<style scoped>
  .chart-container {
    width: 100%;
    height: 280px;
  }

  .section-title {
    margin-bottom: var(--space-4);
    font-weight: 600;
  }
</style>
