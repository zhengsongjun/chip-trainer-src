/**
 * 布局配置类型定义
 * 用于保存用户自定义的牌桌布局
 */

/**
 * 元素位置和缩放配置
 */
export interface ElementTransform {
  /** 水平位置（百分比，如 '50%'） */
  left?: string
  /** 垂直位置（百分比，如 '42%'） */
  top?: string
  /** 右侧位置（百分比，如 '20%'） */
  right?: string
  /** 底部位置（百分比，如 '15%'） */
  bottom?: string
  /** 缩放比例 (0.5 - 2.0) */
  scale: number
  /** 旋转角度（度，只读，不可调整） */
  rotation?: number
}

/**
 * 公共牌布局配置
 */
export interface CommunityCardsLayout {
  /** 位置和缩放 */
  transform: ElementTransform
  /** 卡牌间距（像素） */
  spacing: number
}

/**
 * 牌堆布局配置
 */
export interface DeckLayout {
  /** 位置和缩放 */
  transform: ElementTransform
}

/**
 * 玩家手牌布局配置（8个座位）
 */
export interface PlayerHandsLayout {
  /** 所有手牌统一缩放比例 */
  uniformScale: number
  /** 每个座位的位置（1-8） */
  positions: Record<number, {
    left?: string
    top?: string
    right?: string
    bottom?: string
  }>
}

/**
 * 7 Card Stud 明牌配置（单个座位）
 */
export interface StudCardsConfig {
  /** 相对 hole cards 的水平位置（像素） */
  left?: string
  /** 相对 hole cards 的垂直位置（像素） */
  top?: string
  /** 右侧位置（像素） */
  right?: string
  /** 底部位置（像素） */
  bottom?: string
}

/**
 * 7 Card Stud 布局配置（所有座位）
 */
export interface StudLayout {
  /** 所有座位的明牌统一缩放比例 */
  uniformScale: number
  /** 每个座位的明牌位置（1, 3, 4, 5, 6, 8） */
  positions: Record<number, StudCardsConfig>
}

/**
 * 设备类型
 */
export type DeviceType = 'desktop' | 'mobileLandscape' | 'mobilePortrait'

/**
 * 游戏模式
 */
export type GameMode =
  | 'holdem'
  | 'omaha'
  | 'bigo'
  | '7stud'
  | 'razz'
  | 'razzdugi'
  | 'razzdeucey'
  | '5card-draw'
  | 'badugi'
  | 'lowball-a5'
  | 'lowball-27'
  | 'ari'
  | 'archie'
  | 'badacey'
  | 'badeucey'
  | 'double-board-omaha'
  | 'double-board-bigo'
  | 'double-board-holdem'

/**
 * 完整布局配置（针对特定设备和游戏模式）
 */
export interface BoardLayoutConfig {
  /** 公共牌布局 */
  communityCards: CommunityCardsLayout
  /** 牌堆布局 */
  deck: DeckLayout
  /** 玩家手牌布局 */
  playerHands: PlayerHandsLayout
  /** 7 Card Stud 明牌布局（仅 7stud 和 razz 模式使用） */
  studCards?: StudLayout
  /** Double Board Omaha 下方公共牌布局 */
  communityCardsBottom?: CommunityCardsLayout
}

/**
 * 用户布局配置（支持多设备、多游戏模式）
 */
export interface UserLayoutConfig {
  /** 用户 ID */
  userId: string
  /** 上次更新时间 */
  updatedAt: number
  /** 布局配置（按设备类型 -> 游戏模式） */
  layouts: {
    [deviceType in DeviceType]?: {
      [gameMode in GameMode]?: BoardLayoutConfig
    }
  }
}

/**
 * 默认布局配置
 */
export const DEFAULT_LAYOUT_CONFIG: BoardLayoutConfig = {
  communityCards: {
    transform: {
      top: '42%',
      left: '50%',
      scale: 1.0,
    },
    spacing: 88,
  },
  communityCardsBottom: {
    transform: {
      top: '58%',
      left: '50%',
      scale: 1.0,
    },
    spacing: 88,
  },
  deck: {
    transform: {
      bottom: '50%',
      left: '50%',
      scale: 0.85,
    },
  },
  playerHands: {
    uniformScale: 1.0,
    positions: {
      1: { bottom: '15%', left: '22%' },
      2: { bottom: '35%', left: '10%' },
      3: { top: '17%', left: '20%' },
      4: { top: '10%', left: '28%' },
      5: { top: '10%', left: '62%' },
      6: { top: '11%', left: '85%' },
      7: { bottom: '20%', right: '18%' },
      8: { bottom: '8%', left: '48%' },
    },
  },
  studCards: {
    uniformScale: 1.0,
    positions: {
      1: { top: '72%', left: '24%' },
      2: { top: '55%', left: '12%' },
      3: { top: '28%', left: '22%' },
      4: { top: '22%', left: '30%' },
      5: { top: '22%', left: '64%' },
      6: { top: '22%', left: '82%' },
      7: { top: '65%', left: '78%' },
      8: { top: '72%', left: '50%' },
    },
  },
}

/**
 * 布局调整模式状态
 */
export interface LayoutEditState {
  /** 是否处于编辑模式 */
  isEditing: boolean
  /** 当前选中的元素 */
  selectedElement: 'communityCards' | 'communityCardsBottom' | 'deck' | `player-${number}` | `stud-${number}` | null
  /** 是否显示网格辅助线 */
  showGrid: boolean
  /** 是否已修改（未保存） */
  isDirty: boolean
}
