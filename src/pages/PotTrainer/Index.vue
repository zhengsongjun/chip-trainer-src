<script setup lang="ts">
  import { ref, onMounted, nextTick, computed } from 'vue'
  import bg from '@/assets/bg/poker table.png?url'
  import PotConfigBar from './components/PotConfigBar.vue'
  import ChipStack from '@/pages/ChipTrainer/components/ChipStack.vue'
  import Chip from '@/pages/ChipTrainer/components/Chip.vue'
  import DealerButton from './components/DealerButton.vue'

  /* =============================== 基础状态 =============================== */

  const playerCount = ref<number>(8)
  const stakes = ref<string>('1/2/5')

  // 背景图位置控制
  const backgroundPosition = ref({
    size: '125%',        // 背景图大小 (可以是百分比或 px)
    x: 'center',         // 水平位置 (可以是: left, center, right, 或百分比/px)
    y: '41%',            // 垂直位置 (可以是: top, center, bottom, 或百分比/px)
  })

  // 筹码整体缩放系数 (0-1之间，1表示原始大小，0.8表示缩小到80%)
  const chipScale = ref(0.90)

  // 筹码堆基础配置 (会被chipScale缩放)
  const chipStackConfig = ref({
    size: 48,           // 单个筹码大小
    spacing: 8,         // 筹码间距
  })

  // 计算实际的筹码配置（应用缩放）
  const actualChipConfig = computed(() => ({
    size: chipStackConfig.value.size * chipScale.value,
    spacing: chipStackConfig.value.spacing * chipScale.value,
  }))

  // 玩家位置控制（8个座位）- 和 BoardAnalysis 保持一致
  const playerPositions = ref([
    // Seat 1
    { bottom: '-2%', left: '22%' },
    // Seat 2
    { bottom: '15%', left: '10%' },
    // Seat 3
    { top: '17%', left: '8%' },
    // Seat 4
    { top: '-10%', left: '28%' },
    // Seat 5
    { top: '-10%', left: '65%' },
    // Seat 6
    { top: '11%', left: '85%' },
    // Seat 7
    { bottom: '20%', right: '18%' },
    // Seat 8
    { bottom: '-2%', right: '28%' },
  ])

  // 每个玩家的筹码堆位置配置（相对于player-area的坐标，单位px）
  // 每个座位的green、black、purple筹码堆都可以单独调整
  const playerChipPositions = ref([
    // Seat 1
    {
      green: { x: 0, y: 0 },
      black: { x: 50, y: 0 },
      purple: { x: 100, y: 80 }
    },
    // Seat 2
    {
      green: { x: 0, y: 5 },
      black: { x: 47, y: 15 },
      purple: { x: 96, y: 77 }
    },
    // Seat 3
    {
      green: { x: 5, y: 0 },
      black: { x: 53, y: 5 },
      purple: { x: 102, y: 85 }
    },
    // Seat 4
    {
      green: { x: 5, y: 0 },
      black: { x: 55, y: 0 },
      purple: { x: 35, y: 99 }
    },
    // Seat 5
    {
      green: { x: 0, y: 0 },
      black: { x: 48, y: 0 },
      purple: { x: 30, y: 100 }
    },
    // Seat 6
    {
      green: { x: 50, y: 0 },
      black: { x: 60, y: 35 },
      purple: { x: 10, y: 105 }
    },
    // Seat 7
    {
      green: { x: 109, y: 0 },
      black: { x: 90, y: 26 },
      purple: { x: 50, y: 80 }
    },
    // Seat 8
    {
      green: { x: 5, y: 0 },
      black: { x: 55, y: 0 },
      purple: { x: 104, y: 80 }
    },
  ])

  /* =============================== Dealer Button 锚点配置 =============================== */

  // 是否显示锚点（调试用）
  const showAnchors = ref(false)  // 改为 false，隐藏锚点

  // Dealer Button 当前锚点索引（0-7是玩家，8是托盘）
  const dealerAnchorIndex = ref(0)

  // Dealer Button 锚点位置（使用百分比，相对于board容器）
  // 0-7: 8个玩家座位的锚点
  // 8: 托盘锚点
  // 格式：{ x: '50%', y: '50%' } 或 { left: '50%', top: '50%' }
  const dealerAnchors = ref([
    // Seat 1
    { x: '30%', y: '63%' },
    // Seat 2
    { x: '22%', y: '60%' },
    // Seat 3
    { x: '21%', y: '41%' },
    // Seat 4
    { x: '31%', y: '33%' },
    // Seat 5
    { x: '69%', y: '33%' },
    // Seat 6
    { x: '80%', y: '41%' },
    // Seat 7
    { x: '80%', y: '57%' },
    // Seat 8
    { x: '72%', y: '65%' },
    // Tray (托盘) - 桌子中央
    { x: '50%', y: '80%' },
  ])

  // 计算锚点的实际像素位置（用于拖动计算）
  const boardElement = ref<HTMLElement | null>(null)

  const actualAnchorPositions = computed(() => {
    if (!boardElement.value) {
      // 如果board还没有挂载，返回一个默认值
      return dealerAnchors.value.map(anchor => ({
        x: parseFloat(anchor.x) * 8, // 假设board宽度800px
        y: parseFloat(anchor.y) * 6, // 假设board高度600px
      }))
    }

    const rect = boardElement.value.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    return dealerAnchors.value.map(anchor => ({
      x: parseFloat(anchor.x) / 100 * width,
      y: parseFloat(anchor.y) / 100 * height,
    }))
  })

  // 获取缩放后的筹码位置
  function getScaledPosition(pos: { x: number; y: number }) {
    return {
      left: `${pos.x * chipScale.value}px`,
      top: `${pos.y * chipScale.value}px`,
    }
  }

  /* =============================== 盲注逻辑 =============================== */

  // 计算小盲玩家索引（Dealer下一位，0-7）
  const smallBlindIndex = computed(() => {
    if (dealerAnchorIndex.value === 8) return -1 // 托盘位置，不给盲注
    return (dealerAnchorIndex.value + 1) % 8
  })

  // 计算大盲玩家索引（小盲下一位，0-7）
  const bigBlindIndex = computed(() => {
    if (dealerAnchorIndex.value === 8) return -1 // 托盘位置，不给盲注
    return (dealerAnchorIndex.value + 2) % 8
  })

  // 计算每个玩家的实际绿色筹码数量（扣除盲注）
  const actualGreenCounts = computed(() => {
    const counts = Array(8).fill(20) // 默认每人20个绿色筹码

    if (smallBlindIndex.value >= 0) {
      counts[smallBlindIndex.value] = 19 // 小盲 -1
    }

    if (bigBlindIndex.value >= 0) {
      counts[bigBlindIndex.value] = 18 // 大盲 -2
    }

    return counts
  })

  /* =============================== 生命周期 =============================== */

  const boardRef = ref<HTMLElement | null>(null)

  onMounted(async () => {
    await nextTick()
    boardRef.value = document.querySelector('.board')
    boardElement.value = boardRef.value
  })
</script>

<template>
  <div class="ui-page">
    <div class="ui-stage">
      <div class="ui-panel trainer-header">
        <h1 class="page-title">底池训练</h1>
      </div>

      <PotConfigBar
        @change-stakes="(value) => (stakes = value)"
        @change-player-count="(value) => (playerCount = value)"
      />

      <!-- 训练舞台 -->
      <div class="chip-stage board" ref="boardRef" :style="{
        backgroundImage: `url(${bg})`,
        backgroundSize: backgroundPosition.size,
        backgroundPosition: `${backgroundPosition.x} ${backgroundPosition.y}`
      }">
        <div class="board-overlay">
          <!-- 玩家筹码 -->
          <div
            v-for="seat in playerCount"
            :key="seat"
            class="player-area"
            :style="playerPositions[seat - 1]"
          >
            <div class="player-chips">
              <!-- Green cheque stack (20个，扣除盲注后的数量) -->
              <div
                class="chip-stack-item"
                :style="getScaledPosition(playerChipPositions[seat - 1].green)"
              >
                <ChipStack
                  color="green25"
                  :count="actualGreenCounts[seat - 1]"
                  :size="actualChipConfig.size"
                  :spacing="actualChipConfig.spacing"
                />
              </div>

              <!-- Black cheque stack (20个) -->
              <div
                class="chip-stack-item"
                :style="getScaledPosition(playerChipPositions[seat - 1].black)"
              >
                <ChipStack
                  color="black100"
                  :count="20"
                  :size="actualChipConfig.size"
                  :spacing="actualChipConfig.spacing"
                />
              </div>

              <!-- Purple cheque half stack (10个) -->
              <div
                class="chip-stack-item"
                :style="getScaledPosition(playerChipPositions[seat - 1].purple)"
              >
                <ChipStack
                  color="purple500"
                  :count="10"
                  :size="actualChipConfig.size"
                  :spacing="actualChipConfig.spacing"
                />
              </div>
            </div>
          </div>

          <!-- 小盲筹码（1个绿色筹码） -->
          <div
            v-if="smallBlindIndex >= 0 && smallBlindIndex < playerCount"
            class="blind-chip small-blind"
            :style="{
              left: dealerAnchors[smallBlindIndex].x,
              top: dealerAnchors[smallBlindIndex].y,
            }"
          >
            <Chip color="green25" angle="ang1" :size="actualChipConfig.size" />
          </div>

          <!-- 大盲筹码（2个绿色筹码，错开放置） -->
          <div
            v-if="bigBlindIndex >= 0 && bigBlindIndex < playerCount"
            class="blind-chips big-blind"
            :style="{
              left: dealerAnchors[bigBlindIndex].x,
              top: dealerAnchors[bigBlindIndex].y,
            }"
          >
            <!-- 第一个筹码 -->
            <div class="blind-chip-item" :style="{ left: '0px', top: '0px' }">
              <Chip color="green25" angle="ang1" :size="actualChipConfig.size" />
            </div>
            <!-- 第二个筹码，错开一点 -->
            <div class="blind-chip-item" :style="{ left: `${actualChipConfig.size * 0.3}px`, top: `${actualChipConfig.size * 0.15}px` }">
              <Chip color="green25" angle="ang2" :size="actualChipConfig.size" />
            </div>
          </div>

          <!-- Dealer Button 锚点（调试用） -->
          <div
            v-if="showAnchors"
            v-for="(anchor, index) in dealerAnchors"
            :key="`anchor-${index}`"
            class="dealer-anchor"
            :style="{
              left: anchor.x,
              top: anchor.y,
            }"
          >
            <div class="anchor-label">{{ index === 8 ? 'Tray' : `S${index + 1}` }}</div>
          </div>

          <!-- Dealer Button -->
          <DealerButton
            :anchors="actualAnchorPositions"
            :current-anchor-index="dealerAnchorIndex"
            @update:currentAnchorIndex="dealerAnchorIndex = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* ===============================
 牌桌
 =============================== */

  .board {
    position: relative;
    height: 600px;
    margin-top: 16px;
    background-repeat: no-repeat;
  }

  .board-overlay {
    position: absolute;
    inset: 0;
  }

  /* ===============================
 玩家筹码
 =============================== */

  .player-area {
    position: absolute;
  }

  .player-chips {
    position: relative;
    height: 250px;  /* 增加高度以容纳更高的筹码堆 */
  }

  .chip-stack-item {
    position: absolute;
  }

  /* ===============================
 盲注筹码
 =============================== */

  .blind-chip,
  .blind-chips {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 900;
  }

  .blind-chips {
    position: absolute;
  }

  .blind-chip-item {
    position: absolute;
  }

  /* ===============================
 Dealer Button 锚点（调试用）
 =============================== */

  .dealer-anchor {
    position: absolute;
    width: 16px;
    height: 16px;
    background: lime;
    border: 2px solid darkgreen;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 999;
    pointer-events: none;
    box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.3);
  }

  .anchor-label {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: darkgreen;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    white-space: nowrap;
  }
</style>
