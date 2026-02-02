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
      total: number
      correct: number
      wrong: number
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
            data: props.data.map((d) => d.total),
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
      grid: { top: 20, left: 40, right: 20, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const p = params[0]
          const date = p.axisValue as string

          const item = props.data.find((d) => d.date === date)
          if (!item) return ''

          const { total, correct, wrong, byMode } = item
          const accuracy = total ? Math.round((correct / total) * 100) : 0

          const accuracyColor = accuracy >= 70 ? '#2ecc71' : accuracy >= 40 ? '#f1c40f' : '#e74c3c'

          const modeLines = Object.entries(byMode)
            .map(([mode, v]) => {
              const rate = v.questions > 0 ? Math.round((v.correct / v.questions) * 100) : 0

              return `
        <div style="
          display: flex;
          justify-content: space-between;
          margin-left: 8px;
          padding: 2px 0;
          font-size: 12px;
          color: #555;
        ">
          <span>• ${getModeLabel(mode)}</span>
          <span>${v.questions} 题 · 正确率 ${rate}%</span>
        </div>
      `
            })
            .join('')

          return `
    <div style="
      padding: 10px 12px;
      min-width: 180px;
      line-height: 1.6;
      font-size: 12px;
      color: #333;
    ">
      <!-- 日期 -->
      <div style="
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 6px;
      ">
        ${date}
      </div>

      <!-- 核心数据 -->
      <div style="color: #666;">
        <div>练习总数：${total}</div>
        <div>正确：${correct}</div>
        <div>错误：${wrong}</div>
      </div>

      <!-- 正确率（重点） -->
      <div style="
        margin-top: 8px;
        font-weight: 600;
        color: ${accuracyColor};
      ">
        整体正确率：${accuracy}%
      </div>

      <!-- 分割线 -->
      ${
        modeLines
          ? `
            <div style="
              height: 1px;
              background: #eee;
              margin: 8px 0;
            "></div>

            <div style="
              font-weight: 500;
              color: #666;
              margin-bottom: 2px;
            ">
              模式分布
            </div>

            ${modeLines}
          `
          : ''
      }
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
      legend: {
        top: 0,
      },

      series: allModes.map((mode) => ({
        name: getModeLabel(mode), // legend 名字
        type: 'bar',
        barWidth: '30%',
        data: props.data.map((d) => {
          const m = d.byMode[mode]
          return m ? m.questions : 0
        }),
      })),
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
