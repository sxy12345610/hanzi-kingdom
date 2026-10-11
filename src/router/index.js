import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeMap.vue'),
  },
  {
    path: '/forest',
    name: 'forest',
    component: () => import('../views/CharacterForest.vue'),
  },
  {
    path: '/idiom',
    name: 'idiom',
    component: () => import('../views/IdiomPark.vue'),
  },
  {
    path: '/poem',
    name: 'poem',
    component: () => import('../views/Poem.vue'),
  },
  {
    path: '/growth',
    name: 'growth',
    component: () => import('../views/Growth.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
