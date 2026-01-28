<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
  import * as echarts from 'echarts'
  // ⭐ 临时 mock：按 date 映射对 / 错
  const mockResultMap: Record<string, { correct: number; wrong: number }> = {
    '2026-01-08': { correct: 18, wrong: 6 },
    '2026-01-09': { correct: 12, wrong: 8 },
    '2026-01-10': { correct: 20, wrong: 5 },
  }

  const chartRef = ref<HTMLDivElement | null>(null)
  let chart: echarts.ECharts | null = null
  let observer: ResizeObserver | null = null

  const props = defineProps<{
    data: {
      date: string
      correct: number
      wrong: number
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
            data: props.data.map((d) => d.correct + d.wrong),
          },
        ],
      })
    },
    { deep: true }
  )

  function initChart() {
    if (!chartRef.value || chart) return

    chart = echarts.init(chartRef.value)
    chart.setOption({
      grid: { top: 20, left: 40, right: 20, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const p = params[0]
          const date = p.axisValue as string

          const item = props.data.find((d) => d.date === date)
          if (!item) return ''

          const { correct, wrong } = item
          const total = correct + wrong
          const rate = total ? Math.round((correct / total) * 100) : 0

          return `
      <div>
        <div style="font-weight: 600; margin-bottom: 6px;">
          ${date}
        </div>
        <div>练习总数：${total}</div>
        <div>正确：${correct}</div>
        <div>错误：${wrong}</div>
        <div style="margin-top: 6px; font-weight: 500;">
          正确率：${rate}%
        </div>
      </div>
    `
        },
      },
      xAxis: {
        type: 'category',
        data: props.data.map((d) => d.date),
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      series: [
        {
          name: '练习总数',
          type: 'bar',
          barWidth: '40%',
          data: props.data.map((d) => d.correct + d.wrong),
        },
      ],
    })
  }

  onMounted(() => {
    if (!chartRef.value) return

    observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect

      // 🔴 关键判断：只有在“有尺寸”时才 init
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
    <h3 class="section-title">每日练习量</h3>
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
