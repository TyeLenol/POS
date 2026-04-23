<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getReportsInventory, getReportsProducts, getReportsSummary, getStaff } from '../../api/pos'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()

interface Summary {
  orderCount: number
  totalRevenue: number
  avgOrder: number
  todayOrders: number
  todayRevenue: number
  weekOrders: number
  weekRevenue: number
}

interface TopProduct {
  name: string
  totalQty: number
  totalRevenue: number
}

interface InventoryItem {
  id: string
  name: string
  stock: number
  category: string
}

const isLoading = ref(true)
const summary = ref<Summary | null>(null)
const topProducts = ref<TopProduct[]>([])
const lowStock = ref<InventoryItem[]>([])
const staffCount = ref(0)

const load = async () => {
  isLoading.value = true
  try {
    const [s, p, inv, staff] = await Promise.all([
      getReportsSummary(),
      getReportsProducts(),
      getReportsInventory(),
      getStaff(),
    ])
    summary.value = s
    topProducts.value = p.slice(0, 6)
    lowStock.value = (inv as InventoryItem[]).filter((i) => i.stock <= 5)
    staffCount.value = (staff as unknown[]).length
  } catch {
    // silently fail — partial data is fine on dashboard
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

const userName = computed(() => authStore.user?.username || 'Manager')

const maxQty = computed(() =>
  topProducts.value.length > 0 ? Math.max(...topProducts.value.map((p) => p.totalQty)) : 1,
)
const barPct = (qty: number) => `${Math.max(4, Math.round((qty / maxQty.value) * 100))}%`

const kpis = computed(() => {
  if (!summary.value) return []
  const s = summary.value
  return [
    {
      label: "Today's revenue",
      value: formatCurrency(s.todayRevenue),
      sub: `${s.todayOrders} order${s.todayOrders !== 1 ? 's' : ''} today`,
      icon: 'mdi-weather-sunny',
      color: 'amber',
    },
    {
      label: 'This week',
      value: formatCurrency(s.weekRevenue),
      sub: `${s.weekOrders} order${s.weekOrders !== 1 ? 's' : ''} this week`,
      icon: 'mdi-calendar-week-outline',
      color: 'blue',
    },
    {
      label: 'All-time revenue',
      value: formatCurrency(s.totalRevenue),
      sub: `${s.orderCount} total orders`,
      icon: 'mdi-trending-up',
      color: 'teal',
    },
    {
      label: 'Average order',
      value: formatCurrency(s.avgOrder),
      sub: 'Per completed sale',
      icon: 'mdi-calculator-variant-outline',
      color: 'purple',
    },
  ]
})

const quickLinks = [
  { label: 'Reports', to: '/reports', icon: 'mdi-chart-bar', tone: 'amber' },
  { label: 'Inventory', to: '/inventory', icon: 'mdi-package-variant-closed', tone: 'teal' },
  { label: 'Staff', to: '/staff', icon: 'mdi-account-group-outline', tone: 'indigo' },
  { label: 'Receipts', to: '/receipts', icon: 'mdi-receipt-text-outline', tone: 'orange' },
  { label: 'Settings', to: '/settings', icon: 'mdi-tune-variant', tone: 'gray' },
]
</script>

<template>
  <div class="dashboard-ui">
    <div class="dash-head">
      <div>
        <div class="eyebrow">Manager overview</div>
        <h1 class="dash-title">Overview</h1>
        <p class="dash-subtitle">
          {{ greeting }}, <span class="accent">{{ userName }}</span
          >. Store performance at a glance.
        </p>
      </div>
      <div class="dash-actions">
        <div class="dash-date">{{ todayLabel }}</div>
        <button class="btn-outline" type="button" :disabled="isLoading" @click="load">
          <v-icon icon="mdi-refresh" size="16" />
          <span>{{ isLoading ? 'Refreshing' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading && !summary" class="loading-state">
      <div class="spinner" aria-hidden="true" />
      <div class="loading-text">Loading dashboard...</div>
    </div>

    <template v-else>
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.label" class="bento-card kpi-card">
          <div class="kpi-top">
            <div :class="['kpi-icon', `kpi-icon--${kpi.color}`]">
              <v-icon :icon="kpi.icon" size="18" />
            </div>
            <span class="kpi-label">{{ kpi.label }}</span>
          </div>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-sub">{{ kpi.sub }}</div>
        </div>
      </div>

      <div class="dash-grid dash-grid--charts">
        <div class="bento-card card-panel">
          <div class="card-head">
            <div>
              <div class="eyebrow">Insights</div>
              <h3 class="card-title">Revenue trend</h3>
            </div>
            <button class="text-link" type="button" @click="router.push('/reports')">
              Full report
            </button>
          </div>
          <div class="chart-placeholder">
            <div class="chart-muted">Trend data not available yet.</div>
          </div>
        </div>

        <div class="bento-card card-panel">
          <div class="card-head">
            <div>
              <div class="eyebrow">Sales rhythm</div>
              <h3 class="card-title">Peak sales hours</h3>
            </div>
          </div>
          <div class="chart-placeholder">
            <div class="chart-muted">Peak hour data not available yet.</div>
          </div>
        </div>
      </div>

      <div class="dash-grid dash-grid--main">
        <div class="bento-card card-panel">
          <div class="card-head">
            <div>
              <div class="eyebrow">Product performance</div>
              <h3 class="card-title">Top selling products</h3>
            </div>
            <button class="text-link" type="button" @click="router.push('/reports')">
              Full report
            </button>
          </div>
          <div v-if="topProducts.length === 0" class="empty">
            No sales yet. Complete some transactions to see data here.
          </div>
          <div v-else class="top-list">
            <div v-for="(item, i) in topProducts" :key="item.name" class="top-row">
              <div class="top-rank">{{ i + 1 }}</div>
              <div class="top-info">
                <div class="top-name">{{ item.name }}</div>
                <div class="top-bar">
                  <div class="top-bar-fill" :style="{ width: barPct(item.totalQty) }" />
                </div>
              </div>
              <div class="top-meta">
                <div class="top-qty">{{ item.totalQty }} sold</div>
                <div class="top-rev">{{ formatCurrency(item.totalRevenue) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="dash-side">
          <div class="snapshot-grid">
            <button class="bento-card snapshot-card" type="button" @click="router.push('/staff')">
              <div class="snapshot-icon snapshot-icon--navy">
                <v-icon icon="mdi-account-group-outline" size="18" />
              </div>
              <div class="snapshot-value">{{ staffCount }}</div>
              <div class="snapshot-label">Staff accounts</div>
            </button>
            <button
              class="bento-card snapshot-card"
              type="button"
              :class="{ 'snapshot-card--warn': lowStock.length > 0 }"
              @click="router.push('/inventory')"
            >
              <div
                class="snapshot-icon"
                :class="lowStock.length > 0 ? 'snapshot-icon--warn' : 'snapshot-icon--teal'"
              >
                <v-icon
                  :icon="lowStock.length > 0 ? 'mdi-alert-outline' : 'mdi-check-circle-outline'"
                  size="18"
                />
              </div>
              <div class="snapshot-value">{{ lowStock.length }}</div>
              <div class="snapshot-label">Low stock items</div>
            </button>
          </div>

          <div class="bento-card card-panel">
            <div class="card-head">
              <div>
                <div class="eyebrow">Inventory alert</div>
                <h3 class="card-title">Restock required</h3>
              </div>
              <button class="text-link" type="button" @click="router.push('/inventory')">
                Manage
              </button>
            </div>
            <div v-if="lowStock.length === 0" class="empty success-empty">
              <v-icon icon="mdi-check-circle-outline" size="16" />
              All products are well stocked.
            </div>
            <div v-else class="stock-list">
              <div v-for="item in lowStock.slice(0, 5)" :key="item.id" class="stock-row">
                <div>
                  <div class="stock-name">{{ item.name }}</div>
                  <div class="stock-cat">{{ item.category }}</div>
                </div>
                <span
                  class="status-pill"
                  :class="item.stock === 0 ? 'status-pill--error' : 'status-pill--warn'"
                >
                  {{ item.stock === 0 ? 'Out of stock' : `${item.stock} left` }}
                </span>
              </div>
              <div v-if="lowStock.length > 5" class="stock-more">
                +{{ lowStock.length - 5 }} more items need attention
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bento-card card-panel">
        <div class="card-head">
          <div>
            <div class="eyebrow">Quick access</div>
            <h3 class="card-title">Jump back in</h3>
          </div>
        </div>
        <div class="quick-grid">
          <button
            v-for="link in quickLinks"
            :key="link.to"
            class="quick-card"
            type="button"
            @click="router.push(link.to)"
          >
            <div class="quick-icon" :class="`quick-icon--${link.tone}`">
              <v-icon :icon="link.icon" size="18" />
            </div>
            <span class="quick-label">{{ link.label }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard-ui {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 24px 28px 40px;
  max-width: 1600px;
  margin: 0 auto;
}

@media (max-width: 960px) {
  .dashboard-ui {
    padding: 20px 16px 32px;
  }
}

.dash-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dash-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-color);
}

.dash-subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 6px;
}

.dash-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.dash-date {
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-outline:hover:not(:disabled) {
  border-color: var(--color-pos-accent);
  color: var(--color-pos-accent-strong);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: default;
}

.eyebrow {
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--text-muted);
}

.accent {
  color: var(--color-pos-accent-strong);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 10px;
}

.spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-pos-accent);
  animation: spin 0.9s linear infinite;
}

.loading-text {
  font-size: 13px;
  color: var(--text-muted);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  padding: 18px;
}

.kpi-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.kpi-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.kpi-icon--amber {
  background: #fef3c7;
  color: #d97706;
}
.kpi-icon--blue {
  background: #dbeafe;
  color: #1d4ed8;
}
.kpi-icon--teal {
  background: #ccfbf1;
  color: #0f766e;
}
.kpi-icon--purple {
  background: #ede9fe;
  color: #7c3aed;
}

.kpi-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-family: var(--pos-mono);
  color: var(--text-color);
}

.kpi-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.dash-grid {
  display: grid;
  gap: 20px;
}

.dash-grid--charts,
.dash-grid--main {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

@media (max-width: 1024px) {
  .dash-grid--charts,
  .dash-grid--main {
    grid-template-columns: 1fr;
  }
}

.card-panel {
  padding: 20px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin-top: 3px;
  color: var(--text-color);
}

.text-link {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-pos-accent-strong);
  cursor: pointer;
}

.text-link:hover {
  text-decoration: underline;
}

.chart-placeholder {
  min-height: 220px;
  border-radius: 16px;
  border: 1px dashed var(--border-color);
  background: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px;
}

.chart-muted {
  font-size: 13px;
  color: var(--text-muted);
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-pos-accent-soft);
  color: var(--color-pos-accent-strong);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.top-info {
  flex: 1;
  min-width: 0;
}

.top-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.top-bar {
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: #f1f5f9;
}

.top-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--color-pos-accent) 0%,
    var(--color-pos-accent-strong) 100%
  );
  transition: width 0.4s ease;
  min-width: 4%;
}

.top-meta {
  text-align: right;
  flex-shrink: 0;
}

.top-qty {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color);
}

.top-rev {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--pos-mono);
}

.dash-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.snapshot-card {
  padding: 16px 14px;
  text-align: center;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.snapshot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
}

.snapshot-card--warn {
  border-color: #f59e0b;
  background: #fffbeb;
}

.snapshot-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
}

.snapshot-icon--navy {
  background: #e0e7f0;
  color: var(--color-pos-navy);
}
.snapshot-icon--teal {
  background: #ccfbf1;
  color: #0f766e;
}
.snapshot-icon--warn {
  background: #fef3c7;
  color: #d97706;
}

.snapshot-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-color);
}

.snapshot-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
}

.stock-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}
.stock-cat {
  font-size: 11px;
  color: var(--text-muted);
}
.stock-more {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.status-pill {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid transparent;
  white-space: nowrap;
}

.status-pill--warn {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.3);
}

.status-pill--error {
  background: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.3);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.quick-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-pos-accent);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.quick-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.quick-icon--amber {
  background: #fef3c7;
  color: #d97706;
}
.quick-icon--teal {
  background: #ccfbf1;
  color: #0f766e;
}
.quick-icon--indigo {
  background: #e0e7ff;
  color: #4338ca;
}
.quick-icon--orange {
  background: #ffedd5;
  color: #ea580c;
}
.quick-icon--gray {
  background: #f1f5f9;
  color: #475569;
}

.quick-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.empty {
  font-size: 14px;
  color: var(--text-muted);
  padding: 6px 0;
}
.success-empty {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
