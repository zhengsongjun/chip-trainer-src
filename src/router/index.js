import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'
import MainLayout from '@/layouts/MainLayout/MainLayout.vue'
import ChipTrainer from '@/pages/ChipTrainer/Index.vue'
import Login from '@/pages/Login/Index.vue'
import BoardAnalysis from '@/pages/BoardAnalysis/Index.vue'
import PotTrainer from '@/pages/PotTrainer/Index.vue'
import { onAuthStateChanged } from 'firebase/auth'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    /* ================= 登录页（无 Layout） ================= */
    {
      path: '/login',
      component: Login,
    },

    /* ================= 主 Layout ================= */
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'chip-trainer',
          name: 'ChipTrainer',
          component: ChipTrainer,
          meta: { layout: 'main' }, // 有 Sidebar
        },
        {
          path: 'board-analysis',
          name: 'boardAnalysis',
          component: BoardAnalysis,
          meta: { layout: 'main' }, // 有 Sidebar
        },
        {
          path: 'pot-trainer',
          name: 'PotTrainer',
          component: PotTrainer,
          meta: { layout: 'main', requiresService: 'potTrainer' }, // 有 Sidebar
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/pages/Profile/Index.vue'),
          meta: { layout: 'simple' }, // 无 Sidebar
        },
        {
          path: 'activation',
          name: 'Activation',
          component: () => import('@/pages/Activation/Index.vue'),
          meta: { layout: 'simple' }, // 无 Sidebar
        },
        {
          path: '/403',
          component: () => import('@/pages/NoPermission/Index.vue'),
          meta: { layout: 'simple' },
        },
      ],
    },
  ],
})

/* ================= Auth Guard ================= */
function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (!requiresAuth) {
    next()
    return
  }

  const user = await getCurrentUser()

  if (!user || !user.emailVerified) {
    next('/login')
    return
  }

  // 检查服务权限
  const userStore = useUserStore()
  const requiredService = to.meta.requiresService

  if (requiredService) {
    // 管理员拥有所有服务的访问权限
    const role = userStore.profile?.role
    if (role !== 'admin') {
      // 普通用户需要检查服务权限
      const services = userStore.profile?.services || {}
      const service = services[requiredService]

      if (!service || !service.expiresAt || !service.expiresAt.seconds) {
        next('/403')
        return
      }

      const expiresAtMs = service.expiresAt.seconds * 1000
      if (expiresAtMs <= Date.now()) {
        next('/403')
        return
      }
    }
  }

  next()
})

export default router
