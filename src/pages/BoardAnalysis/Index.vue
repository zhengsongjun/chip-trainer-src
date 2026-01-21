<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import bg from '@/assets/bg/pokertablewithplayers.svg?url'

  import BoardConfigBar from './components/BoardConfigBar.vue'
  import CardFace from '@/components/cards/CardFace.vue'
  import CardStack from '@/components/cards/CardStack.vue'
  import HighChip from '@/components/HighChip.vue'

  /* ===============================
   基础状态
   =============================== */

  /** 玩家数量（2-8） */
  const playerCount = ref<number>(2)

  /** 公共牌 */
  const boardCards = ref<string[]>([])

  /** 玩家手牌：seatId -> 4 张 */
  const playerHands = ref<Record<number, string[]>>({})

  /* ===============================
   牌池 & 工具函数
   =============================== */

  const suits = ['s', 'h', 'd', 'c']
  const ranks = ['a', 'k', 'q', 'j', '10', '9', '8', '7', '6', '5', '4', '3', '2']

  const fullDeck = suits.flatMap((s) => ranks.map((r) => `${r}${s}`))

  function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5)
  }

  /* ===============================
   发牌逻辑
   =============================== */

  function dealNewHand() {
    const deck = shuffle(fullDeck)

    // 公共牌 5 张
    boardCards.value = deck.splice(0, 5)

    // 玩家手牌
    const hands: Record<number, string[]> = {}

    for (let seat = 1; seat <= playerCount.value; seat++) {
      hands[seat] = deck.splice(0, 4)
    }

    playerHands.value = hands
  }

  /* ===============================
   行为
   =============================== */

  function checkAnswer() {
    console.log('submit', {
      board: boardCards.value,
      hands: playerHands.value,
    })
  }

  function handleNext() {
    dealNewHand()
  }

  /* ===============================
   生命周期 & 响应配置
   =============================== */

  onMounted(() => {
    dealNewHand()
  })

  watch(playerCount, () => {
    dealNewHand()
  })
</script>

<template>
  <div class="ui-page">
    <div class="ui-stage">
      <div class="ui-panel trainer-header">
        <h1 class="page-title">牌面分析训练</h1>
      </div>

      <!-- 配置条 -->
      <BoardConfigBar
        @change-player-count="(n) => (playerCount = n)"
        @submit="checkAnswer"
        @next="handleNext"
      />

      <!-- 训练舞台 -->
      <div class="chip-stage board" :style="{ backgroundImage: `url(${bg})` }">
        <div class="board-overlay">
          <!-- 公共牌 -->
          <div class="community-cards">
            <CardFace v-for="(card, i) in boardCards" :key="i" :card="card" :scale="0.75" />
          </div>

          <!-- 牌堆 -->
          <div class="deck">
            <CardStack :count="16" :scale="0.7" />
          </div>

          <!-- 玩家区域 -->
          <div v-for="seat in playerCount" :key="seat" class="player-area" :class="`seat-${seat}`">
            <div class="player-hand">
              <div
                v-for="(card, i) in playerHands[seat]"
                :key="i"
                class="hand-card"
                :style="{ left: `${i * 18}px`, zIndex: i }"
              >
                <CardFace :card="card" :scale="0.6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <HighChip />
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
    background-size: 120% auto;
    background-position: center 42%;
  }

  .board-overlay {
    position: absolute;
    inset: 0;
  }

  /* ===============================
   公共牌 & 牌堆
   =============================== */

  .community-cards {
    position: absolute;
    top: 42%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
  }

  .deck {
    position: absolute;
    top: 60%;
    left: 52%;
    transform: translateX(-50%);
  }

  /* ===============================
   玩家区域
   =============================== */

  .player-area {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .player-hand {
    position: relative;
    height: 90px; /* 给叠牌一个稳定高度 */
  }

  /* 单张手牌 */
  .hand-card {
    position: absolute;
    top: 0;
  }

  /* ===============================
   八个座位定位
   =============================== */

  .seat-1 {
    bottom: 20%;
    left: 22%;
    transform: translateX(-50%);
  }
  .seat-2 {
    bottom: 37%;
    left: 13%;
    transform: rotateZ(40deg);
  }
  .seat-3 {
    top: 18%;
    left: 20%;
    transform: rotateZ(124deg);
  }
  .seat-4 {
    top: 11%;
    left: 30%;
  }
  .seat-5 {
    top: 11%;
    left: 62%;
  }
  .seat-6 {
    top: 14%;
    left: 80%;
    transform: rotateZ(45deg);
  }
  .seat-7 {
    top: 62%;
    right: 18%;
    transform: rotateZ(-62deg);
  }
  .seat-8 {
    bottom: 20%;
    right: 30%;
  }
</style>
