<script setup lang="ts">
import { computed } from 'vue'

import { usePosStore } from '@/stores/pos'
import { formatCurrency } from '@/utils/format'

const store = usePosStore()

const totalRevenue = computed(() =>
  store.receipts.reduce((sum, receipt) => sum + receipt.total, 0),
)

const totalItems = computed(() =>
  store.receipts.reduce((sum, receipt) => {
    return sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
  }, 0),
)

const topProducts = computed(() => {
  const map = new Map<string, { name: string; quantity: number }>()
  store.receipts.forEach((receipt) => {
    receipt.items.forEach((item) => {
      const existing = map.get(item.product.id)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        map.set(item.product.id, { name: item.product.name, quantity: item.quantity })
      }
    })
  })
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)
})
</script>

<template>
  <v-row dense>
    <v-col cols="12" md="4">
      <v-card class="panel-card" elevation="0">
        <div class="eyebrow">Revenue</div>
        <div class="metric-value">
          {{ formatCurrency(totalRevenue, store.settings.currency, store.settings.locale) }}
        </div>
        <div class="metric-subtitle">Total across receipts</div>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card class="panel-card" elevation="0">
        <div class="eyebrow">Items sold</div>
        <div class="metric-value">{{ totalItems }}</div>
        <div class="metric-subtitle">Across all orders</div>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card class="panel-card" elevation="0">
        <div class="eyebrow">Orders</div>
        <div class="metric-value">{{ store.receipts.length }}</div>
        <div class="metric-subtitle">Completed receipts</div>
      </v-card>
    </v-col>
  </v-row>

  <v-row dense class="mt-6">
    <v-col cols="12" lg="6">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Top products</div>
            <h2 class="panel-title">Best movers</h2>
          </div>
        </div>
        <div v-if="topProducts.length === 0" class="empty-state">
          No sales yet. Complete a few transactions to see insights.
        </div>
        <v-list v-else density="comfortable" class="mt-2">
          <v-list-item v-for="item in topProducts" :key="item.name">
            <v-list-item-title>{{ item.name }}</v-list-item-title>
            <template #append>
              <v-chip size="small" color="secondary" variant="tonal">
                {{ item.quantity }} sold
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>

    <v-col cols="12" lg="6">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Team notes</div>
            <h2 class="panel-title">Ops reminders</h2>
          </div>
        </div>
        <v-list density="comfortable" class="mt-2">
          <v-list-item>
            <v-list-item-title>Reconcile cash drawer by 8 PM</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Review MoMo settlements weekly</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Prepare weekend inventory counts</v-list-item-title>
          </v-list-item>
        </v-list>
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

.metric-value {
  font-size: 26px;
  font-weight: 700;
  margin-top: 6px;
}

.metric-subtitle {
  color: var(--pos-muted);
  font-size: 13px;
  margin-top: 4px;
}

.empty-state {
  color: var(--pos-muted);
  font-size: 14px;
  padding: 12px 0;
}
</style>
