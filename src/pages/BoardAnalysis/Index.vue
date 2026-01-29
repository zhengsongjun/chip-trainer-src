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
  import { useTrainingSession } from '@/trainerCount/hooks/useTrainingSession'
  import useBoardAnalysisTrainingI18n from '@/i18n/customHook/useBoardAnalysis'
  import { useUserStore } from '@/stores/user'
  const { pageTitle, markHigh, markLow, kill, close } = useBoardAnalysisTrainingI18n()

  /* =============================== 基础状态 =============================== */
  const userStore = useUserStore()
  const { startSession, answerQuestion } = useTrainingSession()
  const hasRecordedWrong = ref(false)
  const questionStartAt = ref(Date.now())
  const showFireworks = ref(false)
  const playerCount = ref<number>(2)
  const gameMode = ref<'holdem' | 'omaha' | 'bigo' | '7stud' | 'razz' | 'badugi' | 'lowball-a5' | 'lowball-27' | 'ari' | 'archie' | 'badacey' | 'badeucey'>('omaha')

  const boardCards = ref<string[]>([])
  const playerHands = ref<Record<number, string[]>>({})
  // 7 Card Stud 专用：每个玩家的 4 张明牌
  const playerStudCards = ref<Record<number, string[]>>({})

  // 公共牌间距控制
  const cardSpacing = ref<number>(88) // 默认 46px 间距

  // 7 Card Stud 明牌配置 - 每个座位独立配置（2号位和7号位不参与游戏）
  const studCardsConfig = ref({
    1: {
      rotation: 0, // 旋转角度（单位：度）
      startLeft: 60, // 相对hole cards的水平位置（单位：px）
      startTop: -60, // 相对hole cards的垂直位置（单位：px）
      offsetX: 15, // 每张牌的水平叠加偏移（单位：px）
      offsetY: -15, // 每张牌的垂直叠加偏移（单位：px，负数向上）
    },
    3: {
      rotation: 0,
      startLeft: 60,
      startTop: -100,
      offsetX: 15,
      offsetY: -15, // 正数向下
    },
    4: {
      rotation: 0,
      startLeft: 20,
      startTop: 50,
      offsetX: 15,
      offsetY: 15,
    },
    5: {
      rotation: 0,
      startLeft: 20,
      startTop: 50,
      offsetX: 15,
      offsetY: 15,
    },
    6: {
      rotation: 0,
      startLeft: 20,
      startTop: 50,
      offsetX: 25,
      offsetY: 25,
    },
    8: {
      rotation: 0,
      startLeft: -85,
      startTop: -90,
      offsetX: -20,
      offsetY: -20,
    },
  })

  // 背景图位置控制
  const backgroundPosition = ref({
    size: '125%', // 背景图大小 (可以是百分比或 px)
    x: 'center', // 水平位置 (可以是: left, center, right, 或百分比/px)
    y: '41%', // 垂直位置 (可以是: top, center, bottom, 或百分比/px)
  })

  // 公共牌位置控制
  const communityCardsPosition = ref({
    top: '38%', // 距离顶部的位置
    left: '46%', // 距离左侧的位置
    width: 260, // 容器宽度（单位：px）
  })
  const activeSeats = ref<number[]>([])

  function pickRandomSeats(count: number): number[] {
    // 7 Card Stud 和 Razz 模式下，只使用 1, 3, 4, 5, 6, 8 号座位（排除 2 和 7）
    // Badugi、Lowball A-5、Lowball 2-7、Ari、Archie、Badacey 和 Badeucey 模式使用所有8个座位
    const allSeats =
      gameMode.value === '7stud' || gameMode.value === 'razz'
        ? [1, 3, 4, 5, 6, 8]
        : [1, 2, 3, 4, 5, 6, 7, 8]
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
    return (
      studCardsConfig.value[seat as keyof typeof studCardsConfig.value] || studCardsConfig.value[1]
    )
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

  // 游戏类型：High 或 High Low 或 A-5 Low 或 2-7 Low 或 Badugi 或 Lowball A-5 或 Lowball 2-7 或 Ari 或 Archie 或 Badacey 或 Badeucey
  const gameType = ref<'high' | 'high-low' | 'a5-low' | '2-7-low' | 'badugi' | 'lowball-a5-type' | 'lowball-27-type' | 'ari-type' | 'archie-type' | 'badacey-type' | 'badeucey-type'>('high')

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

  /** ✅ TextureAnalysis 是否启用（仅 Hold'em、Omaha、Big O） */
  const isTextureAnalysisEnabled = computed(() => {
    return gameMode.value === 'holdem' || gameMode.value === 'omaha' || gameMode.value === 'bigo'
  })

  /** ✅ Chip 显示文本 */
  const highChipLabel = computed(() => {
    if (gameMode.value === 'badacey') {
      return 'BADUGI'
    } else if (gameMode.value === 'badeucey') {
      return 'BADEUGI 2-7'
    }
    return 'HIGH'
  })

  const lowChipLabel = computed(() => {
    return 'LOW'
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
    hasRecordedWrong.value = false
    questionStartAt.value = Date.now()
    const deck = shuffle(fullDeck)

    // 🎯 随机选座位
    activeSeats.value = pickRandomSeats(playerCount.value)

    const hands: Record<number, string[]> = {}
    const studCards: Record<number, string[]> = {}
    const statuses: Record<number, HandStatus> = {}

    if (gameMode.value === '7stud' || gameMode.value === 'razz') {
      // 7 Card Stud / Razz: 不需要公共牌
      boardCards.value = []

      for (const seat of activeSeats.value) {
        // 每人 3 张 hole cards + 4 张 stud cards
        hands[seat] = deck.splice(0, 3)
        studCards[seat] = deck.splice(0, 4)
        statuses[seat] = 'none'
      }
      playerStudCards.value = studCards
    } else if (gameMode.value === 'badugi') {
      // Badugi: 不需要公共牌，每人4张牌
      boardCards.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 4)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'lowball-a5') {
      // Lowball A-5: 不需要公共牌，每人5张牌
      boardCards.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'lowball-27') {
      // Lowball 2-7: 不需要公共牌，每人5张牌
      boardCards.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'ari') {
      // Ari: 1张公共牌，每人5张牌
      boardCards.value = deck.splice(0, 1)

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'archie') {
      // Archie: 没有公共牌，每人5张牌
      boardCards.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'badacey') {
      // Badacey A-5: 没有公共牌，每人5张牌
      boardCards.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'badeucey') {
      // Badeucey 2-7: 没有公共牌，每人5张牌
      boardCards.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
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
    if (gameMode.value === '7stud' || gameMode.value === 'razz') {
      // 7 Card Stud / Razz: 3张hole cards + 4张stud cards，选最好的5张
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
  function getLowHand(
    holeCards: string[],
    board: string[],
    studCards?: string[]
  ): { cards: string[]; valid: boolean } | null {
    const rankValues: Record<string, number> = {
      A: 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
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
  function checkLowHand(
    cards: string[],
    rankValues: Record<string, number>
  ): { cards: string[]; valid: boolean } {
    const ranks = cards.map((c) => c[0])
    const values = ranks.map((r) => rankValues[r])

    // 检查是否所有牌都 ≤8
    const allUnder8 = values.every((v) => v <= 8)
    if (!allUnder8) {
      return { cards: [], valid: false }
    }

    // 检查是否有对子
    const rankCounts = new Map<number, number>()
    for (const v of values) {
      rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
    }
    const hasPair = Array.from(rankCounts.values()).some((count) => count > 1)
    if (hasPair) {
      return { cards: [], valid: false }
    }

    return { cards, valid: true }
  }

  /**
   * 比较两手 Low 牌，返回负数表示 hand1 更好（更低）
   */
  function compareLowHands(
    hand1: string[],
    hand2: string[],
    rankValues: Record<string, number>
  ): number {
    const values1 = hand1.map((c) => rankValues[c[0]]).sort((a, b) => b - a) // 从大到小
    const values2 = hand2.map((c) => rankValues[c[0]]).sort((a, b) => b - a)

    for (let i = 0; i < 5; i++) {
      if (values1[i] < values2[i]) return -1 // hand1 更好
      if (values1[i] > values2[i]) return 1 // hand2 更好
    }
    return 0 // 平局
  }

  /**
   * Razz A-5 Low：计算牌力评分（越小越好）
   * 规则：A算1点，同花和顺子不影响牌力，但对子、两对、三条、葫芦、四条让牌力变差
   */
  function getA5LowScore(cards: string[]): { score: number; highCards: number[] } {
    const rankValues: Record<string, number> = {
      A: 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
    }

    const ranks = cards.map((c) => c[0])
    const values = ranks.map((r) => rankValues[r])

    // 统计每个点数的数量
    const rankCounts = new Map<number, number>()
    for (const v of values) {
      rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
    }

    // 判断牌型
    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
    let handType = 0 // 0=高牌, 1=一对, 2=两对, 3=三条, 4=葫芦, 5=四条

    if (counts[0] === 4)
      handType = 5 // 四条
    else if (counts[0] === 3 && counts[1] === 2)
      handType = 4 // 葫芦
    else if (counts[0] === 3)
      handType = 3 // 三条
    else if (counts[0] === 2 && counts[1] === 2)
      handType = 2 // 两对
    else if (counts[0] === 2) handType = 1 // 一对

    // 获取高牌（从大到小排序）
    const highCards = values.sort((a, b) => b - a)

    // 牌型权重 * 1000000，然后加上高牌比较
    return { score: handType * 1000000, highCards }
  }

  /**
   * Razz 2-7 Low：计算牌力评分（越小越好）
   * 规则：A算14点，顺子和同花让牌力变差，对子、两对、三条、顺子、同花、葫芦、四条、同花顺一个比一个差
   */
  function get27LowScore(cards: string[]): { score: number; highCards: number[] } {
    const rankValues: Record<string, number> = {
      A: 14,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
    }

    const ranks = cards.map((c) => c[0])
    const suits = cards.map((c) => c[1])
    const values = ranks.map((r) => rankValues[r])

    // 统计每个点数的数量
    const rankCounts = new Map<number, number>()
    for (const v of values) {
      rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
    }

    // 判断是否同花
    const isFlush = suits.every((s) => s === suits[0])

    // 判断是否顺子
    const sortedValues = [...values].sort((a, b) => a - b)
    const isStraight = sortedValues.every((v, i) => {
      if (i === 0) return true
      return v === sortedValues[i - 1] + 1
    })

    // 判断牌型
    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
    let handType = 0 // 0=高牌

    if (isFlush && isStraight)
      handType = 8 // 同花顺
    else if (counts[0] === 4)
      handType = 7 // 四条
    else if (counts[0] === 3 && counts[1] === 2)
      handType = 6 // 葫芦
    else if (isFlush)
      handType = 5 // 同花
    else if (isStraight)
      handType = 4 // 顺子
    else if (counts[0] === 3)
      handType = 3 // 三条
    else if (counts[0] === 2 && counts[1] === 2)
      handType = 2 // 两对
    else if (counts[0] === 2) handType = 1 // 一对

    // 获取高牌（从大到小排序）
    const highCards = values.sort((a, b) => b - a)

    // 牌型权重 * 1000000，然后加上高牌比较
    return { score: handType * 1000000, highCards }
  }

  /**
   * Lowball A-5：计算牌力评分（越小越好）
   * 规则：A算1点，同花和顺子不影响牌力，但对子、两对、三条、葫芦、四条让牌力变差
   * 比较方式：从高到低比较每张牌
   */
  function getLowballA5Score(cards: string[]): { score: number; highCards: number[] } {
    const rankValues: Record<string, number> = {
      A: 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
    }

    const ranks = cards.map((c) => c[0])
    const values = ranks.map((r) => rankValues[r])

    // 统计每个点数的数量
    const rankCounts = new Map<number, number>()
    for (const v of values) {
      rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
    }

    // 判断牌型
    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
    let handType = 0 // 0=高牌, 1=一对, 2=两对, 3=三条, 4=葫芦, 5=四条

    if (counts[0] === 4)
      handType = 5 // 四条
    else if (counts[0] === 3 && counts[1] === 2)
      handType = 4 // 葫芦
    else if (counts[0] === 3)
      handType = 3 // 三条
    else if (counts[0] === 2 && counts[1] === 2)
      handType = 2 // 两对
    else if (counts[0] === 2) handType = 1 // 一对

    // 获取高牌（从大到小排序）
    const highCards = values.sort((a, b) => b - a)

    // 牌型权重 * 1000000，然后加上高牌比较
    return { score: handType * 1000000, highCards }
  }

  /**
   * 获取 Lowball A-5 模式下的最佳 Low 牌（直接使用5张手牌）
   */
  function getLowballA5Hand(cards: string[]): { cards: string[]; score: number; highCards: number[] } {
    const solverCards = cards.map(toSolverCard)
    const scoreResult = getLowballA5Score(solverCards)
    return { cards: solverCards, ...scoreResult }
  }

  /**
   * 获取 Lowball 2-7 模式下的最佳 Low 牌（直接使用5张手牌）
   */
  function getLowball27Hand(cards: string[]): { cards: string[]; score: number; highCards: number[] } {
    const solverCards = cards.map(toSolverCard)
    const scoreResult = get27LowScore(solverCards)
    return { cards: solverCards, ...scoreResult }
  }

  /**
   * Ari High：检查牌型是否 qualify（至少一对 9 或以上）
   * Archie High：检查牌型是否 qualify（至少一对 9 或以上）
   */
  function checkAriHighQualifier(hand: any): boolean {
    const handName = hand.name.toLowerCase()

    // 高牌不 qualify
    if (handName === 'high card') {
      return false
    }

    // 一对：需要检查对子的点数
    if (handName === 'pair') {
      // 字符串到数字的映射
      const rankValueString: Record<string, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        'T': 10, 't': 10, '10': 10,
        'J': 11, 'j': 11,
        'Q': 12, 'q': 12,
        'K': 13, 'k': 13,
        'A': 14, 'a': 14
      }

      // pokersolver 数字映射（从 1 开始）
      // 2=1, 3=2, 4=3, 5=4, 6=5, 7=6, 8=7, 9=8, T=9, J=10, Q=11, K=12, A=13
      const rankValueNumber: Record<number, number> = {
        1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 13, 13: 14
      }

      // 找到对子的点数：统计每个点数出现的次数
      const rankCounts = new Map<any, number>()
      for (const card of hand.cards) {
        const rank = card.rank || card.value
        rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1)
      }

      // 找出出现2次的点数（对子）
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 2) {
          let pairValue = 0

          if (typeof rank === 'string') {
            // 字符串类型：使用映射表
            pairValue = rankValueString[rank] || 0
          } else if (typeof rank === 'number') {
            // 数字类型：使用 pokersolver 映射表
            pairValue = rankValueNumber[rank] || 0
          }

          console.log(`Pair rank: ${rank} (type: ${typeof rank}), value: ${pairValue}, qualify: ${pairValue >= 9}`)
          return pairValue >= 9 // 至少一对 9（对应 pairValue >= 9）
        }
      }

      console.log('No pair found in cards:', hand.cards.map((c: any) => ({rank: c.rank, value: c.value})))
      return false
    }

    // 其他所有牌型都 qualify（两对、三条、顺子、同花、葫芦、四条、同花顺等）
    return true
  }

  /**
   * Ari Low：检查是否 qualify 并计算牌力（只用手牌5张，A-5规则）
   * Qualifier: 5张牌点数各不相同，所有牌都≤8
   */
  function getAriLowHand(holeCards: string[]): { cards: string[]; valid: boolean; highCards: number[] } {
    const rankValues: Record<string, number> = {
      A: 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
    }

    const solverCards = holeCards.map(toSolverCard)
    const ranks = solverCards.map((c) => c[0])
    const values = ranks.map((r) => rankValues[r])

    // 检查是否所有牌都 ≤8
    const allUnder8 = values.every((v) => v <= 8)
    if (!allUnder8) {
      return { cards: [], valid: false, highCards: [] }
    }

    // 检查是否有重复点数
    const rankCounts = new Map<number, number>()
    for (const v of values) {
      rankCounts.set(v, (rankCounts.get(v) || 0) + 1)
    }
    const hasPair = Array.from(rankCounts.values()).some((count) => count > 1)
    if (hasPair) {
      return { cards: [], valid: false, highCards: [] }
    }

    // Qualify 成功，从大到小排序用于比较
    const highCards = values.sort((a, b) => b - a)

    return { cards: solverCards, valid: true, highCards }
  }

  /**
   * Badacey A-5 Low：不需要 qualifier，直接计算 A-5 Low 牌力
   * 规则：A=1，同花和顺子不影响牌力，对子/两对/三条等让牌力变差
   */
  function getBadaceyA5LowHand(holeCards: string[]): { cards: string[]; score: number; highCards: number[] } {
    const solverCards = holeCards.map(toSolverCard)
    const scoreResult = getLowballA5Score(solverCards)
    return { cards: solverCards, ...scoreResult }
  }

  /**
   * 获取 Razz 模式下的最佳 Low 牌
   */
  function getRazzLowHand(
    holeCards: string[],
    studCards: string[]
  ): { cards: string[]; score: number; highCards: number[] } {
    const allCards = [...holeCards, ...studCards]
    const allSolverCards = allCards.map(toSolverCard)
    const combos = combinations(allSolverCards, 5)

    let bestLow: { cards: string[]; score: number; highCards: number[] } | null = null

    for (const combo of combos) {
      const scoreResult = gameType.value === 'a5-low' ? getA5LowScore(combo) : get27LowScore(combo)

      if (
        !bestLow ||
        scoreResult.score < bestLow.score ||
        (scoreResult.score === bestLow.score &&
          compareHighCards(scoreResult.highCards, bestLow.highCards) < 0)
      ) {
        bestLow = { cards: combo, ...scoreResult }
      }
    }

    return bestLow!
  }

  /**
   * 比较高牌（从大到小），返回负数表示 hand1 更好（更低）
   */
  function compareHighCards(hand1: number[], hand2: number[]): number {
    for (let i = 0; i < 5; i++) {
      if (hand1[i] < hand2[i]) return -1
      if (hand1[i] > hand2[i]) return 1
    }
    return 0
  }

  /**
   * 计算Badugi牌的最佳组合
   * 规则：
   * 1. 尽可能多的不同花色、不同点数的牌（4张最好）
   * 2. 如果有相同点数，只能用一张
   * 3. 如果有相同花色，只能用一张（选点数最低的）
   * 4. 点数越低越好（A=1）
   */
  function getBadugiHand(cards: string[]): {
    validCards: string[]
    count: number
    ranks: number[]
  } {
    const rankValues: Record<string, number> = {
      A: 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
    }

    // 转换为solver格式
    const solverCards = cards.map(toSolverCard)

    // 按点数从小到大排序
    const sortedCards = solverCards
      .map((c) => ({
        card: c,
        rank: c[0],
        suit: c[1],
        value: rankValues[c[0]],
      }))
      .sort((a, b) => a.value - b.value)

    // 贪心算法：按点数从小到大，选择不同花色、不同点数的牌
    const validCards: string[] = []
    const usedRanks = new Set<string>()
    const usedSuits = new Set<string>()

    for (const cardInfo of sortedCards) {
      if (!usedRanks.has(cardInfo.rank) && !usedSuits.has(cardInfo.suit)) {
        validCards.push(cardInfo.card)
        usedRanks.add(cardInfo.rank)
        usedSuits.add(cardInfo.suit)
      }
    }

    // 获取有效牌的点数（从大到小排序用于比较）
    const ranks = validCards.map((c) => rankValues[c[0]]).sort((a, b) => b - a)

    return {
      validCards,
      count: validCards.length,
      ranks,
    }
  }

  /**
   * 计算 Badeucey 2-7 Badugi 牌的最佳组合（A=14，是很差的牌）
   * 规则：
   * 1. 尽可能多的不同花色、不同点数的牌（4张最好）
   * 2. 如果有相同点数，只能用一张
   * 3. 如果有相同花色，只能用一张（选点数最低的）
   * 4. 点数越低越好（A=14，是最差的牌）
   */
  function getBadeuceyBadugiHand(cards: string[]): {
    validCards: string[]
    count: number
    ranks: number[]
  } {
    const rankValues: Record<string, number> = {
      A: 14, // Badeucey 中 A=14，是很差的牌
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
    }

    // 转换为solver格式
    const solverCards = cards.map(toSolverCard)

    // 按点数从小到大排序
    const sortedCards = solverCards
      .map((c) => ({
        card: c,
        rank: c[0],
        suit: c[1],
        value: rankValues[c[0]],
      }))
      .sort((a, b) => a.value - b.value)

    // 贪心算法：按点数从小到大，选择不同花色、不同点数的牌
    const validCards: string[] = []
    const usedRanks = new Set<string>()
    const usedSuits = new Set<string>()

    for (const cardInfo of sortedCards) {
      if (!usedRanks.has(cardInfo.rank) && !usedSuits.has(cardInfo.suit)) {
        validCards.push(cardInfo.card)
        usedRanks.add(cardInfo.rank)
        usedSuits.add(cardInfo.suit)
      }
    }

    // 获取有效牌的点数（从大到小排序用于比较）
    const ranks = validCards.map((c) => rankValues[c[0]]).sort((a, b) => b - a)

    return {
      validCards,
      count: validCards.length,
      ranks,
    }
  }

  /**
   * 比较两手Badugi牌
   * 返回负数表示hand1更好（更低）
   */
  function compareBadugiHands(
    hand1: { count: number; ranks: number[] },
    hand2: { count: number; ranks: number[] }
  ): number {
    // 先比较有效牌的数量，数量多的获胜
    if (hand1.count > hand2.count) return -1
    if (hand1.count < hand2.count) return 1

    // 数量相同，从高到低比较每张牌的点数
    for (let i = 0; i < hand1.count; i++) {
      if (hand1.ranks[i] < hand2.ranks[i]) return -1 // hand1的高牌更低，更好
      if (hand1.ranks[i] > hand2.ranks[i]) return 1 // hand2的高牌更低，更好
    }

    return 0 // 平局
  }

  function checkAnswer() {
    // Badeucey 2-7 模式需要同时判断 Badugi 2-7 和 2-7 Low
    if (gameMode.value === 'badeucey') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Badugi 2-7 赢家（从5张牌选最好的4张，A=14）
      const solvedBadugi = Object.entries(playerHands.value).map(([seat, cards]) => {
        const badugiHand = getBadeuceyBadugiHand(cards)
        return {
          seat: Number(seat),
          badugiHand,
        }
      })

      // 找出最好的 Badugi 2-7 牌
      let bestBadugi = solvedBadugi[0]
      for (const player of solvedBadugi) {
        if (compareBadugiHands(player.badugiHand, bestBadugi.badugiHand) < 0) {
          bestBadugi = player
        }
      }

      // 找出所有平局的玩家（Badugi 2-7）
      const badugiWinnerSeats = solvedBadugi
        .filter((p) => compareBadugiHands(p.badugiHand, bestBadugi.badugiHand) === 0)
        .map((p) => p.seat)
        .sort((a, b) => a - b)

      const badugiWinnerDetails = badugiWinnerSeats
        .map((seat) => {
          const player = solvedBadugi.find((s) => s.seat === seat)
          const cardCount = player?.badugiHand.count
          const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
          return `Player ${seat}: ${player?.badugiHand.validCards.join(' ')} (${cardType})`
        })
        .join('\n')

      // 计算 2-7 Low 赢家（5张牌，无 qualifier）
      const solvedLow = Object.entries(playerHands.value).map(([seat, cards]) => {
        const lowHand = getLowball27Hand(cards)
        return {
          seat: Number(seat),
          lowHand,
        }
      })

      // 找出最好的 2-7 Low 牌
      let bestLow = solvedLow[0]
      for (const player of solvedLow) {
        if (
          player.lowHand.score < bestLow.lowHand.score ||
          (player.lowHand.score === bestLow.lowHand.score &&
            compareHighCards(player.lowHand.highCards, bestLow.lowHand.highCards) < 0)
        ) {
          bestLow = player
        }
      }

      // 找出所有平局的玩家（2-7 Low）
      const lowWinnerSeats = solvedLow
        .filter(
          (p) =>
            p.lowHand.score === bestLow.lowHand.score &&
            compareHighCards(p.lowHand.highCards, bestLow.lowHand.highCards) === 0
        )
        .map((p) => p.seat)
        .sort((a, b) => a - b)

      const lowWinnerDetails = lowWinnerSeats
        .map((seat) => {
          const player = solvedLow.find((s) => s.seat === seat)
          return `Player ${seat}: ${player?.lowHand.cards.join(' ')}`
        })
        .join('\n')

      // 检查 Badugi 2-7 答案（使用 High 位置）
      const badugiCorrect =
        badugiWinnerSeats.length === selectedHighSeats.value.length &&
        badugiWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      // 检查 2-7 Low 答案
      const lowCorrect =
        lowWinnerSeats.length === selectedLowSeats.value.length &&
        lowWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!badugiCorrect || !lowCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Badugi 2-7 winner(s): ${badugiWinnerSeats.join(', ')}\n` +
          `${badugiWinnerDetails}\n\n` +
          `2-7 Low winner(s): ${lowWinnerSeats.join(', ')}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your Badugi 2-7 answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your 2-7 Low answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Badacey A-5 模式需要同时判断 Badugi 和 A-5 Low
    if (gameMode.value === 'badacey') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Badugi 赢家（从5张牌选最好的4张）
      const solvedBadugi = Object.entries(playerHands.value).map(([seat, cards]) => {
        const badugiHand = getBadugiHand(cards)
        return {
          seat: Number(seat),
          badugiHand,
        }
      })

      // 找出最好的 Badugi 牌
      let bestBadugi = solvedBadugi[0]
      for (const player of solvedBadugi) {
        if (compareBadugiHands(player.badugiHand, bestBadugi.badugiHand) < 0) {
          bestBadugi = player
        }
      }

      // 找出所有平局的玩家（Badugi）
      const badugiWinnerSeats = solvedBadugi
        .filter((p) => compareBadugiHands(p.badugiHand, bestBadugi.badugiHand) === 0)
        .map((p) => p.seat)
        .sort((a, b) => a - b)

      const badugiWinnerDetails = badugiWinnerSeats
        .map((seat) => {
          const player = solvedBadugi.find((s) => s.seat === seat)
          const cardCount = player?.badugiHand.count
          const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
          return `Player ${seat}: ${player?.badugiHand.validCards.join(' ')} (${cardType})`
        })
        .join('\n')

      // 计算 A-5 Low 赢家（5张牌，无 qualifier）
      const solvedLow = Object.entries(playerHands.value).map(([seat, cards]) => {
        const lowHand = getBadaceyA5LowHand(cards)
        return {
          seat: Number(seat),
          lowHand,
        }
      })

      // 找出最好的 A-5 Low 牌
      let bestLow = solvedLow[0]
      for (const player of solvedLow) {
        if (
          player.lowHand.score < bestLow.lowHand.score ||
          (player.lowHand.score === bestLow.lowHand.score &&
            compareHighCards(player.lowHand.highCards, bestLow.lowHand.highCards) < 0)
        ) {
          bestLow = player
        }
      }

      // 找出所有平局的玩家（A-5 Low）
      const lowWinnerSeats = solvedLow
        .filter(
          (p) =>
            p.lowHand.score === bestLow.lowHand.score &&
            compareHighCards(p.lowHand.highCards, bestLow.lowHand.highCards) === 0
        )
        .map((p) => p.seat)
        .sort((a, b) => a - b)

      const lowWinnerDetails = lowWinnerSeats
        .map((seat) => {
          const player = solvedLow.find((s) => s.seat === seat)
          return `Player ${seat}: ${player?.lowHand.cards.join(' ')}`
        })
        .join('\n')

      // 检查 Badugi 答案（使用 High 位置）
      const badugiCorrect =
        badugiWinnerSeats.length === selectedHighSeats.value.length &&
        badugiWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      // 检查 A-5 Low 答案
      const lowCorrect =
        lowWinnerSeats.length === selectedLowSeats.value.length &&
        lowWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!badugiCorrect || !lowCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Badugi winner(s): ${badugiWinnerSeats.join(', ')}\n` +
          `${badugiWinnerDetails}\n\n` +
          `A-5 Low winner(s): ${lowWinnerSeats.join(', ')}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your Badugi answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your A-5 Low answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Archie 模式需要同时判断 High 和 Low
    if (gameMode.value === 'archie') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 High 赢家（只用5张手牌）
      // Qualifier: 至少一对 9 或以上
      const solvedHigh = Object.entries(playerHands.value).map(([seat, cards]) => {
        const hand = Hand.solve(cards.map(toSolverCard))
        const qualified = checkAriHighQualifier(hand)
        return {
          seat: Number(seat),
          hand,
          qualified,
        }
      })

      // 只考虑 qualify 的玩家
      const qualifiedHighPlayers = solvedHigh.filter((s) => s.qualified)

      let highWinnerSeats: number[] = []
      let highWinnerDetails = ''

      if (qualifiedHighPlayers.length > 0) {
        const highWinners = Hand.winners(qualifiedHighPlayers.map((s) => s.hand))
        highWinnerSeats = qualifiedHighPlayers
          .filter((s) => highWinners.includes(s.hand))
          .map((s) => s.seat)
          .sort((a, b) => a - b)

        highWinnerDetails = qualifiedHighPlayers
          .filter((s) => highWinnerSeats.includes(s.seat))
          .map((s) => `Player ${s.seat}: ${s.hand.descr}`)
          .join('\n')
      }

      // 计算 Low 赢家（只用5张手牌，A-5规则）
      const solvedLow = Object.entries(playerHands.value).map(([seat, cards]) => {
        const lowHand = getAriLowHand(cards)
        return {
          seat: Number(seat),
          lowHand,
        }
      })

      // 找出有效的 Low 牌
      const validLowPlayers = solvedLow.filter((s) => s.lowHand.valid)

      let lowWinnerSeats: number[] = []
      let lowWinnerDetails = ''

      if (validLowPlayers.length > 0) {
        // 找出最好的 Low 牌（高牌最低的）
        let bestLow = validLowPlayers[0]
        for (const player of validLowPlayers) {
          if (compareHighCards(player.lowHand.highCards, bestLow.lowHand.highCards) < 0) {
            bestLow = player
          }
        }

        // 找出所有平局的玩家
        lowWinnerSeats = validLowPlayers
          .filter((p) => compareHighCards(p.lowHand.highCards, bestLow.lowHand.highCards) === 0)
          .map((p) => p.seat)
          .sort((a, b) => a - b)

        lowWinnerDetails = lowWinnerSeats
          .map((seat) => {
            const player = solvedLow.find((s) => s.seat === seat)
            return `Player ${seat}: ${player?.lowHand.cards.join(' ')}`
          })
          .join('\n')
      }

      // 检查 High 答案
      const highCorrect =
        highWinnerSeats.length === selectedHighSeats.value.length &&
        highWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      // 检查 Low 答案
      const lowCorrect =
        lowWinnerSeats.length === selectedLowSeats.value.length &&
        lowWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!highCorrect || !lowCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `High winner(s): ${highWinnerSeats.length > 0 ? highWinnerSeats.join(', ') : 'No qualifying high'}\n` +
          `${highWinnerDetails}\n\n` +
          `Low winner(s): ${lowWinnerSeats.length > 0 ? lowWinnerSeats.join(', ') : 'No qualifying low'}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your High answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your Low answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Ari 模式需要同时判断 High 和 Low
    if (gameMode.value === 'ari') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 High 赢家（6张牌：5张手牌 + 1张公共牌）
      // Qualifier: 至少一对 9 或以上
      const solvedHigh = Object.entries(playerHands.value).map(([seat, cards]) => {
        const allCards = [...cards, ...boardCards.value]
        const hand = Hand.solve(allCards.map(toSolverCard))
        const qualified = checkAriHighQualifier(hand)
        return {
          seat: Number(seat),
          hand,
          qualified,
        }
      })

      // 只考虑 qualify 的玩家
      const qualifiedHighPlayers = solvedHigh.filter((s) => s.qualified)

      let highWinnerSeats: number[] = []
      let highWinnerDetails = ''

      if (qualifiedHighPlayers.length > 0) {
        const highWinners = Hand.winners(qualifiedHighPlayers.map((s) => s.hand))
        highWinnerSeats = qualifiedHighPlayers
          .filter((s) => highWinners.includes(s.hand))
          .map((s) => s.seat)
          .sort((a, b) => a - b)

        highWinnerDetails = qualifiedHighPlayers
          .filter((s) => highWinnerSeats.includes(s.seat))
          .map((s) => `Player ${s.seat}: ${s.hand.descr}`)
          .join('\n')
      }

      // 计算 Low 赢家（只用5张手牌，A-5规则）
      const solvedLow = Object.entries(playerHands.value).map(([seat, cards]) => {
        const lowHand = getAriLowHand(cards)
        return {
          seat: Number(seat),
          lowHand,
        }
      })

      // 找出有效的 Low 牌
      const validLowPlayers = solvedLow.filter((s) => s.lowHand.valid)

      let lowWinnerSeats: number[] = []
      let lowWinnerDetails = ''

      if (validLowPlayers.length > 0) {
        // 找出最好的 Low 牌（高牌最低的）
        let bestLow = validLowPlayers[0]
        for (const player of validLowPlayers) {
          if (compareHighCards(player.lowHand.highCards, bestLow.lowHand.highCards) < 0) {
            bestLow = player
          }
        }

        // 找出所有平局的玩家
        lowWinnerSeats = validLowPlayers
          .filter((p) => compareHighCards(p.lowHand.highCards, bestLow.lowHand.highCards) === 0)
          .map((p) => p.seat)
          .sort((a, b) => a - b)

        lowWinnerDetails = lowWinnerSeats
          .map((seat) => {
            const player = solvedLow.find((s) => s.seat === seat)
            return `Player ${seat}: ${player?.lowHand.cards.join(' ')}`
          })
          .join('\n')
      }

      // 检查 High 答案
      const highCorrect =
        highWinnerSeats.length === selectedHighSeats.value.length &&
        highWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      // 检查 Low 答案
      const lowCorrect =
        lowWinnerSeats.length === selectedLowSeats.value.length &&
        lowWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!highCorrect || !lowCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `High winner(s): ${highWinnerSeats.length > 0 ? highWinnerSeats.join(', ') : 'No qualifying high'}\n` +
          `${highWinnerDetails}\n\n` +
          `Low winner(s): ${lowWinnerSeats.length > 0 ? lowWinnerSeats.join(', ') : 'No qualifying low'}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your High answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your Low answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Lowball 2-7 模式只需要选择 Low
    if (gameMode.value === 'lowball-27') {
      if (selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Lowball 2-7 赢家
      const solvedLowball27 = Object.entries(playerHands.value).map(([seat, cards]) => {
        const lowball27Hand = getLowball27Hand(cards)
        return {
          seat: Number(seat),
          lowball27Hand,
        }
      })

      // 找出最好的 Lowball 2-7 牌
      let bestLowball27 = solvedLowball27[0]
      for (const player of solvedLowball27) {
        if (
          player.lowball27Hand.score < bestLowball27.lowball27Hand.score ||
          (player.lowball27Hand.score === bestLowball27.lowball27Hand.score &&
            compareHighCards(player.lowball27Hand.highCards, bestLowball27.lowball27Hand.highCards) < 0)
        ) {
          bestLowball27 = player
        }
      }

      // 找出所有平局的玩家
      const lowball27WinnerSeats = solvedLowball27
        .filter(
          (p) =>
            p.lowball27Hand.score === bestLowball27.lowball27Hand.score &&
            compareHighCards(p.lowball27Hand.highCards, bestLowball27.lowball27Hand.highCards) === 0
        )
        .map((p) => p.seat)
        .sort((a, b) => a - b)

      const lowball27Correct =
        lowball27WinnerSeats.length === selectedLowSeats.value.length &&
        lowball27WinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!lowball27Correct) {
        const lowball27WinnerDetails = lowball27WinnerSeats
          .map((seat) => {
            const player = solvedLowball27.find((s) => s.seat === seat)
            return `Player ${seat}: ${player?.lowball27Hand.cards.join(' ')}`
          })
          .join('\n')

        resultMessage.value =
          `Wrong ❌\n\n` +
          `Winner(s): ${lowball27WinnerSeats.join(', ')}\n` +
          `${lowball27WinnerDetails}\n\n` +
          `Your answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Lowball A-5 模式只需要选择 Low
    if (gameMode.value === 'lowball-a5') {
      if (selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Lowball A-5 赢家
      const solvedLowball = Object.entries(playerHands.value).map(([seat, cards]) => {
        const lowballHand = getLowballA5Hand(cards)
        return {
          seat: Number(seat),
          lowballHand,
        }
      })

      // 找出最好的 Lowball A-5 牌
      let bestLowball = solvedLowball[0]
      for (const player of solvedLowball) {
        if (
          player.lowballHand.score < bestLowball.lowballHand.score ||
          (player.lowballHand.score === bestLowball.lowballHand.score &&
            compareHighCards(player.lowballHand.highCards, bestLowball.lowballHand.highCards) < 0)
        ) {
          bestLowball = player
        }
      }

      // 找出所有平局的玩家
      const lowballWinnerSeats = solvedLowball
        .filter(
          (p) =>
            p.lowballHand.score === bestLowball.lowballHand.score &&
            compareHighCards(p.lowballHand.highCards, bestLowball.lowballHand.highCards) === 0
        )
        .map((p) => p.seat)
        .sort((a, b) => a - b)

      const lowballCorrect =
        lowballWinnerSeats.length === selectedLowSeats.value.length &&
        lowballWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!lowballCorrect) {
        const lowballWinnerDetails = lowballWinnerSeats
          .map((seat) => {
            const player = solvedLowball.find((s) => s.seat === seat)
            return `Player ${seat}: ${player?.lowballHand.cards.join(' ')}`
          })
          .join('\n')

        resultMessage.value =
          `Wrong ❌\n\n` +
          `Winner(s): ${lowballWinnerSeats.join(', ')}\n` +
          `${lowballWinnerDetails}\n\n` +
          `Your answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    const answerTimeMs = Date.now() - questionStartAt.value
    function recordWrong(correctValue: { high?: number[]; low?: number[] }) {
      if (hasRecordedWrong.value) return

      answerQuestion({
        isCorrect: false,
        answerTimeMs,
        payload: {
          boardCards: boardCards.value,
          playerHands: playerHands.value,
          playerStudCards: playerStudCards.value,
          gameMode: gameMode.value,
          gameType: gameType.value,
          activeSeats: activeSeats.value,
          correctValue,
        },
        userAnswer: {
          high: selectedHighSeats.value,
          low: selectedLowSeats.value,
        },
        mode: 'board-analysis',
        subMode: gameMode.value,
      })

      hasRecordedWrong.value = true
    }
    // Razz 模式只需要选择 Low
    if (gameMode.value === 'razz') {
      if (selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Razz Low 赢家
      const solvedLow = Object.entries(playerHands.value).map(([seat, cards]) => {
        const lowHand = getRazzLowHand(cards, playerStudCards.value[Number(seat)])
        return {
          seat: Number(seat),
          lowHand,
        }
      })

      // 找出最好的 Low 牌
      let bestLow = solvedLow[0]
      for (const player of solvedLow) {
        if (
          player.lowHand.score < bestLow.lowHand.score ||
          (player.lowHand.score === bestLow.lowHand.score &&
            compareHighCards(player.lowHand.highCards, bestLow.lowHand.highCards) < 0)
        ) {
          bestLow = player
        }
      }

      // 找出所有平局的玩家
      const lowWinnerSeats = solvedLow
        .filter(
          (p) =>
            p.lowHand.score === bestLow.lowHand.score &&
            compareHighCards(p.lowHand.highCards, bestLow.lowHand.highCards) === 0
        )
        .map((p) => p.seat)
        .sort((a, b) => a - b)

      const lowCorrect =
        lowWinnerSeats.length === selectedLowSeats.value.length &&
        lowWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!lowCorrect) {
        recordWrong({ low: lowWinnerSeats })
        const lowWinnerDetails = lowWinnerSeats
          .map((seat) => {
            const player = solvedLow.find((s) => s.seat === seat)
            return `Player ${seat}: ${player?.lowHand.cards.join(' ')}`
          })
          .join('\n')

        resultMessage.value =
          `Wrong ❌\n\n` +
          `Low winner(s): ${lowWinnerSeats.join(', ')}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }
      answerQuestion({
        isCorrect: true,
        answerTimeMs,
        payload: {
          boardCards: boardCards.value,
          playerHands: playerHands.value,
          playerStudCards: playerStudCards.value,
          gameMode: gameMode.value,
          gameType: gameType.value,
          activeSeats: activeSeats.value,
          correctValue: {
            low: lowWinnerSeats,
          },
        },
        userAnswer: {
          high: selectedHighSeats.value ?? [],
          low: selectedLowSeats.value ?? [],
        },
        mode: 'board-analysis',
        subMode: gameMode.value,
      })
      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Badugi 模式只需要选择 Low
    if (gameMode.value === 'badugi') {
      if (selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Badugi 赢家
      const solvedBadugi = Object.entries(playerHands.value).map(([seat, cards]) => {
        const badugiHand = getBadugiHand(cards)
        return {
          seat: Number(seat),
          badugiHand,
        }
      })

      // 找出最好的 Badugi 牌
      let bestBadugi = solvedBadugi[0]
      for (const player of solvedBadugi) {
        if (compareBadugiHands(player.badugiHand, bestBadugi.badugiHand) < 0) {
          bestBadugi = player
        }
      }

      // 找出所有平局的玩家
      const badugiWinnerSeats = solvedBadugi
        .filter((p) => compareBadugiHands(p.badugiHand, bestBadugi.badugiHand) === 0)
        .map((p) => p.seat)
        .sort((a, b) => a - b)

      const badugiCorrect =
        badugiWinnerSeats.length === selectedLowSeats.value.length &&
        badugiWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!badugiCorrect) {
        recordWrong({
          low: badugiWinnerSeats,
        })
        const badugiWinnerDetails = badugiWinnerSeats
          .map((seat) => {
            const player = solvedBadugi.find((s) => s.seat === seat)
            const cardCount = player?.badugiHand.count
            const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
            return `Player ${seat}: ${player?.badugiHand.validCards.join(' ')} (${cardType})`
          })
          .join('\n')

        resultMessage.value =
          `Wrong ❌\n\n` +
          `Winner(s): ${badugiWinnerSeats.join(', ')}\n` +
          `${badugiWinnerDetails}\n\n` +
          `Your answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }
      answerQuestion({
        isCorrect: true,
        answerTimeMs,
        payload: {
          boardCards: boardCards.value,
          playerHands: playerHands.value,
          playerStudCards: playerStudCards.value,
          gameMode: gameMode.value,
          gameType: gameType.value,
          activeSeats: activeSeats.value,
          correctValue: {
            low: badugiWinnerSeats,
          },
        },
        userAnswer: {
          high: selectedHighSeats.value ?? [],
          low: selectedLowSeats.value ?? [],
        },
        mode: 'board-analysis',
        subMode: gameMode.value,
      })
      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // 其他模式（High 或 High-Low）
    if (
      selectedHighSeats.value.length === 0 &&
      (gameType.value === 'high' || selectedLowSeats.value.length === 0)
    ) {
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
    let finalLowWinnerSeats: number[] = []
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
          A: 1,
          '2': 2,
          '3': 3,
          '4': 4,
          '5': 5,
          '6': 6,
          '7': 7,
          '8': 8,
          '9': 9,
          T: 10,
          J: 11,
          Q: 12,
          K: 13,
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
          .filter(
            (p) => compareLowHands(p.lowHand!.cards, bestLow.lowHand!.cards, rankValues) === 0
          )
          .map((p) => p.seat)
          .sort((a, b) => a - b)
        finalLowWinnerSeats = lowWinnerSeats
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
        recordWrong({
          high: highWinnerSeats,
          low: lowWinnerSeats,
        })
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
        recordWrong({
          high: highWinnerSeats,
        })
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Correct winner(s): ${highWinnerSeats.join(', ')}\n\n` +
          `Winning hand(s):\n${highWinnerDetails}\n\n` +
          `Your answer: ${selectedHighSeats.value.join(', ') || 'None'}`
        showResult.value = true
      }
    }

    if (isCorrect) {
      answerQuestion({
        isCorrect: true,
        answerTimeMs,
        payload: {
          boardCards: boardCards.value,
          playerHands: playerHands.value,
          playerStudCards: playerStudCards.value,
          gameMode: gameMode.value,
          gameType: gameType.value,
          activeSeats: activeSeats.value,
          correctValue: {
            high: highWinnerSeats,
            low: finalLowWinnerSeats,
          },
        },
        userAnswer: {
          high: selectedHighSeats.value ?? [],
          low: selectedLowSeats.value ?? [],
        },
        mode: 'board-analysis',
        subMode: gameMode.value,
      })
      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }
  }

  /* =============================== 生命周期 =============================== */

  onMounted(async () => {
    dealNewHand()
    await nextTick()
    boardRef.value = document.querySelector('.board')
    if (userStore.profile) {
      startSession({
        sessionId: crypto.randomUUID(),
        userId: userStore.profile.uid,
        mode: 'board-analysis',
        subMode: gameMode.value,
      })
    }
  })

  watch(playerCount, async () => {
    dealNewHand()
    await nextTick()
  })

  // 当切换到 7 Card Stud 或 Razz 模式时，限制最大人数为 6
  watch(gameMode, (newMode) => {
    if ((newMode === '7stud' || newMode === 'razz') && playerCount.value > 6) {
      playerCount.value = 6
    }
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
      <div
        class="chip-stage board"
        ref="boardRef"
        :style="{
          backgroundImage: `url(${bg})`,
          backgroundSize: backgroundPosition.size,
          backgroundPosition: `${backgroundPosition.x} ${backgroundPosition.y}`,
        }"
      >
        <div class="board-overlay">
          <TextureAnalysisPanel
            :board-cards="boardCards"
            anchor-selector=".board-overlay"
            :enabled="isTextureAnalysisEnabled"
          />
          <!-- 公共牌 (仅在非 7 Card Stud、Razz、Badugi、Badacey、Badeucey、Lowball A-5、Lowball 2-7 和 Archie 模式下显示) -->
          <!-- Ari 模式显示 1 张公共牌在第三张牌的位置 -->
          <div
            v-if="gameMode !== '7stud' && gameMode !== 'razz' && gameMode !== 'badugi' && gameMode !== 'badacey' && gameMode !== 'badeucey' && gameMode !== 'lowball-a5' && gameMode !== 'lowball-27' && gameMode !== 'archie'"
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
              :style="{
                left: gameMode === 'ari' ? `${2 * cardSpacing}px` : `${i * cardSpacing}px`,
                zIndex: i + 1
              }"
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
                <!-- Stud Cards (7 Card Stud / Razz) -->
                <div
                  v-if="(gameMode === '7stud' || gameMode === 'razz') && playerStudCards[seat]"
                  class="stud-cards-container"
                  :style="getStudCardContainerStyle(seat)"
                >
                  <div
                    v-for="(card, i) in playerStudCards[seat]"
                    :key="`stud-${i}`"
                    class="stud-card dim-card"
                    :style="{
                      top: `${getStudCardOffset(seat, i).top}px`,
                      left: `${getStudCardOffset(seat, i).left}px`,
                      transform: `rotate(${getStudCardRotation(seat)}deg)`,
                      zIndex: 100 + i,
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
                <!-- Stud Cards (7 Card Stud / Razz) -->
                <div
                  v-if="(gameMode === '7stud' || gameMode === 'razz') && playerStudCards[seat]"
                  class="stud-cards-container"
                  :style="getStudCardContainerStyle(seat)"
                >
                  <div
                    v-for="(card, i) in playerStudCards[seat]"
                    :key="`stud-${i}`"
                    class="stud-card"
                    :style="{
                      top: `${getStudCardOffset(seat, i).top}px`,
                      left: `${getStudCardOffset(seat, i).left}px`,
                      transform: `rotate(${getStudCardRotation(seat)}deg)`,
                      zIndex: 100 + i,
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
                <div class="mini-chip high-mini-chip">{{ highChipLabel }}</div>
                <div class="mini-chip low-mini-chip">{{ lowChipLabel }}</div>
              </div>

              <!-- High 状态显示 High Chip -->
              <div v-if="handStatuses[seat] === 'high'" class="single-chip">
                <div class="mini-chip high-mini-chip">{{ highChipLabel }}</div>
              </div>

              <!-- Low 状态显示 Low Chip -->
              <div v-if="handStatuses[seat] === 'low'" class="single-chip">
                <div class="mini-chip low-mini-chip">{{ lowChipLabel }}</div>
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
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border-radius: 16px;
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 700;
    font-family: 'Segoe UI', 'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif;
    color: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
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
