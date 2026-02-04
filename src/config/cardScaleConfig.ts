/**
 * 🎯 全局卡牌缩放配置
 *
 * 调整这些值可以统一控制所有牌的大小（公共牌、手牌、牌堆）
 * 适用于不同屏幕尺寸和设备类型
 */

export interface CardScaleConfig {
  /** 桌面端缩放系数 (>1024px) */
  desktop: number
  /** 移动端横屏缩放系数 (≤1024px, landscape) */
  mobileLandscape: number
  /** 移动端竖屏缩放系数 (≤1024px, portrait) */
  mobilePortrait: number
}

/**
 * 默认卡牌缩放配置
 *
 * 推荐调整范围：
 * - desktop: 0.8 - 1.2
 * - mobileLandscape: 0.65 - 0.9
 * - mobilePortrait: 0.5 - 0.75
 */
export const DEFAULT_CARD_SCALE: CardScaleConfig = {
  desktop: 1.1,           // 桌面端默认大小
  mobileLandscape: 1.15,   // 移动端横屏 (80% 大小)
  mobilePortrait: 0.65,   // 移动端竖屏 (65% 大小)
}

/**
 * 牌堆额外缩放系数
 * 牌堆会在卡牌缩放基础上再乘以这个系数
 */
export const DECK_EXTRA_SCALE = 0.85

/**
 * 公共牌基础间距（像素）
 * 实际间距 = BASE_CARD_SPACING × 当前设备的卡牌缩放系数
 */
export const BASE_CARD_SPACING = 88

/**
 * 公共牌位置配置
 * 用于调整公共牌在牌桌上的位置
 */
export interface CommunityCardsPositionConfig {
  /** 垂直位置（相对于容器顶部的百分比，如 '42%'） */
  top: string
  /** 水平位置（相对于容器左侧的百分比，如 '50%'） */
  left: string
  /** 容器宽度（像素，建议 = BASE_CARD_SPACING × 5） */
  width: number
}

/**
 * 默认公共牌位置配置
 * 针对不同设备类型可以单独设置
 */
export const DEFAULT_COMMUNITY_POSITION: Record<
  keyof CardScaleConfig,
  CommunityCardsPositionConfig
> = {
  // 桌面端位置
  desktop: {
    top: '37%',
    left: '35%',
    width: 440,  // BASE_CARD_SPACING × 5 = 88 × 5
  },
  // 移动端横屏位置
  mobileLandscape: {
    top: '40%',    // 稍微上移，适应横屏
    left: '48%',   // 稍微左移
    width: 440,
  },
  // 移动端竖屏位置
  mobilePortrait: {
    top: '38%',    // 更靠上
    left: '50%',
    width: 440,
  },
}

/**
 * 根据设备类型获取卡牌缩放系数
 */
export function getCardScale(
  width: number,
  height: number,
  config: CardScaleConfig = DEFAULT_CARD_SCALE
): number {
  const isLandscape = width > height

  if (width <= 1024) {
    return isLandscape ? config.mobileLandscape : config.mobilePortrait
  }
  return config.desktop
}

/**
 * 根据设备类型获取设备类型标识
 */
export function getDeviceType(width: number, height: number): keyof CardScaleConfig {
  const isLandscape = width > height

  if (width <= 1024) {
    return isLandscape ? 'mobileLandscape' : 'mobilePortrait'
  }
  return 'desktop'
}
