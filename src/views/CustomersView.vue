<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { createCustomer, getReceipts, searchCustomers } from '@/api/pos'
import { usePosStore } from '@/stores/pos'
import { formatCurrency } from '@/utils/format'
import type { Receipt } from '@/types/pos'

const store = usePosStore()

const normalizePhone = (phone: string | null | undefined) => String(phone ?? '').replace(/\D/g, '')

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  created_at: string
}

// ── data ─────────────────────────────────────────────────────
const customers = ref<Customer[]>([])
const receipts = ref<Receipt[]>([])
const isLoading = ref(true)

const load = async () => {
  isLoading.value = true
  try {
    const [c, r] = await Promise.all([searchCustomers(), getReceipts()])
    customers.value = c
    receipts.value = r
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const uniqueCustomers = computed(() => {
  const byPhone = new Map<string, Customer>()

  for (const customer of customers.value) {
    const key = normalizePhone(customer.phone) || `id:${customer.id}`
    const existing = byPhone.get(key)

    if (!existing) {
      byPhone.set(key, customer)
      continue
    }

    byPhone.set(key, {
      ...existing,
      name: existing.name || customer.name,
      phone: existing.phone || customer.phone,
      email: existing.email || customer.email,
    })
  }

  return Array.from(byPhone.values())
})

// ── per-customer receipt lookup (match by phone) ─────────────
const receiptsByCustomer = (c: Customer): Receipt[] => {
  const phoneKey = normalizePhone(c.phone)
  if (!phoneKey) return []
  return receipts.value.filter((r) => normalizePhone(r.customer?.phone) === phoneKey)
}

const orderCount = (c: Customer) => receiptsByCustomer(c).length
const totalSpent = (c: Customer) => receiptsByCustomer(c).reduce((s, r) => s + r.total, 0)

// ── stats ─────────────────────────────────────────────────────
const totalCustomers = computed(() => uniqueCustomers.value.length)
const totalRevenue = computed(() => uniqueCustomers.value.reduce((s, c) => s + totalSpent(c), 0))
const avgOrderVal = computed(() => {
  const allOrders = uniqueCustomers.value.reduce((s, c) => s + orderCount(c), 0)
  return allOrders > 0 ? totalRevenue.value / allOrders : 0
})

// ── search + sort ─────────────────────────────────────────────
const search = ref('')

type SortField = 'name' | 'orders' | 'spent'
type SortDir = 'asc' | 'desc'
const sortField = ref<SortField>('name')
const sortDir = ref<SortDir>('asc')

const toggleSort = (field: SortField) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  let list = q
    ? uniqueCustomers.value.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone || '').includes(q) ||
          (c.email || '').toLowerCase().includes(q),
      )
    : [...uniqueCustomers.value]

  return list.sort((a, b) => {
    let av: string | number, bv: string | number
    if (sortField.value === 'name') {
      av = a.name.toLowerCase()
      bv = b.name.toLowerCase()
    } else if (sortField.value === 'orders') {
      av = orderCount(a)
      bv = orderCount(b)
    } else {
      av = totalSpent(a)
      bv = totalSpent(b)
    }
    if (av < bv) return sortDir.value === 'asc' ? -1 : 1
    if (av > bv) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

// ── avatar colour ─────────────────────────────────────────────
const avatarBgs = [
  '#f59e0b',
  '#8b5cf6',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#f97316',
  '#14b8a6',
  '#6366f1',
]
const avatarBg = (id: string) =>
  avatarBgs[parseInt(id.replace(/\D/g, '') || '0', 10) % avatarBgs.length]
const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

// ── add customer ──────────────────────────────────────────────
const showAddForm = ref(false)
const newName = ref('')
const newPhone = ref('')
const newEmail = ref('')
const addError = ref('')
const isAdding = ref(false)

const addValid = computed(
  () => newName.value.trim().length > 0 && newPhone.value.trim().length >= 10,
)

const submitAdd = async () => {
  if (!addValid.value) return
  isAdding.value = true
  addError.value = ''
  try {
    const c = await createCustomer({
      name: newName.value.trim(),
      phone: newPhone.value.trim(),
      email: newEmail.value.trim() || undefined,
    })
    customers.value = [
      c,
      ...customers.value.filter(
        (existing) => normalizePhone(existing.phone) !== normalizePhone(c.phone),
      ),
    ]
    newName.value = ''
    newPhone.value = ''
    newEmail.value = ''
    showAddForm.value = false
  } catch (e: unknown) {
    addError.value = e instanceof Error ? e.message : 'Failed to save customer'
  } finally {
    isAdding.value = false
  }
}

// ── history modal ─────────────────────────────────────────────
const historyCustomer = ref<Customer | null>(null)
const expandedReceipts = ref(new Set<string>())

const openHistory = (c: Customer) => {
  historyCustomer.value = c
  expandedReceipts.value = new Set()
}

const historyReceipts = computed(() =>
  historyCustomer.value
    ? [...receiptsByCustomer(historyCustomer.value)].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : [],
)

const historyTotalSpent = computed(() => historyReceipts.value.reduce((s, r) => s + r.total, 0))
const historyAvgOrder = computed(() =>
  historyReceipts.value.length > 0 ? historyTotalSpent.value / historyReceipts.value.length : 0,
)

const toggleReceipt = (id: string) => {
  const s = new Set(expandedReceipts.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedReceipts.value = s
}

const formatJoined = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })

const paymentIcon = (method: string) => {
  if (method === 'cash') return 'mdi-cash'
  if (method === 'momo') return 'mdi-cellphone'
  if (method === 'ussd') return 'mdi-dialpad'
  if (method === 'paystack') return 'mdi-credit-card-outline'
  return 'mdi-cash'
}
</script>

<template>
  <!-- History Modal -->
  <div v-if="historyCustomer" class="modal-overlay" @click.self="historyCustomer = null">
    <div class="modal-box">
      <!-- Modal header -->
      <div class="modal-header">
        <div class="modal-avatar" :style="{ background: avatarBg(historyCustomer.id) }">
          {{ initials(historyCustomer.name) }}
        </div>
        <div class="modal-info">
          <h2 class="modal-name">{{ historyCustomer.name }}</h2>
          <div class="modal-contact">
            <span v-if="historyCustomer.phone">
              <span class="mdi mdi-phone-outline" /> {{ historyCustomer.phone }}
            </span>
            <span v-if="historyCustomer.email">
              <span class="mdi mdi-email-outline" /> {{ historyCustomer.email }}
            </span>
          </div>
        </div>
        <button class="modal-close" type="button" @click="historyCustomer = null">
          <span class="mdi mdi-close" />
        </button>
      </div>

      <!-- Stats bar -->
      <div class="modal-stats">
        <div class="mstat">
          <span class="mstat-val mono">{{ historyReceipts.length }}</span>
          <span class="mstat-label">Receipts</span>
        </div>
        <div class="mstat">
          <span class="mstat-val mono">{{
            formatCurrency(historyTotalSpent, store.settings.currency, store.settings.locale)
          }}</span>
          <span class="mstat-label">Total Spent</span>
        </div>
        <div class="mstat">
          <span class="mstat-val mono">{{
            formatCurrency(historyAvgOrder, store.settings.currency, store.settings.locale)
          }}</span>
          <span class="mstat-label">Avg. Order</span>
        </div>
      </div>

      <!-- Receipt list -->
      <div class="modal-body">
        <div v-if="historyReceipts.length === 0" class="history-empty">
          <span class="mdi mdi-shopping-outline history-empty-icon" />
          <p class="history-empty-title">No purchase history yet</p>
          <p class="history-empty-sub">This customer hasn't made any purchases.</p>
        </div>
        <div v-else class="receipt-list">
          <div
            v-for="r in historyReceipts"
            :key="r.id"
            class="receipt-row"
            :class="{ expanded: expandedReceipts.has(r.id) }"
          >
            <button class="receipt-row-header" type="button" @click="toggleReceipt(r.id)">
              <div
                class="receipt-row-icon"
                :class="{ 'receipt-row-icon--open': expandedReceipts.has(r.id) }"
              >
                <span class="mdi mdi-receipt-text-outline" />
              </div>
              <div class="receipt-row-meta">
                <div class="receipt-row-top">
                  <span class="receipt-num mono">{{ r.number }}</span>
                  <span class="receipt-method-badge">
                    <span :class="`mdi ${paymentIcon(r.paymentMethod)}`" />
                    {{ r.paymentMethod }}
                  </span>
                </div>
                <div class="receipt-row-sub">
                  <span class="mdi mdi-clock-outline" />
                  {{
                    new Date(r.createdAt).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }}
                  · {{ r.items.length }} item{{ r.items.length !== 1 ? 's' : '' }}
                </div>
              </div>
              <div class="receipt-row-right">
                <span class="receipt-row-total mono accent-text">{{
                  formatCurrency(r.total, store.settings.currency, store.settings.locale)
                }}</span>
                <span
                  :class="`mdi mdi-chevron-${expandedReceipts.has(r.id) ? 'up' : 'down'} receipt-chevron`"
                />
              </div>
            </button>

            <div v-if="expandedReceipts.has(r.id)" class="receipt-row-body">
              <div v-for="item in r.items" :key="item.product.id" class="receipt-item">
                <div class="receipt-item-left">
                  <span class="receipt-qty-badge mono">{{ item.quantity }}</span>
                  <span class="receipt-item-name">{{ item.product.name }}</span>
                </div>
                <div class="receipt-item-right">
                  <span class="mono muted"
                    >@
                    {{
                      formatCurrency(
                        item.product.price,
                        store.settings.currency,
                        store.settings.locale,
                      )
                    }}</span
                  >
                  <span class="mono receipt-item-total">{{
                    formatCurrency(
                      item.product.price * item.quantity,
                      store.settings.currency,
                      store.settings.locale,
                    )
                  }}</span>
                </div>
              </div>
              <div class="receipt-totals">
                <div class="receipt-total-row muted-sm">
                  <span>Subtotal</span>
                  <span class="mono">{{
                    formatCurrency(r.subtotal, store.settings.currency, store.settings.locale)
                  }}</span>
                </div>
                <div class="receipt-total-row muted-sm">
                  <span>Tax</span>
                  <span class="mono">{{
                    formatCurrency(r.tax, store.settings.currency, store.settings.locale)
                  }}</span>
                </div>
                <div class="receipt-total-row receipt-total-strong">
                  <span>Total</span>
                  <span class="mono accent-text">{{
                    formatCurrency(r.total, store.settings.currency, store.settings.locale)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Page -->
  <div class="customers-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="eyebrow">Customer management</div>
        <h1 class="page-title">Customers</h1>
        <p class="page-sub">
          {{ totalCustomers }} registered customer{{ totalCustomers !== 1 ? 's' : '' }}
        </p>
      </div>
      <button class="add-btn" type="button" @click="showAddForm = !showAddForm">
        <span class="mdi mdi-account-plus-outline" />
        Add Customer
      </button>
    </div>

    <!-- Add Customer Form -->
    <div v-if="showAddForm" class="add-form-card bento-card">
      <div class="add-form-header">
        <h3 class="add-form-title">New Customer</h3>
        <button
          class="icon-btn"
          type="button"
          @click="
            showAddForm = false
            addError = ''
          "
        >
          <span class="mdi mdi-close" />
        </button>
      </div>

      <div v-if="addError" class="form-error">
        <span class="mdi mdi-alert-circle-outline" />
        {{ addError }}
      </div>

      <div class="add-form-fields">
        <div class="form-field">
          <label class="form-label">Full Name *</label>
          <input v-model="newName" type="text" class="form-input" placeholder="Ama Asante" />
        </div>
        <div class="form-field">
          <label class="form-label">Phone Number *</label>
          <input v-model="newPhone" type="tel" class="form-input mono" placeholder="024 XXX XXXX" />
        </div>
        <div class="form-field">
          <label class="form-label">Email <span class="form-label-opt">(optional)</span></label>
          <input
            v-model="newEmail"
            type="email"
            class="form-input"
            placeholder="customer@email.com"
          />
        </div>
      </div>

      <div class="add-form-actions">
        <button
          class="cancel-btn"
          type="button"
          @click="
            showAddForm = false
            addError = ''
          "
        >
          Cancel
        </button>
        <button class="save-btn" type="button" :disabled="!addValid || isAdding" @click="submitAdd">
          <span v-if="isAdding" class="mdi mdi-loading spin" />
          {{ isAdding ? 'Saving...' : 'Save Customer' }}
        </button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stats-row">
      <div class="stat-card bento-card">
        <div class="stat-icon-wrap stat-icon-wrap--violet">
          <span class="mdi mdi-account-multiple-outline stat-icon stat-icon--violet" />
        </div>
        <div>
          <p class="stat-label">Total Customers</p>
          <p class="stat-val mono">{{ totalCustomers }}</p>
        </div>
      </div>
      <div class="stat-card bento-card">
        <div class="stat-icon-wrap stat-icon-wrap--amber">
          <span class="mdi mdi-trending-up stat-icon stat-icon--amber" />
        </div>
        <div>
          <p class="stat-label">Total Revenue</p>
          <p class="stat-val mono">
            {{ formatCurrency(totalRevenue, store.settings.currency, store.settings.locale) }}
          </p>
        </div>
      </div>
      <div class="stat-card bento-card">
        <div class="stat-icon-wrap stat-icon-wrap--emerald">
          <span class="mdi mdi-shopping-outline stat-icon stat-icon--emerald" />
        </div>
        <div>
          <p class="stat-label">Avg. Order Value</p>
          <p class="stat-val mono">
            {{ formatCurrency(avgOrderVal, store.settings.currency, store.settings.locale) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Customer table card -->
    <div class="table-card bento-card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <span class="mdi mdi-magnify search-icon" />
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search by name, phone or email..."
          />
          <button v-if="search" class="search-clear" type="button" @click="search = ''">
            <span class="mdi mdi-close" />
          </button>
        </div>
        <div class="sort-controls">
          <span class="sort-label"><span class="mdi mdi-tune-variant" /> Sort:</span>
          <button
            v-for="s in [
              { f: 'name', l: 'Name' },
              { f: 'orders', l: 'Orders' },
              { f: 'spent', l: 'Spent' },
            ] as { f: SortField; l: string }[]"
            :key="s.f"
            class="sort-btn"
            :class="{ active: sortField === s.f }"
            type="button"
            @click="toggleSort(s.f)"
          >
            {{ s.l }}
            <span
              v-if="sortField === s.f"
              :class="`mdi mdi-arrow-${sortDir === 'asc' ? 'up' : 'down'}`"
            />
            <span v-else class="mdi mdi-arrow-up-down sort-inactive" />
          </button>
        </div>
      </div>

      <!-- Table header -->
      <div class="tbl-header">
        <div class="tbl-col tbl-col--name tbl-hcell sort-col" @click="toggleSort('name')">
          Customer
          <span
            v-if="sortField === 'name'"
            :class="`mdi mdi-arrow-${sortDir === 'asc' ? 'up' : 'down'} sort-arrow`"
          />
          <span v-else class="mdi mdi-arrow-up-down sort-arrow sort-arrow--inactive" />
        </div>
        <div class="tbl-col tbl-hcell">Phone</div>
        <div class="tbl-col tbl-hcell">Email</div>
        <div class="tbl-col tbl-hcell sort-col" @click="toggleSort('orders')">
          Orders
          <span
            v-if="sortField === 'orders'"
            :class="`mdi mdi-arrow-${sortDir === 'asc' ? 'up' : 'down'} sort-arrow`"
          />
          <span v-else class="mdi mdi-arrow-up-down sort-arrow sort-arrow--inactive" />
        </div>
        <div class="tbl-col tbl-hcell sort-col" @click="toggleSort('spent')">
          Total Spent
          <span
            v-if="sortField === 'spent'"
            :class="`mdi mdi-arrow-${sortDir === 'asc' ? 'up' : 'down'} sort-arrow`"
          />
          <span v-else class="mdi mdi-arrow-up-down sort-arrow sort-arrow--inactive" />
        </div>
        <div class="tbl-col tbl-hcell">Joined</div>
        <div class="tbl-col tbl-hcell" />
      </div>

      <!-- Rows -->
      <div v-if="isLoading" class="tbl-loading">
        <span class="mdi mdi-loading spin" style="font-size: 24px; color: var(--pos-muted)" />
      </div>
      <div v-else-if="filtered.length === 0" class="tbl-empty">
        <span class="mdi mdi-account-multiple-outline" style="font-size: 40px; opacity: 0.25" />
        <p>No customers found</p>
      </div>
      <div v-else>
        <div v-for="c in filtered" :key="c.id" class="tbl-row">
          <!-- Name + avatar -->
          <div class="tbl-col tbl-col--name">
            <div class="cust-avatar" :style="{ background: avatarBg(c.id) }">
              {{ initials(c.name) }}
            </div>
            <div>
              <div class="cust-name">{{ c.name }}</div>
              <div class="cust-phone-mobile">{{ c.phone }}</div>
            </div>
          </div>

          <!-- Phone -->
          <div class="tbl-col tbl-col--hide-sm">
            <span class="mdi mdi-phone-outline tbl-field-icon" />
            <span class="mono tbl-muted">{{ c.phone || '—' }}</span>
          </div>

          <!-- Email -->
          <div class="tbl-col tbl-col--hide-sm tbl-col--email">
            <template v-if="c.email">
              <span class="mdi mdi-email-outline tbl-field-icon" />
              <span class="tbl-muted truncate">{{ c.email }}</span>
            </template>
            <span v-else class="tbl-muted" style="font-style: italic">—</span>
          </div>

          <!-- Orders -->
          <div class="tbl-col tbl-col--hide-sm">
            <span class="mdi mdi-shopping-outline tbl-field-icon" />
            <span>{{ orderCount(c) }}</span>
          </div>

          <!-- Spent -->
          <div class="tbl-col tbl-col--hide-sm mono accent-text" style="font-weight: 600">
            {{ formatCurrency(totalSpent(c), store.settings.currency, store.settings.locale) }}
          </div>

          <!-- Joined -->
          <div class="tbl-col tbl-col--hide-sm tbl-muted" style="font-size: 12px">
            <span class="mdi mdi-calendar-outline tbl-field-icon" />
            {{ formatJoined(c.created_at) }}
          </div>

          <!-- View History -->
          <div class="tbl-col tbl-col--action">
            <button class="history-btn" type="button" @click="openHistory(c)">
              <span class="mdi mdi-history" />
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Page ── */
.customers-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 28px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 960px) {
  .customers-page {
    padding: 20px 16px 32px;
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 4px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.page-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--color-pos-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
  transition:
    background 0.15s,
    transform 0.15s;
  font-family: var(--pos-sans);
}

.add-btn:hover {
  background: var(--color-pos-accent-strong);
  transform: translateY(-1px);
}

/* ── Add form ── */
.add-form-card {
  border: 2px solid var(--color-pos-accent);
  border-radius: 24px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--surface-color);
}

.add-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-form-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-color);
}

.form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.18);
  border-radius: 10px;
  padding: 9px 13px;
}

.add-form-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.form-label-opt {
  text-transform: none;
  font-weight: 400;
  letter-spacing: 0;
}

.form-input {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  font-size: 13px;
  color: var(--text-color);
  font-family: var(--pos-sans);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.form-input:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--pos-ring);
}
.form-input.mono {
  font-family: var(--pos-mono);
}

.add-form-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  font-family: var(--pos-sans);
}

.cancel-btn:hover {
  background: var(--border-color);
}

.save-btn {
  padding: 8px 20px;
  border-radius: 10px;
  background: var(--color-pos-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;
  font-family: var(--pos-sans);
}

.save-btn:hover:not(:disabled) {
  background: var(--color-pos-accent-strong);
}
.save-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Stats ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrap--violet {
  background: rgba(139, 92, 246, 0.1);
}
.stat-icon-wrap--amber {
  background: rgba(245, 158, 11, 0.1);
}
.stat-icon-wrap--emerald {
  background: rgba(16, 185, 129, 0.1);
}

.stat-icon {
  font-size: 20px;
}
.stat-icon--violet {
  color: #7c3aed;
}
.stat-icon--amber {
  color: #b45309;
}
.stat-icon--emerald {
  color: #059669;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}
.stat-val {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.2;
  margin-top: 2px;
}

/* ── Table card ── */
.table-card {
  overflow: hidden;
  background: var(--surface-color);
}

/* ── Toolbar ── */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface-color);
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 16px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 36px 10px 36px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  font-size: 13px;
  color: var(--text-color);
  font-family: var(--pos-sans);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.search-input:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--pos-ring);
}

.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 14px;
  padding: 2px;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sort-label {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--pos-sans);
}

.sort-btn:hover {
  border-color: var(--color-pos-accent);
  color: var(--text-color);
}

.sort-btn.active {
  background: var(--color-pos-accent-soft);
  border-color: var(--color-pos-accent);
  color: var(--color-pos-accent-strong);
}

.sort-inactive {
  opacity: 0.35;
}

/* ── Table header ── */
.tbl-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 1fr 1.2fr 1fr 120px;
  gap: 0 16px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color);
}

.tbl-hcell {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-col {
  cursor: pointer;
  transition: color 0.15s;
}
.sort-col:hover {
  color: var(--text-color);
}
.sort-arrow {
  font-size: 11px;
}
.sort-arrow--inactive {
  opacity: 0.3;
}

/* ── Table rows ── */
.tbl-loading,
.tbl-empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.tbl-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 1fr 1.2fr 1fr 120px;
  gap: 0 16px;
  padding: 12px 18px;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.12s;
}

.tbl-row:last-child {
  border-bottom: none;
}
.tbl-row:hover {
  background: var(--bg-color);
}
.tbl-row:hover .history-btn {
  opacity: 1;
}

.tbl-col {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  overflow: hidden;
}
.tbl-col--name {
  gap: 10px;
}
.tbl-col--email {
  overflow: hidden;
}
.tbl-col--action {
  justify-content: flex-end;
}

.tbl-field-icon {
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.tbl-muted {
  color: var(--text-muted);
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cust-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.03em;
}

.cust-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}
.cust-phone-mobile {
  display: none;
  font-size: 11px;
  color: var(--text-muted);
}

.history-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0;
  white-space: nowrap;
  transition: all 0.15s;
  font-family: var(--pos-sans);
}

.history-btn:hover {
  color: var(--color-pos-accent-strong);
  border-color: var(--color-pos-accent);
  background: var(--color-pos-accent-soft);
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
}

.modal-box {
  width: 100%;
  max-width: 640px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.modal-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.03em;
}

.modal-info {
  flex: 1;
  min-width: 0;
}
.modal-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.2;
}

.modal-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.modal-contact span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 6px;
  border-radius: 8px;
  font-size: 18px;
  transition:
    color 0.15s,
    background 0.15s;
}

.modal-close:hover {
  color: var(--text-color);
  background: var(--border-color);
}

.modal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color);
  flex-shrink: 0;
}

.mstat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-right: 1px solid var(--border-color);
}

.mstat:last-child {
  border-right: none;
}
.mstat-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
}
.mstat-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  background: var(--bg-color);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  opacity: 0.5;
}

.history-empty-icon {
  font-size: 40px;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.history-empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}
.history-empty-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 3px;
}

.receipt-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.receipt-row {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.15s;
  background: var(--surface-color);
}

.receipt-row:hover {
  border-color: var(--color-pos-accent);
}
.receipt-row.expanded {
  border-color: var(--color-pos-accent);
  background: var(--color-pos-accent-soft);
}

.receipt-row-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--pos-sans);
}

.receipt-row-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  background: var(--bg-color);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.receipt-row-icon--open {
  background: var(--color-pos-accent);
  color: #fff;
  border-color: var(--color-pos-accent);
}

.receipt-row-meta {
  flex: 1;
  min-width: 0;
}
.receipt-row-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.receipt-num {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.receipt-method-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 2px 7px;
  border-radius: 999px;
}

.receipt-row-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
}

.receipt-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 8px;
}

.receipt-row-total {
  font-size: 14px;
  font-weight: 700;
}
.receipt-chevron {
  font-size: 16px;
  color: var(--text-muted);
}

.receipt-row-body {
  padding: 0 14px 14px;
  border-top: 1px solid rgba(217, 119, 6, 0.15);
  margin-top: 0;
}

.receipt-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 13px;
}

.receipt-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
}
.receipt-item-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.receipt-qty-badge {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.receipt-item-name {
  font-size: 13px;
}

.receipt-totals {
  padding-top: 10px;
  margin-top: 6px;
  border-top: 1px solid rgba(217, 119, 6, 0.15);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.receipt-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.receipt-total-strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-color);
  padding-top: 4px;
}
.receipt-item-total {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  min-width: 60px;
  text-align: right;
}

/* ── Utils ── */
.mono {
  font-family: var(--pos-mono);
}
.accent-text {
  color: var(--color-pos-accent-strong);
}
.muted {
  color: var(--text-muted);
}
.muted-sm {
  font-size: 12px;
  color: var(--text-muted);
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 6px;
  font-size: 17px;
  transition: color 0.15s;
}
.icon-btn:hover {
  color: var(--text-color);
}
.spin {
  animation: do-spin 0.75s linear infinite;
  display: inline-block;
}
@keyframes do-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .tbl-header {
    grid-template-columns: 1fr 120px;
  }
  .tbl-row {
    grid-template-columns: 1fr 120px;
  }
  .tbl-col--hide-sm {
    display: none;
  }
  .cust-phone-mobile {
    display: block;
  }
  .tbl-header .tbl-col:not(.tbl-col--name):not(.tbl-col--action) {
    display: none;
  }
  .history-btn {
    opacity: 1;
  }
}
</style>
