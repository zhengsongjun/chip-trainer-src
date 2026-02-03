<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import CardFace from '@/components/cards/CardFace.vue'
  import CardBack from '@/components/cards/CardBack.vue'
  import CardStackNew from '@/components/cards/CardStackNew.vue'
  import HandContextMenu from './HandContextMenu.vue'
  import bg from '@/assets/bg/poker table.png?url'

  /* ================= Types ================= */

  export type GameMode = 'holdem' | 'omaha' | 'bigo' | '7stud' | 'razz' | 'badugi'
  export type GameType = 'high' | 'high-low' | 'a5-low' | '2-7-low' | 'badugi'
  export type HandStatus = 'none' | 'high' | 'low' | 'both' | 'kill'
  export type PokerBoardChangePayload = Record<number, HandStatus>

  /* ================= Props ================= */

  const props = defineProps<{
    activeSeats: number[]
    playerHands: Record<number, string[]>
    playerStudCards?: Record<number, string[]>
    boardCards: string[]
    gameMode: GameMode
    gameType: GameType
  }>()

  /* ================= Emits ================= */

  const emit = defineEmits<{
    (e: 'change', value: PokerBoardChangePayload): void
  }>()

  /* ================= Background ================= */

  const backgroundPosition = {
    size: '125%',
    x: 'center',
    y: '41%',
  }

  /* ================= Core State ================= */

  const handStatuses = ref<Record<number, HandStatus>>({})

  const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    seat: 0,
  })

  /* ================= Layout ================= */

  const cardSpacing = 88

  const communityCardsPosition = {
    top: '38%',
    left: '46%',
    width: 260,
  }

  const playerPositions = [
    { bottom: '15%', left: '22%', transform: 'rotateZ(0deg)' },
    { bottom: '35%', left: '10%', transform: 'rotateZ(50deg)' },
    { top: '17%', left: '20%', transform: 'rotateZ(124deg)' },
    { top: '10%', left: '28%', transform: 'rotateZ(0deg)' },
    { top: '10%', left: '62%', transform: 'rotateZ(0deg)' },
    { top: '11%', left: '85%', transform: 'rotateZ(45deg)' },
    { bottom: '20%', right: '18%', transform: 'rotateZ(-63deg)' },
    { bottom: '18%', right: '34%', transform: 'rotateZ(0deg)' },
  ]

  /* ================= Stud Config ================= */

  const studCardsConfig: Record<number, any> = {
    1: { rotation: 0, startLeft: 60, startTop: -60, offsetX: 15, offsetY: -15 },
    3: { rotation: 0, startLeft: 60, startTop: -100, offsetX: 15, offsetY: -15 },
    4: { rotation: 0, startLeft: 20, startTop: 50, offsetX: 15, offsetY: 15 },
    5: { rotation: 0, startLeft: 20, startTop: 50, offsetX: 15, offsetY: 15 },
    6: { rotation: 0, startLeft: 20, startTop: 50, offsetX: 25, offsetY: 25 },
    8: { rotation: 0, startLeft: -85, startTop: -90, offsetX: -20, offsetY: -20 },
  }

  function getStudConfig(seat: number) {
    return studCardsConfig[seat] ?? studCardsConfig[1]
  }

  function getStudOffset(seat: number, i: number) {
    const c = getStudConfig(seat)
    return { top: `${i * c.offsetY}px`, left: `${i * c.offsetX}px` }
  }

  function getStudContainerStyle(seat: number) {
    const c = getStudConfig(seat)
    return { left: `${c.startLeft}px`, top: `${c.startTop}px` }
  }

  /* ================= Derived ================= */

  const activeHighSeatSet = computed(() => {
    const s = new Set<number>()
    Object.entries(handStatuses.value).forEach(([seat, v]) => {
      if (v === 'high' || v === 'both') s.add(Number(seat) - 1)
    })
    return s
  })

  const activeLowSeatSet = computed(() => {
    const s = new Set<number>()
    Object.entries(handStatuses.value).forEach(([seat, v]) => {
      if (v === 'low' || v === 'both') s.add(Number(seat) - 1)
    })
    return s
  })

  const hasSelection = computed(() =>
    Object.values(handStatuses.value).some((v) => v !== 'none' && v !== 'kill')
  )

  /* ================= Helpers ================= */

  function emitChange() {
    emit('change', { ...handStatuses.value })
  }

  function onHandClick(seat: number, e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    contextMenu.value = {
      visible: true,
      x: e.clientX,
      y: e.clientY,
      seat,
    }
  }

  function closeMenu() {
    contextMenu.value.visible = false
  }

  /* ================= Menu Actions ================= */
  watch(
    () => props.boardCards,
    () => {
      console.log(handStatuses.value)
      Object.keys(handStatuses.value).forEach((key) => delete handStatuses.value[key])
    }
  )

  function markAsHigh() {
    const s = contextMenu.value.seat
    const cur = handStatuses.value[s] ?? 'none'
    handStatuses.value[s] = cur === 'low' ? 'both' : cur === 'both' ? 'low' : 'high'
    closeMenu()
    emitChange()
  }

  function markAsLow() {
    const s = contextMenu.value.seat
    const cur = handStatuses.value[s] ?? 'none'
    handStatuses.value[s] = cur === 'high' ? 'both' : cur === 'both' ? 'high' : 'low'
    closeMenu()
    emitChange()
  }

  function markAsKill() {
    handStatuses.value[contextMenu.value.seat] = 'kill'
    closeMenu()
    emitChange()
  }

  function clearHandStatus() {
    handStatuses.value[contextMenu.value.seat] = 'none'
    closeMenu()
    emitChange()
  }

  /* ================= Lifecycle ================= */

  onMounted(() => {
    document.addEventListener('click', () => {
      if (contextMenu.value.visible) closeMenu()
    })
  })
</script>

<template>
  <div
    class="chip-stage board"
    :style="{
      backgroundImage: `url(${bg})`,
      backgroundSize: backgroundPosition.size,
      backgroundPosition: `${backgroundPosition.x} ${backgroundPosition.y}`,
    }"
  >
    <div class="board-overlay">
      <!-- 公共牌 -->
      <div
        v-if="gameMode !== '7stud' && gameMode !== 'razz' && gameMode !== 'badugi'"
        class="community-cards-group"
        :style="{
          top: communityCardsPosition.top,
          left: communityCardsPosition.left,
          width: `${communityCardsPosition.width}px`,
        }"
      >
        <div
          v-for="(card, i) in boardCards"
          :key="i"
          class="community-card"
          :style="{ left: `${i * cardSpacing}px`, zIndex: i }"
        >
          <CardFace :card="card" />
        </div>
      </div>

      <!-- 牌堆 -->
      <div class="deck">
        <CardStackNew :count="15" :scale="0.85" />
      </div>

      <!-- 玩家 -->
      <div
        v-for="seat in activeSeats"
        :key="seat"
        class="player-area"
        :style="playerPositions[seat - 1]"
        @click="onHandClick(seat, $event)"
      >
        <div class="player-hand">
          <!-- Kill -->
          <template v-if="handStatuses[seat] === 'kill'">
            <div
              v-for="(_, i) in playerHands[seat]"
              :key="i"
              class="hand-card dim-card"
              :style="{ left: `${i * 18}px` }"
            >
              <CardBack />
            </div>
          </template>

          <!-- Normal -->
          <template v-else>
            <div
              v-for="(card, i) in playerHands[seat]"
              :key="i"
              class="hand-card"
              :style="{ left: `${i * 18}px` }"
            >
              <CardFace
                :card="card"
                :active="activeHighSeatSet.has(seat - 1)"
                :activeLow="activeLowSeatSet.has(seat - 1)"
                :has-selection="handStatuses[seat] !== 'none' && hasSelection"
              />
            </div>

            <!-- Stud -->
            <div
              v-if="(gameMode === '7stud' || gameMode === 'razz') && playerStudCards?.[seat]"
              class="stud-cards-container"
              :style="getStudContainerStyle(seat)"
            >
              <div
                v-for="(card, i) in playerStudCards[seat]"
                :key="i"
                class="stud-card"
                :style="{ ...getStudOffset(seat, i), zIndex: 100 + i }"
              >
                <CardFace :card="card" />
              </div>
            </div>
          </template>
          <!-- Both 状态显示两个 Mini Chips -->
          <div v-if="handStatuses[seat] === 'both'" class="both-chips">
            <div class="mini-chip high-mini-chip">HIGH</div>
            <div class="mini-chip low-mini-chip">LOW</div>
          </div>

          <!-- High 状态显示 High Chip -->
          <div v-if="handStatuses[seat] === 'high'" class="single-chip">
            <div class="mini-chip high-mini-chip">HIGH</div>
          </div>

          <!-- Low 状态显示 Low Chip -->
          <div v-if="handStatuses[seat] === 'low'" class="single-chip">
            <div class="mini-chip low-mini-chip">LOW</div>
          </div>
        </div>
      </div>
      <HandContextMenu
        :visible="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :seat="contextMenu.seat"
        :game-type="gameType"
        :game-mode="gameMode"
        @mark-high="markAsHigh"
        @mark-low="markAsLow"
        @mark-kill="markAsKill"
        @clear="clearHandStatus"
      />
    </div>
  </div>
</template>

<style scoped>
  /* === 和你原页面 CSS 100% 对齐 === */
  .board {
    width: 100%;
    position: relative;
    height: 600px;
    margin-top: 16px;
    background-repeat: no-repeat;
  }

  .board-overlay {
    position: absolute;
    inset: 0;
  }

  .community-cards-group {
    position: absolute;
    transform: translateX(-50%);
    height: 100px;
  }

  .community-card {
    position: absolute;
    top: 0;
  }

  .deck {
    position: absolute;
    bottom: 67px;
    left: 35%;
    transform: translateX(-50%) scale(0.85);
  }

  .player-area {
    position: absolute;
    cursor: pointer;
  }

  .player-hand {
    position: relative;
    height: 90px;
  }

  .hand-card {
    position: absolute;
    top: 0;
  }

  .stud-cards-container {
    position: absolute;
    top: 0;
  }

  .stud-card {
    position: absolute;
  }

  .dim-card {
    filter: brightness(0.5) saturate(0.7);
  }

  /* ===============================
 Mini Chips（High / Low / Both）
 =============================== */

  .both-chips {
    position: absolute;
    top: -12px;
    right: -12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 1001;
  }

  .single-chip {
    position: absolute;
    top: -12px;
    right: -12px;
    z-index: 1001;
  }

  .mini-chip {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    font-family: 'Segoe UI', 'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif;
    color: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .high-mini-chip {
    background: #d32f2f;
  }

  .low-mini-chip {
    background: #1976d2;
  }
</style>
