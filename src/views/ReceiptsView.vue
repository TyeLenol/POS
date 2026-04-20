<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { usePosStore } from '@/stores/pos'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { Receipt } from '@/types/pos'

const store = usePosStore()
const selectedId = ref<string | null>(null)

const receipts = computed(() => store.receipts)
const selectedReceipt = computed(() => {
  if (!selectedId.value) {
    return receipts.value[0] || null
  }
  return receipts.value.find((receipt) => receipt.id === selectedId.value) || null
})

const selectReceipt = (receipt: Receipt) => {
  selectedId.value = receipt.id
}

const buildReceiptHtml = (receipt: Receipt) => {
  const { settings } = store
  const itemsHtml = receipt.items
    .map((item) => {
      return `
        <tr>
          <td>${item.product.name}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.product.price, settings.currency, settings.locale)}</td>
          <td>${formatCurrency(item.product.price * item.quantity, settings.currency, settings.locale)}</td>
        </tr>
      `
    })
    .join('')

  return `
    <html>
      <head>
        <style>
          body { font-family: 'Space Grotesk', Arial, sans-serif; padding: 32px; }
          h1 { margin: 0 0 8px; }
          .muted { color: #64748b; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .totals { margin-top: 20px; }
          .totals div { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .grand { font-weight: 700; font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>${settings.storeName}</h1>
        <div class="muted">${settings.branchName}</div>
        <div class="muted">${settings.address}</div>
        <div class="muted">${settings.phone} | ${settings.email}</div>
        <div class="muted">Receipt ${receipt.number}</div>
        <div class="muted">${formatDateTime(receipt.createdAt)}</div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div><span>Subtotal</span><span>${formatCurrency(receipt.subtotal, settings.currency, settings.locale)}</span></div>
          <div><span>${settings.taxLabel}</span><span>${formatCurrency(receipt.tax, settings.currency, settings.locale)}</span></div>
          <div class="grand"><span>Total</span><span>${formatCurrency(receipt.total, settings.currency, settings.locale)}</span></div>
        </div>

        <p class="muted">Payment: ${receipt.paymentMethod.toUpperCase()}</p>
        <p class="muted">Status: ${receipt.status}</p>
      </body>
    </html>
  `
}

const downloadReceiptPdf = (receipt: Receipt | null) => {
  if (!receipt) {
    return
  }
  const popup = window.open('', '_blank', 'width=720,height=920')
  if (!popup) {
    return
  }
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
  <v-row dense>
    <v-col cols="12" lg="4">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Receipt history</div>
            <h2 class="panel-title">Recent orders</h2>
          </div>
        </div>

        <div v-if="receipts.length === 0" class="empty-state">
          No receipts yet. Complete a payment to generate one.
        </div>

        <v-list v-else density="comfortable" class="receipt-list">
          <v-list-item
            v-for="receipt in receipts"
            :key="receipt.id"
            :active="receipt.id === selectedReceipt?.id"
            @click="selectReceipt(receipt)"
          >
            <v-list-item-title>{{ receipt.number }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatDateTime(receipt.createdAt) }}
            </v-list-item-subtitle>
            <template #append>
              <v-chip
                size="x-small"
                :color="receipt.status === 'paid' ? 'success' : 'error'"
                variant="tonal"
              >
                {{ receipt.status }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>

    <v-col cols="12" lg="8">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Receipt preview</div>
            <h2 class="panel-title">Customer receipt</h2>
          </div>
          <v-btn
            color="secondary"
            variant="flat"
            :disabled="!selectedReceipt"
            @click="downloadReceiptPdf(selectedReceipt)"
          >
            Download PDF
          </v-btn>
        </div>

        <div v-if="!selectedReceipt" class="empty-state">
          Select a receipt from the list to preview.
        </div>

        <div v-else class="receipt-preview">
          <div class="receipt-header">
            <div>
              <div class="receipt-title">{{ store.settings.storeName }}</div>
              <div class="muted">{{ store.settings.branchName }}</div>
              <div class="muted">{{ store.settings.address }}</div>
              <div class="muted">{{ store.settings.phone }} | {{ store.settings.email }}</div>
            </div>
            <div class="receipt-meta">
              <div>{{ selectedReceipt.number }}</div>
              <div class="muted">{{ formatDateTime(selectedReceipt.createdAt) }}</div>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="receipt-items">
            <div class="receipt-row header">
              <span>Item</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Total</span>
            </div>
            <div class="receipt-row" v-for="item in selectedReceipt.items" :key="item.product.id">
              <span>{{ item.product.name }}</span>
              <span>{{ item.quantity }}</span>
              <span>
                {{
                  formatCurrency(item.product.price, store.settings.currency, store.settings.locale)
                }}
              </span>
              <span>
                {{
                  formatCurrency(
                    item.product.price * item.quantity,
                    store.settings.currency,
                    store.settings.locale,
                  )
                }}
              </span>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="receipt-totals">
            <div>
              <span>Subtotal</span>
              <span>
                {{
                  formatCurrency(
                    selectedReceipt.subtotal,
                    store.settings.currency,
                    store.settings.locale,
                  )
                }}
              </span>
            </div>
            <div>
              <span>{{ store.settings.taxLabel }}</span>
              <span>{{
                formatCurrency(selectedReceipt.tax, store.settings.currency, store.settings.locale)
              }}</span>
            </div>
            <div class="grand-total">
              <span>Total</span>
              <span>{{
                formatCurrency(
                  selectedReceipt.total,
                  store.settings.currency,
                  store.settings.locale,
                )
              }}</span>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="receipt-footer">
            <div class="muted">Payment method: {{ selectedReceipt.paymentMethod }}</div>
            <div class="muted">Status: {{ selectedReceipt.status }}</div>
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.panel-card {
  padding: 20px;
  border-radius: var(--pos-radius-lg);
  background: #ffffff;
  box-shadow: 0 14px 30px var(--pos-shadow);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--pos-muted);
}

.panel-title {
  font-size: 22px;
  font-weight: 700;
  margin-top: 6px;
}

.receipt-list {
  max-height: 520px;
  overflow: auto;
}

.empty-state {
  color: var(--pos-muted);
  font-size: 14px;
  padding: 12px 0;
}

.receipt-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.receipt-title {
  font-size: 20px;
  font-weight: 700;
}

.muted {
  color: var(--pos-muted);
  font-size: 13px;
}

.receipt-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.receipt-row {
  display: grid;
  grid-template-columns: 1.2fr 0.3fr 0.4fr 0.4fr;
  gap: 12px;
  font-size: 14px;
}

.receipt-row.header {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.receipt-totals {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 280px;
  margin-left: auto;
}

.receipt-totals div {
  display: flex;
  justify-content: space-between;
}

.grand-total {
  font-weight: 700;
  font-size: 16px;
}

.receipt-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
