import { createRouter, createWebHistory } from 'vue-router'
import { auth, db } from '@/firebase'
import MainLayout from '@/layouts/MainLayout/MainLayout.vue'
import ChipTrainer from '@/pages/ChipTrainer/Index.vue'
import Login from '@/pages/Login/Index.vue'
import { doc, getDoc } from 'firebase/firestore'
import BoardAnalysis from '@/pages/BoardAnalysis/Index.vue'
import { onAuthStateChanged } from 'firebase/auth'

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
          meta: { layout: 'main', requiresService: 'chipTrainer' }, // 有 Sidebar
        },
        {
          path: 'board-analysis',
          name: 'boardAnalysis',
          component: BoardAnalysis,
          meta: { layout: 'main', requiresService: 'boardAnalysis' }, // 有 Sidebar
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
        {
          path: '/:pathMatch(.*)*',
          component: () => import('@/pages/NotFound/Index.vue'),
          meta: {
            layout: 'simple',
            is404: true,
          },
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
  console.log(to.meta)
  // ⭐ 404 页面直接放行
  if (to.meta.is404) {
    return next()
  }
  // 0. 公共页面直接放行（防死循环）
  if (to.path === '/login' || to.path === '/profile' || to.path === '/403') {
    return next()
  }

  // 1. 登录校验
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth) {
    const u = await getCurrentUser()
    if (!u || !u.emailVerified) {
      return next('/login')
    }
  }

  // 2. 当前用户
  const user = auth.currentUser
  if (!user) {
    return next('/login')
  }

  // 3. 读取服务
  const snap = await getDoc(doc(db, 'user_activation_service', user.uid))
  const services = snap.exists() ? snap.data().services || {} : {}

  const now = new Date()
  const hasAnyValidService = Object.values(services).some((s: any) => s?.expiresAt?.toDate() > now)

  const requiredService = to.meta.requiresService

  // ⭐ 核心分流逻辑
  if (!hasAnyValidService) {
    if (requiredService) {
      return next('/403')
    }
    return next('/profile')
  }

  // 4. 具体服务权限
  if (!requiredService) {
    return next()
  }

  const service = services[requiredService]
  if (!service || service.expiresAt.toDate() <= now) {
    return next('/403')
  }

  next()
})

export default router
