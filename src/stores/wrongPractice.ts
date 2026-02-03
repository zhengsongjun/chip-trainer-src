import { defineStore } from 'pinia'

/**
 * 单道错题（直接来自 answers）
 */
export type WrongPracticeItem = {
  mode: 'chip' | 'board-analysis'
  subMode: string
  payload: any
  answeredAt: number
}

const STORAGE_KEY = 'wrong-practice'

export const useWrongPracticeStore = defineStore('wrongPractice', {
  state: () => ({
    items: [] as WrongPracticeItem[],
  }),

  actions: {
    /**
     * ✅ 覆盖写入整批错题
     * localStorage 只存裸数组
     */
    setPracticeItems(items: WrongPracticeItem[]) {
      this.items = items
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    },

    /**
     * 🔁 页面刷新 / 直进练习页时恢复
     */
    restoreFromStorage() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        this.items = []
        return
      }

      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          this.items = parsed
        } else {
          this.items = []
        }
      } catch (e) {
        console.error('[WrongPracticeStore] restore failed', e)
        this.items = []
      }
    },

    /**
     * 🧹 清空错题（练习完成 / 主动退出）
     */
    clear() {
      this.items = []
      localStorage.removeItem(STORAGE_KEY)
    },

    /**
     * 🧪 调试用
     */
    debug() {
      console.log('[WrongPracticeStore.items]', this.items)
    },
  },
})
