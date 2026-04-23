<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { getReportsSummary, getReportsProducts, getReportsInventory } from '@/api/pos'
import { formatCurrency } from '@/utils/format'

// ─── Types ────────────────────────────────────────────────────────────────────
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
  sku: string
  name: string
  category: string
  price: number
  stock: number
  cost?: number | null
}
type TabId = 'overview' | 'sales' | 'products' | 'inventory'
type Period = 'daily' | 'weekly' | 'monthly'

// ─── State ────────────────────────────────────────────────────────────────────
const isLoading = ref(true)
const error = ref('')
const activeTab = ref<TabId>('overview')
const period = ref<Period>('weekly')
const summary = ref<Summary | null>(null)
const topProducts = ref<TopProduct[]>([])
const inventory = ref<InventoryItem[]>([])

// ─── Static mock time-series (no historical API endpoint yet) ─────────────────
const DAILY = {
  labels: ['Apr 8', 'Apr 9', 'Apr 10', 'Apr 11', 'Apr 12', 'Apr 13', 'Apr 14'],
  revenue: [4200, 5100, 3800, 6200, 4900, 7100, 5400],
  transactions: [34, 41, 29, 50, 39, 57, 44],
}
const WEEKLY = {
  labels: ['Wk 14', 'Wk 15', 'Wk 16', 'Wk 17', 'Wk 18', 'Wk 19', 'Wk 20'],
  revenue: [28400, 31200, 27800, 34600, 29900, 38200, 36700],
  transactions: [230, 252, 218, 280, 241, 309, 297],
}
const MONTHLY = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  revenue: [118000, 134000, 189000, 121000, 138000, 152000, 144000],
  transactions: [950, 1082, 1528, 978, 1114, 1229, 1163],
}

const PEAK_HOURS = {
  labels: [
    '8am',
    '9am',
    '10am',
    '11am',
    '12pm',
    '1pm',
    '2pm',
    '3pm',
    '4pm',
    '5pm',
    '6pm',
    '7pm',
    '8pm',
  ],
  sales: [8, 22, 41, 55, 78, 82, 61, 53, 60, 71, 44, 25, 12],
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'mdi-view-dashboard-outline' },
  { id: 'sales', label: 'Sales Analysis', icon: 'mdi-trending-up' },
  { id: 'products', label: 'Products', icon: 'mdi-package-variant' },
  { id: 'inventory', label: 'Inventory', icon: 'mdi-warehouse' },
]

const CAT_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899']

// ─── Computed ─────────────────────────────────────────────────────────────────
const periodData = computed(() =>
  period.value === 'daily' ? DAILY : period.value === 'weekly' ? WEEKLY : MONTHLY,
)

const maxQty = computed(() => Math.max(...topProducts.value.map((p) => p.totalQty), 1))

const categoryStats = computed(() => {
  const map = new Map<string, number>()
  inventory.value.forEach((i) => {
    const cat = i.category || 'Other'
    map.set(cat, (map.get(cat) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const lowStockItems = computed(() =>
  inventory.value.filter((i) => i.stock <= 5).sort((a, b) => a.stock - b.stock),
)

const stockItems = computed(() =>
  [...inventory.value].sort((a, b) => b.stock - a.stock).slice(0, 10),
)

const salesTableRows = computed(() => {
  const labels = [...periodData.value.labels].reverse()
  const revenue = [...periodData.value.revenue].reverse()
  const txns = [...periodData.value.transactions].reverse()
  return labels.map((label, i) => ({
    label,
    revenue: revenue[i] ?? 0,
    txns: txns[i] ?? 0,
  }))
})

const totalPeriodRevenue = computed(() => periodData.value.revenue.reduce((a, b) => a + b, 0))
const totalPeriodTxns = computed(() => periodData.value.transactions.reduce((a, b) => a + b, 0))

// ─── Chart theme helpers ───────────────────────────────────────────────────────
const AMBER = '#f59e0b'
const EMERALD = '#10b981'
const VIOLET = '#8b5cf6'

const labelStyle = { style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'var(--pos-sans)' } }
const gridOpts = { borderColor: '#e2e8f0', strokeDashArray: 3 }
const tipOpts = {
  theme: 'light' as const,
  style: { fontSize: '12px', fontFamily: 'var(--pos-sans)' },
}

// ─── Overview charts ──────────────────────────────────────────────────────────
const revAreaOpts = computed<ApexOptions>(() => ({
  chart: { type: 'area', toolbar: { show: false }, animations: { enabled: false } },
  stroke: { curve: 'smooth' as const, width: [2.5, 2] },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.22, opacityTo: 0.01, stops: [0, 90, 100] },
  },
  dataLabels: { enabled: false },
  grid: gridOpts,
  xaxis: {
    categories: periodData.value.labels,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: labelStyle,
  },
  yaxis: { labels: { ...labelStyle, formatter: (v: number) => `₵${(v / 1000).toFixed(0)}k` } },
  tooltip: { ...tipOpts, y: { formatter: (v: number) => `GH₵${v.toLocaleString()}` } },
  colors: [AMBER, EMERALD],
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    fontSize: '12px',
    fontFamily: 'var(--pos-sans)',
  },
}))
const revAreaSeries = computed(() => [
  { name: 'Revenue', data: periodData.value.revenue },
  { name: 'Profit', data: periodData.value.revenue.map((v) => Math.round(v * 0.38)) },
])

const peakBarOpts = computed<ApexOptions>(() => ({
  chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: false } },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%', distributed: true } },
  dataLabels: { enabled: false },
  grid: { ...gridOpts, xaxis: { lines: { show: false } } },
  xaxis: {
    categories: PEAK_HOURS.labels,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: labelStyle,
  },
  yaxis: { labels: labelStyle },
  tooltip: { ...tipOpts, y: { formatter: (v: number) => `${v} transactions` } },
  colors: PEAK_HOURS.sales.map((v) => (v >= 70 ? '#d97706' : AMBER)),
  legend: { show: false },
}))
const peakBarSeries = [{ name: 'Transactions', data: PEAK_HOURS.sales }]

const topBarOpts = computed<ApexOptions>(() => ({
  chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: false } },
  plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '65%' } },
  dataLabels: { enabled: false },
  grid: { ...gridOpts, yaxis: { lines: { show: false } } },
  xaxis: {
    labels: { ...labelStyle, formatter: (v: number) => `₵${(v / 1000).toFixed(1)}k` },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: '#64748b', fontSize: '11px', fontFamily: 'var(--pos-sans)' } },
  },
  tooltip: { ...tipOpts, y: { formatter: (v: number) => `GH₵${v.toLocaleString()}` } },
  colors: [AMBER],
}))
const topBarSeries = computed(() => [
  {
    name: 'Revenue',
    data: topProducts.value.slice(0, 8).map((p) => ({ x: p.name, y: p.totalRevenue })),
  },
])

// ─── Sales tab charts ─────────────────────────────────────────────────────────
const salesBarOpts = computed<ApexOptions>(() => ({
  chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: false } },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '65%' } },
  dataLabels: { enabled: false },
  grid: gridOpts,
  xaxis: {
    categories: periodData.value.labels,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: labelStyle,
  },
  yaxis: { labels: { ...labelStyle, formatter: (v: number) => `₵${(v / 1000).toFixed(0)}k` } },
  tooltip: { ...tipOpts, y: { formatter: (v: number) => `GH₵${v.toLocaleString()}` } },
  colors: [AMBER],
}))
const salesBarSeries = computed(() => [{ name: 'Revenue', data: periodData.value.revenue }])

const trendLineOpts = computed<ApexOptions>(() => ({
  chart: { type: 'line', toolbar: { show: false }, animations: { enabled: false } },
  stroke: { width: [2.5, 2], curve: 'smooth' as const, dashArray: [0, 5] },
  dataLabels: { enabled: false },
  grid: gridOpts,
  xaxis: {
    categories: periodData.value.labels,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: labelStyle,
  },
  yaxis: [
    { labels: { ...labelStyle, formatter: (v: number) => `₵${(v / 1000).toFixed(0)}k` } },
    { opposite: true, labels: labelStyle },
  ],
  tooltip: tipOpts,
  colors: [AMBER, VIOLET],
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    fontSize: '12px',
    fontFamily: 'var(--pos-sans)',
  },
}))
const trendLineSeries = computed(() => [
  { name: 'Revenue (GH₵)', data: periodData.value.revenue },
  { name: 'Transactions', data: periodData.value.transactions },
])

// ─── Inventory charts ─────────────────────────────────────────────────────────
const stockBarOpts = computed<ApexOptions>(() => ({
  chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: false } },
  plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '60%', distributed: true } },
  dataLabels: {
    enabled: true,
    style: { fontSize: '11px', colors: ['#fff'] },
    formatter: (v: number) => (v === 0 ? 'Out' : `${v}`),
  },
  grid: { ...gridOpts, yaxis: { lines: { show: false } } },
  xaxis: { labels: labelStyle, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: {
    labels: { style: { colors: '#64748b', fontSize: '11px', fontFamily: 'var(--pos-sans)' } },
  },
  tooltip: { ...tipOpts, y: { formatter: (v: number) => `${v} units in stock` } },
  colors: stockItems.value.map((i) =>
    i.stock === 0 ? '#ef4444' : i.stock <= 5 ? '#f59e0b' : EMERALD,
  ),
  legend: { show: false },
}))
const stockBarSeries = computed(() => [
  {
    name: 'Stock',
    data: stockItems.value.map((i) => ({ x: i.name, y: i.stock })),
  },
])

const catDonutOpts = computed<ApexOptions>(() => ({
  chart: { type: 'donut', toolbar: { show: false } },
  labels: categoryStats.value.map((c) => c.name),
  colors: CAT_COLORS,
  legend: { position: 'bottom' as const, fontSize: '12px', fontFamily: 'var(--pos-sans)' },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Categories',
            fontSize: '12px',
            fontFamily: 'var(--pos-sans)',
          },
        },
      },
    },
  },
  tooltip: { ...tipOpts, y: { formatter: (v: number) => `${v} products` } },
  stroke: { show: false },
}))
const catDonutSeries = computed(() => categoryStats.value.map((c) => c.count))

// ─── API ──────────────────────────────────────────────────────────────────────
const load = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const [s, p, inv] = await Promise.all([
      getReportsSummary(),
      getReportsProducts(),
      getReportsInventory(),
    ])
    summary.value = s
    topProducts.value = p
    inventory.value = inv
  } catch (e: any) {
    error.value = e.message || 'Failed to load reports'
  } finally {
    isLoading.value = false
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
const dlCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: filename,
  })
  a.click()
}

const exportCSV = () => {
  if (activeTab.value === 'products') {
    dlCSV(
      'products.csv',
      ['Product', 'Units Sold', 'Revenue'],
      topProducts.value.map((p) => [p.name, p.totalQty, p.totalRevenue]),
    )
  } else if (activeTab.value === 'inventory') {
    dlCSV(
      'inventory.csv',
      ['Product', 'Category', 'SKU', 'Price', 'Stock'],
      inventory.value.map((i) => [i.name, i.category, i.sku, i.price, i.stock]),
    )
  } else {
    dlCSV(
      'summary.csv',
      ['Metric', 'Value'],
      [
        ['Total Revenue', summary.value?.totalRevenue ?? 0],
        ['Total Orders', summary.value?.orderCount ?? 0],
        ['Avg Order', (summary.value?.avgOrder ?? 0).toFixed(2)],
        ['Today Revenue', summary.value?.todayRevenue ?? 0],
        ['This Week Revenue', summary.value?.weekRevenue ?? 0],
      ],
    )
  }
}

const exportPDF = () => window.print()

onMounted(load)
</script>

<template>
  <div class="rpt-wrap">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="rpt-header">
      <div>
        <div class="eyebrow">Analytics &amp; Insights</div>
        <h1 class="rpt-title">Reports</h1>
      </div>
      <div class="hdr-actions">
        <button class="btn-outline" @click="exportCSV">
          <span class="mdi mdi-file-delimited-outline" /> Export CSV
        </button>
        <button class="btn-solid" @click="exportPDF">
          <span class="mdi mdi-download" /> Export PDF
        </button>
        <button class="btn-outline" :disabled="isLoading" @click="load">
          <span :class="['mdi mdi-refresh', { spin: isLoading }]" /> Refresh
        </button>
      </div>
    </div>

    <!-- ── Error ──────────────────────────────────────────────────────── -->
    <div v-if="error" class="alert-error">
      <span class="mdi mdi-alert-circle-outline" /> {{ error }}
    </div>

    <!-- ── Loading skeleton ───────────────────────────────────────────── -->
    <div v-if="isLoading && !summary" class="loading-state">
      <div class="spinner" />
      <span>Loading report data…</span>
    </div>

    <template v-else>
      <!-- ── Period selector ────────────────────────────────────────────── -->
      <div class="period-row">
        <span class="period-label">Period:</span>
        <div class="period-pills">
          <button
            v-for="p in ['daily', 'weekly', 'monthly'] as Period[]"
            :key="p"
            class="period-pill"
            :class="{ active: period === p }"
            @click="period = p"
          >
            {{ p.charAt(0).toUpperCase() + p.slice(1) }}
          </button>
        </div>
      </div>

      <!-- ── Tab nav ────────────────────────────────────────────────────── -->
      <div class="tab-nav">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span :class="`mdi ${tab.icon}`" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ══════════════════ OVERVIEW TAB ══════════════════ -->
      <div v-if="activeTab === 'overview'" class="tab-content">
        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card stat-card--amber">
            <span class="mdi mdi-weather-sunny stat-icon" />
            <div class="stat-period">Today</div>
            <div class="stat-val">{{ formatCurrency(summary?.todayRevenue ?? 0) }}</div>
            <div class="stat-sub">{{ summary?.todayOrders ?? 0 }} orders</div>
          </div>
          <div class="stat-card stat-card--blue">
            <span class="mdi mdi-calendar-week stat-icon" />
            <div class="stat-period">This week</div>
            <div class="stat-val">{{ formatCurrency(summary?.weekRevenue ?? 0) }}</div>
            <div class="stat-sub">{{ summary?.weekOrders ?? 0 }} orders</div>
          </div>
          <div class="stat-card stat-card--teal">
            <span class="mdi mdi-history stat-icon" />
            <div class="stat-period">All time</div>
            <div class="stat-val">{{ formatCurrency(summary?.totalRevenue ?? 0) }}</div>
            <div class="stat-sub">{{ summary?.orderCount ?? 0 }} total orders</div>
          </div>
          <div class="stat-card stat-card--violet">
            <span class="mdi mdi-calculator-variant-outline stat-icon" />
            <div class="stat-period">Avg order</div>
            <div class="stat-val">{{ formatCurrency(summary?.avgOrder ?? 0) }}</div>
            <div class="stat-sub">Per completed sale</div>
          </div>
        </div>

        <!-- Charts row -->
        <div class="charts-row">
          <div class="bento-card chart-box">
            <div class="chart-hdr">
              <h3 class="chart-title"><span class="mdi mdi-trending-up" /> Revenue vs Profit</h3>
              <span class="badge-demo">Demo data</span>
            </div>
            <VueApexCharts
              type="area"
              :options="revAreaOpts"
              :series="revAreaSeries"
              height="255"
            />
          </div>
          <div class="bento-card chart-box">
            <div class="chart-hdr">
              <h3 class="chart-title"><span class="mdi mdi-clock-outline" /> Peak Sales Hours</h3>
              <span class="badge-demo">Demo data</span>
            </div>
            <VueApexCharts type="bar" :options="peakBarOpts" :series="peakBarSeries" height="255" />
          </div>
        </div>

        <!-- Top products -->
        <div class="bento-card chart-box">
          <div class="chart-hdr">
            <h3 class="chart-title">
              <span class="mdi mdi-package-variant" /> Top Products by Revenue
            </h3>
            <span class="badge-live">Live data</span>
          </div>
          <div v-if="topProducts.length === 0" class="chart-empty">
            No sales data yet. Complete transactions to see results.
          </div>
          <VueApexCharts
            v-else
            type="bar"
            :options="topBarOpts"
            :series="topBarSeries"
            height="230"
          />
        </div>
      </div>
      <!-- /overview -->

      <!-- ══════════════════ SALES ANALYSIS TAB ══════════════════ -->
      <div v-else-if="activeTab === 'sales'" class="tab-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-period">Total Revenue</div>
            <div class="stat-val stat-val--emerald">
              GH₵{{ totalPeriodRevenue.toLocaleString() }}
            </div>
            <div class="stat-sub">{{ period }} view (demo)</div>
          </div>
          <div class="stat-card">
            <div class="stat-period">Transactions</div>
            <div class="stat-val">{{ totalPeriodTxns.toLocaleString() }}</div>
            <div class="stat-sub">Completed orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-period">Est. Profit</div>
            <div class="stat-val stat-val--blue">
              GH₵{{ Math.round(totalPeriodRevenue * 0.38).toLocaleString() }}
            </div>
            <div class="stat-sub">~38% margin</div>
          </div>
          <div class="stat-card">
            <div class="stat-period">Avg. Order</div>
            <div class="stat-val stat-val--violet">
              GH₵{{ (totalPeriodRevenue / totalPeriodTxns).toFixed(2) }}
            </div>
            <div class="stat-sub">Per transaction</div>
          </div>
        </div>

        <div class="bento-card chart-box">
          <h3 class="chart-title cmt">
            {{ period.charAt(0).toUpperCase() + period.slice(1) }} Sales Total (GH₵)
          </h3>
          <VueApexCharts type="bar" :options="salesBarOpts" :series="salesBarSeries" height="280" />
        </div>

        <div class="bento-card chart-box">
          <h3 class="chart-title cmt">Sales Trend Comparison</h3>
          <VueApexCharts
            type="line"
            :options="trendLineOpts"
            :series="trendLineSeries"
            height="260"
          />
        </div>

        <!-- Breakdown table -->
        <div class="bento-card t-card">
          <div class="t-header">
            <h3 class="chart-title">
              Detailed {{ period.charAt(0).toUpperCase() + period.slice(1) }} Breakdown
            </h3>
          </div>
          <div class="t-scroll">
            <table class="dtable">
              <thead>
                <tr>
                  <th>Period</th>
                  <th class="r">Revenue</th>
                  <th class="r">Transactions</th>
                  <th class="r">Est. Profit</th>
                  <th class="r">Avg. Order</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in salesTableRows" :key="i">
                  <td class="fw">{{ row.label }}</td>
                  <td class="r mono">GH₵{{ row.revenue.toLocaleString() }}</td>
                  <td class="r mono muted">{{ row.txns }}</td>
                  <td class="r mono emerald">
                    GH₵{{ Math.round(row.revenue * 0.38).toLocaleString() }}
                  </td>
                  <td class="r mono muted">GH₵{{ (row.revenue / row.txns).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- /sales -->

      <!-- ══════════════════ PRODUCTS TAB ══════════════════ -->
      <div v-else-if="activeTab === 'products'" class="tab-content">
        <div class="charts-row">
          <!-- Top sellers ranked list -->
          <div class="bento-card chart-box">
            <h3 class="chart-title chart-title--emerald cmt">
              <span class="mdi mdi-trending-up" /> Top Sellers
            </h3>
            <div v-if="topProducts.length === 0" class="chart-empty">No sales data yet.</div>
            <div v-else class="seller-list">
              <div v-for="(p, i) in topProducts.slice(0, 7)" :key="p.name" class="seller-item">
                <div class="seller-rank">{{ i + 1 }}</div>
                <div class="seller-info">
                  <div class="seller-name">{{ p.name }}</div>
                  <div class="seller-bar-wrap">
                    <div class="seller-bar" :style="{ width: `${(p.totalQty / maxQty) * 100}%` }" />
                  </div>
                </div>
                <div class="seller-stats">
                  <div class="seller-qty">{{ p.totalQty }} sold</div>
                  <div class="seller-rev">{{ formatCurrency(p.totalRevenue) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue bar chart -->
          <div class="bento-card chart-box">
            <h3 class="chart-title cmt"><span class="mdi mdi-chart-bar" /> Revenue by Product</h3>
            <div v-if="topProducts.length === 0" class="chart-empty">No sales data yet.</div>
            <VueApexCharts
              v-else
              type="bar"
              :options="topBarOpts"
              :series="topBarSeries"
              height="310"
            />
          </div>
        </div>

        <!-- Full product table -->
        <div class="bento-card t-card">
          <div class="t-header">
            <h3 class="chart-title">Product Performance</h3>
            <span class="chip">{{ topProducts.length }} products sold</span>
          </div>
          <div class="t-scroll">
            <table class="dtable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="r">Units Sold</th>
                  <th class="r">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in topProducts" :key="p.name">
                  <td class="fw">{{ p.name }}</td>
                  <td class="r mono">{{ p.totalQty }}</td>
                  <td class="r mono">GH₵{{ p.totalRevenue.toLocaleString() }}</td>
                </tr>
                <tr v-if="topProducts.length === 0">
                  <td colspan="3" class="empty-row">No sales data yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- /products -->

      <!-- ══════════════════ INVENTORY TAB ══════════════════ -->
      <div v-else-if="activeTab === 'inventory'" class="tab-content">
        <!-- Category stat cards -->
        <div class="cat-grid">
          <div v-for="(cat, i) in categoryStats" :key="cat.name" class="cat-card">
            <div class="cat-dot" :style="{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }" />
            <div class="cat-name">{{ cat.name }}</div>
            <div class="cat-val">{{ cat.count }}</div>
            <div class="cat-sub">SKUs</div>
          </div>
        </div>

        <!-- Donut + Stock bar -->
        <div class="charts-row">
          <div class="bento-card chart-box">
            <h3 class="chart-title cmt">
              <span class="mdi mdi-chart-donut" /> Products by Category
            </h3>
            <div v-if="categoryStats.length === 0" class="chart-empty">No inventory data.</div>
            <VueApexCharts
              v-else
              type="donut"
              :options="catDonutOpts"
              :series="catDonutSeries"
              height="280"
            />
          </div>
          <div class="bento-card chart-box">
            <h3 class="chart-title cmt">
              <span class="mdi mdi-package-variant-closed" /> Stock Levels (Top 10)
            </h3>
            <div v-if="stockItems.length === 0" class="chart-empty">No inventory data.</div>
            <VueApexCharts
              v-else
              type="bar"
              :options="stockBarOpts"
              :series="stockBarSeries"
              height="280"
            />
          </div>
        </div>

        <!-- Low stock table -->
        <div class="bento-card t-card">
          <div class="t-header">
            <h3 class="chart-title">Low Stock Alert</h3>
            <span
              :class="[
                'chip',
                lowStockItems.length === 0
                  ? 'chip--ok'
                  : lowStockItems.some((i) => i.stock === 0)
                    ? 'chip--danger'
                    : 'chip--warn',
              ]"
            >
              {{ lowStockItems.length === 0 ? 'All good' : `${lowStockItems.length} items` }}
            </span>
          </div>
          <div class="t-scroll">
            <table class="dtable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th class="r">Price</th>
                  <th class="r">Stock</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in lowStockItems" :key="item.id">
                  <td class="fw">{{ item.name }}</td>
                  <td class="muted">{{ item.category }}</td>
                  <td class="mono muted">{{ item.sku }}</td>
                  <td class="r mono">{{ formatCurrency(item.price) }}</td>
                  <td class="r">
                    <span
                      :class="[
                        'stock-chip',
                        item.stock === 0 ? 'stock-chip--out' : 'stock-chip--low',
                      ]"
                    >
                      {{ item.stock === 0 ? 'Out of stock' : `${item.stock} left` }}
                    </span>
                  </td>
                </tr>
                <tr v-if="lowStockItems.length === 0">
                  <td colspan="5" class="empty-row">
                    <span class="mdi mdi-check-circle-outline" />
                    All products have sufficient stock (more than 5 units).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- /inventory -->
    </template>
  </div>
</template>

<style scoped>
/* ── Wrapper ── */
.rpt-wrap {
  padding: 24px 28px 40px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ── */
.rpt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--pos-muted);
}

.rpt-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--pos-ink);
  margin-top: 4px;
}

.hdr-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.btn-outline,
.btn-solid {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--pos-sans);
}
.btn-outline {
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  color: var(--pos-muted);
}
.btn-outline:hover {
  border-color: var(--pos-accent);
  color: var(--pos-accent-strong);
}
.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-solid {
  background: var(--pos-accent);
  border: none;
  color: #fff;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.28);
}
.btn-solid:hover {
  background: var(--pos-accent-strong);
}

/* ── Alert ── */
.alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.07);
  border: 1px solid rgba(239, 68, 68, 0.18);
  border-radius: 12px;
  color: #dc2626;
  font-size: 13px;
}

/* ── Loading ── */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 260px;
  color: var(--pos-muted);
  font-size: 14px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--pos-border);
  border-top-color: var(--pos-accent);
  border-radius: 50%;
  animation: do-spin 0.75s linear infinite;
}
@keyframes do-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Period ── */
.period-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.period-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--pos-muted);
}
.period-pills {
  display: flex;
  gap: 6px;
}
.period-pill {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--pos-border);
  background: var(--pos-bg);
  color: var(--pos-muted);
  transition: all 0.15s;
  font-family: var(--pos-sans);
}
.period-pill.active {
  background: var(--pos-accent-soft);
  border-color: var(--pos-accent);
  color: var(--pos-accent-strong);
}

/* ── Tab nav ── */
.tab-nav {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--pos-border);
  overflow-x: auto;
  scrollbar-width: none;
}
.tab-nav::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  background: none;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  cursor: pointer;
  white-space: nowrap;
  color: var(--pos-muted);
  transition: all 0.15s;
  font-family: var(--pos-sans);
  margin-bottom: -1px;
}
.tab-btn:hover {
  color: var(--pos-ink);
  background: var(--pos-bg);
}
.tab-btn.active {
  background: var(--pos-surface);
  border-color: var(--pos-border);
  border-bottom-color: var(--pos-surface);
  color: var(--pos-accent-strong);
}

/* ── Tab content ── */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── Stat cards ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.stat-card {
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  border-left-width: 3px;
  border-radius: var(--pos-radius);
  padding: 16px 18px;
  box-shadow: 0 1px 6px var(--pos-shadow);
}
.stat-card--amber {
  border-left-color: #d97706;
}
.stat-card--blue {
  border-left-color: #2563eb;
}
.stat-card--teal {
  border-left-color: #0d9488;
}
.stat-card--violet {
  border-left-color: #7c3aed;
}
.stat-icon {
  color: var(--pos-muted);
  font-size: 16px;
  margin-bottom: 8px;
  display: block;
}
.stat-period {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--pos-muted);
}
.stat-val {
  font-size: 20px;
  font-weight: 800;
  margin-top: 2px;
  letter-spacing: -0.02em;
  color: var(--pos-ink);
}
.stat-val--emerald {
  color: #059669;
}
.stat-val--blue {
  color: #2563eb;
}
.stat-val--violet {
  color: #7c3aed;
}
.stat-sub {
  font-size: 12px;
  color: var(--pos-muted);
  margin-top: 2px;
}

/* ── Chart cards ── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 860px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

.chart-box {
  padding: 20px;
}

.chart-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--pos-ink);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}
.chart-title--emerald {
  color: #059669;
}
.cmt {
  margin-bottom: 14px;
}

.badge-demo,
.badge-live {
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 999px;
  font-weight: 500;
}
.badge-demo {
  background: var(--pos-bg);
  color: var(--pos-muted);
  border: 1px solid var(--pos-border);
}
.badge-live {
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.chart-empty {
  color: var(--pos-muted);
  font-size: 13px;
  padding: 40px;
  text-align: center;
}

/* ── Seller list ── */
.seller-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.seller-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.seller-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--pos-accent-soft);
  color: var(--pos-accent-strong);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.seller-info {
  flex: 1;
  min-width: 0;
}
.seller-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--pos-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.seller-bar-wrap {
  height: 4px;
  background: #f1f5f9;
  border-radius: 999px;
  margin-top: 5px;
  overflow: hidden;
}
.seller-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--pos-accent) 0%, var(--pos-accent-strong) 100%);
  border-radius: 999px;
  transition: width 0.4s ease;
}
.seller-stats {
  text-align: right;
  flex-shrink: 0;
}
.seller-qty {
  font-size: 12px;
  font-weight: 600;
  color: var(--pos-ink);
}
.seller-rev {
  font-size: 11px;
  color: var(--pos-muted);
  font-family: var(--pos-mono);
}

/* ── Category grid ── */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.cat-card {
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  border-radius: var(--pos-radius);
  padding: 14px;
}
.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-bottom: 8px;
}
.cat-name {
  font-size: 12px;
  color: var(--pos-muted);
  font-weight: 500;
}
.cat-val {
  font-size: 22px;
  font-weight: 800;
  color: var(--pos-ink);
  margin-top: 2px;
}
.cat-sub {
  font-size: 11px;
  color: var(--pos-muted);
}

/* ── Tables ── */
.t-card {
  overflow: hidden;
  padding: 0;
}
.t-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--pos-border);
  gap: 12px;
}
.t-scroll {
  overflow-x: auto;
}

.dtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.dtable thead th {
  padding: 10px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--pos-muted);
  background: var(--pos-bg);
  border-bottom: 1px solid var(--pos-border);
  white-space: nowrap;
}
.dtable tbody tr:hover {
  background: var(--pos-bg);
}
.dtable tbody td {
  padding: 11px 20px;
  color: var(--pos-ink);
  border-bottom: 1px solid var(--pos-border);
}
.dtable tbody tr:last-child td {
  border-bottom: none;
}
.r {
  text-align: right !important;
}
.fw {
  font-weight: 500;
}
.mono {
  font-family: var(--pos-mono) !important;
}
.muted {
  color: var(--pos-muted) !important;
}
.emerald {
  color: #059669 !important;
}
.empty-row {
  text-align: center;
  color: var(--pos-muted);
  padding: 32px !important;
}

/* ── Chips ── */
.chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--pos-bg);
  color: var(--pos-muted);
  border: 1px solid var(--pos-border);
}
.chip--ok {
  background: rgba(16, 185, 129, 0.09);
  color: #065f46;
  border-color: rgba(16, 185, 129, 0.2);
}
.chip--warn {
  background: rgba(245, 158, 11, 0.09);
  color: #92400e;
  border-color: rgba(245, 158, 11, 0.2);
}
.chip--danger {
  background: rgba(239, 68, 68, 0.07);
  color: #991b1b;
  border-color: rgba(239, 68, 68, 0.2);
}

.stock-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.stock-chip--out {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}
.stock-chip--low {
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

/* ── Utils ── */
.spin {
  animation: do-spin 0.75s linear infinite;
  display: inline-block;
}
</style>
