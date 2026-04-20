<script setup lang="ts">
import { reactive } from 'vue'

import { usePosStore } from '@/stores/pos'

const store = usePosStore()
const settings = reactive({ ...store.settings })

const saveSettings = () => {
  store.updateSettings(settings)
}
</script>

<template>
  <v-row dense>
    <v-col cols="12" lg="7">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Store profile</div>
            <h2 class="panel-title">Business information</h2>
          </div>
        </div>

        <v-row dense class="mt-3">
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.storeName" label="Store name" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.branchName" label="Branch" variant="outlined" />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="settings.address" label="Address" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.phone" label="Phone" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.email" label="Email" variant="outlined" />
          </v-col>
        </v-row>
      </v-card>
    </v-col>

    <v-col cols="12" lg="5">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Taxes and currency</div>
            <h2 class="panel-title">Checkout defaults</h2>
          </div>
        </div>

        <v-row dense class="mt-3">
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.currency" label="Currency" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.locale" label="Locale" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model.number="settings.taxRate" label="Tax rate" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.taxLabel" label="Tax label" variant="outlined" />
          </v-col>
          <v-col cols="12">
            <v-switch v-model="settings.taxEnabled" label="Enable tax" color="secondary" />
          </v-col>
        </v-row>

        <v-btn color="primary" block class="mt-2" @click="saveSettings">Save settings</v-btn>
      </v-card>

      <v-card class="panel-card mt-4" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Payments</div>
            <h2 class="panel-title">Integration status</h2>
          </div>
        </div>
        <v-list density="comfortable" class="mt-2">
          <v-list-item>
            <v-list-item-title>MoMo</v-list-item-title>
            <template #append
              ><v-chip size="small" color="secondary" variant="tonal">Sandbox</v-chip></template
            >
          </v-list-item>
          <v-list-item>
            <v-list-item-title>USSD</v-list-item-title>
            <template #append
              ><v-chip size="small" color="secondary" variant="tonal">Sandbox</v-chip></template
            >
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Paystack</v-list-item-title>
            <template #append
              ><v-chip size="small" color="warning" variant="tonal">WIP</v-chip></template
            >
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
</style>
