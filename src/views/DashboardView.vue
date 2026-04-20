<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { usePosStore } from '@/stores/pos'
import { formatCurrency, formatDateTime } from '@/utils/format'

const store = usePosStore()
const router = useRouter()

const totalRevenue = computed(() =>
  store.receipts.reduce((sum, receipt) => sum + receipt.total, 0),
)
const paidOrders = computed(() => store.receipts.filter((receipt) => receipt.status === 'paid'))
const averageOrder = computed(() => {
  if (paidOrders.value.length === 0) {
    return 0
  }
  return totalRevenue.value / paidOrders.value.length
})
const latestReceipts = computed(() => store.receipts.slice(0, 5))

const goTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="dashboard">
    <div class="header">
      <div>
        <div class="eyebrow">Operations snapshot</div>
        <h1 class="title">Today at a glance</h1>
        <p class="subtitle">Track sales, open orders, and the fastest lanes to checkout.</p>
      </div>
      <v-btn color="secondary" variant="flat" @click="goTo('/products')">
        Start new sale
      </v-btn>
    </div>

    <v-row class="mt-6" dense>
      <v-col cols="12" md="3">
        <v-card class="stat-card" elevation="0">
          <div class="stat-label">Total sales</div>
          <div class="stat-value">
            {{ formatCurrency(totalRevenue, store.settings.currency, store.settings.locale) }}
          </div>
          <div class="stat-meta">{{ paidOrders.length }} paid orders</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="stat-card" elevation="0">
          <div class="stat-label">Average order</div>
          <div class="stat-value">
            {{ formatCurrency(averageOrder, store.settings.currency, store.settings.locale) }}
          </div>
          <div class="stat-meta">Based on successful receipts</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="stat-card" elevation="0">
          <div class="stat-label">Open cart</div>
          <div class="stat-value">{{ store.cartCount }} items</div>
          <div class="stat-meta">Ready to move to checkout</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="stat-card" elevation="0">
          <div class="stat-label">Payment modes</div>
          <div class="stat-value">4 active</div>
          <div class="stat-meta">Cash, MoMo, USSD, Paystack</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-6" dense>
      <v-col cols="12" md="7">
        <v-card class="panel-card" elevation="0">
          <div class="panel-header">
            <div>
              <div class="eyebrow">Quick actions</div>
              <h3 class="panel-title">Move faster on the floor</h3>
            </div>
          </div>
          <v-row dense class="mt-2">
            <v-col cols="12" sm="6">
              <v-card class="action-card" elevation="0" @click="goTo('/products')">
                <v-icon icon="mdi-storefront-outline" size="30" />
                <div>
                  <div class="action-title">Browse products</div>
                  <div class="action-subtitle">Add items and build the cart</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card class="action-card" elevation="0" @click="goTo('/checkout')">
                <v-icon icon="mdi-cart-check" size="30" />
                <div>
                  <div class="action-title">Checkout ready</div>
                  <div class="action-subtitle">Confirm totals and customer info</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card class="action-card" elevation="0" @click="goTo('/payments')">
                <v-icon icon="mdi-credit-card-outline" size="30" />
                <div>
                  <div class="action-title">Capture payment</div>
                  <div class="action-subtitle">MoMo, USSD, Paystack, cash</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card class="action-card" elevation="0" @click="goTo('/receipts')">
                <v-icon icon="mdi-receipt-text-outline" size="30" />
                <div>
                  <div class="action-title">Receipts hub</div>
                  <div class="action-subtitle">Review and export PDF receipts</div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="panel-card" elevation="0">
          <div class="panel-header">
            <div>
              <div class="eyebrow">Recent receipts</div>
              <h3 class="panel-title">Last activity</h3>
            </div>
            <v-btn size="small" variant="text" @click="goTo('/receipts')">View all</v-btn>
          </div>
          <v-divider class="my-2" />
          <div v-if="latestReceipts.length === 0" class="empty-state">
            No receipts yet. Complete a sale to see activity.
          </div>
          <v-list v-else density="comfortable">
            <v-list-item v-for="receipt in latestReceipts" :key="receipt.id">
              <v-list-item-title>{{ receipt.number }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDateTime(receipt.createdAt) }}
              </v-list-item-subtitle>
              <template #append>
                <v-chip size="small" :color="receipt.status === 'paid' ? 'success' : 'error'" variant="tonal">
                  {{ receipt.status }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--pos-muted);
}

.title {
  font-size: 30px;
  font-weight: 700;
  margin-top: 6px;
}

.subtitle {
  color: var(--pos-muted);
  margin-top: 6px;
}

.stat-card {
  padding: 18px;
  border-radius: var(--pos-radius);
  background: var(--pos-card);
  box-shadow: 0 12px 30px var(--pos-shadow);
}

.stat-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--pos-muted);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  margin-top: 8px;
}

.stat-meta {
  font-size: 13px;
  color: var(--pos-muted);
  margin-top: 4px;
}

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

.panel-title {
  font-size: 20px;
  font-weight: 700;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.1);
}

.action-title {
  font-weight: 600;
}

.action-subtitle {
  font-size: 13px;
  color: var(--pos-muted);
}

.empty-state {
  color: var(--pos-muted);
  font-size: 14px;
  padding: 12px 0;
}
</style>
