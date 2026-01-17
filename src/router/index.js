import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'
import MainLayout from '@/layouts/MainLayout/MainLayout.vue'
import ChipTrainer from '@/pages/ChipTrainer/Index.vue'
import Login from '@/pages/Login/Index.vue'
import { onAuthStateChanged } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: Login,
    },
    {
      path: '/chip-trainer',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'ChipTrainer',
          component: ChipTrainer,
        },
      ],
    },
  ],
})

// 等 Firebase Auth 初始化完成
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

  if (!user) {
    next('/login')
  } else if (!user.emailVerified) {
    next('/login')
  } else {
    next()
  }
})

export default router
