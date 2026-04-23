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
        return authStore.isAuthenticated ? (authStore.isManager ? '/dashboard' : '/sales') : '/login'
      },
    },
    // ── Manager-only routes ────────────────────────────────────────
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
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true, requiresManager: true },
    },
    {
      path: '/staff',
      name: 'staff',
      component: () => import('../views/StaffView.vue'),
      meta: { requiresAuth: true, requiresManager: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, requiresManager: true },
    },
    // ── Cashier-only routes ────────────────────────────────────────
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/ProductsView.vue'),
      meta: { requiresAuth: true, cashierOnly: true, fullHeight: true },
    },
    // ── Shared routes ──────────────────────────────────────────────
    {
      path: '/customers',
      name: 'customers',
      component: () => import('../views/CustomersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/receipts',
      name: 'receipts',
      component: () => import('../views/ReceiptsView.vue'),
      meta: { requiresAuth: true },
    },
    // ── Dead legacy routes → redirect ─────────────────────────────
    { path: '/checkout', redirect: '/sales' },
    { path: '/payments', redirect: '/sales' },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresManager = to.meta.requiresManager === true
  const cashierOnly = to.meta.cashierOnly === true
  const isAuthRoute = to.path === '/login' || to.path === '/signup'

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (authStore.isAuthenticated && isAuthRoute) {
    next(authStore.isManager ? '/dashboard' : '/sales')
    return
  }

  // Manager trying to access a cashier-only screen → send to dashboard
  if (cashierOnly && authStore.isManager) {
    next('/dashboard')
    return
  }

  // Cashier trying to access a manager-only screen → send to sales
  if (requiresManager && authStore.isCashier) {
    next('/sales')
    return
  }

  // Onboarding gate for managers
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
