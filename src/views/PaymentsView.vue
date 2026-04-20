<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { usePosStore } from '@/stores/pos'
import { formatCurrency } from '@/utils/format'
import type { PaymentMethod } from '@/types/pos'

const store = usePosStore()
const router = useRouter()

const networks = ['MTN', 'Vodafone', 'AirtelTigo']

const method = computed(() => store.payment.method)
const status = computed(() => store.payment.status)
const total = computed(() => store.total)

const phone = computed({
  get: () => store.payment.phone,
  set: (value: string) => store.updatePaymentInfo({ phone: value }),
})

const network = computed({
  get: () => store.payment.network,
  set: (value: string) => store.updatePaymentInfo({ network: value }),
})

const email = computed({
  get: () => store.payment.email,
  set: (value: string) => store.updatePaymentInfo({ email: value }),
})

const reference = computed({
  get: () => store.payment.reference,
  set: (value: string) => store.updatePaymentInfo({ reference: value }),
})

const ussdCode = computed(() => store.payment.ussdCode)

const selectMethod = (value: PaymentMethod) => {
  store.selectPaymentMethod(value)
}

const createReference = (prefix: string) => {
  const suffix = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}-${suffix}`
}

const startMomo = () => {
  store.updatePaymentInfo({
    reference: reference.value || createReference('MOMO'),
    paidAmount: total.value,
  })
  store.markPaymentAwaiting()
}

const startUssd = () => {
  const code = `*170*${Math.floor(1000 + Math.random() * 9000)}#`
  store.updatePaymentInfo({
    reference: reference.value || createReference('USSD'),
    ussdCode: code,
    paidAmount: total.value,
  })
  store.markPaymentAwaiting()
}

const startPaystack = () => {
  store.updatePaymentInfo({
    reference: reference.value || createReference('PSTK'),
    paidAmount: total.value,
  })
  store.markPaymentAwaiting()
}

const completePayment = async () => {
  if (store.cart.length === 0) {
    return
  }
  store.markPaymentSuccess()
  await store.completeOrder()
  router.push('/receipts')
}

const failPayment = () => {
  store.markPaymentFailed()
}

const resetPayment = () => {
  store.resetPayment()
}
</script>

<template>
  <v-row dense>
    <v-col cols="12" lg="7">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Payment method</div>
            <h2 class="panel-title">Choose how the customer pays</h2>
          </div>
        </div>

        <v-row dense class="mt-3">
          <v-col cols="12" sm="6">
            <v-card
              class="method-card"
              :class="{ active: method === 'cash' }"
              elevation="0"
              @click="selectMethod('cash')"
            >
              <v-icon icon="mdi-cash" size="26" />
              <div>
                <div class="method-title">Cash</div>
                <div class="method-subtitle">Immediate settlement</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6">
            <v-card
              class="method-card"
              :class="{ active: method === 'momo' }"
              elevation="0"
              @click="selectMethod('momo')"
            >
              <v-icon icon="mdi-cellphone" size="26" />
              <div>
                <div class="method-title">MoMo</div>
                <div class="method-subtitle">Push to wallet</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6">
            <v-card
              class="method-card"
              :class="{ active: method === 'ussd' }"
              elevation="0"
              @click="selectMethod('ussd')"
            >
              <v-icon icon="mdi-dialpad" size="26" />
              <div>
                <div class="method-title">USSD</div>
                <div class="method-subtitle">Dial to approve</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6">
            <v-card
              class="method-card"
              :class="{ active: method === 'paystack' }"
              elevation="0"
              @click="selectMethod('paystack')"
            >
              <v-icon icon="mdi-credit-card-outline" size="26" />
              <div>
                <div class="method-title">Paystack</div>
                <div class="method-subtitle">Cards and bank transfer</div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div v-if="method === 'cash'" class="method-panel">
          <div class="panel-title">Cash payment</div>
          <p class="panel-text">Collect cash and confirm when the amount is received.</p>
          <v-btn color="primary" class="mt-3" @click="completePayment"> Mark as paid </v-btn>
        </div>

        <div v-else-if="method === 'momo'" class="method-panel">
          <div class="panel-title">Mobile money request</div>
          <p class="panel-text">Send a prompt to the customer and wait for confirmation.</p>
          <v-row dense class="mt-2">
            <v-col cols="12" md="6">
              <v-text-field v-model="phone" label="MoMo phone number" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="network" :items="networks" label="Network" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="reference" label="Reference" variant="outlined" />
            </v-col>
          </v-row>
          <div class="actions">
            <v-btn color="secondary" variant="flat" @click="startMomo">Send MoMo prompt</v-btn>
            <v-btn variant="text" @click="resetPayment">Reset</v-btn>
          </div>
        </div>

        <div v-else-if="method === 'ussd'" class="method-panel">
          <div class="panel-title">USSD payment</div>
          <p class="panel-text">Generate a USSD code for the customer to approve.</p>
          <v-row dense class="mt-2">
            <v-col cols="12" md="6">
              <v-text-field v-model="phone" label="Customer phone" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="network" :items="networks" label="Network" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="reference" label="Reference" variant="outlined" />
            </v-col>
          </v-row>
          <div class="actions">
            <v-btn color="secondary" variant="flat" @click="startUssd">Generate USSD code</v-btn>
            <v-btn variant="text" @click="resetPayment">Reset</v-btn>
          </div>
          <v-alert v-if="ussdCode" type="info" variant="tonal" class="mt-3">
            Customer should dial <strong>{{ ussdCode }}</strong> to approve payment.
          </v-alert>
        </div>

        <div v-else-if="method === 'paystack'" class="method-panel">
          <div class="panel-title">Paystack checkout</div>
          <p class="panel-text">Placeholder flow for Paystack integration.</p>
          <v-row dense class="mt-2">
            <v-col cols="12" md="6">
              <v-text-field v-model="email" label="Customer email" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="reference" label="Reference" variant="outlined" />
            </v-col>
          </v-row>
          <div class="actions">
            <v-btn color="secondary" variant="flat" @click="startPaystack"
              >Initialize Paystack</v-btn
            >
            <v-btn variant="text" @click="resetPayment">Reset</v-btn>
          </div>
        </div>

        <div v-else class="empty-state">Select a payment method to continue.</div>
      </v-card>
    </v-col>

    <v-col cols="12" lg="5">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Amount due</div>
            <h2 class="panel-title">
              {{ formatCurrency(total, store.settings.currency, store.settings.locale) }}
            </h2>
          </div>
          <v-chip color="primary" variant="tonal" v-if="method">{{ method }}</v-chip>
        </div>

        <v-divider class="my-3" />

        <div class="status-block">
          <div class="status-label">Payment status</div>
          <v-chip
            :color="status === 'success' ? 'success' : status === 'failed' ? 'error' : 'warning'"
            variant="tonal"
          >
            {{ status }}
          </v-chip>
        </div>

        <v-alert v-if="status === 'awaiting'" type="info" variant="tonal" class="mt-3">
          Waiting for confirmation from customer. Use the buttons below to simulate the response.
        </v-alert>

        <v-alert v-else-if="status === 'success'" type="success" variant="tonal" class="mt-3">
          Payment confirmed. Receipt is ready.
        </v-alert>

        <v-alert v-else-if="status === 'failed'" type="error" variant="tonal" class="mt-3">
          Payment failed. Try again or switch methods.
        </v-alert>

        <div class="actions mt-4">
          <v-btn
            color="primary"
            :disabled="!method || store.cart.length === 0"
            @click="completePayment"
          >
            Confirm payment
          </v-btn>
          <v-btn variant="outlined" :disabled="!method" @click="failPayment">Mark failed</v-btn>
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

.method-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.method-card.active {
  border-color: var(--pos-accent);
  box-shadow: 0 8px 18px rgba(217, 119, 6, 0.2);
  transform: translateY(-2px);
}

.method-title {
  font-weight: 600;
}

.method-subtitle {
  font-size: 12px;
  color: var(--pos-muted);
}

.method-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-text {
  color: var(--pos-muted);
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 12px;
}

.status-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-label {
  font-size: 13px;
  color: var(--pos-muted);
}

.empty-state {
  color: var(--pos-muted);
  font-size: 14px;
  padding: 12px 0;
}
</style>
