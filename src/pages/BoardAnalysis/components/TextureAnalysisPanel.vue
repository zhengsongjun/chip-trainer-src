<script setup lang="ts">
  import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
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
    enabled?: boolean
  }>()

  const isEnabled = computed(() => props.enabled ?? true)

  /* ===============================
   State（⚠️ 不自动验证）
  =============================== */

  const panelRef = ref<HTMLElement | null>(null)
  const isCollapsed = ref(true)

  // 检测是否为移动端
  const isMobile = ref(false)

  function checkIsMobile() {
    isMobile.value = window.matchMedia('(max-width: 1024px)').matches
  }

  onMounted(() => {
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkIsMobile)
  })

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
   拖拽（fixed + viewport）- 仅桌面端
  =============================== */

  let offsetX = 0
  let offsetY = 0
  let dragging = false

  function onDragStart(e: MouseEvent) {
    // 移动端禁用拖拽
    if (isMobile.value) return
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
   初始定位（父级右上）- 仅桌面端
  =============================== */

  onMounted(async () => {
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    // 移动端不需要定位
    if (isMobile.value) return

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
   监听 enabled 状态变化，禁用时重置
  =============================== */

  watch(isEnabled, (newEnabled) => {
    if (!newEnabled) {
      resetAll()
    }
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
  <!-- 移动端：底部抽屉 + 遮罩 -->
  <div v-if="isMobile" class="mobile-texture-wrapper">
    <!-- 遮罩层 -->
    <div
      v-show="!isCollapsed"
      class="mobile-overlay"
      @click="isCollapsed = true"
    ></div>

    <!-- 底部抽屉 -->
    <div class="mobile-drawer" :class="{ 'drawer-open': !isCollapsed, disabled: !isEnabled }">
      <!-- 拖动手柄 -->
      <div class="drawer-handle" @click="isCollapsed = !isCollapsed">
        <div class="handle-bar"></div>
        <span class="drawer-title">{{ textureAnalysis }}</span>
      </div>

      <!-- 抽屉内容 -->
      <div v-show="!isCollapsed" class="drawer-content">
        <!-- 禁用提示 -->
        <div v-if="!isEnabled" class="disabled-hint">
          Texture analysis is only available for Hold'em, Omaha, and Big O
        </div>

        <!-- 基础判断 -->
        <div
          v-else
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
        <div v-if="isEnabled && state.hasFlush && state.hasStraight" class="row">
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
        <div v-if="isEnabled && state.hasStraight" class="row vertical">
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
          v-if="isEnabled && state.hasFlush && state.hasStraight && state.hasStraightFlush"
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

        <!-- Footer -->
        <div class="drawer-footer">
          <el-button size="small" type="primary" @click="validateAll" :disabled="!isEnabled">
            {{ verify }}
          </el-button>
          <el-button size="small" @click="resetAll" :disabled="!isEnabled">
            {{ reset }}
          </el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- 桌面端：原有浮动面板 -->
  <div v-else class="texture-panel chip-stage" :class="{ collapsed: isCollapsed, disabled: !isEnabled }" ref="panelRef">
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
      <!-- 禁用提示 -->
      <div v-if="!isEnabled" class="disabled-hint">
        Texture analysis is only available for Hold'em, Omaha, and Big O
      </div>

      <!-- 基础判断 -->
      <div
        v-else
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
      <div v-if="isEnabled && state.hasFlush && state.hasStraight" class="row">
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
      <div v-if="isEnabled && state.hasStraight" class="row vertical">
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
        v-if="isEnabled && state.hasFlush && state.hasStraight && state.hasStraightFlush"
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
      <el-button size="small" type="primary" @click="validateAll" :disabled="!isEnabled">
        {{ verify }}
      </el-button>
      <el-button size="small" @click="resetAll" :disabled="!isEnabled">
        {{ reset }}
      </el-button>
    </footer>
  </div>
</template>

<style lang="css" scoped>
  /* ===============================
   移动端底部抽屉
  =============================== */

  .mobile-texture-wrapper {
    display: contents;
  }

  /* 遮罩层 */
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999; /* 在抽屉下方 */
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* 底部抽屉 */
  .mobile-drawer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
    z-index: 10000; /* 降低 z-index，不遮挡侧边栏按钮 */
    max-height: 70vh;
    /* 默认显示手柄（手柄高度约 68px），并向右偏移留出左侧空间 */
    transform: translateY(calc(100% - 68px));
    transition: transform 0.3s ease, left 0.3s ease;
    /* 左侧留出 70px 给侧边栏按钮 */
    left: 70px;
  }

  .mobile-drawer.drawer-open {
    transform: translateY(0);
    left: 0; /* 展开时占满全宽 */
  }

  /* 拖动手柄 */
  .drawer-handle {
    padding: 12px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    background: #fff;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  }

  .handle-bar {
    width: 36px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
  }

  .drawer-title {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  /* 抽屉内容 */
  .drawer-content {
    padding: 0 20px 24px;
    max-height: calc(70vh - 68px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 禁用状态 - 手柄依然可用 */
  .mobile-drawer.disabled .drawer-handle {
    pointer-events: auto;
    cursor: pointer;
  }

  .mobile-drawer.disabled .drawer-content {
    pointer-events: none;
  }

  .drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  /* ===============================
   桌面端浮动面板
  =============================== */

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
    pointer-events: auto; /* 始终可点击 */
  }

  .collapse-toggle:hover {
    opacity: 1;
  }

  /* 收起态 */
  .texture-panel.collapsed .panel-header {
    padding: 8px 12px;
  }

  /* ================= Disabled 状态 ================= */

  .texture-panel.disabled {
    opacity: 0.6;
  }

  /* 禁用时，body 和 footer 不可交互 */
  .texture-panel.disabled .panel-body,
  .texture-panel.disabled .panel-footer {
    pointer-events: none;
  }

  /* 但 header 仍然可以拖拽 */
  .texture-panel.disabled .panel-header {
    cursor: move; /* 保持可拖拽 */
    pointer-events: auto; /* 允许交互 */
  }

  .disabled-hint {
    padding: 12px;
    background: #f5f5f5;
    border-radius: 6px;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    text-align: center;
    line-height: 1.5;
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
