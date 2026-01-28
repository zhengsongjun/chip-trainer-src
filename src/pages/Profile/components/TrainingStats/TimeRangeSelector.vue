<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { Close } from '@element-plus/icons-vue'

  type RangeType = 'all' | '7d' | '30d' | 'custom'

  const selected = ref<RangeType>('all')
  const dateRange = ref<[Date, Date] | null>(null)
  /** 记录进入 custom 前的选项 */
  const prevSelected = ref<RangeType>('all')

  /** 是否已经确认选择了时间 */
  const hasConfirmedRange = ref(false)

  /** 悬浮面板显示状态 */
  const showPicker = ref(false)

  /** 自定义按钮是否“激活中”（浅色态） */
  const customActive = ref(false)
  watch(dateRange, (val) => {
    if (val && val[0] && val[1]) {
      hasConfirmedRange.value = true
    }
  })
  /** tab 切换逻辑 */
  watch(selected, (val, oldVal) => {
    if (val === 'custom') {
      // 进入 custom 前，记住之前的选项
      prevSelected.value = oldVal as RangeType

      showPicker.value = true
      customActive.value = true
      hasConfirmedRange.value = false
    } else {
      showPicker.value = false
      customActive.value = false
    }
  })

  function closePicker() {
    showPicker.value = false

    if (!hasConfirmedRange.value) {
      // ❌ 没选时间 = 取消 → 回退
      selected.value = prevSelected.value
      customActive.value = false
    } else {
      // ✅ 已选时间 = 完成 → 保持 custom
      customActive.value = true
    }
  }
</script>

<template>
  <div class="range-panel">
    <el-radio-group v-model="selected">
      <el-radio-button label="all">全部</el-radio-button>
      <el-radio-button label="7d">7 天</el-radio-button>
      <el-radio-button label="30d">30 天</el-radio-button>

      <!-- 自定义按钮：浅色态 -->
      <el-radio-button label="custom" :class="{ 'custom-active': customActive }">
        自定义
      </el-radio-button>
    </el-radio-group>

    <!-- 悬浮日期选择器 -->
    <div v-show="showPicker" class="floating-picker">
      <div class="picker-header">
        <span class="picker-title">选择时间范围</span>
        <el-icon class="close-icon" @click="closePicker">
          <Close />
        </el-icon>
      </div>

      <el-date-picker
        v-model="dateRange"
        type="daterange"
        unlink-panels
        start-placeholder="开始"
        end-placeholder="结束"
      />
    </div>
  </div>
</template>

<style scoped>
  .range-panel {
    position: relative;
  }

  /* ===== 自定义按钮：浅色激活态 ===== */
  :deep(.custom-active) {
    background-color: #ecf5ff !important;
    color: var(--el-color-primary) !important;
    border-color: var(--el-color-primary-light-7) !important;
  }

  /* ===== 悬浮面板 ===== */
  .floating-picker {
    position: absolute;
    top: calc(100% + 12px);
    right: 10px;
    width: 380px;

    background: #fff;
    padding: 12px 12px 16px;
    border-radius: 14px;
    box-shadow:
      0 6px 18px rgba(0, 0, 0, 0.08),
      0 16px 40px rgba(0, 0, 0, 0.12);

    z-index: 20;
  }

  /* ===== 悬浮框头部 ===== */
  /* ===== Header 整体 ===== */
  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  /* 左侧标题 */
  .picker-title-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .picker-title-icon {
    font-size: 14px;
    color: var(--color-text-placeholder);
  }

  .picker-title-text {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  /* ===== 关闭按钮 ===== */
  .close-icon {
    font-size: 22px;
    color: var(--color-text-placeholder);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .close-icon:hover {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
</style>
