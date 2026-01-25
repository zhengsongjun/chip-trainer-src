import { defineStore } from 'pinia'
import type { UserProfile } from '@/services/userProfile'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null as UserProfile | null,
    profileLoaded: false, // ⭐ 核心
  }),

  getters: {
    isAdmin: (state) => {
      return state.profileLoaded && state.profile?.role === 'admin'
    },
  },

  actions: {
    setProfile(profile: UserProfile) {
      this.profile = profile
      this.profileLoaded = true
    },

    /**
     * 必须在登出 / auth 变化时调用
     */
    clear() {
      this.profile = null
      this.profileLoaded = true // 已经“明确知道没有 profile”
    },

    /**
     * 用于登录前 / auth 初始化
     */
    reset() {
      this.profile = null
      this.profileLoaded = false
    },
  },
})
