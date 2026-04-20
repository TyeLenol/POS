<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { usePosStore } from '@/stores/pos'
import { formatCurrency } from '@/utils/format'

const store = usePosStore()
const router = useRouter()

const customerName = computed({
  get: () => store.customer.name,
  set: (value: string) => store.setCustomerInfo({ name: value }),
})

const customerPhone = computed({
  get: () => store.customer.phone,
  set: (value: string) => store.setCustomerInfo({ phone: value }),
})

const customerNote = computed({
  get: () => store.customer.note,
  set: (value: string) => store.setCustomerInfo({ note: value }),
})

const goToPayments = () => {
  router.push('/payments')
}
</script>

<template>
  <v-row dense>
    <v-col cols="12" lg="7">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Customer details</div>
            <h2 class="panel-title">Confirm buyer info</h2>
          </div>
          <v-chip v-if="store.cart.length" color="secondary" variant="tonal">
            {{ store.cart.length }} items
          </v-chip>
        </div>

        <v-row dense class="mt-2">
          <v-col cols="12" md="6">
            <v-text-field v-model="customerName" label="Customer name" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="customerPhone" label="Phone number" variant="outlined" />
          </v-col>
          <v-col cols="12">
            <v-textarea v-model="customerNote" label="Order note" variant="outlined" rows="3" />
          </v-col>
        </v-row>
      </v-card>

      <v-card class="panel-card mt-6" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Order items</div>
            <h2 class="panel-title">Review the cart</h2>
          </div>
        </div>

        <div v-if="store.cart.length === 0" class="empty-state">
          Cart is empty. Add items from the products screen.
        </div>

        <v-list v-else density="comfortable" class="mt-2">
          <v-list-item v-for="item in store.cart" :key="item.product.id">
            <v-list-item-title>{{ item.product.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ item.quantity }} x
              {{
                formatCurrency(item.product.price, store.settings.currency, store.settings.locale)
              }}
            </v-list-item-subtitle>
            <template #append>
              <div class="item-total">
                {{
                  formatCurrency(
                    item.product.price * item.quantity,
                    store.settings.currency,
                    store.settings.locale,
                  )
                }}
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>

    <v-col cols="12" lg="5">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Totals</div>
            <h2 class="panel-title">Checkout summary</h2>
          </div>
        </div>

        <v-divider class="my-3" />

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>{{
              formatCurrency(store.subtotal, store.settings.currency, store.settings.locale)
            }}</span>
          </div>
          <div class="total-row" v-if="store.settings.taxEnabled">
            <span
              >{{ store.settings.taxLabel }} ({{
                (store.settings.taxRate * 100).toFixed(1)
              }}%)</span
            >
            <span>{{
              formatCurrency(store.tax, store.settings.currency, store.settings.locale)
            }}</span>
          </div>
          <div class="total-row total-strong">
            <span>Total due</span>
            <span>{{
              formatCurrency(store.total, store.settings.currency, store.settings.locale)
            }}</span>
          </div>
        </div>

        <v-divider class="my-4" />

        <v-btn
          color="primary"
          block
          size="large"
          :disabled="store.cart.length === 0"
          @click="goToPayments"
        >
          Continue to payments
        </v-btn>
      </v-card>

      <v-card class="panel-card mt-4" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Payment prep</div>
            <h2 class="panel-title">Select a payment method</h2>
          </div>
        </div>
        <v-chip-group class="mt-3" column>
          <v-chip variant="outlined">Cash</v-chip>
          <v-chip variant="outlined">MoMo</v-chip>
          <v-chip variant="outlined">USSD</v-chip>
          <v-chip variant="outlined">Paystack</v-chip>
        </v-chip-group>
        <div class="helper-text">Finalize payment in the next step.</div>
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

.totals {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.total-strong {
  font-weight: 700;
  font-size: 16px;
}

.item-total {
  font-weight: 600;
}

.empty-state {
  color: var(--pos-muted);
  font-size: 14px;
  padding: 12px 0;
}

.helper-text {
  color: var(--pos-muted);
  margin-top: 12px;
  font-size: 13px;
}
</style>
