import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type {
  UserLayoutConfig,
  BoardLayoutConfig,
  DeviceType,
  GameMode,
} from '@/types/layoutConfig'
import { DEFAULT_LAYOUT_CONFIG } from '@/types/layoutConfig'

/**
 * Firebase 布局配置服务
 */

const COLLECTION_NAME = 'userBoardLayouts'

/**
 * 共享布局的游戏模式映射
 * Razz、Razzdugi 和 Razzdeucey 与 7stud 共享同一套布局配置
 */
function getSharedGameMode(gameMode: GameMode): GameMode {
  if (gameMode === 'razz' || gameMode === 'razzdugi' || gameMode === 'razzdeucey') {
    return '7stud'
  }
  return gameMode
}

/**
 * 获取用户的布局配置
 */
export async function getUserLayoutConfig(userId: string): Promise<UserLayoutConfig | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as UserLayoutConfig
    }
    return null
  } catch (error) {
    console.error('Failed to get user layout config:', error)
    return null
  }
}

/**
 * 获取特定设备和游戏模式的布局配置
 */
export async function getLayoutForDeviceAndMode(
  userId: string,
  deviceType: DeviceType,
  gameMode: GameMode
): Promise<BoardLayoutConfig> {
  const userConfig = await getUserLayoutConfig(userId)

  // Razz、Razzdugi、Razzdeucey 和 7stud 共享布局配置
  const sharedMode = getSharedGameMode(gameMode)

  // 如果没有配置或没有对应的设备/模式配置，返回默认配置
  if (!userConfig?.layouts?.[deviceType]?.[sharedMode]) {
    return DEFAULT_LAYOUT_CONFIG
  }

  return userConfig.layouts[deviceType][sharedMode]
}

/**
 * 保存布局配置
 */
export async function saveLayoutConfig(
  userId: string,
  deviceType: DeviceType,
  gameMode: GameMode,
  layoutConfig: BoardLayoutConfig
): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId)
    const docSnap = await getDoc(docRef)

    const now = Date.now()

    // Razz 和 7stud 共享布局配置
    const sharedMode = getSharedGameMode(gameMode)

    if (docSnap.exists()) {
      // 更新现有配置
      const existingData = docSnap.data() as UserLayoutConfig
      const updatedData: UserLayoutConfig = {
        ...existingData,
        updatedAt: now,
        layouts: {
          ...existingData.layouts,
          [deviceType]: {
            ...existingData.layouts?.[deviceType],
            [sharedMode]: layoutConfig,
          },
        },
      }

      await updateDoc(docRef, updatedData)
    } else {
      // 创建新配置
      const newData: UserLayoutConfig = {
        userId,
        updatedAt: now,
        layouts: {
          [deviceType]: {
            [sharedMode]: layoutConfig,
          },
        },
      }

      await setDoc(docRef, newData)
    }

    return true
  } catch (error) {
    console.error('Failed to save layout config:', error)
    return false
  }
}

/**
 * 重置布局配置到默认值
 */
export async function resetLayoutConfig(
  userId: string,
  deviceType: DeviceType,
  gameMode: GameMode
): Promise<boolean> {
  return saveLayoutConfig(userId, deviceType, gameMode, DEFAULT_LAYOUT_CONFIG)
}

/**
 * 批量保存多个设备的布局配置
 */
export async function batchSaveLayoutConfigs(
  userId: string,
  configs: Array<{
    deviceType: DeviceType
    gameMode: GameMode
    layoutConfig: BoardLayoutConfig
  }>
): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId)
    const docSnap = await getDoc(docRef)

    const now = Date.now()
    let layouts: UserLayoutConfig['layouts'] = {}

    if (docSnap.exists()) {
      const existingData = docSnap.data() as UserLayoutConfig
      layouts = existingData.layouts || {}
    }

    // 合并所有配置
    for (const { deviceType, gameMode, layoutConfig } of configs) {
      // Razz 和 7stud 共享布局配置
      const sharedMode = getSharedGameMode(gameMode)
      if (!layouts[deviceType]) {
        layouts[deviceType] = {}
      }
      layouts[deviceType]![sharedMode] = layoutConfig
    }

    const data: UserLayoutConfig = {
      userId,
      updatedAt: now,
      layouts,
    }

    await setDoc(docRef, data)
    return true
  } catch (error) {
    console.error('Failed to batch save layout configs:', error)
    return false
  }
}
