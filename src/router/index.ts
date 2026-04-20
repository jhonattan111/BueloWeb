import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/pages/ReportEditor/Index.vue'),
    },
    {
      path: '/project',
      name: 'project',
      component: () => import('@/pages/ProjectEditor/Index.vue'),
    },
  ],
})

export default router
