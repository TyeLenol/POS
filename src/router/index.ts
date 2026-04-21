import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false, hideShell: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { requiresAuth: false, hideShell: true },
    },
    {
      path: '/',
      redirect: () => {
        const authStore = useAuthStore()
        return authStore.isAuthenticated ? '/dashboard' : '/login'
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true, requiresManager: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('../views/OnboardingView.vue'),
      meta: { requiresAuth: true, requiresManager: true, hideShell: true },
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/ProductsView.vue'),
      meta: { requiresAuth: true, label: 'Customer Cart' },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/payments',
      name: 'payments',
      component: () => import('../views/PaymentsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/receipts',
      name: 'receipts',
      component: () => import('../views/ReceiptsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true, requiresManager: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, requiresManager: true },
    },
  ],
})

// Navigation Guard for authentication and authorization
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresManager = to.meta.requiresManager === true
  const isAuthRoute = to.path === '/login' || to.path === '/signup'

  // If route requires auth but user is not authenticated, redirect to login
  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (authStore.isAuthenticated && isAuthRoute) {
    next(authStore.isManager ? '/dashboard' : '/sales')
    return
  }

  // If route requires manager role but user is cashier, redirect to sales
  if (requiresManager && authStore.isCashier) {
    next('/sales')
    return
  }

  if (authStore.isManager && authStore.isAuthenticated && to.path !== '/onboarding') {
    if (!authStore.onboardingCompleted) {
      await authStore.fetchOnboardingStatus()
    }
    if (!authStore.onboardingCompleted) {
      next('/onboarding')
      return
    }
  }

  next()
})

export default router
