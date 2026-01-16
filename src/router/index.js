import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout/MainLayout.vue'
import ChipTrainer from '@/pages/ChipTrainer/Index.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/chip-trainer',
      component: MainLayout,
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

export default router
