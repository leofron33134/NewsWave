import { createRouter, createWebHistory } from 'vue-router';
import Register from './components/register.vue';
import Home from './components/home.vue';
import LoginAdmin from './components/loginAdmin.vue';

const routes = [
  { 
    path: '/', 
    component: Register,
    meta: { guest: true } // Только для неавторизованных пользователей
  },
  { 
    path: '/home', 
    component: Home,
    meta: { requiresAuth: true }
  },
  { 
    path: '/loginAdmin', 
    component: LoginAdmin,
    meta: { guest: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;