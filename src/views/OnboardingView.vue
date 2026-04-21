<template>
  <v-container fluid class="onboarding-shell">
    <v-card class="onboarding-card" elevation="0">
      <div class="onboarding-header">
        <div>
          <p class="eyebrow">Owner onboarding</p>
          <h1 class="title">Set up your business workspace</h1>
          <p class="subtitle">Complete all steps to unlock the POS.</p>
        </div>
        <v-chip color="primary" variant="tonal">Step {{ step }}/5</v-chip>
      </div>

      <v-progress-linear :model-value="progress" height="6" color="primary" class="mt-4" />

      <v-window v-model="step" class="mt-6">
        <v-window-item :value="1">
          <div class="step-panel">
            <h2 class="step-title">Business profile</h2>
            <p class="step-subtitle">Tell us about the store customers will see.</p>
            <v-row dense class="mt-4">
              <v-col cols="12" md="6">
                <v-text-field v-model="form.storeName" label="Store name" variant="outlined" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.phone" label="Store phone" variant="outlined" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.address" label="Address" variant="outlined" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.email" label="Email (optional)" variant="outlined" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.currency" label="Currency" variant="outlined" />
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <v-window-item :value="2">
          <div class="step-panel">
            <h2 class="step-title">Payments</h2>
            <p class="step-subtitle">Enable the payment options you plan to use.</p>
            <v-row dense class="mt-4">
              <v-col cols="12" md="4">
                <v-switch v-model="form.enableMomo" label="MoMo" color="primary" />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch v-model="form.enableUssd" label="USSD" color="primary" />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch v-model="form.enablePaystack" label="Paystack" color="primary" />
              </v-col>
            </v-row>
            <v-alert type="info" variant="tonal" class="mt-4">
              Payment integrations can be configured after onboarding.
            </v-alert>
          </div>
        </v-window-item>

        <v-window-item :value="3">
          <div class="step-panel">
            <h2 class="step-title">Taxes and discounts</h2>
            <p class="step-subtitle">Set your default tax rate and discount preference.</p>
            <v-row dense class="mt-4">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.taxRate"
                  label="Tax rate (%)"
                  variant="outlined"
                  type="number"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.discountPolicy"
                  :items="discountOptions"
                  label="Discount policy"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <v-window-item :value="4">
          <div class="step-panel">
            <h2 class="step-title">Staff setup</h2>
            <p class="step-subtitle">Create cashier accounts after onboarding.</p>
            <v-alert type="info" variant="tonal" class="mt-4">
              You will create worker credentials from Settings → Staff.
            </v-alert>
          </div>
        </v-window-item>

        <v-window-item :value="5">
          <div class="step-panel">
            <h2 class="step-title">Inventory</h2>
            <p class="step-subtitle">You can add products manually after onboarding.</p>
            <v-alert type="info" variant="tonal" class="mt-4">
              Go to Inventory to add products and upload images.
            </v-alert>
          </div>
        </v-window-item>
      </v-window>

      <v-divider class="my-6" />

      <div class="onboarding-actions">
        <v-btn variant="text" :disabled="step === 1" @click="step -= 1">Back</v-btn>
        <v-spacer />
        <v-btn v-if="step < 5" color="primary" @click="nextStep">Continue</v-btn>
        <v-btn v-else color="primary" :loading="isSubmitting" @click="finishOnboarding">
          Complete onboarding
        </v-btn>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
        {{ error }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const isSubmitting = ref(false)
const error = ref('')

const form = reactive({
  storeName: '',
  phone: '',
  address: '',
  email: '',
  currency: 'GHS',
  taxRate: 7.5,
  enableMomo: true,
  enableUssd: false,
  enablePaystack: false,
  discountPolicy: 'Manager approval',
})

const discountOptions = ['Manager approval', 'Auto discounts', 'No discounts']

const progress = computed(() => (step.value / 5) * 100)

const nextStep = () => {
  error.value = ''

  if (step.value === 1) {
    if (!form.storeName || !form.phone) {
      error.value = 'Store name and phone are required.'
      return
    }
  }

  step.value += 1
}

const finishOnboarding = async () => {
  error.value = ''
  isSubmitting.value = true

  const result = await authStore.completeOnboarding({
    storeName: form.storeName,
    address: form.address,
    phone: form.phone,
    email: form.email || undefined,
    currency: form.currency,
    taxRate: form.taxRate / 100,
  })

  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.error || 'Unable to complete onboarding.'
  }

  isSubmitting.value = false
}
</script>

<style scoped>
.onboarding-shell {
  min-height: 100vh;
  padding: 48px 20px;
  background: var(--pos-sand);
}

.onboarding-card {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 36px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 11px;
  color: var(--pos-muted);
}

.title {
  font-size: 28px;
  margin-top: 12px;
}

.subtitle {
  color: var(--pos-muted);
  margin-top: 8px;
}

.step-panel {
  min-height: 280px;
}

.step-title {
  font-size: 20px;
  font-weight: 700;
}

.step-subtitle {
  color: var(--pos-muted);
  margin-top: 6px;
}

.onboarding-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 720px) {
  .onboarding-card {
    padding: 24px;
  }
}
</style>
