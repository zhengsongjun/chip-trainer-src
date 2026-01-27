import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout/MainLayout.vue'
import ChipTrainer from '@/pages/ChipTrainer/Index.vue'
import Login from '@/pages/Login/Index.vue'
import BoardAnalysis from '@/pages/BoardAnalysis/Index.vue'
import { useUserStore } from '@/stores/user'
import { beaconFlush } from '@/trainer'
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
          path: 'pot-trainer',
          name: 'PotTrainer',
          component: () => import('@/pages/PotTrainer/Index.vue'),
          meta: { layout: 'main', requiresService: 'potTrainer' }, // 有 Sidebar
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/pages/Profile/Index.vue'),
          meta: { layout: 'simple' }, // 无 Sidebar
        },
        {
          path: 'test',
          name: 'Test',
          component: () => import('@/pages/TestPage/Index.vue'),
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

router.beforeEach((to, from, next) => {
  console.log('[router] beforeEach hit')
  const userStore = useUserStore()
  beaconFlush()
  // 1️⃣ 404 直接放行
  if (to.matched.some((record) => record.meta.is404)) {
    return next()
  }

  // 2️⃣ 登录页放行
  if (to.path === '/login') {
    return next()
  }

  if (!userStore.profile) {
    return next('/login')
  }
  // 3️⃣ 未登录（profile 还没准备好 or 已退出）
  if (!userStore.profile) {
    return next('/login')
  }

  // 4️⃣ activation 仅管理员
  if (['/activation', '/pot-trainer'].includes(to.path)) {
    const role = userStore.profile?.role

    if (role !== 'admin') {
      return next('/403')
    }
  }

  // 5️⃣ 不需要服务权限的页面
  const requiredService = to.meta.requiresService as string
  if (!requiredService) {
    return next()
  }

  // 管理员拥有所有服务的访问权限
  const role = userStore.profile?.role
  if (role === 'admin') {
    return next()
  }

  // 服务权限校验（⚠️ 本地 JSON，不能用 toDate）
  const services = userStore.profile.services || {}
  const service = services[requiredService]

  if (!service || !service.expiresAt || !service.expiresAt.seconds) {
    return next('/403')
  }

  const expiresAtMs = service.expiresAt.seconds * 1000

  if (expiresAtMs <= Date.now()) {
    return next('/403')
  }

  next()
})

export default router
