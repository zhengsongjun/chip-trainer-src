<script setup lang="ts">
  import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import {
    analyzeBoardTexture,
    validateStraightMissingInput,
    validateStraightFlushMissingInput,
  } from '@/utils/textureAnalysis'
  import { ArrowRight, ArrowDown } from '@element-plus/icons-vue'
  import useBoardAnalysisTrainingI18n from '@/i18n/customHook/useBoardAnalysis'

  const {
    textureAnalysis,
    pair,
    flush,
    straightPotential,
    straightFlushPotential,
    straightGutshotExample,
    straightFlushGutshotExample,
    yes,
    no,
    verify,
    reset,
    noStraightPotential,
    noStraightFlushPossible,
  } = useBoardAnalysisTrainingI18n()
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
  const isCollapsed = ref(true)

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
        message: res.message as string,
      }
    } else if (state.hasStraight && !actualTexture.value.hasStraight) {
      state.straightMissingResult = {
        ok: false,
        message: noStraightPotential.value,
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
          message: noStraightFlushPossible.value,
        }
      } else {
        // ✅ 可能，才校验缺张
        const res = validateStraightFlushMissingInput(
          props.boardCards,
          state.straightFlushMissingInput
        )
        state.straightFlushMissingResult = {
          ok: res.ok,
          message: res.message as string,
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
  <div class="texture-panel chip-stage" :class="{ collapsed: isCollapsed }" ref="panelRef">
    <!-- Header -->
    <header class="panel-header" @mousedown="onDragStart">
      <span class="panel-title">{{ textureAnalysis }}</span>

      <el-icon class="collapse-toggle" @click.stop="isCollapsed = !isCollapsed">
        <ArrowRight v-if="isCollapsed" />
        <ArrowDown v-else />
      </el-icon>
    </header>

    <!-- Body -->
    <div v-show="!isCollapsed" class="panel-body">
      <!-- 基础判断 -->
      <div
        class="row"
        v-for="item in [
          { key: 'pair', label: pair, model: 'hasPair', result: 'pairResult' },
          { key: 'flush', label: flush, model: 'hasFlush', result: 'flushResult' },
          {
            key: 'straight',
            label: straightPotential,
            model: 'hasStraight',
            result: 'straightResult',
          },
        ]"
        :key="item.key"
      >
        <span class="row-label">{{ item.label }}</span>

        <el-radio-group v-model="state[item.model]" class="row-radio">
          <el-radio :label="true">{{ yes }}</el-radio>
          <el-radio :label="false">{{ no }}</el-radio>
        </el-radio-group>

        <span
          class="row-result"
          :class="{
            ok: state[item.result] === true,
            bad: state[item.result] === false,
            empty: state[item.result] === null,
          }"
        >
          {{ state[item.result] === true ? '✔' : state[item.result] === false ? '✖' : '' }}
        </span>
      </div>

      <!-- 同花顺 -->
      <div v-if="state.hasFlush && state.hasStraight" class="row">
        <span class="row-label">{{ straightFlushPotential }}</span>

        <el-radio-group v-model="state.hasStraightFlush" class="row-radio">
          <el-radio :label="true">{{ yes }}</el-radio>
          <el-radio :label="false">{{ no }}</el-radio>
        </el-radio-group>

        <span
          class="row-result"
          :class="{
            ok: state.straightFlushResult === true,
            bad: state.straightFlushResult === false,
            empty: state.straightFlushResult === null,
          }"
        >
          {{
            state.straightFlushResult === true
              ? '✔'
              : state.straightFlushResult === false
                ? '✖'
                : ''
          }}
        </span>
      </div>

      <!-- 顺子缺张 -->
      <div v-if="state.hasStraight" class="row vertical">
        <el-input
          v-model="state.straightMissingInput"
          type="textarea"
          :placeholder="straightGutshotExample"
        />
        <div
          v-if="state.straightMissingResult"
          class="hint"
          :class="state.straightMissingResult.ok ? 'ok' : 'bad'"
        >
          {{ state.straightMissingResult.message }}
        </div>
      </div>

      <!-- 同花顺缺张 -->
      <div
        v-if="state.hasFlush && state.hasStraight && state.hasStraightFlush"
        class="row vertical"
      >
        <el-input
          v-model="state.straightFlushMissingInput"
          type="textarea"
          :placeholder="straightFlushGutshotExample"
        />
        <div
          v-if="state.straightFlushMissingResult"
          class="hint"
          :class="state.straightFlushMissingResult.ok ? 'ok' : 'bad'"
        >
          {{ state.straightFlushMissingResult.message }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer v-show="!isCollapsed" class="panel-footer">
      <el-button size="small" type="primary" @click="validateAll">
        {{ verify }}
      </el-button>
      <el-button size="small" @click="resetAll">
        {{ reset }}
      </el-button>
    </footer>
  </div>
</template>

<style lang="css" scoped>
  .texture-panel {
    position: fixed;
    z-index: 100000;
    width: 320px;

    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);

    border-radius: 12px;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 12px 24px rgba(0, 0, 0, 0.08);

    font-size: var(--font-size-xs);
    transition: padding 0.15s ease;
  }

  /* ================= Header ================= */

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 10px 12px;
    font-size: var(--font-size-sm);
    cursor: move;
    user-select: none;
  }

  .panel-title {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .collapse-toggle {
    font-size: 18px;
    opacity: 0.6;
    cursor: pointer;
  }

  .collapse-toggle:hover {
    opacity: 1;
  }

  /* 收起态 */
  .texture-panel.collapsed .panel-header {
    padding: 8px 12px;
  }

  /* ================= Body ================= */

  .panel-body {
    padding: 8px 12px 10px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 30px;
  }

  .row + .row {
    margin-top: 4px;
  }

  .row-label {
    flex: 1;
    font-size: var(--font-size-xs);
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  .row-radio {
    display: flex;
    gap: 8px;
  }

  /* radio 字体统一 */
  .texture-panel .el-radio {
    font-size: var(--font-size-xs);
    line-height: 1;
  }

  /* ================= 结果位 ================= */

  .row-result {
    width: 20px;
    text-align: center;
  }

  .row-result.empty {
    visibility: hidden;
  }

  .row-result.ok {
    color: #16a34a;
  }

  .row-result.bad {
    color: #dc2626;
  }

  /* ================= vertical ================= */

  .row.vertical {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    margin-top: 8px;
  }

  /* textarea 提示 */
  .texture-panel textarea::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.9;
  }

  /* 结果提示 */
  .hint {
    font-size: var(--font-size-xs);
    line-height: 1.4;
  }

  .hint.ok {
    color: #16a34a;
  }

  .hint.bad {
    color: #dc2626;
  }

  /* ================= Footer ================= */

  .panel-footer {
    padding: 8px 12px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
