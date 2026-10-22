import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  
  { path: '/setBuild', component: () => import('../components/SetBuild.vue') },
  { path: '/setInfo', component: () => import('../components/SetInfo.vue') },
  { path: '/scanInfo', component: () => import('../components/ScanInfo.vue') },
 
  
  
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

export default router;
