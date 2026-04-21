<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import { usePosStore } from '@/stores/pos'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/format'

const store = usePosStore()
const authStore = useAuthStore()
const router = useRouter()
const display = useDisplay()
const drawer = ref(true)

watch(
  () => display.mobile.value,
  (isMobile) => {
    drawer.value = !isMobile
  },
  { immediate: true },
)

const isMobile = computed(() => display.mobile.value)
const orderTotal = computed(() => store.total)
const orderCount = computed(() => store.cartCount)

const allNavItems = [
  { title: 'Dashboard', to: '/dashboard', icon: 'mdi-view-dashboard-variant', manager: true },
  { title: 'Customer Cart', to: '/sales', icon: 'mdi-shopping-cart', manager: false },
  { title: 'Inventory', to: '/inventory', icon: 'mdi-warehouse', manager: false },
  { title: 'Receipts', to: '/receipts', icon: 'mdi-receipt-text-outline', manager: false },
  { title: 'Reports', to: '/reports', icon: 'mdi-chart-line', manager: true },
  { title: 'Settings', to: '/settings', icon: 'mdi-tune-variant', manager: true },
]

const navItems = computed(() => {
  if (authStore.isManager) {
    return allNavItems
  } else {
    // Cashiers only see non-manager items
    return allNavItems.filter((item) => !item.manager)
  }
})

const startNewOrder = () => {
  store.startNewOrder()
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <v-app>
    <v-layout class="pos-shell">
      <v-navigation-drawer
        v-model="drawer"
        :temporary="isMobile"
        :permanent="!isMobile"
        width="280"
        class="pos-drawer"
      >
        <div class="brand">
          <div class="brand-mark">DA</div>
          <div>
            <div class="brand-title">Diagon Alley POS</div>
            <div class="brand-subtitle">Everyday shop suite</div>
          </div>
        </div>

        <v-list nav density="comfortable" class="mt-2">
          <v-list-item v-for="item in navItems" :key="item.to" :to="item.to" class="pos-nav-item">
            <template #prepend>
              <v-icon :icon="item.icon" />
            </template>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <v-divider class="my-4" />

        <v-card class="mx-4 mb-4 pos-status" elevation="0">
          <div class="status-title">Open order</div>
          <div class="status-value">
            {{ formatCurrency(orderTotal, store.settings.currency, store.settings.locale) }}
          </div>
          <div class="status-meta">{{ orderCount }} items ready for checkout</div>
          <v-btn color="primary" class="mt-3" block @click="startNewOrder"> New order </v-btn>
        </v-card>

        <div class="drawer-footer">
          <div class="drawer-tag">Live</div>
          <div class="drawer-hint">Payment flows are in sandbox mode.</div>
        </div>
      </v-navigation-drawer>

      <v-app-bar class="pos-app-bar" elevation="0">
        <v-app-bar-nav-icon class="d-lg-none" @click="drawer = !drawer" />
        <v-toolbar-title class="pos-title">Sales command center</v-toolbar-title>
        <v-spacer />
        <v-chip color="secondary" variant="flat" class="mr-2">
          {{ authStore.isManager ? 'Manager' : 'Cashier' }}
        </v-chip>
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-account-circle" />
          </template>
          <v-list min-width="200">
            <v-list-item readonly>
              <div class="text-caption text-disabled">{{ authStore.user?.username }}</div>
            </v-list-item>
            <v-divider />
            <v-list-item @click="handleLogout">
              <template #prepend>
                <v-icon icon="mdi-logout" />
              </template>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <v-main>
        <v-container fluid class="pos-content">
          <RouterView />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<style scoped>
.pos-shell {
  min-height: 100vh;
}

.pos-drawer {
  border-right: 1px solid var(--pos-border);
  background: linear-gradient(160deg, #fff7ed 0%, #ffffff 42%, #f1f5f9 100%);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 8px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #1b3a57;
  color: #ffffff;
  font-weight: 700;
  display: grid;
  place-items: center;
  letter-spacing: 0.08em;
}

.brand-title {
  font-weight: 700;
  font-size: 16px;
}

.brand-subtitle {
  font-size: 12px;
  color: var(--pos-muted);
}

.pos-nav-item {
  border-radius: 14px;
  margin: 4px 10px;
}

.pos-status {
  padding: 16px;
  border-radius: var(--pos-radius-lg);
  background: #0f172a;
  color: #ffffff;
}

.status-title {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.2em;
  opacity: 0.7;
}

.status-value {
  font-size: 22px;
  font-weight: 700;
  margin-top: 6px;
}

.status-meta {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.drawer-footer {
  padding: 0 20px 20px;
  font-size: 12px;
  color: var(--pos-muted);
}

.drawer-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  font-weight: 600;
  margin-bottom: 6px;
}

.pos-app-bar {
  background: transparent;
  padding: 0 8px;
}

.pos-title {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.pos-content {
  padding: 28px 28px 40px;
}

@media (max-width: 960px) {
  .pos-content {
    padding: 18px;
  }
}
</style>
