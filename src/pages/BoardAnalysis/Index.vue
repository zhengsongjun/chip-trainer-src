<script setup lang="ts">
  import { ref, onMounted, watch, nextTick, computed, onUnmounted } from 'vue'
  import bg from '@/assets/bg/poker table.png?url'
  import { ElMessage } from 'element-plus'
  import { Hand } from 'pokersolver'
  import { Setting } from '@element-plus/icons-vue'
  import {
    readHoldemHandHigh,
    readOmahaHandHigh,
    readOmahaHandLowA5,
    read7CardHandHigh,
    read5CardA5LowHands,
    read5Card27LowHands,
    read7CardHandLowA5Regular,
    read7CardHandLow8orBetter,
    read7CardHandLow27,
    getLowballA5Score,
    readBadugiHands,
    readBadugiHands27,
    read5CardHigh,
    read5Card49,
    read5CardZero,
    read6CardsHigh9sOrBetter,
    read5CardA5Low8orBetter,
    read7CardBadugiA5,
    read7CardBadugi27,
    type WinnerResult,
  } from '@/utils/PokerHandReader'
  import BoardConfigBar from './components/BoardConfigBar.vue'
  import CardFace from '@/components/cards/CardFace.vue'
  import CardBack from '@/components/cards/CardBack.vue'
  import CardStackNew from '@/components/cards/CardStackNew.vue'
  import TextureAnalysisPanel from './components/TextureAnalysisPanel.vue'
  import HandContextMenu from './components/HandContextMenu.vue'
  import LayoutEditor from './components/LayoutEditor.vue'
  import DraggableElement from './components/DraggableElement.vue'
  import Fireworks from '@/components/Fireworks.vue'
  import useBoardAnalysisTrainingI18n from '@/i18n/customHook/useBoardAnalysis'
  import { DEFAULT_CARD_SCALE, DECK_EXTRA_SCALE, BASE_CARD_SPACING, DEFAULT_COMMUNITY_POSITION, getDeviceType } from '@/config/cardScaleConfig'
  import { getSelectionIndicatorConfig } from '@/config/selectionIndicatorConfig'
  import { getLayoutForDeviceAndMode, saveLayoutConfig, resetLayoutConfig } from '@/services/layoutConfigService'
  import type { BoardLayoutConfig, LayoutEditState } from '@/types/layoutConfig'
  import { DEFAULT_LAYOUT_CONFIG } from '@/types/layoutConfig'
  import { useUserStore } from '@/stores/user'

  const { pageTitle, markHigh, markLow, kill, close } = useBoardAnalysisTrainingI18n()

  /* =============================== 基础状态 =============================== */

  const userStore = useUserStore()

  const showFireworks = ref(false)
  const playerCount = ref<number>(2)
  const gameMode = ref<'holdem' | 'omaha' | 'bigo' | '7stud' | 'razz' | 'razzdugi' | 'razzdeucey' | '5card-draw' | 'badugi' | 'lowball-a5' | 'lowball-27' | 'ari' | 'archie' | 'badacey' | 'badeucey' | 'drawmaha' | 'drawmaha-49' | 'drawmaha-zero' | 'drawmaha-27' | 'double-board-omaha' | 'double-board-bigo' | 'double-board-holdem'>('omaha')

  // 当前悬浮的座位（用于 Stud Cards 和 Hand Cards 联动 hover 效果）
  const hoveredSeat = ref<number | null>(null)

  // UI 折叠状态（移动端横屏）
  const isUICollapsed = ref(false)

  /* =============================== 布局调整系统 =============================== */

  // 布局配置
  const currentLayout = ref<BoardLayoutConfig>(JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG)))

  // 编辑状态
  const layoutEditState = ref<LayoutEditState>({
    isEditing: false,
    selectedElement: null,
    showGrid: false,
    isDirty: false,
  })

  /* =============================== 卡牌缩放系数 =============================== */

  /**
   * 🎯 全局卡牌缩放配置
   * 在 src/config/cardScaleConfig.ts 中修改 DEFAULT_CARD_SCALE 即可调整所有设备的卡牌大小
   */
  const CARD_SCALE_FACTOR = ref(DEFAULT_CARD_SCALE)

  // 当前设备类型
  const deviceType = ref<keyof typeof DEFAULT_CARD_SCALE>('desktop')

  // 当前卡牌缩放比例
  const currentCardScale = computed(() => {
    return CARD_SCALE_FACTOR.value[deviceType.value]
  })

  // 牌堆缩放（卡牌缩放 × 额外系数）
  const deckScale = computed(() => {
    return currentCardScale.value * DECK_EXTRA_SCALE
  })

  // 检测设备类型
  function updateDeviceType() {
    deviceType.value = getDeviceType(window.innerWidth, window.innerHeight)
  }

  onMounted(() => {
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateDeviceType)
  })

  const boardCards = ref<string[]>([])
  // Double Board Omaha 下方公共牌
  const boardCardsBottom = ref<string[]>([])
  const playerHands = ref<Record<number, string[]>>({})
  // 7 Card Stud 专用：每个玩家的 4 张明牌
  const playerStudCards = ref<Record<number, string[]>>({})

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

  // 公共牌位置控制（响应设备类型）
  const communityCardsPosition = computed(() => {
    return DEFAULT_COMMUNITY_POSITION[deviceType.value]
  })

  const activeSeats = ref<number[]>([])

  function pickRandomSeats(count: number): number[] {
    // 7 Card Stud、Razz、Razzdugi 和 Razzdeucey 模式下，只使用 1, 3, 4, 5, 6, 8 号座位（排除 2 和 7）
    // Badugi、Lowball A-5、Lowball 2-7、Ari、Archie、Badacey 和 Badeucey 模式使用所有8个座位
    const allSeats =
      gameMode.value === '7stud' || gameMode.value === 'razz' || gameMode.value === 'razzdugi' || gameMode.value === 'razzdeucey'
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

  type HandStatus = 'none' | 'high' | 'low' | 'both' | 'kill' | 'hand' | 'board'

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
    // 位置由 DraggableElement 控制，这里返回缩放和旋转（与玩家手牌相同的旋转）
    const playerRotation = playerPositions.value[seat - 1]?.transform || 'rotateZ(0deg)'
    return {
      transform: `scale(${currentCardScale.value * (currentLayout.value.studCards?.uniformScale || 1.0)}) ${playerRotation}`,
      transformOrigin: 'center center',
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

  // 游戏类型：High 或 High Low 或 A-5 Low 或 2-7 Low 或 Badugi 或 Lowball A-5 或 Lowball 2-7 或 Ari 或 Archie 或 Badacey 或 Badeucey 或 Razzdugi 或 Razzdeucey 或 Double Board
  const gameType = ref<'high' | 'high-low' | 'a5-low' | '2-7-low' | 'badugi' | 'lowball-a5-type' | 'lowball-27-type' | 'ari-type' | 'archie-type' | 'badacey-type' | 'badeucey-type' | 'razzdugi-type' | 'razzdeucey-type' | 'double-board-high' | 'double-board-bestbest'>('high')

  /* =============================== 结果弹窗 =============================== */

  const showResult = ref(false)
  const resultMessage = ref('')

  /* =============================== 派生状态 =============================== */

  const activeHighSeatSet = computed(() => {
    const set = new Set<number>()
    Object.entries(handStatuses.value).forEach(([seat, status]) => {
      if (status === 'high' || status === 'both' || status === 'hand' || status === 'board') {
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
    } else if (gameMode.value === 'razzdugi') {
      return 'BADUGI'
    } else if (gameMode.value === 'razzdeucey') {
      return 'BADUGI'
    } else if ((gameMode.value === 'double-board-omaha' && gameType.value === 'double-board-high') || (gameMode.value === 'double-board-bigo' && gameType.value === 'double-board-high') || gameMode.value === 'double-board-holdem') {
      return 'TOP'
    } else if ((gameMode.value === 'double-board-omaha' && gameType.value === 'double-board-bestbest') || (gameMode.value === 'double-board-bigo' && gameType.value === 'double-board-bestbest')) {
      return 'HIGH'
    }
    return 'HIGH'
  })

  const lowChipLabel = computed(() => {
    if ((gameMode.value === 'double-board-omaha' && gameType.value === 'double-board-high') || (gameMode.value === 'double-board-bigo' && gameType.value === 'double-board-high') || gameMode.value === 'double-board-holdem') {
      return 'BOTTOM'
    } else if ((gameMode.value === 'double-board-omaha' && gameType.value === 'double-board-bestbest') || (gameMode.value === 'double-board-bigo' && gameType.value === 'double-board-bestbest')) {
      return 'LOW'
    }
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
    const deck = shuffle(fullDeck)

    // 🎯 随机选座位
    activeSeats.value = pickRandomSeats(playerCount.value)

    const hands: Record<number, string[]> = {}
    const studCards: Record<number, string[]> = {}
    const statuses: Record<number, HandStatus> = {}

    if (gameMode.value === '7stud' || gameMode.value === 'razz' || gameMode.value === 'razzdugi' || gameMode.value === 'razzdeucey') {
      // 7 Card Stud / Razz / Razzdugi / Razzdeucey: 不需要公共牌
      boardCards.value = []
      boardCardsBottom.value = []

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
      boardCardsBottom.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 4)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'lowball-a5') {
      // Lowball A-5: 不需要公共牌，每人5张牌
      boardCards.value = []
      boardCardsBottom.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'lowball-27') {
      // Lowball 2-7: 不需要公共牌，每人5张牌
      boardCards.value = []
      boardCardsBottom.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'ari') {
      // Ari: 1张公共牌，每人5张牌
      boardCards.value = deck.splice(0, 1)
      boardCardsBottom.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'archie') {
      // Archie: 没有公共牌，每人5张牌
      boardCards.value = []
      boardCardsBottom.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'badacey') {
      // Badacey A-5: 没有公共牌，每人5张牌
      boardCards.value = []
      boardCardsBottom.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'badeucey') {
      // Badeucey 2-7: 没有公共牌，每人5张牌
      boardCards.value = []
      boardCardsBottom.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'drawmaha') {
      // Drawmaha: 5张公共牌，每人5张手牌
      boardCards.value = deck.splice(0, 5)
      boardCardsBottom.value = []

      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, 5)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else if (gameMode.value === 'double-board-omaha' || gameMode.value === 'double-board-bigo' || gameMode.value === 'double-board-holdem') {
      // Double Board Omaha/Big O/Hold'em: 上下各5张公共牌
      boardCards.value = deck.splice(0, 5)
      boardCardsBottom.value = deck.splice(0, 5)

      const cardsPerPlayer = gameMode.value === 'double-board-bigo' ? 5 : gameMode.value === 'double-board-holdem' ? 2 : 4
      for (const seat of activeSeats.value) {
        hands[seat] = deck.splice(0, cardsPerPlayer)
        statuses[seat] = 'none'
      }
      playerStudCards.value = {}
    } else {
      // Hold'em / Omaha / Big O: 有公共牌
      boardCards.value = deck.splice(0, 5)
      boardCardsBottom.value = []

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
  const boardScale = ref<number>(1) // 牌桌缩放比例

  // 计算牌桌缩放比例
  function calculateBoardScale() {
    if (!boardRef.value) {
      console.log('boardRef is null')
      return
    }

    const containerWidth = boardRef.value.clientWidth
    const containerHeight = boardRef.value.clientHeight

    console.log('Container size:', containerWidth, 'x', containerHeight)

    // 背景图片原始尺寸
    const bgOriginalWidth = 1000
    const bgOriginalHeight = 600

    // 计算容器相对于背景原始尺寸的缩放比例
    const scaleX = containerWidth / bgOriginalWidth
    const scaleY = containerHeight / bgOriginalHeight

    // 使用最小缩放比例，确保背景完全可见
    boardScale.value = Math.min(scaleX, scaleY, 1) // 最大不超过1，避免放大
    console.log('Calculated scale:', boardScale.value)
  }

  // 点击手牌显示菜单
  function onHandClick(seat: number, e: MouseEvent) {
    // 在布局编辑模式下不触发右键菜单
    if (layoutEditState.value.isEditing) {
      return
    }

    e.preventDefault()
    e.stopPropagation() // 阻止事件冒泡到 document

    // 计算相对于 board 的坐标
    if (boardRef.value) {
      const rect = boardRef.value.getBoundingClientRect()
      // 计算点击位置相对于 board 左上角的坐标
      const relativeX = e.clientX - rect.left
      const relativeY = e.clientY - rect.top

      console.log('Board rect:', rect)
      console.log('Click relative position:', relativeX, relativeY)

      contextMenu.value = {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        seat,
      }
    }
  }

  // 关闭菜单
  function closeContextMenu() {
    contextMenu.value.visible = false
  }

  // 标记为 Hand (Drawmaha)
  function markAsHand() {
    const seat = contextMenu.value.seat
    const currentStatus = handStatuses.value[seat]

    if (currentStatus === 'board') {
      handStatuses.value[seat] = 'both'
    } else if (currentStatus === 'both') {
      handStatuses.value[seat] = 'board'
    } else {
      handStatuses.value[seat] = handStatuses.value[seat] === 'hand' ? 'none' : 'hand'
    }
    closeContextMenu()
  }

  // 标记为 Board (Drawmaha)
  function markAsBoard() {
    const seat = contextMenu.value.seat
    const currentStatus = handStatuses.value[seat]

    if (currentStatus === 'hand') {
      handStatuses.value[seat] = 'both'
    } else if (currentStatus === 'both') {
      handStatuses.value[seat] = 'hand'
    } else {
      handStatuses.value[seat] = handStatuses.value[seat] === 'board' ? 'none' : 'board'
    }
    closeContextMenu()
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

  /* =============================== 布局管理 =============================== */

  // 获取选中边框配置
  const communityCardsIndicator = computed(() => getSelectionIndicatorConfig(deviceType.value, 'communityCards'))
  const deckIndicator = computed(() => getSelectionIndicatorConfig(deviceType.value, 'deck'))
  const playerHandIndicator = computed(() => getSelectionIndicatorConfig(deviceType.value, 'playerHand'))
  const studCardsIndicator = computed(() => getSelectionIndicatorConfig(deviceType.value, 'studCards'))

  // 加载布局配置
  async function loadLayoutConfig() {
    if (!userStore.profile?.uid) {
      currentLayout.value = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG))
      return
    }

    try {
      const layout = await getLayoutForDeviceAndMode(
        userStore.profile.uid,
        deviceType.value,
        gameMode.value
      )
      // 确保 studCards 配置存在
      if (!layout.studCards) {
        layout.studCards = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG.studCards))
      }
      currentLayout.value = layout
    } catch (error) {
      console.error('Failed to load layout config:', error)
      currentLayout.value = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG))
    }
  }

  // 切换编辑模式
  function toggleLayoutEdit() {
    layoutEditState.value.isEditing = !layoutEditState.value.isEditing
    if (!layoutEditState.value.isEditing) {
      layoutEditState.value.selectedElement = null
    }
  }

  // 保存布局
  async function handleSaveLayout() {
    if (!userStore.profile?.uid) {
      ElMessage.warning('请先登录')
      return
    }

    try {
      const success = await saveLayoutConfig(
        userStore.profile.uid,
        deviceType.value,
        gameMode.value,
        currentLayout.value
      )

      if (success) {
        ElMessage.success('布局已保存')
        layoutEditState.value.isDirty = false
      } else {
        ElMessage.error('保存失败，请重试')
      }
    } catch (error) {
      console.error('Failed to save layout:', error)
      ElMessage.error('保存失败')
    }
  }

  // 重置布局
  async function handleResetLayout() {
    if (!userStore.profile?.uid) {
      currentLayout.value = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG))
      layoutEditState.value.isDirty = true
      ElMessage.success('已重置为默认布局')
      return
    }

    try {
      const success = await resetLayoutConfig(
        userStore.profile.uid,
        deviceType.value,
        gameMode.value
      )

      if (success) {
        await loadLayoutConfig()
        ElMessage.success('已重置为默认布局')
      } else {
        ElMessage.error('重置失败')
      }
    } catch (error) {
      console.error('Failed to reset layout:', error)
      ElMessage.error('重置失败')
    }
  }

  // 取消编辑
  function handleCancelEdit() {
    if (layoutEditState.value.isDirty) {
      if (confirm('有未保存的更改，确定要取消吗？')) {
        layoutEditState.value.isEditing = false
        layoutEditState.value.isDirty = false
        loadLayoutConfig() // 重新加载
      }
    } else {
      layoutEditState.value.isEditing = false
    }
  }

  // 更新公共牌位置
  function updateCommunityCardsPosition(position: any) {
    currentLayout.value.communityCards.transform = {
      ...currentLayout.value.communityCards.transform,
      ...position
    }
    layoutEditState.value.isDirty = true
  }

  // 更新牌堆位置
  function updateDeckPosition(position: any) {
    currentLayout.value.deck.transform = {
      ...currentLayout.value.deck.transform,
      ...position
    }
    layoutEditState.value.isDirty = true
  }

  // 更新玩家手牌位置
  function updatePlayerPosition(seat: number, position: any) {
    currentLayout.value.playerHands.positions[seat] = {
      ...currentLayout.value.playerHands.positions[seat],
      ...position
    }
    layoutEditState.value.isDirty = true
  }

  // 更新 Stud 明牌位置
  function updateStudPosition(seat: number, position: any) {
    if (!currentLayout.value.studCards) {
      currentLayout.value.studCards = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG.studCards))
    }
    currentLayout.value.studCards.positions[seat] = {
      ...currentLayout.value.studCards.positions[seat],
      ...position
    }
    layoutEditState.value.isDirty = true
  }

  // 更新下方公共牌位置（Double Board Omaha）
  function updateCommunityCardsBottomPosition(position: any) {
    if (!currentLayout.value.communityCardsBottom) {
      currentLayout.value.communityCardsBottom = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG.communityCardsBottom))
    }
    currentLayout.value.communityCardsBottom.transform = {
      ...currentLayout.value.communityCardsBottom.transform,
      ...position
    }
    layoutEditState.value.isDirty = true
  }

  // 监听设备类型和游戏模式变化，重新加载配置
  watch([deviceType, gameMode], () => {
    loadLayoutConfig()
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
    if (gameMode.value === '7stud' || gameMode.value === 'razz' || gameMode.value === 'razzdugi' || gameMode.value === 'razzdeucey') {
      // 7 Card Stud / Razz / Razzdugi / Razzdeucey: 3张hole cards + 4张stud cards，选最好的5张
      const allCards = [...holeCards, ...(studCards || [])]
      return Hand.solve(allCards.map(toSolverCard))
    } else if (gameMode.value === 'holdem') {
      // Hold'em: 手牌2张 + 公共牌5张，选最好的5张
      return Hand.solve([...holeCards, ...board].map(toSolverCard))
    } else if (gameMode.value === 'drawmaha') {
      // Drawmaha: 同时计算两种情况，但不比较它们的牌力
      // 1. 5张手牌成一手牌
      const handOnly = Hand.solve(holeCards.map(toSolverCard))

      // 2. 2张手牌 + 3张公共牌的最佳组合
      const holeCombos = combinations(holeCards, 2)
      const boardCombos = combinations(board, 3)

      const allPossibleHands = []
      for (const hole of holeCombos) {
        for (const boardPart of boardCombos) {
          const hand = Hand.solve([...hole, ...boardPart].map(toSolverCard))
          allPossibleHands.push(hand)
        }
      }

      const bestBoardHand = Hand.winners(allPossibleHands)[0]

      // 返回 both 类型，包含 Hand 和 Board 两种牌力
      const result = Object.create(handOnly)
      result.type = 'both'
      result.handOnly = handOnly
      result.bestBoardHand = bestBoardHand

      return result
    } else if (gameMode.value === 'drawmaha-49') {
      // Drawmaha 49: 同时计算两种情况，但不比较它们的牌力
      // 1. 5张手牌成一手牌（计算 49 点分数）
      const handScore = calculateDrawmaha49Score(holeCards)

      // 2. 2张手牌 + 3张公共牌的最佳组合（Omaha High）
      const holeCombos = combinations(holeCards, 2)
      const boardCombos = combinations(board, 3)

      const allPossibleHands = []
      for (const hole of holeCombos) {
        for (const boardPart of boardCombos) {
          const hand = Hand.solve([...hole, ...boardPart].map(toSolverCard))
          allPossibleHands.push(hand)
        }
      }

      const bestBoardHand = Hand.winners(allPossibleHands)[0]

      // 返回 both 类型，包含 Hand 分数和 Board 牌力
      const result = Object.create(bestBoardHand)
      result.type = 'both'
      result.handScore = handScore
      result.bestBoardHand = bestBoardHand

      return result
    } else if (gameMode.value === 'drawmaha-zero') {
      // Drawmaha Zero: 同时计算两种情况，但不比较它们的牌力
      // 1. 5张手牌成一手牌（计算 0 点分数）
      const handScore = calculateDrawmahaZeroScore(holeCards)

      // 2. 2张手牌 + 3张公共牌的最佳组合（Omaha High）
      const holeCombos = combinations(holeCards, 2)
      const boardCombos = combinations(board, 3)

      const allPossibleHands = []
      for (const hole of holeCombos) {
        for (const boardPart of boardCombos) {
          const hand = Hand.solve([...hole, ...boardPart].map(toSolverCard))
          allPossibleHands.push(hand)
        }
      }

      const bestBoardHand = Hand.winners(allPossibleHands)[0]

      // 返回 both 类型，包含 Hand 分数和 Board 牌力
      const result = Object.create(bestBoardHand)
      result.type = 'both'
      result.handScore = handScore
      result.bestBoardHand = bestBoardHand

      return result
    } else if (gameMode.value === 'drawmaha-27') {
      // Drawmaha 2-7: 同时计算两种情况，但不比较它们的牌力
      // 1. 5张手牌成一手牌（2-7 Lowball）
      const handOnly = read5Card27LowHands({ 0: holeCards }).hands[0]

      // 2. 2张手牌 + 3张公共牌的最佳组合（Omaha High）
      const holeCombos = combinations(holeCards, 2)
      const boardCombos = combinations(board, 3)

      const allPossibleHands = []
      for (const hole of holeCombos) {
        for (const boardPart of boardCombos) {
          const hand = Hand.solve([...hole, ...boardPart].map(toSolverCard))
          allPossibleHands.push(hand)
        }
      }

      const bestBoardHand = Hand.winners(allPossibleHands)[0]

      // 返回 both 类型，包含 Hand 和 Board 两种牌力
      const result = Object.create(bestBoardHand)
      result.type = 'both'
      result.handOnly = handOnly
      result.bestBoardHand = bestBoardHand

      return result
    } else if (gameMode.value === '5card-draw') {
      // 5 Card Draw: 5张手牌直接组成一手牌
      const hand = Hand.solve(holeCards.map(toSolverCard))
      return hand
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
   * 计算 Low 牌型 (8 or better) - 用于 Omaha/Big O
   * Low 规则：每张牌都 ≤8，不能有对子，同花和顺子不影响牌力
   * 比较时高牌更低的获胜
   * 注意：7 Card Stud High-Low 使用 read7CardHandLow8orBetter 函数
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

    if (gameMode.value === 'holdem') {
      // Hold'em: 不支持 Low
      return null
    }

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

  // 计算 Drawmaha 49 模式的 Hand 分数（接近 49 为胜）
  function calculateDrawmaha49Score(cards: string[]): number {
    const rankValues: Record<string, number> = {
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      '10': 10,
      'j': 0,
      'q': 0,
      'k': 0,
      'a': 1
    }

    let totalScore = 0
    for (const card of cards) {
      const rank = card.slice(0, -1).toLowerCase()
      totalScore += rankValues[rank] || 0
    }

    return Math.abs(totalScore - 49) // 返回与 49 的距离，越小越好
  }

  // 计算 Drawmaha Zero 模式的 Hand 分数（接近 0 为胜）
  function calculateDrawmahaZeroScore(cards: string[]): number {
    const rankValues: Record<string, number> = {
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      '10': 10,
      'j': 0,
      'q': 0,
      'k': 0,
      'a': 1
    }

    let totalScore = 0
    for (const card of cards) {
      const rank = card.slice(0, -1).toLowerCase()
      totalScore += rankValues[rank] || 0
    }

    return Math.abs(totalScore - 0) // 返回与 0 的距离，越小越好
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
   * 比较高牌（从大到小），返回负数表示 hand1 更好（更低）
   */
  function compareHighCards(hand1: number[], hand2: number[]): number {
    for (let i = 0; i < 5; i++) {
      if (hand1[i] < hand2[i]) return -1
      if (hand1[i] > hand2[i]) return 1
    }
    return 0
  }


  function checkAnswer() {
    // Badeucey 2-7 模式需要同时判断 Badugi 2-7 和 2-7 Low
    if (gameMode.value === 'badeucey') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Badugi 2-7 赢家（从5张牌选最好的4张，A=14）
      const badugiResult = readBadugiHands27(playerHands.value)
      const badugiWinnerSeats = badugiResult.seats

      const badugiWinnerDetails = badugiWinnerSeats
        .map((seat, index) => {
          const hand = badugiResult.hands[index]
          const cardCount = hand?.count
          const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
          return `Player ${seat}: ${hand?.validCards.join(' ')} (${cardType})`
        })
        .join('\n')

      // 计算 2-7 Low 赢家（5张牌，无 qualifier）
      const lowResult = read5Card27LowHands(playerHands.value)
      const lowWinnerSeats = lowResult.seats

      const lowWinnerDetails = lowWinnerSeats
        .map((seat, index) => {
          const hand = lowResult.hands[index]
          return `Player ${seat}: ${hand?.cards?.join(' ') || ''}`
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
      const badugiResult = readBadugiHands(playerHands.value)
      const badugiWinnerSeats = badugiResult.seats

      const badugiWinnerDetails = badugiWinnerSeats
        .map((seat, index) => {
          const hand = badugiResult.hands[index]
          const cardCount = hand?.count
          const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
          return `Player ${seat}: ${hand?.validCards.join(' ')} (${cardType})`
        })
        .join('\n')

      // 计算 A-5 Low 赢家（5张牌，无 qualifier）
      const lowResult = read5CardA5LowHands(playerHands.value)
      const lowWinnerSeats = lowResult.seats

      const lowWinnerDetails = lowWinnerSeats
        .map((seat, index) => {
          const hand = lowResult.hands[index]
          return `Player ${seat}: ${hand?.cards?.join(' ') || ''}`
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
      const highResult = read6CardsHigh9sOrBetter(playerHands.value)
      const highWinnerSeats = highResult.seats
      const highWinnerDetails = highWinnerSeats.length > 0
        ? highWinnerSeats.map((seat, i) => `Player ${seat}: ${highResult.hands[i]?.descr || ''}`).join('\n')
        : ''

      // 计算 Low 赢家（只用5张手牌，A-5规则，8 or better qualifier）
      const lowResult = read5CardA5Low8orBetter(playerHands.value)
      const lowWinnerSeats = lowResult.seats
      const lowWinnerDetails = lowWinnerSeats.length > 0
        ? lowWinnerSeats.map((seat, i) => `Player ${seat}: ${lowResult.hands[i]?.descr || ''}`).join('\n')
        : ''

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
      // 构建每个玩家的6张牌（5张手牌 + 1张公共牌）
      const playerHandsWith6Cards: Record<number, string[]> = {}
      for (const [seat, cards] of Object.entries(playerHands.value)) {
        playerHandsWith6Cards[Number(seat)] = [...cards, ...boardCards.value]
      }
      const highResult = read6CardsHigh9sOrBetter(playerHandsWith6Cards)
      const highWinnerSeats = highResult.seats
      const highWinnerDetails = highWinnerSeats.length > 0
        ? highWinnerSeats.map((seat, i) => `Player ${seat}: ${highResult.hands[i]?.descr || ''}`).join('\n')
        : ''

      // 计算 Low 赢家（只用5张手牌，A-5规则，8 or better qualifier）
      const lowResult = read5CardA5Low8orBetter(playerHands.value)
      const lowWinnerSeats = lowResult.seats
      const lowWinnerDetails = lowWinnerSeats.length > 0
        ? lowWinnerSeats.map((seat, i) => `Player ${seat}: ${lowResult.hands[i]?.descr || ''}`).join('\n')
        : ''

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
      const solvedLowball27 = read5Card27LowHands(playerHands.value)

      // 找出最好的 Lowball 2-7 牌
      const bestLowball27 = solvedLowball27

      // 找出所有平局的玩家
      const lowball27WinnerSeats = bestLowball27.seats

      const lowball27Correct =
        lowball27WinnerSeats.length === selectedLowSeats.value.length &&
        lowball27WinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!lowball27Correct) {
        const lowball27WinnerDetails = lowball27WinnerSeats
          .map((seat) => {
            const winnerHand = bestLowball27.hands.find((_, index) => bestLowball27.seats[index] === seat)
            return `Player ${seat}: ${winnerHand?.descr || ''}`
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
      const lowResult = read5CardA5LowHands(playerHands.value)

      const lowballCorrect =
        lowResult.seats.length === selectedLowSeats.value.length &&
        lowResult.seats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!lowballCorrect) {
        const lowballWinnerDetails = lowResult.seats
          .map((seat) => {
            const winnerHand = lowResult.hands.find((_, index) => lowResult.seats[index] === seat)
            return `Player ${seat}: ${winnerHand?.descr || ''}`
          })
          .join('\n')

        resultMessage.value =
          `Wrong ❌\n\n` +
          `Winner(s): ${lowResult.seats.join(', ')}\n` +
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

    // Razz 模式只需要选择 Low
    if (gameMode.value === 'razz') {
      if (selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Razz Low 赢家（根据 gameType 选择 A-5 或 2-7）
      const lowResult = gameType.value === '2-7-low'
        ? read7CardHandLow27(playerHands.value, playerStudCards.value)
        : read7CardHandLowA5Regular(playerHands.value, playerStudCards.value)

      const lowCorrect =
        lowResult.seats.length === selectedLowSeats.value.length &&
        lowResult.seats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!lowCorrect) {
        const lowWinnerDetails = lowResult.seats
          .map((seat) => {
            const winnerHand = lowResult.hands.find((_, index) => lowResult.seats[index] === seat)
            return `Player ${seat}: ${winnerHand?.descr || ''}`
          })
          .join('\n')

        resultMessage.value =
          `Wrong ❌\n\n` +
          `Low winner(s): ${lowResult.seats.join(', ')}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Razzdugi A-5 模式：需要同时判断 Razz Low 和 Badugi
    if (gameMode.value === 'razzdugi') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Badugi 赢家（从7张牌选最好的4张）
      const badugiResult = read7CardBadugiA5(playerHands.value, playerStudCards.value)
      const badugiWinnerSeats = badugiResult.seats

      const badugiWinnerDetails = badugiWinnerSeats
        .map((seat, index) => {
          const hand = badugiResult.hands[index]
          const cardCount = hand?.count
          const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
          return `Player ${seat}: ${hand?.validCards.join(' ')} (${cardType})`
        })
        .join('\n')

      // 计算 Razz Low 赢家（A-5 规则）
      const lowResult = read7CardHandLowA5Regular(playerHands.value, playerStudCards.value)
      const lowWinnerSeats = lowResult.seats

      const lowWinnerDetails = lowWinnerSeats
        .map((seat, index) => {
          const hand = lowResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''}`
        })
        .join('\n')

      // 检查 Badugi 答案（使用 High 位置）
      const badugiCorrect =
        badugiWinnerSeats.length === selectedHighSeats.value.length &&
        badugiWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      // 检查 Razz Low 答案
      const lowCorrect =
        lowWinnerSeats.length === selectedLowSeats.value.length &&
        lowWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!badugiCorrect || !lowCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Badugi winner(s): ${badugiWinnerSeats.join(', ')}\n` +
          `${badugiWinnerDetails}\n\n` +
          `Razz Low winner(s): ${lowWinnerSeats.join(', ')}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your Badugi answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your Razz Low answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Razzdeucey 2-7 模式：需要同时判断 Razz 2-7 Low 和 Badugi 2-7
    if (gameMode.value === 'razzdeucey') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Badugi 2-7 赢家（从7张牌选最好的4张，A=14）
      const badugiResult = read7CardBadugi27(playerHands.value, playerStudCards.value)
      const badugiWinnerSeats = badugiResult.seats

      const badugiWinnerDetails = badugiWinnerSeats
        .map((seat, index) => {
          const hand = badugiResult.hands[index]
          const cardCount = hand?.count
          const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
          return `Player ${seat}: ${hand?.validCards.join(' ')} (${cardType})`
        })
        .join('\n')

      // 计算 Razz 2-7 Low 赢家
      const lowResult = read7CardHandLow27(playerHands.value, playerStudCards.value)
      const lowWinnerSeats = lowResult.seats

      const lowWinnerDetails = lowWinnerSeats
        .map((seat, index) => {
          const hand = lowResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''}`
        })
        .join('\n')

      // 检查 Badugi 2-7 答案（使用 High 位置）
      const badugiCorrect =
        badugiWinnerSeats.length === selectedHighSeats.value.length &&
        badugiWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      // 检查 Razz 2-7 Low 答案
      const lowCorrect =
        lowWinnerSeats.length === selectedLowSeats.value.length &&
        lowWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!badugiCorrect || !lowCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Badugi 2-7 winner(s): ${badugiWinnerSeats.join(', ')}\n` +
          `${badugiWinnerDetails}\n\n` +
          `Razz 2-7 Low winner(s): ${lowWinnerSeats.join(', ')}\n` +
          `${lowWinnerDetails}\n\n` +
          `Your Badugi 2-7 answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your Razz 2-7 Low answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Drawmaha 2-7 模式：比较 Hand（2-7 Lowball）和 Board（Omaha High）
    if (gameMode.value === 'drawmaha-27') {
      // 检查是否有玩家被标记了 Hand 或 Board 或 Both
      const markedSeats = Object.entries(handStatuses.value)
        .filter(([_, status]) => status === 'hand' || status === 'board' || status === 'both')
        .map(([seat]) => Number(seat))

      if (markedSeats.length === 0) {
        ElMessage.warning('请先标记获胜玩家')
        return
      }

      // 计算 Hand 类型的赢家（2-7 Lowball）
      const handResult = read5Card27LowHands(playerHands.value)
      const handWinnerSeats = handResult.seats

      // 计算 Board 类型的赢家（Omaha High）
      const boardResult = readOmahaHandHigh(boardCards.value, playerHands.value)
      const boardWinnerSeats = boardResult.seats

      // 获取所有赢家的详细信息
      const handWinnerDetails = handWinnerSeats
        .map((seat, index) => {
          const hand = handResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''} (Hand)`
        })
        .join('\n')
      const boardWinnerDetails = boardWinnerSeats
        .map((seat, index) => {
          const hand = boardResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''} (Board)`
        })
        .join('\n')

      // 验证答案：检查是否标记了正确的座位和正确的类型
      let isCorrect = true

      // 检查 Hand 类型的标记
      for (const seat of handWinnerSeats) {
        const actualType = handStatuses.value[seat]
        if (!['hand', 'both'].includes(actualType)) {
          isCorrect = false
          break
        }
      }

      // 检查 Board 类型的标记
      for (const seat of boardWinnerSeats) {
        const actualType = handStatuses.value[seat]
        if (!['board', 'both'].includes(actualType)) {
          isCorrect = false
          break
        }
      }

      // 检查是否标记了额外的座位
      const allWinnerSeats = new Set([...handWinnerSeats, ...boardWinnerSeats])
      for (const seat of markedSeats) {
        if (!allWinnerSeats.has(seat)) {
          isCorrect = false
          break
        }
      }

      // 检查是否有遗漏的座位
      if (markedSeats.length !== allWinnerSeats.size) {
        isCorrect = false
      }

      if (!isCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          (handWinnerDetails ? `Hand Winner(s):\n${handWinnerDetails}\n\n` : '') +
          (boardWinnerDetails ? `Board Winner(s):\n${boardWinnerDetails}` : '') +
          `\n\nYour answer: ${markedSeats.map(seat => {
            const type = handStatuses.value[seat] === 'hand' ? 'Hand' : handStatuses.value[seat] === 'board' ? 'Board' : 'Both'
            return `Player ${seat} (${type})`
          }).join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Drawmaha Zero 模式：比较 Hand（接近 0 点）和 Board（Omaha High）
    if (gameMode.value === 'drawmaha-zero') {
      // 检查是否有玩家被标记了 Hand 或 Board 或 Both
      const markedSeats = Object.entries(handStatuses.value)
        .filter(([_, status]) => status === 'hand' || status === 'board' || status === 'both')
        .map(([seat]) => Number(seat))

      if (markedSeats.length === 0) {
        ElMessage.warning('请先标记获胜玩家')
        return
      }

      // 计算 Hand 类型的赢家（接近 0 点）
      const handResult = read5CardZero(playerHands.value)
      const handWinnerSeats = handResult.seats

      // 计算 Board 类型的赢家（Omaha High）
      const boardResult = readOmahaHandHigh(boardCards.value, playerHands.value)
      const boardWinnerSeats = boardResult.seats

      // 获取所有赢家的详细信息
      const handWinnerDetails = handWinnerSeats
        .map((seat, index) => {
          const score = handResult.scores[index]
          return `Player ${seat}: 分数 = ${score} (Hand)`
        })
        .join('\n')
      const boardWinnerDetails = boardWinnerSeats
        .map((seat, index) => {
          const hand = boardResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''} (Board)`
        })
        .join('\n')

      // 验证答案：检查是否标记了正确的座位和正确的类型
      let isCorrect = true

      // 检查 Hand 类型的标记
      for (const seat of handWinnerSeats) {
        const actualType = handStatuses.value[seat]
        if (!['hand', 'both'].includes(actualType)) {
          isCorrect = false
          break
        }
      }

      // 检查 Board 类型的标记
      for (const seat of boardWinnerSeats) {
        const actualType = handStatuses.value[seat]
        if (!['board', 'both'].includes(actualType)) {
          isCorrect = false
          break
        }
      }

      // 检查是否标记了额外的座位
      const allWinnerSeats = new Set([...handWinnerSeats, ...boardWinnerSeats])
      for (const seat of markedSeats) {
        if (!allWinnerSeats.has(seat)) {
          isCorrect = false
          break
        }
      }

      // 检查是否有遗漏的座位
      if (markedSeats.length !== allWinnerSeats.size) {
        isCorrect = false
      }

      if (!isCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          (handWinnerDetails ? `Hand Winner(s):\n${handWinnerDetails}\n\n` : '') +
          (boardWinnerDetails ? `Board Winner(s):\n${boardWinnerDetails}` : '') +
          `\n\nYour answer: ${markedSeats.map(seat => {
            const type = handStatuses.value[seat] === 'hand' ? 'Hand' : handStatuses.value[seat] === 'board' ? 'Board' : 'Both'
            return `Player ${seat} (${type})`
          }).join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Drawmaha 49 模式：比较 Hand（接近 49 点）和 Board（Omaha High）
    if (gameMode.value === 'drawmaha-49') {
      // 检查是否有玩家被标记了 Hand 或 Board 或 Both
      const markedSeats = Object.entries(handStatuses.value)
        .filter(([_, status]) => status === 'hand' || status === 'board' || status === 'both')
        .map(([seat]) => Number(seat))

      if (markedSeats.length === 0) {
        ElMessage.warning('请先标记获胜玩家')
        return
      }

      // 计算 Hand 类型的赢家（接近 49 点）
      const handResult = read5Card49(playerHands.value)
      const handWinnerSeats = handResult.seats

      // 计算 Board 类型的赢家（Omaha High）
      const boardResult = readOmahaHandHigh(boardCards.value, playerHands.value)
      const boardWinnerSeats = boardResult.seats

      // 获取所有赢家的详细信息
      const handWinnerDetails = handWinnerSeats
        .map((seat, index) => {
          const score = handResult.scores[index]
          return `Player ${seat}: 与49的距离 = ${score} (Hand)`
        })
        .join('\n')
      const boardWinnerDetails = boardWinnerSeats
        .map((seat, index) => {
          const hand = boardResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''} (Board)`
        })
        .join('\n')

      // 验证答案：检查是否标记了正确的座位和正确的类型
      let isCorrect = true

      // 检查 Hand 类型的标记
      for (const seat of handWinnerSeats) {
        const actualType = handStatuses.value[seat]
        if (!['hand', 'both'].includes(actualType)) {
          isCorrect = false
          break
        }
      }

      // 检查 Board 类型的标记
      for (const seat of boardWinnerSeats) {
        const actualType = handStatuses.value[seat]
        if (!['board', 'both'].includes(actualType)) {
          isCorrect = false
          break
        }
      }

      // 检查是否标记了额外的座位
      const allWinnerSeats = new Set([...handWinnerSeats, ...boardWinnerSeats])
      for (const seat of markedSeats) {
        if (!allWinnerSeats.has(seat)) {
          isCorrect = false
          break
        }
      }

      // 检查是否有遗漏的座位
      if (markedSeats.length !== allWinnerSeats.size) {
        isCorrect = false
      }

      if (!isCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          (handWinnerDetails ? `Hand Winner(s):\n${handWinnerDetails}\n\n` : '') +
          (boardWinnerDetails ? `Board Winner(s):\n${boardWinnerDetails}` : '') +
          `\n\nYour answer: ${markedSeats.map(seat => {
            const type = handStatuses.value[seat] === 'hand' ? 'Hand' : handStatuses.value[seat] === 'board' ? 'Board' : 'Both'
            return `Player ${seat} (${type})`
          }).join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Drawmaha 模式：比较所有玩家的最佳牌型（Hand 或 Board）
    if (gameMode.value === 'drawmaha') {
      // 检查是否有玩家被标记了 Hand 或 Board
      const markedSeats = Object.entries(handStatuses.value)
        .filter(([_, status]) => status === 'hand' || status === 'board' || status === 'both')
        .map(([seat]) => Number(seat))

      if (markedSeats.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Hand 类型的赢家（5张手牌直接比较）
      const handResult = read5CardHigh(playerHands.value)
      const handWinnerSeats = handResult.seats

      // 计算 Board 类型的赢家（Omaha 规则：2张手牌 + 3张公共牌）
      const boardResult = readOmahaHandHigh(boardCards.value, playerHands.value)
      const boardWinnerSeats = boardResult.seats

      // 获取所有赢家的详细信息
      const handWinnerDetails = handWinnerSeats
        .map((seat, index) => {
          const hand = handResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''} (Hand)`
        })
        .join('\n')
      const boardWinnerDetails = boardWinnerSeats
        .map((seat, index) => {
          const hand = boardResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''} (Board)`
        })
        .join('\n')

      // 验证答案：检查是否标记了正确的座位和正确的类型
      let isCorrect = true

      // 检查 Hand 类型的标记
      for (const seat of handWinnerSeats) {
        const actualType = handStatuses.value[seat]
        if (!['hand', 'both'].includes(actualType)) {
          isCorrect = false
          break
        }
      }

      // 检查 Board 类型的标记
      for (const seat of boardWinnerSeats) {
        const actualType = handStatuses.value[seat]
        if (!['board', 'both'].includes(actualType)) {
          isCorrect = false
          break
        }
      }

      // 检查是否标记了额外的座位
      const allWinnerSeats = new Set([...handWinnerSeats, ...boardWinnerSeats])
      for (const seat of markedSeats) {
        if (!allWinnerSeats.has(seat)) {
          isCorrect = false
          break
        }
      }

      // 检查是否有遗漏的座位
      if (markedSeats.length !== allWinnerSeats.size) {
        isCorrect = false
      }

      if (!isCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          (handWinnerDetails ? `Hand Winner(s):\n${handWinnerDetails}\n\n` : '') +
          (boardWinnerDetails ? `Board Winner(s):\n${boardWinnerDetails}` : '') +
          `\n\nYour answer: ${markedSeats.map(seat => {
            const type = handStatuses.value[seat] === 'hand' ? 'Hand' : 'Board'
            return `Player ${seat} (${type})`
          }).join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // 5 Card Draw 模式只需要选择 High
    if (gameMode.value === '5card-draw') {
      if (selectedHighSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 5 Card Draw 赢家
      const highResult = read5CardHigh(playerHands.value)
      const highWinnerSeats = highResult.seats

      const highWinnerDetails = highWinnerSeats
        .map((seat, index) => {
          const hand = highResult.hands[index]
          return `Player ${seat}: ${hand?.descr || ''}`
        })
        .join('\n')

      // 检查答案是否正确
      const highCorrect =
        highWinnerSeats.length === selectedHighSeats.value.length &&
        highWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      if (!highCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Winner(s): ${highWinnerSeats.join(', ')}\n` +
          `${highWinnerDetails}\n\n` +
          `Your answer: ${selectedHighSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

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
      const badugiResult = readBadugiHands(playerHands.value)
      const badugiWinnerSeats = badugiResult.seats

      const badugiCorrect =
        badugiWinnerSeats.length === selectedLowSeats.value.length &&
        badugiWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!badugiCorrect) {
        const badugiWinnerDetails = badugiWinnerSeats
          .map((seat, index) => {
            const hand = badugiResult.hands[index]
            const cardCount = hand?.count
            const cardType = cardCount === 4 ? 'Badugi' : `${cardCount}-card`
            return `Player ${seat}: ${hand?.validCards.join(' ')} (${cardType})`
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

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Double Board Omaha/Big O Top/Bottom 模式：Top 和 Bottom 两个板子
    if ((gameMode.value === 'double-board-omaha' || gameMode.value === 'double-board-bigo') && gameType.value === 'double-board-high') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Top 赢家（上方公共牌）
      const topResult = readOmahaHandHigh(boardCards.value, playerHands.value)
      const topWinnerSeats = topResult.seats
      const topWinnerDetails = topWinnerSeats.length > 0
        ? topWinnerSeats.map((seat, i) => `Player ${seat}: ${topResult.hands[i]?.descr || ''}`).join('\n')
        : ''

      // 计算 Bottom 赢家（下方公共牌）
      const bottomResult = readOmahaHandHigh(boardCardsBottom.value, playerHands.value)
      const bottomWinnerSeats = bottomResult.seats
      const bottomWinnerDetails = bottomWinnerSeats.length > 0
        ? bottomWinnerSeats.map((seat, i) => `Player ${seat}: ${bottomResult.hands[i]?.descr || ''}`).join('\n')
        : ''

      // 检查 Top 答案（使用 High 位置）
      const topCorrect =
        topWinnerSeats.length === selectedHighSeats.value.length &&
        topWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      // 检查 Bottom 答案（使用 Low 位置）
      const bottomCorrect =
        bottomWinnerSeats.length === selectedLowSeats.value.length &&
        bottomWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!topCorrect || !bottomCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Top winner(s): ${topWinnerSeats.length > 0 ? topWinnerSeats.join(', ') : 'None'}\n` +
          `${topWinnerDetails}\n\n` +
          `Bottom winner(s): ${bottomWinnerSeats.length > 0 ? bottomWinnerSeats.join(', ') : 'None'}\n` +
          `${bottomWinnerDetails}\n\n` +
          `Your Top answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your Bottom answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Double Board Hold'em Top/Bottom 模式：Top 和 Bottom 两个板子
    if (gameMode.value === 'double-board-holdem') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算 Top 赢家（上方公共牌）- 使用 Hold'em 规则
      const topResult = readHoldemHandHigh(boardCards.value, playerHands.value)
      const topWinnerSeats = topResult.seats
      const topWinnerDetails = topWinnerSeats.length > 0
        ? topWinnerSeats.map((seat, i) => `Player ${seat}: ${topResult.hands[i]?.descr || ''}`).join('\n')
        : ''

      // 计算 Bottom 赢家（下方公共牌）- 使用 Hold'em 规则
      const bottomResult = readHoldemHandHigh(boardCardsBottom.value, playerHands.value)
      const bottomWinnerSeats = bottomResult.seats
      const bottomWinnerDetails = bottomWinnerSeats.length > 0
        ? bottomWinnerSeats.map((seat, i) => `Player ${seat}: ${bottomResult.hands[i]?.descr || ''}`).join('\n')
        : ''

      // 检查 Top 答案（使用 High 位置）
      const topCorrect =
        topWinnerSeats.length === selectedHighSeats.value.length &&
        topWinnerSeats.every((seat, i) => seat === selectedHighSeats.value[i])

      // 检查 Bottom 答案（使用 Low 位置）
      const bottomCorrect =
        bottomWinnerSeats.length === selectedLowSeats.value.length &&
        bottomWinnerSeats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!topCorrect || !bottomCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `Top winner(s): ${topWinnerSeats.length > 0 ? topWinnerSeats.join(', ') : 'None'}\n` +
          `${topWinnerDetails}\n\n` +
          `Bottom winner(s): ${bottomWinnerSeats.length > 0 ? bottomWinnerSeats.join(', ') : 'None'}\n` +
          `${bottomWinnerDetails}\n\n` +
          `Your Top answer: ${selectedHighSeats.value.join(', ') || 'None'}\n` +
          `Your Bottom answer: ${selectedLowSeats.value.join(', ') || 'None'}`
        showResult.value = true
        return
      }

      ElMessage.success('Correct! 🎉')
      showFireworks.value = true
      setTimeout(dealNewHand, 1200)
      return
    }

    // Double Board Omaha/Big O Best/Best 模式：High 和 Low
    if ((gameMode.value === 'double-board-omaha' || gameMode.value === 'double-board-bigo') && gameType.value === 'double-board-bestbest') {
      if (selectedHighSeats.value.length === 0 && selectedLowSeats.value.length === 0) {
        ElMessage.warning('Please select the winning player(s) first')
        return
      }

      // 计算两个板子的 High
      const topHighResult = readOmahaHandHigh(boardCards.value, playerHands.value)
      const bottomHighResult = readOmahaHandHigh(boardCardsBottom.value, playerHands.value)

      // 比较两个板子的最好 High，选出更好的那个
      let highWinnerSeats: number[] = []
      let highWinnerDetails = ''

      if (topHighResult.seats.length > 0 && bottomHighResult.seats.length > 0) {
        // 比较两个板子的最好手牌
        const topBestHand = topHighResult.hands[0]
        const bottomBestHand = bottomHighResult.hands[0]
        const winners = Hand.winners([topBestHand, bottomBestHand])

        if (winners.includes(topBestHand) && winners.includes(bottomBestHand)) {
          // 平局，两个板子的赢家都算
          highWinnerSeats = [...new Set([...topHighResult.seats, ...bottomHighResult.seats])].sort((a, b) => a - b)
          highWinnerDetails = `Top: ${topHighResult.seats.map((seat, i) => `Player ${seat}: ${topHighResult.hands[i]?.descr || ''}`).join(', ')}\n` +
            `Bottom: ${bottomHighResult.seats.map((seat, i) => `Player ${seat}: ${bottomHighResult.hands[i]?.descr || ''}`).join(', ')}`
        } else if (winners.includes(topBestHand)) {
          highWinnerSeats = topHighResult.seats
          highWinnerDetails = topHighResult.seats.map((seat, i) => `Player ${seat}: ${topHighResult.hands[i]?.descr || ''} (Top)`).join('\n')
        } else {
          highWinnerSeats = bottomHighResult.seats
          highWinnerDetails = bottomHighResult.seats.map((seat, i) => `Player ${seat}: ${bottomHighResult.hands[i]?.descr || ''} (Bottom)`).join('\n')
        }
      } else if (topHighResult.seats.length > 0) {
        highWinnerSeats = topHighResult.seats
        highWinnerDetails = topHighResult.seats.map((seat, i) => `Player ${seat}: ${topHighResult.hands[i]?.descr || ''} (Top)`).join('\n')
      } else if (bottomHighResult.seats.length > 0) {
        highWinnerSeats = bottomHighResult.seats
        highWinnerDetails = bottomHighResult.seats.map((seat, i) => `Player ${seat}: ${bottomHighResult.hands[i]?.descr || ''} (Bottom)`).join('\n')
      }

      // 计算两个板子的 Low (8 or better)
      const topLowResult = readOmahaHandLowA5(boardCards.value, playerHands.value)
      const bottomLowResult = readOmahaHandLowA5(boardCardsBottom.value, playerHands.value)

      // 比较两个板子的最好 Low，选出更好的那个
      let lowWinnerSeats: number[] = []
      let lowWinnerDetails = ''

      if (topLowResult.seats.length > 0 && bottomLowResult.seats.length > 0) {
        // 比较两个板子的最好 Low 牌（从大到小比较，越小越好）
        const rankValues: Record<string, number> = {
          A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
          '9': 9, T: 10, J: 11, Q: 12, K: 13,
        }

        const topLowCards = topLowResult.hands[0]?.cards || []
        const bottomLowCards = bottomLowResult.hands[0]?.cards || []

        const topValues = topLowCards.map((c: string) => rankValues[c[0]]).sort((a: number, b: number) => b - a)
        const bottomValues = bottomLowCards.map((c: string) => rankValues[c[0]]).sort((a: number, b: number) => b - a)

        let comparison = 0
        for (let i = 0; i < 5; i++) {
          if (topValues[i] < bottomValues[i]) {
            comparison = -1
            break
          }
          if (topValues[i] > bottomValues[i]) {
            comparison = 1
            break
          }
        }

        if (comparison === 0) {
          // 平局
          lowWinnerSeats = [...new Set([...topLowResult.seats, ...bottomLowResult.seats])].sort((a, b) => a - b)
          lowWinnerDetails = `Top: ${topLowResult.descr}\nBottom: ${bottomLowResult.descr}`
        } else if (comparison < 0) {
          lowWinnerSeats = topLowResult.seats
          lowWinnerDetails = topLowResult.seats.map((seat) => `Player ${seat}: ${topLowResult.descr} (Top)`).join('\n')
        } else {
          lowWinnerSeats = bottomLowResult.seats
          lowWinnerDetails = bottomLowResult.seats.map((seat) => `Player ${seat}: ${bottomLowResult.descr} (Bottom)`).join('\n')
        }
      } else if (topLowResult.seats.length > 0) {
        lowWinnerSeats = topLowResult.seats
        lowWinnerDetails = topLowResult.seats.map((seat) => `Player ${seat}: ${topLowResult.descr} (Top)`).join('\n')
      } else if (bottomLowResult.seats.length > 0) {
        lowWinnerSeats = bottomLowResult.seats
        lowWinnerDetails = bottomLowResult.seats.map((seat) => `Player ${seat}: ${bottomLowResult.descr} (Bottom)`).join('\n')
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
          `High winner(s): ${highWinnerSeats.length > 0 ? highWinnerSeats.join(', ') : 'None'}\n` +
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

    // 其他模式（High 或 High-Low）
    if (
      selectedHighSeats.value.length === 0 &&
      (gameType.value === 'high' || selectedLowSeats.value.length === 0)
    ) {
      ElMessage.warning('Please select the winning player(s) first')
      return
    }

    // 根据游戏模式计算 High 赢家
    let highResult: WinnerResult
    if (gameMode.value === 'holdem') {
      highResult = readHoldemHandHigh(boardCards.value, playerHands.value)
    } else if (gameMode.value === 'omaha' || gameMode.value === 'bigo') {
      highResult = readOmahaHandHigh(boardCards.value, playerHands.value)
    } else if (gameMode.value === '7stud') {
      highResult = read7CardHandHigh(playerHands.value, playerStudCards.value)
    } else {
      // 其他模式使用原来的 getBestHand 函数
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
      const winnerSeats = solvedHigh
        .filter((s) => highWinners.includes(s.hand))
        .map((s) => s.seat)
        .sort((a, b) => a - b)

      const winnerHands = solvedHigh
        .filter((s) => winnerSeats.includes(s.seat))
        .map((s) => s.hand)

      highResult = {
        seats: winnerSeats,
        hands: winnerHands,
        descr: winnerHands[0]?.descr || '',
      }
    }

    // 检查 High 答案
    const highCorrect =
      highResult.seats.length === selectedHighSeats.value.length &&
      highResult.seats.every((seat, i) => seat === selectedHighSeats.value[i])

    let isCorrect = highCorrect

    const highWinnerDetails = highResult.seats
      .map((seat) => {
        const playerHand = playerHands.value[seat]
        const winnerHand = highResult.hands.find((_, index) => highResult.seats[index] === seat)
        return `Player ${seat}: ${winnerHand?.descr || ''}`
      })
      .join('\n')

    // 检查 Low 答案（如果是 High-Low 模式）
    if (gameType.value === 'high-low') {
      let lowResult: WinnerResult
      if (gameMode.value === 'omaha' || gameMode.value === 'bigo') {
        lowResult = readOmahaHandLowA5(boardCards.value, playerHands.value)
      } else if (gameMode.value === '7stud') {
        // 7 Card Stud High-Low 使用 8/Better 限制
        lowResult = read7CardHandLow8orBetter(playerHands.value, playerStudCards.value)
      } else {
        // 其他模式使用原来的 getLowHand 函数
        const solvedLow = Object.entries(playerHands.value).map(([seat, cards]) => {
          const lowHand = getLowHand(cards, boardCards.value, playerStudCards.value[Number(seat)])
          return {
            seat: Number(seat),
            lowHand,
          }
        })

        const validLowPlayers = solvedLow.filter((s) => s.lowHand?.valid)

        if (validLowPlayers.length === 0) {
          lowResult = {
            seats: [],
            hands: [],
            descr: 'No qualifying low',
          }
        } else {
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

          let bestLow = validLowPlayers[0]
          for (const player of validLowPlayers) {
            if (compareLowHands(player.lowHand!.cards, bestLow.lowHand!.cards, rankValues) < 0) {
              bestLow = player
            }
          }

          const winnerSeats = validLowPlayers
            .filter((p) => compareLowHands(p.lowHand!.cards, bestLow.lowHand!.cards, rankValues) === 0)
            .map((p) => p.seat)
            .sort((a, b) => a - b)

          const winnerHands = validLowPlayers
            .filter((p) => winnerSeats.includes(p.seat))
            .map((p) => ({
              cards: p.lowHand!.cards,
              descr: p.lowHand!.cards.join(' '),
            }))

          lowResult = {
            seats: winnerSeats,
            hands: winnerHands,
            descr: bestLow.lowHand!.cards.join(' '),
          }
        }
      }

      const lowCorrect =
        lowResult.seats.length === selectedLowSeats.value.length &&
        lowResult.seats.every((seat, i) => seat === selectedLowSeats.value[i])

      if (!lowCorrect) {
        isCorrect = false
      }

      const lowWinnerDetails = lowResult.seats
        .map((seat) => {
          const winnerHand = lowResult.hands.find((_, index) => lowResult.seats[index] === seat)
          return `Player ${seat}: ${winnerHand?.descr || ''}`
        })
        .join('\n')

      if (!isCorrect) {
        resultMessage.value =
          `Wrong ❌\n\n` +
          `High winner(s): ${highResult.seats.join(', ')}\n` +
          `${highWinnerDetails}\n\n` +
          `Low winner(s): ${lowResult.seats.length > 0 ? lowResult.seats.join(', ') : 'No qualifying low'}\n` +
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
          `Correct winner(s): ${highResult.seats.join(', ')}\n\n` +
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
    console.log('boardRef after nextTick:', boardRef.value)
    calculateBoardScale()

    // 监听窗口大小变化
    window.addEventListener('resize', calculateBoardScale)

    // 加载布局配置
    await loadLayoutConfig()
  })

  // 清理监听器
  onUnmounted(() => {
    window.removeEventListener('resize', calculateBoardScale)
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

  <!-- 编辑器工具栏 -->
  <LayoutEditor
    v-model:layout-config="currentLayout"
    v-model:edit-state="layoutEditState"
    @save="handleSaveLayout"
    @reset="handleResetLayout"
    @cancel="handleCancelEdit"
  />

  <!-- 网格辅助线 -->
  <div v-if="layoutEditState.showGrid" class="layout-grid"></div>

  <!-- 移动端折叠按钮 -->
  <button
    class="mobile-collapse-btn"
    @click="isUICollapsed = !isUICollapsed"
    :title="isUICollapsed ? '展开控制面板' : '折叠控制面板'"
  >
    <span v-if="isUICollapsed">☰</span>
    <span v-else>✕</span>
  </button>

  <!-- 折叠状态下的快捷操作栏 -->
  <div class="mobile-quick-actions" v-show="isUICollapsed">
    <button class="quick-btn quick-btn-submit" @click="checkAnswer" title="提交答案">✓</button>
    <button class="quick-btn quick-btn-next" @click="handleNextQuestion" title="下一题">→</button>
  </div>

  <div class="ui-page" :class="{ 'ui-collapsed': isUICollapsed }">
    <div class="ui-stage">
      <div class="ui-panel trainer-header" v-show="!isUICollapsed">
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>

      <BoardConfigBar
        v-show="!isUICollapsed"
        :is-layout-editing="layoutEditState.isEditing"
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
        @toggle-layout-edit="toggleLayoutEdit"
      />

      <!-- 训练舞台 -->
      <div
        class="chip-stage board"
        ref="boardRef"
        :style="{
          backgroundImage: `url(${bg})`,
          backgroundSize: backgroundPosition.size, // 固定为 125%
          backgroundPosition: `${backgroundPosition.x} ${backgroundPosition.y}`,
          '--board-scale': boardScale
        }"
      >
        <TextureAnalysisPanel
          :board-cards="boardCards"
          anchor-selector=".board-overlay"
          :enabled="isTextureAnalysisEnabled"
        />
        <div class="board-overlay" :style="{
          transform: `scale(${boardScale})`,
          transformOrigin: 'center center',
          '--card-scale': currentCardScale
        }">
          <!-- 公共牌 (仅在非 7 Card Stud、Razz、Badugi、Badacey、Badeucey、Lowball A-5、Lowball 2-7、Archie 和 5 Card Draw 模式下显示) -->
          <!-- Ari 模式显示 1 张公共牌在第三张牌的位置 -->
          <!-- Double Board Omaha 模式显示上方公共牌 -->
          <DraggableElement
            v-if="gameMode !== '7stud' && gameMode !== 'razz' && gameMode !== 'badugi' && gameMode !== 'badacey' && gameMode !== 'badeucey' && gameMode !== 'lowball-a5' && gameMode !== 'lowball-27' && gameMode !== 'archie' && gameMode !== '5card-draw'"
            :is-editing="layoutEditState.isEditing"
            :is-selected="layoutEditState.selectedElement === 'communityCards'"
            element-id="communityCards"
            :initial-position="currentLayout.communityCards.transform"
            :indicator-offset="communityCardsIndicator.offset"
            :corner-size="communityCardsIndicator.cornerSize"
            @select="layoutEditState.selectedElement = 'communityCards'"
            @position-change="updateCommunityCardsPosition"
          >
            <div
              class="community-cards-group"
              :style="{
                width: `${currentLayout.communityCards.spacing * 5}px`,
                transform: `translate(-50%, -50%) scale(${currentCardScale * currentLayout.communityCards.transform.scale})`,
                transformOrigin: 'center center'
              }"
            >
              <div
                v-for="(card, i) in boardCards"
                :key="i"
                class="community-card"
                :style="{
                  left: gameMode === 'ari' ? `${2 * currentLayout.communityCards.spacing}px` : `${i * currentLayout.communityCards.spacing}px`,
                  zIndex: i + 1
                }">
                <CardFace :card="card" />
              </div>
            </div>
          </DraggableElement>

          <!-- Double Board Omaha 下方公共牌 -->
          <DraggableElement
            v-if="gameMode === 'double-board-omaha' || gameMode === 'double-board-bigo' || gameMode === 'double-board-holdem'"
            :is-editing="layoutEditState.isEditing"
            :is-selected="layoutEditState.selectedElement === 'communityCardsBottom'"
            element-id="communityCardsBottom"
            :initial-position="currentLayout.communityCardsBottom?.transform || currentLayout.communityCards.transform"
            :indicator-offset="communityCardsIndicator.offset"
            :corner-size="communityCardsIndicator.cornerSize"
            @select="layoutEditState.selectedElement = 'communityCardsBottom'"
            @position-change="updateCommunityCardsBottomPosition"
          >
            <div
              class="community-cards-group"
              :style="{
                width: `${(currentLayout.communityCardsBottom?.spacing || currentLayout.communityCards.spacing) * 5}px`,
                transform: `translate(-50%, -50%) scale(${currentCardScale * (currentLayout.communityCardsBottom?.transform.scale || currentLayout.communityCards.transform.scale)})`,
                transformOrigin: 'center center'
              }"
            >
              <div
                v-for="(card, i) in boardCardsBottom"
                :key="i"
                class="community-card"
                :style="{
                  left: `${i * (currentLayout.communityCardsBottom?.spacing || currentLayout.communityCards.spacing)}px`,
                  zIndex: i + 1
                }">
                <CardFace :card="card" />
              </div>
            </div>
          </DraggableElement>

          <!-- 牌堆 -->
          <DraggableElement
            :is-editing="layoutEditState.isEditing"
            :is-selected="layoutEditState.selectedElement === 'deck'"
            element-id="deck"
            :initial-position="currentLayout.deck.transform"
            :indicator-offset="deckIndicator.offset"
            :corner-size="deckIndicator.cornerSize"
            @select="layoutEditState.selectedElement = 'deck'"
            @position-change="updateDeckPosition"
          >
            <div
              class="deck"
              :style="{
                transform: `translateX(-50%) scale(${deckScale * currentLayout.deck.transform.scale})`,
                transformOrigin: 'center center'
              }">
              <CardStackNew :count="15" :offsetX="1" :offsetY="2.5" />
            </div>
          </DraggableElement>

          <!-- 玩家手牌 -->
          <DraggableElement
            v-for="seat in activeSeats"
            :key="seat"
            :is-editing="layoutEditState.isEditing"
            :is-selected="layoutEditState.selectedElement === `player-${seat}`"
            :element-id="`player-${seat}`"
            :initial-position="currentLayout.playerHands.positions[seat]"
            :indicator-offset="playerHandIndicator.offset"
            :corner-size="playerHandIndicator.cornerSize"
            @select="layoutEditState.selectedElement = `player-${seat}`"
            @position-change="(pos) => updatePlayerPosition(seat, pos)"
          >
            <div
              class="player-area"
              :class="{ 'player-area-hover': hoveredSeat === seat }"
              :style="{
                transform: `scale(${currentCardScale * currentLayout.playerHands.uniformScale}) ${playerPositions[seat - 1].transform}`,
                transformOrigin: 'center center'
              }"
              @click="onHandClick(seat, $event)"
              @mouseenter="hoveredSeat = seat"
              @mouseleave="hoveredSeat = null"
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
                    :scale="boardScale"
                    :active="activeHighSeatSet.has(seat - 1)"
                    :activeLow="activeLowSeatSet.has(seat - 1)"
                    :has-selection="handStatuses[seat] !== 'none' && hasSelection"
                  />
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

              <!-- 同时是 Hand 和 Board 状态显示两个 Chip -->
              <div v-if="(gameMode === 'drawmaha' || gameMode === 'drawmaha-49' || gameMode === 'drawmaha-zero' || gameMode === 'drawmaha-27') && handStatuses[seat] === 'both'" class="both-chips">
                <div class="mini-chip high-mini-chip">HAND</div>
                <div class="mini-chip low-mini-chip">BOARD</div>
              </div>

              <!-- Hand 状态显示 Hand Chip（单独显示） -->
              <div v-else-if="(gameMode === 'drawmaha' || gameMode === 'drawmaha-49' || gameMode === 'drawmaha-zero' || gameMode === 'drawmaha-27') && handStatuses[seat] === 'hand'" class="single-chip">
                <div class="mini-chip high-mini-chip">HAND</div>
              </div>

              <!-- Board 状态显示 Board Chip（单独显示） -->
              <div v-else-if="(gameMode === 'drawmaha' || gameMode === 'drawmaha-49' || gameMode === 'drawmaha-zero' || gameMode === 'drawmaha-27') && handStatuses[seat] === 'board'" class="single-chip">
                <div class="mini-chip low-mini-chip">BOARD</div>
              </div>
            </div>
          </div>
          </DraggableElement>

          <!-- Stud Cards (7 Card Stud / Razz / Razzdugi / Razzdeucey) - 独立于玩家手牌，相对于牌桌定位 -->
          <template v-if="(gameMode === '7stud' || gameMode === 'razz' || gameMode === 'razzdugi' || gameMode === 'razzdeucey')">
            <DraggableElement
              v-for="seat in activeSeats"
              :key="`stud-${seat}`"
              v-show="playerStudCards[seat]"
              :is-editing="layoutEditState.isEditing"
              :is-selected="layoutEditState.selectedElement === `stud-${seat}`"
              :element-id="`stud-${seat}`"
              :initial-position="currentLayout.studCards?.positions[seat] || {}"
              :indicator-offset="studCardsIndicator.offset"
              :corner-size="studCardsIndicator.cornerSize"
              @select="layoutEditState.selectedElement = `stud-${seat}`"
              @position-change="(pos) => updateStudPosition(seat, pos)"
            >
              <div
                class="stud-cards-area"
                :class="{ 'stud-cards-area-hover': hoveredSeat === seat }"
                :style="getStudCardContainerStyle(seat)"
                @click="onHandClick(seat, $event)"
                @mouseenter="hoveredSeat = seat"
                @mouseleave="hoveredSeat = null"
              >
                <div
                  v-for="(card, i) in playerStudCards[seat]"
                  :key="`stud-${i}`"
                  class="stud-card"
                  :class="{ 'dim-card': handStatuses[seat] === 'kill' }"
                  :style="{
                    top: `${getStudCardOffset(seat, i).top}px`,
                    left: `${getStudCardOffset(seat, i).left}px`,
                    transform: `rotate(${getStudCardRotation(seat)}deg)`,
                    zIndex: 100 + i,
                  }"
                >
                  <template v-if="handStatuses[seat] === 'kill'">
                    <CardBack />
                  </template>
                  <template v-else>
                    <CardFace
                      :card="card"
                      :scale="boardScale"
                      :active="activeHighSeatSet.has(seat - 1)"
                      :activeLow="activeLowSeatSet.has(seat - 1)"
                      :has-selection="handStatuses[seat] !== 'none' && hasSelection"
                    />
                  </template>
                </div>
              </div>
            </DraggableElement>
          </template>
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
          @mark-hand="markAsHand"
          @mark-board="markAsBoard"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* ===============================
 布局调整按钮
 =============================== */

  /* 桌面端按钮 */
  /* 网格辅助线 */
  .layout-grid {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index: 999;
  }

  /* ===============================
 移动端折叠按钮
 =============================== */

  .mobile-collapse-btn {
    display: none; /* 默认隐藏 */
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 10001;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    font-size: 20px;
    color: #333;
    transition: all 0.3s ease;
  }

  .mobile-collapse-btn:hover {
    background: #fff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  }

  .mobile-collapse-btn:active {
    transform: scale(0.95);
  }

  /* 快捷操作栏 */
  .mobile-quick-actions {
    display: none; /* 默认隐藏 */
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    gap: 12px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 28px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .quick-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .quick-btn-submit {
    background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  }

  .quick-btn-submit:hover {
    background: linear-gradient(135deg, #66bb6a 0%, #388e3c 100%);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }

  .quick-btn-next {
    background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
  }

  .quick-btn-next:hover {
    background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }

  .quick-btn:active {
    transform: scale(0.95);
  }

  /* 移动端横屏模式 - 调整为更大的断点以覆盖 iPhone 14 Pro Max 等大屏手机 */
  @media (max-width: 1024px) and (orientation: landscape) {
    .mobile-collapse-btn,
    .mobile-quick-actions {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 折叠状态：减少页面 padding */
    .ui-page.ui-collapsed {
      padding: var(--space-2);
    }

    /* 折叠状态：牌桌占满高度 */
    .ui-collapsed .board {
      margin-top: 0;
      height: calc(100vh - 32px); /* 减去页面 padding */
    }

    /* 移动端横屏：优化牌桌布局 */
    .board {
      background-size: cover !important; /* 背景填满容器 */
      background-position: center 45% !important; /* 微调背景位置 */
    }

    /* 移动端横屏的公共牌和牌堆位置由 DraggableElement 控制 */
  }

  /* 小屏竖屏也显示折叠按钮 */
  @media (max-width: 768px) and (orientation: portrait) {
    .mobile-collapse-btn,
    .mobile-quick-actions {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ui-page.ui-collapsed {
      padding: var(--space-2);
    }
  }

  /* ===============================
 牌桌
 =============================== */

  .board {
    position: relative;
    width: 100%;
    height: 600px;
    margin-top: 16px;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 125%;
    overflow: hidden;
  }

  .board-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: scale(var(--board-scale, 1));
    transform-origin: center center;
  }

  .board-overlay {
    position: absolute;
    inset: 0;
  }

  /* ===============================
 公共牌 & 牌堆
 =============================== */

  .community-cards-group {
    height: 100px;
  }

  .deck {
    transform-origin: center center;
  }

  /* ===============================
 玩家手牌
 =============================== */

  .player-area {
    /* position 由 DraggableElement 控制 */
  }

  .player-hand {
    position: relative;
    height: 90px;
    width: 100%;
    overflow: visible;
  }

  .hand-card {
    position: absolute;
    top: 0;
    z-index: 1;
  }

  /* ===============================
 7 Card Stud 明牌区域
 =============================== */

  .stud-cards-container {
    /* 位置由 DraggableElement 控制 */
    position: relative;
    z-index: 50;
  }

  .stud-card {
    position: absolute;
    /* transform (rotation) 通过 inline style 动态设置 */
    z-index: 50;
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

  .player-area:hover,
  .player-area-hover {
    opacity: 0.95;
  }

  .stud-cards-area {
    cursor: pointer;
  }

  .stud-cards-area:hover,
  .stud-cards-area-hover {
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
