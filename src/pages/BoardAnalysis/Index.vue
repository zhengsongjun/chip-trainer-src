<script setup lang="ts">
  import { ref, onMounted, watch, nextTick, computed } from 'vue'
  import bg from '@/assets/bg/poker table.png?url'
  import { ElMessage } from 'element-plus'
  import { Hand } from 'pokersolver'
  import BoardConfigBar from './components/BoardConfigBar.vue'
  import CardFace from '@/components/cards/CardFace.vue'
  import CardBack from '@/components/cards/CardBack.vue'
  import CardStackNew from '@/components/cards/CardStackNew.vue'
  import TextureAnalysisPanel from './components/TextureAnalysisPanel.vue'
  import HandContextMenu from './components/HandContextMenu.vue'
  import Fireworks from '@/components/Fireworks.vue'
  import useBoardAnalysisTrainingI18n from '@/i18n/customHook/useBoardAnalysis'

  const { pageTitle, markHigh, markLow, kill, close } = useBoardAnalysisTrainingI18n()

  /* =============================== 基础状态 =============================== */

  const showFireworks = ref(false)
  const playerCount = ref<number>(2)
  const gameMode = ref<'holdem' | 'omaha' | 'bigo' | '7stud'>('omaha')

  const boardCards = ref<string[]>([])
  const playerHands = ref<Record<number, string[]>>({})
  // 7 Card Stud 专用：每个玩家的 4 张明牌
  const playerStudCards = ref<Record<number, string[]>>({})

  // 公共牌间距控制
  const cardSpacing = ref<number>(88) // 默认 46px 间距

  // 7 Card Stud 明牌配置 - 每个座位独立配置
  const studCardsConfig = ref({
    1: {
      rotation: 0,      // 旋转角度（单位：度）
      startLeft: 60,     // 相对hole cards的水平位置（单位：px）
      startTop: -60,      // 相对hole cards的垂直位置（单位：px）
      offsetX: 15,       // 每张牌的水平叠加偏移（单位：px）
      offsetY: -15,      // 每张牌的垂直叠加偏移（单位：px，负数向上）
    },
    2: {
      rotation: -8,
      startLeft: 20,
      startTop: 60,
      offsetX: 15,
      offsetY: -15,
    },
    3: {
      rotation: 0,
      startLeft: 60,
      startTop: -100,
      offsetX: -15,
      offsetY: -15,       // 正数向下
    },
    4: {
      rotation: 0,
      startLeft: 20,
      startTop: 30,
      offsetX: 15,
      offsetY: 15,
    },
    5: {
      rotation: 0,
      startLeft: 20,
      startTop: 0,
      offsetX: 25,
      offsetY: 25,
    },
    6: {
      rotation: -8,
      startLeft: 20,
      startTop: 0,
      offsetX: 25,
      offsetY: 25,
    },
    7: {
      rotation: -8,
      startLeft: 20,
      startTop: 60,
      offsetX: 25,
      offsetY: -25,
    },
    8: {
      rotation: 0,
      startLeft: -80,
      startTop: -90,
      offsetX: -20,
      offsetY: -20,
    },
  })

  // 背景图位置控制
  const backgroundPosition = ref({
    size: '125%',        // 背景图大小 (可以是百分比或 px)
    x: 'center',         // 水平位置 (可以是: left, center, right, 或百分比/px)
    y: '41%',            // 垂直位置 (可以是: top, center, bottom, 或百分比/px)
  })

  // 公共牌位置控制
  const communityCardsPosition = ref({
    top: '38%',      // 距离顶部的位置
    left: '46%',     // 距离左侧的位置
    width: 260,      // 容器宽度（单位：px）
  })
  const activeSeats = ref<number[]>([])

  function pickRandomSeats(count: number): number[] {
    const allSeats = [1, 2, 3, 4, 5, 6, 7, 8]
    return shuffle(allSeats)
      .slice(0, count)
      .sort((a, b) => a - b)
  }

  // 玩家位置控制（8个座位）
  const playerPositions = ref([
    // Seat 1
    { bottom: '15%', left: '22%', transform: 'rotateZ(0deg)' },
    // Seat 2
    { bottom: '35%', left: '10%', transform: 'rotateZ(50deg)' },
    // Seat 3
    { top: '17%', left: '20%', transform: 'rotateZ(124deg)' },
    // Seat 4
    { top: '10%', left: '28%', transform: 'rotateZ(0deg)' },
    // Seat 5
    { top: '10%', left: '62%', transform: 'rotateZ(0deg)' },
    // Seat 6
    { top: '11%', left: '85%', transform: 'rotateZ(45deg)' },
    // Seat 7
    { bottom: '20%', right: '18%', transform: 'rotateZ(-63deg)' },
    // Seat 8
    { bottom: '18%', right: '34%', transform: 'rotateZ(0deg)' },
  ])

  /* =============================== 手牌状态管理 =============================== */

  type HandStatus = 'none' | 'high' | 'low' | 'both' | 'kill'

  // 每个座位的手牌状态
  const handStatuses = ref<Record<number, HandStatus>>({})

  // 获取 Stud 牌的配置（位置、角度、叠加方向）
  function getStudCardConfig(seat: number) {
    return studCardsConfig.value[seat as keyof typeof studCardsConfig.value] || studCardsConfig.value[1]
  }

  // 计算 Stud 牌的偏移
  function getStudCardOffset(seat: number, index: number) {
    const config = getStudCardConfig(seat)
    return {
      top: index * config.offsetY,
      left: index * config.offsetX,
    }
  }

  // 获取 Stud 牌容器的起始位置
  function getStudCardContainerStyle(seat: number) {
    const config = getStudCardConfig(seat)
    return {
      left: `${config.startLeft}px`,
      top: `${config.startTop}px`,
    }
  }

  // 获取 Stud 牌的旋转角度
  function getStudCardRotation(seat: number) {
    const config = getStudCardConfig(seat)
    return config.rotation
  }

  // 右键菜单状态
  const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    seat: 0,
  })

  // 游戏类型：High 或 High Low
  const gameType = ref<'high' | 'high-low'>('high')

  /* =============================== 结果弹窗 =============================== */

  const showResult = ref(false)
  const resultMessage = ref('')

  /* =============================== 派生状态 =============================== */

  const activeHighSeatSet = computed(() => {
    const set = new Set<number>()
    Object.entries(handStatuses.value).forEach(([seat, status]) => {
      if (status === 'high' || status === 'both') {
        set.add(Number(seat) - 1)
      }
    })
    return set
  })

  const activeLowSeatSet = computed(() => {
    const set = new Set<number>()
    Object.entries(handStatuses.value).forEach(([seat, status]) => {
      if (status === 'low' || status === 'both') {
        set.add(Number(seat) - 1)
      }
    })
    return set
  })

  const hasSelection = computed(() => {
    return Object.values(handStatuses.value).some(
      (status) => status !== 'none' && status !== 'kill'
    )
  })

  /** ✅ 多选：你选择的所有 High 玩家 */
  const selectedHighSeats = computed<number[]>(() => {
    return Object.entries(handStatuses.value)
      .filter(([_, status]) => status === 'high' || status === 'both')
      .map(([seat]) => Number(seat))
      .sort((a, b) => a - b)
  })

  /** ✅ 多选：你选择的所有 Low 玩家 */
  const selectedLowSeats = computed<number[]>(() => {
    return Object.entries(handStatuses.value)
      .filter(([_, status]) => status === 'low' || status === 'both')
      .map(([seat]) => Number(seat))
      .sort((a, b) => a - b)
  })

  /* =============================== solver 适配 =============================== */

  function toSolverCard(card: string): string {
    const suit = card.slice(-1)
    const rawRank = card.slice(0, -1)

    const rankMap: Record<string, string> = {
      a: 'A',
      k: 'K',
      q: 'Q',
      j: 'J',
      '10': 'T',
      '9': '9',
      '8': '8',
      '7': '7',
      '6': '6',
      '5': '5',
      '4': '4',
      '3': '3',
      '2': '2',
    }

    return rankMap[rawRank] + suit
  }

  /* =============================== 发牌 =============================== */

  const suits = ['s', 'h', 'd', 'c']
  const ranks = ['a', 'k', 'q', 'j', '10', '9', '8', '7', '6', '5', '4', '3', '2']
  const fullDeck = suits.flatMap((s) => ranks.map((r) => `${r}${s}`))

  function shuffle<T>(arr: T[]) {
    return [...arr].sort(() => Math.random() - 0.5)
  }

  function dealNewHand() {
    const deck = shuffle(fullDeck)

    // 🎯 随机选座位
    activeSeats.value = pickRandomSeats(playerCount.value)

    const hands: Record<number, string[]> = {}
    const studCards: Record<number, string[]> = {}
    const statuses: Record<number, HandStatus> = {}

    if (gameMode.value === '7stud') {
      // 7 Card Stud: 不需要公共牌
      boardCards.value = []

      for (const seat of activeSeats.value) {
        // 每人 3 张 hole cards + 4 张 stud cards
        hands[seat] = deck.splice(0, 3)
        studCards[seat] = deck.splice(0, 4)
        statuses[seat] = 'none'
      }
      playerStudCards.value = studCards
    } else {
      // Hold'em / Omaha / Big O: 有公共牌
      boardCards.value = deck.splice(0, 5)

      const cardsPerPlayer = gameMode.value === 'holdem' ? 2 : gameMode.value === 'omaha' ? 4 : 5

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, cardsPerPlayer)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    }

    playerHands.value = hands
    handStatuses.value = statuses
  }

  function handleNextQuestion() {
    showResult.value = false
    dealNewHand()
  }

  /* =============================== 手牌点击和菜单 =============================== */

  const boardRef = ref<HTMLElement | null>(null)

  // 点击手牌显示菜单
  function onHandClick(seat: number, e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation() // 阻止事件冒泡到 document
    contextMenu.value = {
      visible: true,
      x: e.clientX,
      y: e.clientY,
      seat,
    }
  }

  // 关闭菜单
  function closeContextMenu() {
    contextMenu.value.visible = false
  }

  // 标记为 High
  function markAsHigh() {
    const seat = contextMenu.value.seat
    const currentStatus = handStatuses.value[seat]

    if (currentStatus === 'low') {
      handStatuses.value[seat] = 'both'
    } else if (currentStatus === 'both') {
      handStatuses.value[seat] = 'low'
    } else {
      handStatuses.value[seat] = 'high'
    }

    closeContextMenu()
  }

  // 标记为 Low
  function markAsLow() {
    const seat = contextMenu.value.seat
    const currentStatus = handStatuses.value[seat]

    if (currentStatus === 'high') {
      handStatuses.value[seat] = 'both'
    } else if (currentStatus === 'both') {
      handStatuses.value[seat] = 'high'
    } else {
      handStatuses.value[seat] = 'low'
    }

    closeContextMenu()
  }

  // 标记为 Kill
  function markAsKill() {
    const seat = contextMenu.value.seat
    handStatuses.value[seat] = 'kill'
    closeContextMenu()
  }

  // 复原手牌状态
  function clearHandStatus() {
    const seat = contextMenu.value.seat
    handStatuses.value[seat] = 'none'
    closeContextMenu()
  }

  // 点击其他地方关闭菜单
  onMounted(() => {
    document.addEventListener('click', (e) => {
      if (contextMenu.value.visible) {
        closeContextMenu()
      }
    })
  })

  /* =============================== 判定（严格） =============================== */

  /**
   * 生成组合：从数组中选择 k 个元素
   */
  function combinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]]
    if (arr.length === 0) return []

    const [first, ...rest] = arr
    const withFirst = combinations(rest, k - 1).map((combo) => [first, ...combo])
    const withoutFirst = combinations(rest, k)

    return [...withFirst, ...withoutFirst]
  }

  /**
   * 根据游戏模式计算最佳牌型
   */
  function getBestHand(holeCards: string[], board: string[], studCards?: string[]) {
    if (gameMode.value === '7stud') {
      // 7 Card Stud: 3张hole cards + 4张stud cards，选最好的5张
      const allCards = [...holeCards, ...(studCards || [])]
      return Hand.solve(allCards.map(toSolverCard))
    } else if (gameMode.value === 'holdem') {
      // Hold'em: 手牌2张 + 公共牌5张，选最好的5张
      return Hand.solve([...holeCards, ...board].map(toSolverCard))
    } else {
      // Omaha / Big O: 必须从手牌选2张，从公共牌选3张
      const holeCombos = combinations(holeCards, 2)
      const boardCombos = combinations(board, 3)

      const allPossibleHands = []

      for (const hole of holeCombos) {
        for (const boardPart of boardCombos) {
          const hand = Hand.solve([...hole, ...boardPart].map(toSolverCard))
          allPossibleHands.push(hand)
        }
      }

      // 使用 Hand.winners 找出最好的牌型
      const winners = Hand.winners(allPossibleHands)
      return winners[0]
    }
  }

  /**
   * 计算 Low 牌型 (8 or better)
   * Low 规则：每张牌都 ≤8，不能有对子，同花和顺子不影响牌力
   * 比较时高牌更低的获胜
   */
  function getLowHand(holeCards: string[], board: string[], studCards?: string[]): { cards: string[]; valid: boolean } | null {
    const rankValues: Record<string, number> = {
      'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
      '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10,
      'J': 11, 'Q': 12, 'K': 13
    }

    let allCards: string[]
    if (gameMode.value === '7stud') {
      // 7 Card Stud: 所有7张牌
      allCards = [...holeCards, ...(studCards || [])]
    } else if (gameMode.value === 'holdem') {
      // Hold'em: 不支持 Low
      return null
    } else {
      // Omaha / Big O: 手牌2张 + 公共牌3张的组合
      const holeCombos = combinations(holeCards, 2)
      const boardCombos = combinations(board, 3)

      let bestLow: string[] | null = null

      for (const hole of holeCombos) {
        for (const boardPart of boardCombos) {
          const combo = [...hole, ...boardPart].map(toSolverCard)
          const lowResult = checkLowHand(combo, rankValues)
          if (lowResult.valid) {
            if (!bestLow || compareLowHands(lowResult.cards, bestLow, rankValues) < 0) {
              bestLow = lowResult.cards
            }
          }
        }
      }

      return bestLow ? { cards: bestLow, valid: true } : { cards: [], valid: false }
    }

    // 对于 7 Card Stud，从7张中选5张最好的 Low 牌
    const allSolverCards = allCards.map(toSolverCard)
    const combos = combinations(allSolverCards, 5)

    let bestLow: string[] | null = null

    for (const combo of combos) {
      const lowResult = checkLowHand(combo, rankValues)
      if (lowResult.valid) {
        if (!bestLow || compareLowHands(lowResult.cards, bestLow, rankValues) < 0) {
          bestLow = lowResult.cards
        }
      }
    }

    return bestLow ? { cards: bestLow, valid: true } : { cards: [], valid: false }
  }

  /**
   * 检查一手牌是否是有效的 Low 牌 (8 or better)
   */
  function checkLowHand(cards: string[], rankValues: Record<string, number>): { cards: string[]; valid: boolean } {
    const ranks = cards.map(c => c[0])
    const values = ranks.map(r => rankValues[r])

    // 检查是否所有牌都 ≤8
    const allUnder8 = values.every(v => v <= 8)
    if (!allUnder8) {
      return { cards: [], valid: false }
    }

    // 检查是否有对子
    const rankCounts = new Map<number, number>()
    for (const v of values) {
      rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
    }
    const hasPair = Array.from(rankCounts.values()).some(count => count > 1)
    if (hasPair) {
      return { cards: [], valid: false }
    }

    return { cards, valid: true }
  }

  /**
   * 比较两手 Low 牌，返回负数表示 hand1 更好（更低）
   */
  function compareLowHands(hand1: string[], hand2: string[], rankValues: Record<string, number>): number {
    const values1 = hand1.map(c => rankValues[c[0]]).sort((a, b) => b - a) // 从大到小
    const values2 = hand2.map(c => rankValues[c[0]]).sort((a, b) => b - a)

    for (let i = 0; i < 5; i++) {
      if (values1[i] < values2[i]) return -1 // hand1 更好
      if (values1[i] > values2[i]) return 1  // hand2 更好
    }
    return 0 // 平局
  }

  function checkAnswer() {
    if (selectedHighSeats.value.length === 0 && (gameType.value === 'high' || selectedLowSeats.value.length === 0)) {
      ElMessage.warning('Please select the winning player(s) first')
      return
    }

    // 计算 High 赢家
    const solvedHigh = Object.entries(playerHands.value).map(([seat, cards]) => {
      const hand = getBestHand(cards, boardCards.value, playerStudCards.value[Number(seat)])
      if (!hand) {
        console.error(`Failed to get best hand for seat ${seat}`)
      }
      return {
        seat: Number(seat),
        hand,
      }
    })

    const highWinners = Hand.winners(solvedHigh.map((s) => s.hand))
    const highWinnerSeats = solvedHigh
      .filter((s) => highWinners.includes(s.hand))
      .map((s) => s.seat)
      .sort((a, b) => a - b)

    const winners = Hand.winners(solvedHigh.map((s) => s.hand))
    const winnerSeats = solvedHigh
      .filter((s) => winners.includes(s.hand))
      .map((s) => s.seat)
      .sort((a, b) => a - b)

    let isCorrect =
      winnerSeats.length === selectedHighSeats.value.length &&
      winnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])
    const winnerDetails = solvedHigh
      .filter((s) => winnerSeats.includes(s.seat))
      .map((s) => `玩家 ${s.seat}: ${s.hand.descr}`)
    let resultMsg = ''

    // 检查 High 答案
    const highCorrect =
      highWinnerSeats.length === selectedHighSeats.value.length &&
      highWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

    if (!highCorrect) {
      isCorrect = false
    }

    const highWinnerDetails = solvedHigh
      .filter((s) => highWinnerSeats.includes(s.seat))
      .map((s) => `Player ${s.seat}: ${s.hand.descr}`)
      .join('\n')
    // 检查 Low 答案（如果是 High-Low 模式）
    if (gameType.value === 'high-low') {
      const solvedLow = Object.entries(playerHands.value).map(([seat, cards]) => {
        const lowHand = getLowHand(cards, boardCards.value, playerStudCards.value[Number(seat)])
        return {
          seat: Number(seat),
          lowHand,
        }
      })

      // 找出有效的 Low 牌
      const validLowPlayers = solvedLow.filter((s) => s.lowHand?.valid)

      let lowWinnerSeats: number[] = []
      let lowWinnerDetails = ''

      if (validLowPlayers.length > 0) {
        const rankValues: Record<string, number> = {
          'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
          '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10,
          'J': 11, 'Q': 12, 'K': 13
        }

        // 找出最好的 Low 牌
        let bestLow = validLowPlayers[0]
        for (const player of validLowPlayers) {
          if (compareLowHands(player.lowHand!.cards, bestLow.lowHand!.cards, rankValues) < 0) {
            bestLow = player
          }
        }

        // 找出所有平局的玩家
        lowWinnerSeats = validLowPlayers
          .filter((p) => compareLowHands(p.lowHand!.cards, bestLow.lowHand!.cards, rankValues) === 0)
          .map((p) => p.seat)
          .sort((a, b) => a - b)

        lowWinnerDetails = lowWinnerSeats
          .map((seat) => {
            const player = solvedLow.find((s) => s.seat === seat)
            return `Player ${seat}: ${player?.lowHand?.cards.join(' ')}`
          })
          .join('\n')
      }

      const lowCorrect =
        lowWinnerSeats.length === selectedLowSeats.value.length &&
        lowWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!lowCorrect) {
        isCorrect = false
      }

      if (!isCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `High winner(s): ${highWinnerSeats.join(', ')}\n` +
          `${highWinnerDetails}\n\n` +
          `Low winner(s): ${lowWinnerSeats.length > 0 ? lowWinnerSeats.join(', ') : 'No qualifying low'}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your High answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your Low answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
      }
    } else {
      // High only 模式
      if (!isCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Correct winner(s): ${highWinnerSeats.join(', ')}\n\n` +
          `Winning hand(s):\n${highWinnerDetails}\n\n` +
          `Your answer: ${selectedHighSeats.value.join(', ') || 'None'}`
        showResult.value = true
      }
    }

    if (isCorrect) {
      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
    }
  }

  /* =============================== 生命周期 =============================== */

  onMounted(async () => {
    dealNewHand()
    await nextTick()
    boardRef.value = document.querySelector('.board')
  })

  watch(playerCount, async () => {
    dealNewHand()
    await nextTick()
  })
</script>

<template>
  <el-dialog v-model="showResult" title="回答错误" width="420px" :close-on-click-modal="false">
    <pre style="white-space: pre-wrap; line-height: 1.6"
      >{{ resultMessage }}
  </pre
    >

    <template #footer>
      <el-button @click="showResult = false"> 确认 </el-button>
      <el-button type="primary" @click="handleNextQuestion">换一题</el-button>
    </template>
  </el-dialog>
  <Fireworks v-if="showFireworks" :duration="1000" @finished="showFireworks = false" />
  <div class="ui-page">
    <div class="ui-stage">
      <div class="ui-panel trainer-header">
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>

      <BoardConfigBar
        @change-player-count="(n) => (playerCount = n)"
        @change-game-mode="
          (mode) => {
            gameMode = mode
            dealNewHand()
          }
        "
        @change-game-type="
          (type) => {
            gameType = type
          }
        "
        @submit="checkAnswer"
        @next="handleNextQuestion"
      />

      <!-- 训练舞台 -->
      <div class="chip-stage board" ref="boardRef" :style="{
        backgroundImage: `url(${bg})`,
        backgroundSize: backgroundPosition.size,
        backgroundPosition: `${backgroundPosition.x} ${backgroundPosition.y}`
      }">
        <div class="board-overlay">
          <TextureAnalysisPanel :board-cards="boardCards" anchor-selector=".board-overlay" />
          <!-- 公共牌 (仅在非 7 Card Stud 模式下显示) -->
          <div
            v-if="gameMode !== '7stud'"
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
              :style="{ left: `${i * cardSpacing}px`, zIndex: i + 1 }"
            >
              <CardFace :card="card" :scale="1" />
            </div>
          </div>

          <!-- 牌堆 -->
          <div class="deck">
            <CardStackNew :count="15" :offsetX="1" :offsetY="2.5" :scale="1" />
          </div>

          <!-- 玩家手牌 -->
          <div
            v-for="seat in activeSeats"
            :key="seat"
            class="player-area"
            :style="playerPositions[seat - 1]"
            @click="onHandClick(seat, $event)"
          >
            <div class="player-hand" v-if="playerHands[seat]">
              <!-- Kill 状态显示卡片背面 -->
              <template v-if="handStatuses[seat] === 'kill'">
                <!-- Hole Cards -->
                <div
                  v-for="(card, i) in playerHands[seat]"
                  :key="i"
                  class="hand-card dim-card"
                  :style="{ left: `${i * 18}px`, zIndex: i }"
                >
                  <CardBack />
                </div>
                <!-- Stud Cards (7 Card Stud) -->
                <div v-if="gameMode === '7stud' && playerStudCards[seat]" class="stud-cards-container" :style="getStudCardContainerStyle(seat)">
                  <div
                    v-for="(card, i) in playerStudCards[seat]"
                    :key="`stud-${i}`"
                    class="stud-card dim-card"
                    :style="{
                      top: `${getStudCardOffset(seat, i).top}px`,
                      left: `${getStudCardOffset(seat, i).left}px`,
                      transform: `rotate(${getStudCardRotation(seat)}deg)`,
                      zIndex: 100 + i
                    }"
                  >
                    <CardBack />
                  </div>
                </div>
              </template>

              <!-- 正常状态显示牌面 -->
              <template v-else>
                <!-- Hole Cards -->
                <div
                  v-for="(card, i) in playerHands[seat]"
                  :key="i"
                  class="hand-card"
                  :style="{ left: `${i * 18}px`, zIndex: i }"
                >
                  <CardFace
                    :card="card"
                    :scale="1"
                    :active="activeHighSeatSet.has(seat - 1)"
                    :activeLow="activeLowSeatSet.has(seat - 1)"
                    :has-selection="handStatuses[seat] !== 'none' && hasSelection"
                  />
                </div>
                <!-- Stud Cards (7 Card Stud) -->
                <div v-if="gameMode === '7stud' && playerStudCards[seat]" class="stud-cards-container" :style="getStudCardContainerStyle(seat)">
                  <div
                    v-for="(card, i) in playerStudCards[seat]"
                    :key="`stud-${i}`"
                    class="stud-card"
                    :style="{
                      top: `${getStudCardOffset(seat, i).top}px`,
                      left: `${getStudCardOffset(seat, i).left}px`,
                      transform: `rotate(${getStudCardRotation(seat)}deg)`,
                      zIndex: 100 + i
                    }"
                  >
                    <CardFace
                      :card="card"
                      :scale="1"
                      :active="activeHighSeatSet.has(seat - 1)"
                      :activeLow="activeLowSeatSet.has(seat - 1)"
                      :has-selection="handStatuses[seat] !== 'none' && hasSelection"
                    />
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
 公共牌 & 牌堆
 =============================== */

  .community-cards-group {
    position: absolute;
    transform: translateX(-50%);
    height: 100px;
  }

  .deck {
    position: absolute;
    bottom: 67px;
    left: 35%;
    transform: translateX(-50%);
    transform: scale(0.85);
  }

  /* ===============================
 玩家手牌
 =============================== */

  .player-area {
    position: absolute;
  }

  .player-hand {
    position: relative;
    height: 90px;
  }

  .hand-card {
    position: absolute;
    top: 0;
  }

  /* ===============================
 7 Card Stud 明牌区域
 =============================== */

  .stud-cards-container {
    position: absolute;
    top: 0;
    /* left 和 top 通过 inline style 动态设置 */
  }

  .stud-card {
    position: absolute;
    /* transform (rotation) 通过 inline style 动态设置 */
  }

  /* ===============================
 八个座位定位
 =============================== */

  /* ===============================
 公共牌位置
 =============================== */

  .community-card {
    position: absolute;
    top: 0;
  }

  /* ===============================
 手牌相关
 =============================== */

  .player-area {
    cursor: pointer;
  }

  .player-area:hover {
    opacity: 0.95;
  }

  .dim-card {
    filter: brightness(0.5) saturate(0.7);
  }

  /* Both 状态的 Mini Chips */
  .both-chips {
    position: absolute;
    top: -12px;
    right: -12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 1001;
  }

  /* Single 状态的 Chip */
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

  /* ===============================
 上下文菜单
 =============================== */

  .context-menu {
    position: fixed;
    background: #fff;
    border-radius: 8px;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(0, 0, 0, 0.1);
    padding: 6px;
    min-width: 180px;
    z-index: 10000;
    animation: menuFadeIn 0.15s ease-out;
  }

  @keyframes menuFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    transition: background 0.15s ease;
  }

  .menu-item:hover {
    background: #f5f5f5;
  }

  .menu-item.kill-item:hover {
    background: #ffebee;
    color: #d32f2f;
  }

  .menu-item.clear-item:hover {
    background: #e3f2fd;
    color: #1976d2;
  }

  .menu-divider {
    height: 1px;
    background: #e0e0e0;
    margin: 4px 0;
  }

  .menu-icon {
    font-size: 16px;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
