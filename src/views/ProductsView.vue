<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { usePosStore } from '@/stores/pos'
import { formatCurrency } from '@/utils/format'

const store = usePosStore()
const router = useRouter()

const search = ref('')

const filteredProducts = computed(() => {
  if (!search.value.trim()) {
    return store.products
  }
  const query = search.value.toLowerCase()
  return store.products.filter((product) => {
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    )
  })
})

const goToCheckout = () => {
  router.push('/checkout')
}

onMounted(() => {
  store.loadProducts()
})
</script>

<template>
  <v-row dense>
    <v-col cols="12" lg="8">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Product catalog</div>
            <h2 class="panel-title">Tap to add items</h2>
          </div>
          <v-text-field
            v-model="search"
            label="Search name, category, or SKU"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            class="search-field"
          />
        </div>

        <v-row dense class="mt-2">
          <v-col v-for="product in filteredProducts" :key="product.id" cols="12" sm="6" md="4">
            <v-card class="product-card" elevation="0">
              <div class="product-top">
                <v-chip color="secondary" size="small" variant="tonal">
                  {{ product.category }}
                </v-chip>
                <v-chip size="small" variant="outlined">{{ product.stock }} in stock</v-chip>
              </div>
              <div class="product-title">{{ product.name }}</div>
              <div class="product-sku">{{ product.sku }}</div>
              <div class="product-footer">
                <div class="product-price">
                  {{
                    formatCurrency(product.price, store.settings.currency, store.settings.locale)
                  }}
                </div>
                <v-btn color="primary" size="small" @click="store.addToCart(product)"> Add </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-col>

    <v-col cols="12" lg="4">
      <v-card class="panel-card" elevation="0">
        <div class="panel-header">
          <div>
            <div class="eyebrow">Current cart</div>
            <h2 class="panel-title">Order summary</h2>
          </div>
        </div>
        <v-divider class="my-3" />

        <div v-if="store.cart.length === 0" class="empty-state">Add items to start an order.</div>

        <v-list v-else density="comfortable" class="cart-list">
          <v-list-item v-for="item in store.cart" :key="item.product.id" class="cart-item">
            <v-list-item-title>{{ item.product.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{
                formatCurrency(item.product.price, store.settings.currency, store.settings.locale)
              }}
              each
            </v-list-item-subtitle>
            <template #append>
              <div class="qty-controls">
                <v-btn
                  icon="mdi-minus"
                  size="x-small"
                  variant="outlined"
                  @click="store.updateQuantity(item.product.id, item.quantity - 1)"
                />
                <div class="qty-value">{{ item.quantity }}</div>
                <v-btn
                  icon="mdi-plus"
                  size="x-small"
                  variant="outlined"
                  @click="store.updateQuantity(item.product.id, item.quantity + 1)"
                />
              </div>
            </template>
          </v-list-item>
        </v-list>

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
            <span>Total</span>
            <span>{{
              formatCurrency(store.total, store.settings.currency, store.settings.locale)
            }}</span>
          </div>
        </div>

        <v-btn
          class="mt-4"
          color="secondary"
          block
          :disabled="store.cart.length === 0"
          @click="goToCheckout"
        >
          Proceed to checkout
        </v-btn>
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.search-field {
  max-width: 320px;
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

.product-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.product-title {
  font-weight: 600;
  font-size: 16px;
}

.product-sku {
  font-size: 12px;
  color: var(--pos-muted);
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.product-price {
  font-weight: 700;
}

.cart-list {
  max-height: 320px;
  overflow: auto;
}

.cart-item {
  border-radius: 12px;
  background: #f8fafc;
  margin-bottom: 8px;
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-value {
  min-width: 20px;
  text-align: center;
  font-weight: 600;
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

.empty-state {
  color: var(--pos-muted);
  font-size: 14px;
  padding: 12px 0;
}
</style>
