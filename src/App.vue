<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import { usePosStore } from '@/stores/pos'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/format'

const store = usePosStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const display = useDisplay()

const mobileOpen = ref(false)
const isCollapsed = ref(false)
const userMenuOpen = ref(false)

watch(
  () => display.mobile.value,
  (isMobile) => {
    if (isMobile) isCollapsed.value = false
  },
  { immediate: true },
)

const isMobile = computed(() => display.mobile.value)
const orderTotal = computed(() => store.total)
const orderCount = computed(() => store.cartCount)

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  sales: 'Customer Cart',
  customers: 'Customers',
  inventory: 'Inventory',
  receipts: 'Receipts',
  reports: 'Reports & Analytics',
  staff: 'Staff Management',
  settings: 'Settings',
}
const pageTitle = computed(() => pageTitles[route.name as string] || 'Diagon Alley POS')

const userInitials = computed(() => {
  const name = authStore.user?.username || '?'
  return name.slice(0, 2).toUpperCase()
})

const navSections = computed(() => {
  if (authStore.isManager) {
    return [
      {
        label: null,
        items: [{ title: 'Dashboard', to: '/dashboard', icon: 'mdi-view-dashboard-variant' }],
      },
      {
        label: 'Analytics',
        items: [
          { title: 'Reports', to: '/reports', icon: 'mdi-chart-bar' },
          { title: 'Customers', to: '/customers', icon: 'mdi-account-multiple-outline' },
          { title: 'Inventory', to: '/inventory', icon: 'mdi-package-variant-closed' },
          { title: 'Receipts', to: '/receipts', icon: 'mdi-receipt-text-outline' },
        ],
      },
      {
        label: 'Admin',
        items: [
          { title: 'Staff', to: '/staff', icon: 'mdi-account-group-outline' },
          { title: 'Settings', to: '/settings', icon: 'mdi-tune-variant' },
        ],
      },
    ]
  }
  return [
    {
      label: 'Operations',
      items: [
        { title: 'Customer Cart', to: '/sales', icon: 'mdi-shopping-cart-outline' },
        { title: 'Customers', to: '/customers', icon: 'mdi-account-multiple-outline' },
        { title: 'Inventory', to: '/inventory', icon: 'mdi-package-variant-closed' },
        { title: 'Receipts', to: '/receipts', icon: 'mdi-receipt-text-outline' },
      ],
    },
  ]
})

const showShell = computed(() => route.meta.hideShell !== true)
const isFullHeight = computed(() => route.meta.fullHeight === true)

const handleLogout = () => {
  userMenuOpen.value = false
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <v-app style="background: var(--pos-bg)">
    <template v-if="showShell">
      <!-- Mobile overlay -->
      <div v-if="mobileOpen && isMobile" class="mobile-overlay" @click="mobileOpen = false" />

      <!-- Sidebar -->
      <aside
        class="pos-sidebar"
        :class="{
          'pos-sidebar--collapsed': isCollapsed && !isMobile,
          'pos-sidebar--open': mobileOpen,
        }"
      >
        <!-- Brand -->
        <div
          class="sidebar-brand"
          :class="{ 'sidebar-brand--collapsed': isCollapsed && !isMobile }"
        >
          <div class="brand-mark">DA</div>
          <div v-if="!isCollapsed || isMobile" class="brand-text">
            <div class="brand-name">Diagon Alley</div>
            <div class="brand-sub">Point of Sale</div>
          </div>
        </div>

        <!-- Nav links -->
        <nav class="sidebar-nav">
          <template v-for="section in navSections" :key="section.label || '__top__'">
            <div v-if="section.label && (!isCollapsed || isMobile)" class="nav-section-label">
              {{ section.label }}
            </div>
            <div v-else-if="section.label && isCollapsed && !isMobile" class="nav-divider" />
            <router-link
              v-for="item in section.items"
              :key="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ 'nav-item--collapsed': isCollapsed && !isMobile }"
              active-class="nav-item--active"
              @click="mobileOpen = false"
            >
              <v-icon :icon="item.icon" size="18" class="nav-icon" />
              <span v-if="!isCollapsed || isMobile" class="nav-label">{{ item.title }}</span>
            </router-link>
          </template>
        </nav>

        <!-- Cashier cart widget -->
        <div v-if="authStore.isCashier && (!isCollapsed || isMobile)" class="cart-widget">
          <div class="cart-eyebrow">Current Order</div>
          <div class="cart-total">
            {{ formatCurrency(orderTotal, store.settings.currency, store.settings.locale) }}
          </div>
          <div class="cart-meta">{{ orderCount }} item{{ orderCount !== 1 ? 's' : '' }}</div>
          <button
            class="cart-new-btn"
            @click="
              store.startNewOrder()
              mobileOpen = false
            "
          >
            New Order
          </button>
        </div>

        <!-- Sandbox badge -->
        <div
          class="sidebar-footer"
          :class="{ 'sidebar-footer--collapsed': isCollapsed && !isMobile }"
        >
          <div class="sandbox-pill" :class="{ 'sandbox-pill--icon': isCollapsed && !isMobile }">
            <span class="sandbox-dot" />
            <span v-if="!isCollapsed || isMobile" class="sandbox-text">Sandbox Mode</span>
          </div>
        </div>

        <!-- Desktop collapse toggle -->
        <button
          v-if="!isMobile"
          class="collapse-btn"
          :class="{ 'collapse-btn--rotated': isCollapsed }"
          @click="isCollapsed = !isCollapsed"
        >
          <v-icon icon="mdi-chevron-left" size="16" />
        </button>
      </aside>

      <!-- Main -->
      <div class="pos-main" :class="{ 'pos-main--collapsed': isCollapsed && !isMobile }">
        <!-- App bar -->
        <header class="pos-appbar">
          <div class="appbar-left">
            <button v-if="isMobile" class="menu-btn" @click="mobileOpen = !mobileOpen">
              <v-icon icon="mdi-menu" size="20" />
            </button>
            <span class="appbar-title">{{ pageTitle }}</span>
          </div>

          <div class="appbar-right">
            <div
              class="role-chip"
              :class="authStore.isManager ? 'role-chip--mgr' : 'role-chip--cshr'"
            >
              <v-icon
                :icon="authStore.isManager ? 'mdi-shield-account' : 'mdi-account-badge-outline'"
                size="12"
              />
              <span>{{ authStore.isManager ? 'Manager' : 'Cashier' }}</span>
            </div>

            <div class="user-wrap">
              <button class="user-avatar" @click="userMenuOpen = !userMenuOpen">
                {{ userInitials }}
              </button>
              <template v-if="userMenuOpen">
                <div class="user-overlay" @click="userMenuOpen = false" />
                <div class="user-dropdown">
                  <div class="ud-top">
                    <div class="ud-avatar">{{ userInitials }}</div>
                    <div>
                      <div class="ud-name">{{ authStore.user?.username }}</div>
                      <div class="ud-role">{{ authStore.isManager ? 'Manager' : 'Cashier' }}</div>
                    </div>
                  </div>
                  <div class="ud-divider" />
                  <button class="ud-signout" @click="handleLogout">
                    <v-icon icon="mdi-logout-variant" size="14" />
                    Sign out
                  </button>
                </div>
              </template>
            </div>
          </div>
        </header>

        <!-- Content -->
        <main class="pos-page" :class="{ 'pos-page--full': isFullHeight }">
          <div v-if="!isFullHeight" class="pos-content">
            <RouterView />
          </div>
          <RouterView v-else />
        </main>
      </div>
    </template>

    <RouterView v-else />
  </v-app>
</template>

<style scoped>
/* ── Overlay ── */
.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

/* ── Sidebar ── */
.pos-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  width: 260px;
  background: #ffffff;
  border-right: 1px solid var(--pos-border);
  border-radius: 0 28px 28px 0;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition:
    width 0.25s ease,
    transform 0.25s ease;
}

@media (max-width: 1023px) {
  .pos-sidebar {
    transform: translateX(-100%);
  }
  .pos-sidebar--open {
    transform: translateX(0);
  }
}
@media (min-width: 1024px) {
  .pos-sidebar {
    transform: translateX(0) !important;
  }
  .pos-sidebar--collapsed {
    width: 80px;
  }
}

/* ── Brand ── */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px 12px;
  flex-shrink: 0;
}
.sidebar-brand--collapsed {
  justify-content: center;
  padding: 20px 12px 12px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  font-weight: 800;
  font-size: 12px;
  display: grid;
  place-items: center;
  letter-spacing: 0.08em;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
}
.brand-name {
  font-weight: 700;
  font-size: 14px;
  color: var(--pos-ink);
  line-height: 1.2;
  white-space: nowrap;
}
.brand-sub {
  font-size: 10px;
  color: var(--pos-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 1px;
}

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 4px 10px 8px;
  scrollbar-width: none;
}
.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-section-label {
  padding: 14px 10px 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--pos-muted);
  white-space: nowrap;
}
.nav-divider {
  height: 1px;
  background: var(--pos-border);
  margin: 10px auto;
  width: 32px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--pos-muted);
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;
  white-space: nowrap;
  margin-bottom: 2px;
}
.nav-item--collapsed {
  justify-content: center;
  padding: 10px;
}
.nav-item:hover {
  background: var(--pos-border);
  color: var(--pos-ink);
}
.nav-item--active {
  background: var(--pos-accent-soft) !important;
  color: var(--pos-accent-strong) !important;
}

/* ── Cart widget ── */
.cart-widget {
  margin: 0 12px 12px;
  padding: 14px;
  background: var(--pos-navy);
  border-radius: 16px;
  color: #fff;
  flex-shrink: 0;
}
.cart-eyebrow {
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.6;
}
.cart-total {
  font-size: 18px;
  font-weight: 700;
  font-family: var(--pos-mono);
  margin-top: 4px;
}
.cart-meta {
  font-size: 11px;
  opacity: 0.65;
  margin-top: 2px;
}
.cart-new-btn {
  margin-top: 10px;
  width: 100%;
  padding: 7px 0;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.cart-new-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ── Sidebar footer ── */
.sidebar-footer {
  padding: 8px 12px 16px;
  flex-shrink: 0;
}
.sidebar-footer--collapsed {
  display: flex;
  justify-content: center;
}

.sandbox-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.sandbox-pill--icon {
  padding: 8px;
}

.sandbox-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
  animation: pulse 2s infinite;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}
.sandbox-text {
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  white-space: nowrap;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* ── Collapse btn ── */
.collapse-btn {
  display: none;
  position: absolute;
  top: 28px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--pos-border);
  color: var(--pos-muted);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 60;
  opacity: 0;
  transition:
    opacity 0.15s,
    transform 0.25s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.collapse-btn--rotated {
  transform: rotate(180deg);
}
.pos-sidebar:hover .collapse-btn {
  opacity: 1;
}
@media (min-width: 1024px) {
  .collapse-btn {
    display: flex;
  }
}

/* ── Main ── */
.pos-main {
  margin-left: 260px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.25s ease;
}
@media (max-width: 1023px) {
  .pos-main {
    margin-left: 0 !important;
  }
}
.pos-main--collapsed {
  margin-left: 80px;
}

/* ── App bar ── */
.pos-appbar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--pos-border);
  position: sticky;
  top: 0;
  z-index: 30;
  flex-shrink: 0;
}

.appbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.appbar-title {
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.01em;
  color: var(--pos-ink);
}

.menu-btn {
  background: none;
  border: none;
  color: var(--pos-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  transition: background 0.15s;
}
.menu-btn:hover {
  background: var(--pos-border);
}

.appbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
}
.role-chip--mgr {
  background: rgba(245, 158, 11, 0.08);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.3);
}
.role-chip--cshr {
  background: #f9fafb;
  color: var(--pos-muted);
  border-color: var(--pos-border);
}

/* ── User ── */
.user-wrap {
  position: relative;
}
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--pos-navy);
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: none;
  letter-spacing: 0.05em;
  transition:
    opacity 0.15s,
    transform 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.user-avatar:hover {
  opacity: 0.85;
  transform: scale(1.05);
}

.user-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 200px;
  background: #fff;
  border: 1px solid var(--pos-border);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
}

.ud-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
}
.ud-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--pos-navy);
  color: #fff;
  font-weight: 700;
  font-size: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.ud-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--pos-ink);
}
.ud-role {
  font-size: 11px;
  color: var(--pos-muted);
  text-transform: capitalize;
  margin-top: 1px;
}
.ud-divider {
  height: 1px;
  background: var(--pos-border);
}
.ud-signout {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 11px 14px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #ef4444;
  transition: background 0.15s;
  font-family: inherit;
}
.ud-signout:hover {
  background: rgba(239, 68, 68, 0.06);
}

/* ── Page ── */
.pos-page {
  flex: 1;
  overflow: auto;
  background: var(--pos-bg);
}
.pos-page--full {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.pos-content {
  padding: 28px 28px 40px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 960px) {
  .pos-content {
    padding: 16px;
  }
}
</style>
