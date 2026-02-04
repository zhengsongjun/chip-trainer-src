/**
 * 选中指示器配置
 * 用于调整编辑模式下元素边框和角点的位置
 */

import type { DeviceType } from '@/types/layoutConfig'

/**
 * 元素选中边框配置
 */
export interface SelectionIndicatorConfig {
  /** 边框距离元素的偏移（像素） */
  offset: {
    top: number
    right: number
    bottom: number
    left: number
  }
  /** 角点大小（像素） */
  cornerSize: number
}

/**
 * 不同元素类型的边框配置
 */
export interface ElementSelectionConfig {
  /** 公共牌边框配置 */
  communityCards: SelectionIndicatorConfig
  /** 牌堆边框配置 */
  deck: SelectionIndicatorConfig
  /** 玩家手牌边框配置 */
  playerHand: SelectionIndicatorConfig
  /** 7 Card Stud 明牌边框配置 */
  studCards: SelectionIndicatorConfig
}

/**
 * 按设备类型区分的边框配置
 */
export const SELECTION_INDICATOR_CONFIG: Record<DeviceType, ElementSelectionConfig> = {
  desktop: {
    communityCards: {
      offset: { top: -8, right: -8, bottom: -8, left: -8 },
      cornerSize: 12,
    },
    deck: {
      offset: { top: -15, right: -15, bottom: -15, left: -55 },
      cornerSize: 12,
    },
    playerHand: {
      offset: { top: -6, right: -6, bottom: -6, left: -6 },
      cornerSize: 10,
    },
    studCards: {
      offset: { top: -8, right: -8, bottom: -8, left: -8 },
      cornerSize: 10,
    },
  },
  mobileLandscape: {
    communityCards: {
      offset: { top: -6, right: -6, bottom: -6, left: -6 },
      cornerSize: 10,
    },
    deck: {
      offset: { top: -12, right: -12, bottom: -12, left: -12 },
      cornerSize: 10,
    },
    playerHand: {
      offset: { top: -5, right: -5, bottom: -5, left: -5 },
      cornerSize: 8,
    },
    studCards: {
      offset: { top: -6, right: -6, bottom: -6, left: -6 },
      cornerSize: 8,
    },
  },
  mobilePortrait: {
    communityCards: {
      offset: { top: -5, right: -5, bottom: -5, left: -5 },
      cornerSize: 8,
    },
    deck: {
      offset: { top: -10, right: -10, bottom: -10, left: -10 },
      cornerSize: 8,
    },
    playerHand: {
      offset: { top: -4, right: -4, bottom: -4, left: -4 },
      cornerSize: 8,
    },
    studCards: {
      offset: { top: -5, right: -5, bottom: -5, left: -5 },
      cornerSize: 8,
    },
  },
}

/**
 * 获取选中边框配置
 */
export function getSelectionIndicatorConfig(
  deviceType: DeviceType,
  elementType: 'communityCards' | 'deck' | 'playerHand' | 'studCards'
): SelectionIndicatorConfig {
  return SELECTION_INDICATOR_CONFIG[deviceType][elementType]
}
