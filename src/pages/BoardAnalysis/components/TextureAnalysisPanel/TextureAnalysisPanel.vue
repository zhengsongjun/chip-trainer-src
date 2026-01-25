<script setup lang="ts">
  import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import {
    analyzeBoardTexture,
    validateStraightMissingInput,
    validateStraightFlushMissingInput,
  } from '@/utils/textureAnalysis'

  /* ===============================
 Props
=============================== */

  const props = defineProps<{
    boardCards: string[]
    anchorSelector?: string
  }>()

  /* ===============================
 State（⚠️ 不自动验证）
=============================== */

  const panelRef = ref<HTMLElement | null>(null)
  const isCollapsed = ref(false)

  const state = reactive({
    // 用户选择
    hasPair: null as null | boolean,
    hasFlush: null as null | boolean,
    hasStraight: null as null | boolean,
    hasStraightFlush: null as null | boolean,

    // 输入
    straightMissingInput: '',
    straightFlushMissingInput: '',

    // 验证结果（仅 validateAll 写）
    pairResult: null as null | boolean,
    flushResult: null as null | boolean,
    straightResult: null as null | boolean,
    straightFlushResult: null as null | boolean,

    straightMissingResult: null as null | { ok: boolean; message: string },
    straightFlushMissingResult: null as null | { ok: boolean; message: string },
  })

  /* ===============================
 标准答案（一次性算）
=============================== */

  const actualTexture = computed(() => {
    if (props.boardCards.length < 5) return null
    return analyzeBoardTexture(props.boardCards)
  })

  /* ===============================
 拖拽（fixed + viewport）
=============================== */

  let offsetX = 0
  let offsetY = 0
  let dragging = false

  function onDragStart(e: MouseEvent) {
    if (!panelRef.value) return
    const rect = panelRef.value.getBoundingClientRect()
    offsetX = e.clientX - rect.left
    offsetY = e.clientY - rect.top
    dragging = true
    document.addEventListener('mousemove', onDragging)
    document.addEventListener('mouseup', onDragEnd)
  }

  function onDragging(e: MouseEvent) {
    if (!dragging || !panelRef.value) return
    panelRef.value.style.left = `${e.clientX - offsetX}px`
    panelRef.value.style.top = `${e.clientY - offsetY}px`
  }

  function onDragEnd() {
    dragging = false
    document.removeEventListener('mousemove', onDragging)
    document.removeEventListener('mouseup', onDragEnd)
  }

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onDragging)
    document.removeEventListener('mouseup', onDragEnd)
  })

  /* ===============================
 初始定位（父级右上）
=============================== */

  onMounted(async () => {
    await nextTick()
    if (!panelRef.value) return

    const anchor = props.anchorSelector
      ? document.querySelector(props.anchorSelector)
      : panelRef.value.parentElement

    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const GAP = 12

    panelRef.value.style.left = `${rect.right - panelRef.value.offsetWidth - GAP}px`
    panelRef.value.style.top = `${rect.top + GAP}px`
  })

  /* ===============================
 验证（唯一入口）
=============================== */

  function validateAll() {
    if (!actualTexture.value) return

    // 1️⃣ 基础判断
    state.pairResult = state.hasPair === actualTexture.value.hasPair
    state.flushResult = state.hasFlush === actualTexture.value.hasFlush
    state.straightResult = state.hasStraight === actualTexture.value.hasStraight
    state.straightFlushResult = state.hasStraightFlush === actualTexture.value.hasStraightFlush

    // 2️⃣ 顺子缺张（仅在用户选择“有顺子”时）
    if (state.hasStraight && actualTexture.value.hasStraight) {
      const res = validateStraightMissingInput(props.boardCards, state.straightMissingInput)
      state.straightMissingResult = {
        ok: res.ok,
        message: res.message,
      }
    } else if (state.hasStraight && !actualTexture.value.hasStraight) {
      state.straightMissingResult = {
        ok: false,
        message: '该公共牌不存在顺子潜力',
      }
    } else {
      state.straightMissingResult = null
    }

    // 3️⃣ 同花顺缺张（⚠️ textarea 始终显示，结果只在验证后）
    if (state.hasStraightFlush) {
      if (!actualTexture.value.hasStraightFlush) {
        // ❌ 本质不可能
        state.straightFlushMissingResult = {
          ok: false,
          message: '无法组成同花顺',
        }
      } else {
        // ✅ 可能，才校验缺张
        const res = validateStraightFlushMissingInput(
          props.boardCards,
          state.straightFlushMissingInput
        )
        state.straightFlushMissingResult = {
          ok: res.ok,
          message: res.message,
        }
      }
    } else {
      state.straightFlushMissingResult = null
    }
  }

  /* ===============================
 Reset
=============================== */

  function resetAll() {
    state.hasPair = null
    state.hasFlush = null
    state.hasStraight = null
    state.hasStraightFlush = null

    state.pairResult = null
    state.flushResult = null
    state.straightResult = null
    state.straightFlushResult = null

    state.straightMissingInput = ''
    state.straightFlushMissingInput = ''
    state.straightMissingResult = null
    state.straightFlushMissingResult = null
  }
</script>

<template>
  <div class="ui-panel--sm texture-panel" ref="panelRef">
    <!-- Header -->
    <header class="panel-header" @mousedown="onDragStart">
      <span>Texture Analysis</span>
      <span class="collapse-toggle" @click.stop="isCollapsed = !isCollapsed">
        {{ isCollapsed ? '▸' : '▾' }}
      </span>
    </header>

    <!-- Body -->
    <div v-show="!isCollapsed" class="panel-body">
      <!-- 对子 -->
      <div class="row">
        <span>对子</span>
        <el-radio-group v-model="state.hasPair">
          <el-radio :label="true">有</el-radio>
          <el-radio :label="false">无</el-radio>
        </el-radio-group>
        <span v-if="state.pairResult !== null" :class="state.pairResult ? 'ok' : 'bad'">
          {{ state.pairResult ? '✔' : '✖' }}
        </span>
      </div>

      <!-- 同花 -->
      <div class="row">
        <span>同花</span>
        <el-radio-group v-model="state.hasFlush">
          <el-radio :label="true">有</el-radio>
          <el-radio :label="false">无</el-radio>
        </el-radio-group>
        <span v-if="state.flushResult !== null" :class="state.flushResult ? 'ok' : 'bad'">
          {{ state.flushResult ? '✔' : '✖' }}
        </span>
      </div>

      <!-- 顺子 -->
      <div class="row">
        <span>顺子潜力</span>
        <el-radio-group v-model="state.hasStraight">
          <el-radio :label="true">有</el-radio>
          <el-radio :label="false">无</el-radio>
        </el-radio-group>
        <span v-if="state.straightResult !== null" :class="state.straightResult ? 'ok' : 'bad'">
          {{ state.straightResult ? '✔' : '✖' }}
        </span>
      </div>

      <!-- 同花顺 -->
      <div v-if="state.hasFlush && state.hasStraight" class="row">
        <span>同花顺潜力</span>
        <el-radio-group v-model="state.hasStraightFlush">
          <el-radio :label="true">有</el-radio>
          <el-radio :label="false">无</el-radio>
        </el-radio-group>
        <span
          v-if="state.straightFlushResult !== null"
          :class="state.straightFlushResult ? 'ok' : 'bad'"
        >
          {{ state.straightFlushResult ? '✔' : '✖' }}
        </span>
      </div>

      <!-- 顺子缺张 -->
      <div v-if="state.hasStraight" class="row vertical">
        <el-input
          v-model="state.straightMissingInput"
          type="textarea"
          placeholder="顺子缺张，例如：A5 或 LIVE_9"
        />
        <div
          v-if="state.straightMissingResult"
          :class="state.straightMissingResult.ok ? 'ok' : 'bad'"
        >
          {{ state.straightMissingResult.message }}
        </div>
      </div>

      <!-- 同花顺缺张（textarea 始终显示，结果在验证后） -->
      <div
        v-if="state.hasFlush && state.hasStraight && state.hasStraightFlush"
        class="row vertical"
      >
        <el-input
          v-model="state.straightFlushMissingInput"
          type="textarea"
          placeholder="同花顺缺张，例如：9h Ts"
        />
        <div
          v-if="state.straightFlushMissingResult"
          :class="state.straightFlushMissingResult.ok ? 'ok' : 'bad'"
        >
          {{ state.straightFlushMissingResult.message }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer v-show="!isCollapsed" class="panel-footer">
      <el-button size="small" type="primary" @click="validateAll"> 验证 </el-button>
      <el-button size="small" @click="resetAll"> 重置 </el-button>
    </footer>
  </div>
</template>

<style>
  .texture-panel {
    z-index: 100000;
    position: fixed;
    width: 340px;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(14px);
    border-radius: 14px;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 12px 24px rgba(0, 0, 0, 0.08);
  }

  .panel-header {
    font-size: 14px;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    cursor: move;
    user-select: none;
  }

  .collapse-toggle {
    font-size: 20px;
    cursor: pointer;
    opacity: 0.6;
  }

  .collapse-toggle:hover {
    opacity: 1;
  }

  .panel-body {
    padding: 12px;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
    margin-bottom: 2px;
    font-size: 12px;
  }

  .row.vertical {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .ok {
    color: #16a34a;
    font-weight: 600;
  }

  .bad {
    color: #dc2626;
    font-weight: 600;
  }

  .panel-footer {
    padding: var(--space-2) var(--space-2);
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }
</style>
