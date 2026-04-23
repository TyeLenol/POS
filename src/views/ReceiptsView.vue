<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { usePosStore } from '@/stores/pos'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { Receipt } from '@/types/pos'

const store = usePosStore()
const selectedId = ref<string | null>(null)

const searchTerm = ref('')
const filterStatus = ref<'all' | 'paid' | 'failed'>('all')
const filterMethod = ref<'all' | Receipt['paymentMethod']>('all')

const receipts = computed(() => store.receipts)
const selectedReceipt = computed(() => {
  if (!selectedId.value) return null
  return receipts.value.find((r) => r.id === selectedId.value) || null
})

const selectReceipt = (receipt: Receipt) => {
  selectedId.value = receipt.id
}

const paymentLabels: Record<Receipt['paymentMethod'], string> = {
  cash: 'Cash',
  momo: 'Mobile Money',
  ussd: 'USSD',
  paystack: 'Paystack',
}

const statusLabels: Record<Receipt['status'], string> = {
  paid: 'Paid',
  failed: 'Failed',
}

const paymentClass = (method: Receipt['paymentMethod']) => `payment--${method}`
const statusClass = (status: Receipt['status']) =>
  status === 'paid' ? 'status--paid' : 'status--failed'

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const formatShortTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const filteredReceipts = computed(() => {
  const q = searchTerm.value.toLowerCase().trim()
  return receipts.value.filter((receipt) => {
    const customerName = receipt.customer?.name?.toLowerCase() || ''
    const customerPhone = receipt.customer?.phone || ''
    const matchSearch =
      !q ||
      receipt.number.toLowerCase().includes(q) ||
      customerName.includes(q) ||
      customerPhone.includes(q)
    const matchStatus = filterStatus.value === 'all' || receipt.status === filterStatus.value
    const matchMethod = filterMethod.value === 'all' || receipt.paymentMethod === filterMethod.value
    return matchSearch && matchStatus && matchMethod
  })
})

const totalReceipts = computed(() => receipts.value.length)
const paidCount = computed(() => receipts.value.filter((r) => r.status === 'paid').length)
const failedCount = computed(() => receipts.value.filter((r) => r.status === 'failed').length)
const todayTotal = computed(() => {
  const today = new Date()
  return receipts.value
    .filter((r) => {
      const d = new Date(r.createdAt)
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate() &&
        r.status === 'paid'
      )
    })
    .reduce((sum, r) => sum + r.total, 0)
})

const buildReceiptHtml = (receipt: Receipt) => {
  const { settings } = store
  const itemsHtml = receipt.items
    .map(
      (item) => `
        <tr>
          <td>${item.product.name}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${formatCurrency(item.product.price, settings.currency, settings.locale)}</td>
          <td style="text-align:right">${formatCurrency(item.product.price * item.quantity, settings.currency, settings.locale)}</td>
        </tr>`,
    )
    .join('')

  return `<html><head><style>
    * { box-sizing: border-box; margin: 0; }
    body { font-family: Arial, sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .muted { color: #64748b; font-size: 12px; line-height: 1.8; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
    td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .totals { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; max-width: 280px; margin-left: auto; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; }
    .grand { font-weight: 700; font-size: 16px; padding-top: 8px; border-top: 2px solid #1f2937; }
    .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
  </style></head><body>
    <h1>${settings.storeName}</h1>
    <div class="muted">
      ${settings.branchName ? settings.branchName + '<br>' : ''}
      ${settings.address ? settings.address + '<br>' : ''}
      ${settings.phone || ''} ${settings.email ? '· ' + settings.email : ''}
    </div>
    <hr class="divider">
    <div class="muted">Receipt <strong>${receipt.number}</strong><br>${formatDateTime(receipt.createdAt)}</div>
    <table>
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${formatCurrency(receipt.subtotal, settings.currency, settings.locale)}</span></div>
      <div class="total-row"><span>${settings.taxLabel}</span><span>${formatCurrency(receipt.tax, settings.currency, settings.locale)}</span></div>
      <div class="total-row grand"><span>Total</span><span>${formatCurrency(receipt.total, settings.currency, settings.locale)}</span></div>
    </div>
    <div class="footer">Payment: ${receipt.paymentMethod?.toUpperCase()} · Status: ${receipt.status}</div>
  </body></html>`
}

const printReceipt = (receipt: Receipt | null) => {
  if (!receipt) return
  const popup = window.open('', '_blank', 'width=720,height=920')
  if (!popup) return
  popup.document.write(buildReceiptHtml(receipt))
  popup.document.close()
  popup.focus()
  popup.print()
}

onMounted(() => {
  store.loadReceipts()
})
</script>

<template>
  <div class="receipts-page">
    <div class="page-header">
      <div>
        <div class="eyebrow">Transaction history</div>
        <h1 class="page-title">Receipts</h1>
        <p class="page-sub">View and manage all transaction records.</p>
      </div>
    </div>

    <div class="summary-grid">
      <div class="bento-card summary-card">
        <div class="summary-label">Total receipts</div>
        <div class="summary-value">{{ totalReceipts }}</div>
      </div>
      <div class="bento-card summary-card">
        <div class="summary-label">Paid</div>
        <div class="summary-value summary-value--paid">{{ paidCount }}</div>
      </div>
      <div class="bento-card summary-card">
        <div class="summary-label">Failed</div>
        <div class="summary-value summary-value--failed">{{ failedCount }}</div>
      </div>
      <div class="bento-card summary-card">
        <div class="summary-label">Today's total</div>
        <div class="summary-value summary-value--accent">
          {{ formatCurrency(todayTotal, store.settings.currency, store.settings.locale) }}
        </div>
      </div>
    </div>

    <div class="bento-card receipts-card">
      <div class="filters-bar">
        <div class="search-wrap">
          <span class="mdi mdi-magnify search-icon" />
          <input
            v-model="searchTerm"
            type="text"
            class="search-input"
            placeholder="Search receipt ID or customer..."
          />
        </div>
        <div class="select-wrap">
          <select v-model="filterStatus" class="filter-select">
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          <span class="mdi mdi-chevron-down select-icon" />
        </div>
        <div class="select-wrap">
          <select v-model="filterMethod" class="filter-select">
            <option value="all">All methods</option>
            <option value="cash">Cash</option>
            <option value="momo">Mobile Money</option>
            <option value="ussd">USSD</option>
            <option value="paystack">Paystack</option>
          </select>
          <span class="mdi mdi-chevron-down select-icon" />
        </div>
      </div>

      <div class="table-wrap">
        <table class="receipts-table">
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Date &amp; Time</th>
              <th>Customer</th>
              <th>Payment</th>
              <th class="text-right">Total</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody v-if="filteredReceipts.length">
            <tr
              v-for="receipt in filteredReceipts"
              :key="receipt.id"
              class="receipt-row"
              @click="selectReceipt(receipt)"
            >
              <td class="mono">{{ receipt.number }}</td>
              <td class="muted">
                <div>{{ formatShortDate(receipt.createdAt) }}</div>
                <div class="tiny muted">
                  <span class="mdi mdi-clock-outline" />
                  {{ formatShortTime(receipt.createdAt) }}
                </div>
              </td>
              <td>
                <div v-if="receipt.customer?.name" class="customer-block">
                  <div class="customer-name">{{ receipt.customer.name }}</div>
                  <div class="tiny muted">{{ receipt.customer.phone || 'Walk-in' }}</div>
                </div>
                <span v-else class="tiny muted italic">Walk-in customer</span>
              </td>
              <td>
                <span class="pill" :class="paymentClass(receipt.paymentMethod)">
                  {{ paymentLabels[receipt.paymentMethod] }}
                </span>
              </td>
              <td class="text-right mono">
                {{ formatCurrency(receipt.total, store.settings.currency, store.settings.locale) }}
              </td>
              <td>
                <span class="pill" :class="statusClass(receipt.status)">
                  {{ statusLabels[receipt.status] }}
                </span>
              </td>
              <td class="text-right" @click.stop>
                <div class="row-actions">
                  <button class="icon-btn" type="button" @click="printReceipt(receipt)">
                    <span class="mdi mdi-printer-outline" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!filteredReceipts.length" class="empty-state">
          <div class="empty-icon">
            <span class="mdi mdi-magnify" />
          </div>
          <div class="empty-title">No receipts found</div>
          <div class="empty-sub">Try adjusting your search or filters.</div>
        </div>
      </div>
    </div>

    <div v-if="selectedReceipt" class="modal-overlay" @click.self="selectedId = null">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">
            <div class="modal-badge">
              <span class="mdi mdi-receipt-text-outline" />
            </div>
            <div>
              <div class="modal-name">{{ selectedReceipt.number }}</div>
              <div class="tiny muted">{{ formatDateTime(selectedReceipt.createdAt) }}</div>
            </div>
          </div>
          <div class="modal-actions">
            <span class="pill" :class="statusClass(selectedReceipt.status)">
              {{ statusLabels[selectedReceipt.status] }}
            </span>
            <button class="icon-btn" type="button" @click="selectedId = null">
              <span class="mdi mdi-close" />
            </button>
          </div>
        </div>

        <div class="modal-body">
          <div class="receipt-paper">
            <div class="receipt-head">
              <div class="receipt-logo">DA</div>
              <div class="receipt-store">{{ store.settings.storeName }}</div>
              <div class="tiny muted">{{ store.settings.address }}</div>
              <div class="tiny muted">{{ store.settings.phone }}</div>
              <div class="tiny mono muted">{{ selectedReceipt.number }}</div>
            </div>

            <div class="receipt-items">
              <div class="receipt-items-head">Items purchased</div>
              <div
                class="receipt-item"
                v-for="item in selectedReceipt.items"
                :key="item.product.id"
              >
                <div>
                  <div class="item-name">{{ item.product.name }}</div>
                  <div class="tiny muted">
                    {{ item.quantity }} ×
                    {{
                      formatCurrency(
                        item.product.price,
                        store.settings.currency,
                        store.settings.locale,
                      )
                    }}
                  </div>
                </div>
                <div class="mono">
                  {{
                    formatCurrency(
                      item.product.price * item.quantity,
                      store.settings.currency,
                      store.settings.locale,
                    )
                  }}
                </div>
              </div>
            </div>

            <div class="receipt-totals">
              <div class="total-row">
                <span>Subtotal</span>
                <span class="mono">{{
                  formatCurrency(
                    selectedReceipt.subtotal,
                    store.settings.currency,
                    store.settings.locale,
                  )
                }}</span>
              </div>
              <div class="total-row">
                <span>{{ store.settings.taxLabel }}</span>
                <span class="mono">{{
                  formatCurrency(
                    selectedReceipt.tax,
                    store.settings.currency,
                    store.settings.locale,
                  )
                }}</span>
              </div>
              <div class="total-row total-strong">
                <span>Total</span>
                <span class="mono">{{
                  formatCurrency(
                    selectedReceipt.total,
                    store.settings.currency,
                    store.settings.locale,
                  )
                }}</span>
              </div>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Payment</div>
              <span class="pill" :class="paymentClass(selectedReceipt.paymentMethod)">
                {{ paymentLabels[selectedReceipt.paymentMethod] }}
              </span>
            </div>
            <div class="detail-card">
              <div class="detail-label">Customer</div>
              <div class="detail-value">
                {{ selectedReceipt.customer?.name || 'Walk-in customer' }}
              </div>
              <div class="tiny muted">{{ selectedReceipt.customer?.phone || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-ghost" type="button" @click="selectedId = null">Close</button>
          <button class="btn-ghost" type="button" @click="printReceipt(selectedReceipt)">
            <span class="mdi mdi-printer-outline" /> Print
          </button>
          <button class="btn-primary" type="button" @click="printReceipt(selectedReceipt)">
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.receipts-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 28px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 960px) {
  .receipts-page {
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
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  margin-top: 4px;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.page-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.summary-card {
  padding: 16px 18px;
}

.summary-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-weight: 600;
}

.summary-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-color);
  font-family: var(--pos-mono);
}

.summary-value--paid {
  color: #16a34a;
}
.summary-value--failed {
  color: #dc2626;
}
.summary-value--accent {
  color: var(--color-pos-accent-strong);
}

.receipts-card {
  overflow: hidden;
}

.filters-bar {
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
  padding: 10px 12px 10px 36px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  font-size: 13px;
  color: var(--text-color);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.search-input:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--pos-ring);
}

.select-wrap {
  position: relative;
  min-width: 160px;
}

.filter-select {
  width: 100%;
  padding: 10px 32px 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  font-size: 13px;
  color: var(--text-color);
  appearance: none;
  cursor: pointer;
  outline: none;
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.table-wrap {
  overflow-x: auto;
}

.receipts-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.receipts-table thead {
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
}

.receipts-table th {
  padding: 12px 16px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  white-space: nowrap;
}

.receipts-table td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
}

.receipt-row {
  cursor: pointer;
  transition: background 0.15s;
}
.receipt-row:hover {
  background: var(--bg-color);
}

.mono {
  font-family: var(--pos-mono);
}
.muted {
  color: var(--text-muted);
}
.tiny {
  font-size: 11px;
}
.italic {
  font-style: italic;
}
.text-right {
  text-align: right;
}

.customer-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.customer-name {
  font-weight: 600;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}

.payment--cash {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  border-color: rgba(16, 185, 129, 0.25);
}
.payment--momo {
  background: rgba(139, 92, 246, 0.12);
  color: #6d28d9;
  border-color: rgba(139, 92, 246, 0.25);
}
.payment--ussd {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  border-color: rgba(59, 130, 246, 0.25);
}
.payment--paystack {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.25);
}

.status--paid {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  border-color: rgba(16, 185, 129, 0.25);
}
.status--failed {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.25);
}

.row-actions {
  display: flex;
  justify-content: flex-end;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.icon-btn:hover {
  background: var(--color-pos-accent-soft);
  color: var(--color-pos-accent-strong);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  font-size: 20px;
}

.empty-title {
  font-weight: 600;
  color: var(--text-color);
}
.empty-sub {
  font-size: 12px;
  margin-top: 4px;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
}

.modal-card {
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  background: var(--surface-color);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-pos-accent-soft);
  color: var(--color-pos-accent-strong);
  display: grid;
  place-items: center;
  font-size: 18px;
}

.modal-name {
  font-weight: 700;
  color: var(--text-color);
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-body {
  padding: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.receipt-paper {
  border-radius: 18px;
  border: 1px dashed var(--border-color);
  background: var(--bg-color);
  overflow: hidden;
}

.receipt-head {
  text-align: center;
  padding: 16px;
  border-bottom: 1px dashed var(--border-color);
}

.receipt-logo {
  width: 40px;
  height: 40px;
  margin: 0 auto 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  font-weight: 800;
  display: grid;
  place-items: center;
  font-size: 13px;
}

.receipt-store {
  font-weight: 700;
  color: var(--text-color);
}

.receipt-items {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.receipt-items-head {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: 600;
}

.receipt-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.item-name {
  font-weight: 600;
  color: var(--text-color);
}

.receipt-totals {
  padding: 14px 16px 16px;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.total-strong {
  font-weight: 700;
  color: var(--text-color);
  border-top: 1px solid var(--border-color);
  padding-top: 6px;
  margin-top: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-card {
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: 600;
}

.detail-value {
  font-weight: 600;
  color: var(--text-color);
}

.modal-footer {
  border-top: 1px solid var(--border-color);
  padding: 14px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-ghost {
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-ghost:hover {
  background: var(--bg-color);
}

.btn-primary {
  padding: 8px 16px;
  border-radius: 12px;
  border: none;
  background: var(--color-pos-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-pos-accent-strong);
}
</style>
