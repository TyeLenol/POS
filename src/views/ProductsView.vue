<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { searchCustomers } from '@/api/pos'
import { usePosStore } from '@/stores/pos'
import type { PaymentMethod, Receipt } from '@/types/pos'
import { formatCurrency, formatDateTime } from '@/utils/format'

const store = usePosStore()

// ── product grid ─────────────────────────────────────────────
const search = ref('')
const activeCategory = ref('All')

const categories = computed(() => {
  const cats = new Set(store.products.map((p) => p.category))
  return ['All', ...Array.from(cats).sort()]
})

const filteredProducts = computed(() => {
  let products = store.products
  if (activeCategory.value !== 'All') {
    products = products.filter((p) => p.category === activeCategory.value)
  }
  if (!search.value.trim()) return products
  const q = search.value.toLowerCase()
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q),
  )
})

// ── checkout state ────────────────────────────────────────────
const showCheckout = ref(false)
const step = ref(2) // 2=payment  3=receipt
const mobileCartOpen = ref(false)

interface CustomerResult {
  id: string
  name: string | null
  phone: string | null
  email: string | null
}
const customerPhone = ref('')
const customerName = ref('')
const customerNote = ref('')
const customerResults = ref<CustomerResult[]>([])
const isSearching = ref(false)
const selectedCustomer = ref<CustomerResult | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const isCompleting = ref(false)
const payError = ref('')
const amountTendered = ref('')
const networks = ['MTN', 'Vodafone', 'AirtelTigo']

const completedReceipt = ref<Receipt | null>(null)

// ── payment state (mirrors store) ────────────────────────────
const method = computed(() => store.payment.method)
const momoPhone = computed({
  get: () => store.payment.phone,
  set: (v: string) => store.updatePaymentInfo({ phone: v }),
})
const momoNetwork = computed({
  get: () => store.payment.network || 'MTN',
  set: (v: string) => store.updatePaymentInfo({ network: v }),
})
const paystackEmail = computed({
  get: () => store.payment.email,
  set: (v: string) => store.updatePaymentInfo({ email: v }),
})
const ussdCode = computed(() => store.payment.ussdCode)

const paymentMethods: { value: PaymentMethod; title: string; icon: string }[] = [
  { value: 'cash', title: 'Cash', icon: 'mdi-cash' },
  { value: 'momo', title: 'MoMo', icon: 'mdi-cellphone' },
  { value: 'ussd', title: 'USSD', icon: 'mdi-dialpad' },
  { value: 'paystack', title: 'Card', icon: 'mdi-credit-card-outline' },
]

const changeDue = computed(() => {
  const tendered = Number(amountTendered.value)
  if (method.value === 'cash' && tendered >= store.total) {
    return tendered - store.total
  }
  return null
})

// ── actions ──────────────────────────────────────────────────
const openCheckout = () => {
  step.value = 2
  customerPhone.value = ''
  customerName.value = ''
  customerNote.value = ''
  customerResults.value = []
  selectedCustomer.value = null
  payError.value = ''
  amountTendered.value = ''
  completedReceipt.value = null
  store.resetPayment()
  showCheckout.value = true
  mobileCartOpen.value = true
}

const closeCheckout = () => {
  showCheckout.value = false
  mobileCartOpen.value = false
}

const clearCart = () => {
  const ids = store.cart.map((item) => item.product.id)
  ids.forEach((id) => store.removeFromCart(id))
}

const onPhoneInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  selectedCustomer.value = null
  const q = customerPhone.value.trim()
  if (!q) {
    customerResults.value = []
    return
  }
  isSearching.value = true
  searchTimer = setTimeout(async () => {
    try {
      customerResults.value = await searchCustomers(q)
    } catch {
      customerResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 400)
}

const selectCustomer = (c: CustomerResult) => {
  selectedCustomer.value = c
  customerPhone.value = c.phone || ''
  customerName.value = c.name || ''
  customerResults.value = []
}

const clearSelectedCustomer = () => {
  selectedCustomer.value = null
  customerPhone.value = ''
  customerName.value = ''
}

const selectMethod = (m: PaymentMethod) => {
  store.selectPaymentMethod(m)
  payError.value = ''
}

const generateRef = (prefix: string) =>
  `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`

const confirmPayment = async () => {
  if (!store.payment.method || store.cart.length === 0) return

  store.setCustomerInfo({
    name: customerName.value,
    phone: customerPhone.value,
    note: customerNote.value,
  })

  const prefixes: Record<PaymentMethod, string> = {
    cash: 'CASH',
    momo: 'MOMO',
    ussd: 'USSD',
    paystack: 'PSTK',
  }
  store.updatePaymentInfo({
    reference: generateRef(prefixes[store.payment.method]),
    paidAmount: store.total,
  })
  if (store.payment.method === 'ussd') {
    store.updatePaymentInfo({ ussdCode: `*170*${Math.floor(1000 + Math.random() * 9000)}#` })
  }

  isCompleting.value = true
  payError.value = ''
  try {
    store.markPaymentSuccess()
    await store.completeOrder()
    completedReceipt.value = store.receipts[0] ?? null
    step.value = 3
  } catch (e: unknown) {
    store.markPaymentFailed()
    payError.value = e instanceof Error ? e.message : 'Payment failed. Try again.'
  } finally {
    isCompleting.value = false
  }
}

const finishSale = () => {
  closeCheckout()
}

const printReceipt = () => {
  window.print()
}

onMounted(() => {
  store.loadProducts()
})
</script>

<template>
  <div class="sales-root">
    <!-- ── Left Panel: Catalog ───────────────────────────── -->
    <div class="catalog-panel">
      <div class="catalog-header">
        <div class="search-wrap">
          <span class="mdi mdi-magnify search-icon" />
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search products by name or SKU..."
          />
        </div>
        <div class="category-pills">
          <button
            v-for="cat in categories"
            :key="cat"
            class="cat-pill"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <div class="catalog-grid">
        <div v-if="filteredProducts.length === 0" class="empty-state">
          <span class="mdi mdi-package-variant-closed empty-icon" />
          <p>No products match your search.</p>
        </div>
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-card"
          :class="{ 'product-card--oos': product.stock === 0 }"
          @click="product.stock > 0 && store.addToCart(product)"
        >
          <div class="product-top">
            <span class="cat-badge">{{ product.category }}</span>
            <span
              v-if="product.stock > 0 && product.stock <= 10"
              class="stock-dot stock-dot--low"
              title="Low stock"
            />
            <span
              v-else-if="product.stock === 0"
              class="stock-dot stock-dot--out"
              title="Out of stock"
            />
          </div>
          <div class="product-name">{{ product.name }}</div>
          <div class="product-footer">
            <span class="product-price">{{
              formatCurrency(product.price, store.settings.currency, store.settings.locale)
            }}</span>
            <span
              class="stock-badge"
              :class="{
                'stock-badge--out': product.stock === 0,
                'stock-badge--low': product.stock > 0 && product.stock <= 10,
              }"
            >{{ product.stock === 0 ? 'Out' : `${product.stock} left` }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right Panel: Cart / Checkout / Success ─────────── -->
    <div class="order-panel" :class="{ 'mobile-open': mobileCartOpen }">
      <div class="order-header">
        <h2 class="order-title">
          {{ step === 3 && showCheckout ? 'Receipt' : showCheckout ? 'Checkout' : 'Current Order' }}
        </h2>
        <button v-if="showCheckout && step === 2" class="hdr-btn back-btn" @click="closeCheckout">
          ← Back
        </button>
        <button
          v-else-if="!showCheckout && store.cart.length > 0"
          class="hdr-btn clear-btn"
          @click="clearCart"
        >
          Clear
        </button>
      </div>

      <!-- ── Cart View ── -->
      <template v-if="!showCheckout">
        <div class="order-items">
          <div v-if="store.cart.length === 0" class="cart-empty">
            <span class="mdi mdi-shopping-outline cart-empty-icon" />
            <p class="cart-empty-title">Cart is empty</p>
            <p class="cart-empty-sub">Click products to add them</p>
          </div>
          <div v-else class="cart-list">
            <div v-for="item in store.cart" :key="item.product.id" class="cart-item">
              <div class="cart-item-top">
                <div class="cart-item-info">
                  <div class="cart-item-name">{{ item.product.name }}</div>
                  <div class="cart-item-price">
                    {{
                      formatCurrency(
                        item.product.price,
                        store.settings.currency,
                        store.settings.locale,
                      )
                    }}
                  </div>
                </div>
                <button class="remove-btn" @click="store.removeFromCart(item.product.id)">
                  <span class="mdi mdi-trash-can-outline" />
                </button>
              </div>
              <div class="cart-item-bottom">
                <div class="qty-controls">
                  <button
                    class="qty-btn"
                    @click="store.updateQuantity(item.product.id, item.quantity - 1)"
                  >
                    <span class="mdi mdi-minus" />
                  </button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <button
                    class="qty-btn"
                    @click="store.updateQuantity(item.product.id, item.quantity + 1)"
                  >
                    <span class="mdi mdi-plus" />
                  </button>
                </div>
                <span class="item-line-total mono">{{
                  formatCurrency(
                    item.product.price * item.quantity,
                    store.settings.currency,
                    store.settings.locale,
                  )
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span class="mono">{{
                formatCurrency(store.subtotal, store.settings.currency, store.settings.locale)
              }}</span>
            </div>
            <div v-if="store.settings.taxEnabled" class="total-row">
              <span
                >{{ store.settings.taxLabel }} ({{
                  (store.settings.taxRate * 100).toFixed(1)
                }}%)</span
              >
              <span class="mono">{{
                formatCurrency(store.tax, store.settings.currency, store.settings.locale)
              }}</span>
            </div>
            <div class="total-row total-row--strong">
              <span>Total</span>
              <span class="mono total-accent">{{
                formatCurrency(store.total, store.settings.currency, store.settings.locale)
              }}</span>
            </div>
          </div>
          <button class="checkout-btn" :disabled="store.cart.length === 0" @click="openCheckout">
            <span>Checkout</span>
            <span class="checkout-btn-badge mono">{{
              formatCurrency(store.total, store.settings.currency, store.settings.locale)
            }}</span>
          </button>
        </div>
      </template>

      <!-- ── Payment View ── -->
      <template v-else-if="step === 2">
        <div class="payment-scroll">
          <div class="amount-due">
            <div class="amount-due-label">Amount Due</div>
            <div class="amount-due-value mono">
              {{ formatCurrency(store.total, store.settings.currency, store.settings.locale) }}
            </div>
          </div>

          <!-- Customer -->
          <div class="section-card">
            <div class="section-label">
              <span class="mdi mdi-account-outline" />
              Customer
            </div>
            <template v-if="selectedCustomer">
              <div class="customer-found">
                <div class="customer-avatar">
                  {{ (selectedCustomer.name || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="customer-info-block">
                  <div class="customer-name">{{ selectedCustomer.name || 'Unnamed' }}</div>
                  <div class="customer-phone">{{ selectedCustomer.phone }}</div>
                </div>
                <button class="icon-btn" @click="clearSelectedCustomer">
                  <span class="mdi mdi-close" />
                </button>
              </div>
            </template>
            <template v-else>
              <div class="customer-search-wrap">
                <span class="mdi mdi-magnify field-icon" />
                <input
                  v-model="customerPhone"
                  type="tel"
                  class="field-input field-input--icon"
                  placeholder="Search by phone..."
                  @input="onPhoneInput"
                />
                <span v-if="isSearching" class="mdi mdi-loading field-icon-right spin" />
              </div>
              <div v-if="customerResults.length > 0" class="search-dropdown">
                <button
                  v-for="c in customerResults"
                  :key="c.id"
                  class="search-result"
                  @click="selectCustomer(c)"
                >
                  <div class="result-avatar">{{ (c.name || '?').charAt(0).toUpperCase() }}</div>
                  <div>
                    <div class="result-name">{{ c.name || 'Unnamed' }}</div>
                    <div class="result-phone">{{ c.phone }}</div>
                  </div>
                  <span class="mdi mdi-chevron-right result-chevron" />
                </button>
              </div>
              <input
                v-model="customerName"
                type="text"
                class="field-input field-input--gap"
                placeholder="Name (optional)"
              />
              <div class="walk-in-badge">
                <span class="mdi mdi-walk" />
                Walk-in Customer
                <span class="walk-in-tag">default</span>
              </div>
            </template>
            <textarea
              v-model="customerNote"
              class="field-input field-textarea field-input--gap"
              placeholder="Order note (optional)"
              rows="2"
            />
          </div>

          <!-- Payment Method -->
          <div>
            <div class="method-section-label">Payment Method</div>
            <div class="method-grid">
              <button
                v-for="pm in paymentMethods"
                :key="pm.value"
                class="method-card"
                :class="{ active: method === pm.value }"
                @click="selectMethod(pm.value)"
              >
                <span :class="`mdi ${pm.icon} method-icon`" />
                <span class="method-title">{{ pm.title }}</span>
              </button>
            </div>
          </div>

          <!-- Cash -->
          <div v-if="method === 'cash'" class="method-form">
            <label class="field-label">Amount Tendered</label>
            <div class="field-prefix-wrap">
              <span class="field-prefix mono">{{ store.settings.currency || '₵' }}</span>
              <input
                v-model="amountTendered"
                type="number"
                class="field-input field-input--prefix mono"
                :placeholder="store.total.toFixed(2)"
              />
            </div>
            <div v-if="changeDue !== null" class="change-due">
              <span>Change due:</span>
              <span class="mono change-due-amt">{{
                formatCurrency(changeDue, store.settings.currency, store.settings.locale)
              }}</span>
            </div>
          </div>

          <!-- MoMo -->
          <div v-else-if="method === 'momo'" class="method-form">
            <label class="field-label">Customer Phone</label>
            <input
              v-model="momoPhone"
              type="tel"
              class="field-input mono"
              placeholder="024 XXX XXXX"
            />
            <label class="field-label field-label--gap">Network</label>
            <div class="network-pills">
              <button
                v-for="net in networks"
                :key="net"
                class="net-pill"
                :class="{ active: momoNetwork === net }"
                @click="momoNetwork = net"
              >
                {{ net }}
              </button>
            </div>
          </div>

          <!-- USSD -->
          <div v-else-if="method === 'ussd'" class="method-form">
            <label class="field-label">Customer Phone</label>
            <input
              v-model="momoPhone"
              type="tel"
              class="field-input mono"
              placeholder="024 XXX XXXX"
            />
            <label class="field-label field-label--gap">Network</label>
            <div class="network-pills">
              <button
                v-for="net in networks"
                :key="net"
                class="net-pill"
                :class="{ active: momoNetwork === net }"
                @click="momoNetwork = net"
              >
                {{ net }}
              </button>
            </div>
            <div v-if="ussdCode" class="ussd-info">
              Customer dials <strong class="mono">{{ ussdCode }}</strong>
            </div>
          </div>

          <!-- Paystack -->
          <div v-else-if="method === 'paystack'" class="method-form">
            <label class="field-label">Customer Email</label>
            <input
              v-model="paystackEmail"
              type="email"
              class="field-input"
              placeholder="customer@email.com"
            />
          </div>

          <div v-if="payError" class="pay-error">
            <span class="mdi mdi-alert-circle-outline" />
            {{ payError }}
          </div>
        </div>

        <div class="payment-footer">
          <button
            class="confirm-btn"
            :disabled="!method || store.cart.length === 0 || isCompleting"
            @click="confirmPayment"
          >
            <span v-if="isCompleting" class="mdi mdi-loading spin confirm-spin" />
            {{ isCompleting ? 'Processing...' : 'Confirm Payment' }}
          </button>
        </div>
      </template>

      <!-- ── Success View ── -->
      <template v-else-if="step === 3">
        <div id="printable-receipt" class="success-view">
          <div class="success-icon-wrap">
            <span class="mdi mdi-check-circle success-icon" />
          </div>
          <h2 class="success-title">Payment Successful</h2>
          <div v-if="completedReceipt" class="receipt-num mono">{{ completedReceipt.number }}</div>

          <div v-if="completedReceipt" class="receipt-card">
            <div class="receipt-store">{{ store.settings.storeName }}</div>
            <div class="receipt-date">{{ formatDateTime(completedReceipt.createdAt) }}</div>
            <div class="receipt-divider" />
            <div
              v-for="item in completedReceipt.items"
              :key="item.product.id"
              class="receipt-line"
            >
              <span>{{ item.product.name }} × {{ item.quantity }}</span>
              <span class="mono">{{ formatCurrency(item.product.price * item.quantity) }}</span>
            </div>
            <div class="receipt-divider" />
            <div class="receipt-total-row">
              <span>Total</span>
              <span class="mono receipt-total-amt">{{ formatCurrency(completedReceipt.total) }}</span>
            </div>
            <div class="receipt-method mono">
              {{ completedReceipt.paymentMethod?.toUpperCase() }}
            </div>
          </div>

          <div class="success-actions no-print">
            <button class="new-order-btn" @click="finishSale">New Order</button>
            <button class="print-btn" @click="printReceipt">
              <span class="mdi mdi-printer" />
              Print
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- ── Mobile Bottom Bar ── -->
    <div class="mobile-bar no-print">
      <button class="mobile-cart-btn" @click="mobileCartOpen = !mobileCartOpen">
        <div class="mobile-btn-left">
          <span class="mdi mdi-shopping-outline" />
          <span>{{ mobileCartOpen ? 'Back to Catalog' : 'View Cart' }}</span>
        </div>
        <span class="mobile-cart-total mono">{{
          formatCurrency(store.total, store.settings.currency, store.settings.locale)
        }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ── Root ── */
.sales-root {
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow: hidden;
  background: var(--pos-bg);
  position: relative;
}

/* ── Catalog Panel ── */
.catalog-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid var(--pos-border);
}

.catalog-header {
  padding: 20px 24px 14px;
  background: var(--pos-surface);
  border-bottom: 1px solid var(--pos-border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}

.search-wrap {
  position: relative;
  max-width: 480px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--pos-muted);
  font-size: 17px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 11px 16px 11px 40px;
  border-radius: 14px;
  background: var(--pos-bg);
  border: 1px solid var(--pos-border);
  font-size: 14px;
  color: var(--pos-ink);
  font-family: var(--pos-sans);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus {
  border-color: var(--pos-accent);
  box-shadow: 0 0 0 3px var(--pos-ring);
}

.category-pills {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.category-pills::-webkit-scrollbar { display: none; }

.cat-pill {
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  background: var(--pos-bg);
  border: 1px solid var(--pos-border);
  color: var(--pos-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--pos-sans);
}
.cat-pill:hover { border-color: var(--pos-accent); color: var(--pos-ink); }
.cat-pill.active {
  background: var(--pos-accent-strong);
  border-color: var(--pos-accent-strong);
  color: #fff;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
}

.catalog-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 80px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
  align-content: start;
}

/* ── Product Cards ── */
.product-card {
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  border-radius: 18px;
  padding: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.product-card:hover:not(.product-card--oos) {
  border-color: var(--pos-accent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
.product-card--oos { opacity: 0.5; filter: grayscale(0.4); cursor: default; }

.product-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cat-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--pos-muted);
  background: var(--pos-bg);
  border: 1px solid var(--pos-border);
  border-radius: 6px;
  padding: 2px 7px;
}

.stock-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.stock-dot--low { background: #f59e0b; animation: pulse-dot 1.5s ease-in-out infinite; }
.stock-dot--out { background: #ef4444; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.product-name {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.35;
  color: var(--pos-ink);
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 4px;
}

.product-price {
  font-family: var(--pos-mono);
  font-weight: 700;
  font-size: 15px;
  color: var(--pos-accent-strong);
}

.stock-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--pos-bg);
  color: var(--pos-muted);
}
.stock-badge--low { background: rgba(245, 158, 11, 0.1); color: #b45309; }
.stock-badge--out { background: rgba(239, 68, 68, 0.08); color: #dc2626; }

/* ── Order Panel ── */
.order-panel {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--pos-surface);
  border-left: 1px solid var(--pos-border);
}

.order-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--pos-border);
  flex-shrink: 0;
}

.order-title { font-size: 17px; font-weight: 600; color: var(--pos-ink); }

.hdr-btn {
  font-size: 13px;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
  font-family: var(--pos-sans);
}
.back-btn { color: var(--pos-muted); }
.back-btn:hover { color: var(--pos-ink); background: var(--pos-border); }
.clear-btn { color: #ef4444; }
.clear-btn:hover { background: rgba(239, 68, 68, 0.08); }

/* ── Cart ── */
.order-items {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.cart-empty {
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  opacity: 0.4;
}
.cart-empty-icon { font-size: 44px; color: var(--pos-muted); margin-bottom: 10px; }
.cart-empty-title { font-size: 15px; font-weight: 600; color: var(--pos-ink); }
.cart-empty-sub { font-size: 12px; color: var(--pos-muted); margin-top: 4px; }

.cart-list { display: flex; flex-direction: column; gap: 10px; }

.cart-item {
  background: var(--pos-bg);
  border: 1px solid var(--pos-border);
  border-radius: 16px;
  padding: 12px 14px;
}

.cart-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.cart-item-info { flex: 1; padding-right: 8px; }
.cart-item-name { font-size: 13px; font-weight: 500; color: var(--pos-ink); line-height: 1.3; }
.cart-item-price { font-family: var(--pos-mono); font-size: 12px; color: var(--pos-muted); margin-top: 2px; }

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--pos-muted);
  padding: 3px;
  border-radius: 6px;
  font-size: 15px;
  opacity: 0;
  transition: color 0.15s, opacity 0.15s;
}
.cart-item:hover .remove-btn { opacity: 1; }
.remove-btn:hover { color: #ef4444; }

.cart-item-bottom { display: flex; align-items: center; justify-content: space-between; }

.qty-controls {
  display: flex;
  align-items: center;
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  border-radius: 10px;
  overflow: hidden;
}

.qty-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--pos-ink);
  font-size: 13px;
  transition: background 0.12s;
}
.qty-btn:hover { background: var(--pos-border); }

.qty-value {
  width: 30px;
  text-align: center;
  font-family: var(--pos-mono);
  font-weight: 600;
  font-size: 13px;
}

.item-line-total { font-family: var(--pos-mono); font-weight: 700; font-size: 13px; }

/* ── Cart Footer ── */
.order-footer {
  padding: 18px 20px 22px;
  background: var(--pos-bg);
  border-top: 1px solid var(--pos-border);
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
}

.totals { display: flex; flex-direction: column; gap: 9px; margin-bottom: 18px; }

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--pos-muted);
}

.total-row--strong {
  font-size: 17px;
  font-weight: 700;
  color: var(--pos-ink);
  padding-top: 10px;
  border-top: 1px solid var(--pos-border);
  margin-top: 2px;
}

.total-accent { color: var(--pos-accent-strong); }

.checkout-btn {
  width: 100%;
  padding: 13px 20px;
  border-radius: 14px;
  background: var(--pos-accent);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.38);
  transition: background 0.15s, transform 0.1s;
  font-family: var(--pos-sans);
}
.checkout-btn:hover:not(:disabled) { background: var(--pos-accent-strong); }
.checkout-btn:active:not(:disabled) { transform: scale(0.99); }
.checkout-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

.checkout-btn-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 11px;
  border-radius: 8px;
  font-size: 13px;
}

/* ── Payment View ── */
.payment-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 18px 18px 8px;
  background: var(--pos-bg);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.amount-due { text-align: center; padding: 6px 0 2px; }
.amount-due-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--pos-muted);
  margin-bottom: 4px;
}
.amount-due-value {
  font-size: 34px;
  font-weight: 800;
  color: var(--pos-accent-strong);
  letter-spacing: -0.02em;
}

.section-card {
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--pos-muted);
  display: flex;
  align-items: center;
  gap: 5px;
}

.customer-found {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--pos-accent-soft);
  border: 1px solid var(--pos-accent);
  border-radius: 12px;
  padding: 10px 12px;
}

.customer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--pos-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.customer-info-block { flex: 1; min-width: 0; }
.customer-name { font-weight: 600; font-size: 13px; color: var(--pos-accent-strong); }
.customer-phone { font-size: 12px; color: var(--pos-muted); }

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--pos-muted);
  padding: 4px;
  border-radius: 6px;
  font-size: 15px;
  transition: color 0.15s;
}
.icon-btn:hover { color: #ef4444; }

.customer-search-wrap { position: relative; }

.field-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--pos-muted);
  font-size: 15px;
  pointer-events: none;
}
.field-icon-right {
  position: absolute;
  right: 11px;
  top: calc(50% - 8px);
  color: var(--pos-muted);
  font-size: 15px;
}

.field-input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid var(--pos-border);
  background: var(--pos-bg);
  font-size: 13px;
  color: var(--pos-ink);
  font-family: var(--pos-sans);
  outline: none;
  display: block;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.field-input:focus { border-color: var(--pos-accent); box-shadow: 0 0 0 3px var(--pos-ring); }
.field-input--icon { padding-left: 34px; }
.field-input--prefix { padding-left: 40px; }
.field-input--gap { margin-top: 8px; }
.field-input.mono { font-family: var(--pos-mono); font-size: 15px; }

.field-textarea { resize: none; min-height: 56px; }

.search-dropdown {
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.search-result {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
  font-family: var(--pos-sans);
}
.search-result:hover { background: var(--pos-bg); }

.result-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--pos-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.result-name { font-size: 13px; font-weight: 500; color: var(--pos-ink); }
.result-phone { font-size: 11px; color: var(--pos-muted); }
.result-chevron { font-size: 14px; color: var(--pos-muted); margin-left: auto; }

.walk-in-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--pos-muted);
  padding: 7px 11px;
  border: 1px dashed var(--pos-border);
  border-radius: 10px;
  margin-top: 6px;
}
.walk-in-tag {
  font-size: 10px;
  font-weight: 600;
  background: var(--pos-border);
  color: var(--pos-ink);
  padding: 1px 6px;
  border-radius: 999px;
  margin-left: 2px;
}

/* ── Payment methods ── */
.method-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--pos-muted);
  margin-bottom: 10px;
}

.method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.method-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  border: 2px solid var(--pos-border);
  background: var(--pos-surface);
  cursor: pointer;
  color: var(--pos-muted);
  transition: all 0.15s ease;
  font-family: var(--pos-sans);
}
.method-card:hover { border-color: #cbd5e1; background: var(--pos-bg); }
.method-card.active {
  border-color: var(--pos-accent);
  background: var(--pos-accent-soft);
  color: var(--pos-accent-strong);
}
.method-icon { font-size: 22px; }
.method-title { font-size: 13px; font-weight: 600; }

.method-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  border-radius: 14px;
  padding: 14px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pos-muted);
  display: block;
}
.field-label--gap { margin-top: 6px; }

.field-prefix-wrap { position: relative; }
.field-prefix {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--pos-muted);
  font-size: 13px;
  pointer-events: none;
}

.change-due {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 12px;
  background: rgba(16, 185, 129, 0.08);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
}
.change-due-amt { font-size: 17px; font-weight: 700; }

.network-pills { display: flex; gap: 8px; }
.net-pill {
  flex: 1;
  padding: 7px 0;
  border-radius: 10px;
  border: 1px solid var(--pos-border);
  background: var(--pos-bg);
  color: var(--pos-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--pos-sans);
}
.net-pill.active {
  border-color: var(--pos-accent);
  background: var(--pos-accent-soft);
  color: var(--pos-accent-strong);
}

.ussd-info {
  font-size: 13px;
  color: var(--pos-muted);
  padding: 8px 12px;
  background: var(--pos-bg);
  border-radius: 8px;
  border: 1px solid var(--pos-border);
}

.pay-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.18);
  border-radius: 12px;
  font-size: 13px;
}

/* ── Payment Footer ── */
.payment-footer {
  padding: 14px 18px 18px;
  background: var(--pos-bg);
  border-top: 1px solid var(--pos-border);
  flex-shrink: 0;
}

.confirm-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  background: var(--pos-accent);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.38);
  transition: background 0.15s, transform 0.1s;
  font-family: var(--pos-sans);
}
.confirm-btn:hover:not(:disabled) { background: var(--pos-accent-strong); }
.confirm-btn:active:not(:disabled) { transform: scale(0.99); }
.confirm-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.confirm-spin { font-size: 16px; }

/* ── Success View ── */
.success-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  background: var(--pos-bg);
  gap: 12px;
  text-align: center;
  overflow-y: auto;
}

.success-icon-wrap {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.success-icon { font-size: 42px; color: #10b981; }
.success-title { font-size: 21px; font-weight: 700; color: var(--pos-ink); }
.receipt-num { font-size: 12px; color: var(--pos-muted); }

.receipt-card {
  width: 100%;
  max-width: 270px;
  background: var(--pos-surface);
  border: 1px dashed var(--pos-border);
  border-radius: 16px;
  padding: 15px 16px;
  font-size: 12px;
  text-align: left;
}
.receipt-store { font-weight: 700; font-size: 13px; text-align: center; }
.receipt-date { text-align: center; color: var(--pos-muted); font-size: 11px; margin: 2px 0 6px; }
.receipt-divider { height: 1px; background: var(--pos-border); margin: 6px 0; }
.receipt-line { display: flex; justify-content: space-between; margin-bottom: 3px; }
.receipt-total-row { display: flex; justify-content: space-between; font-weight: 700; }
.receipt-total-amt { font-size: 14px; }
.receipt-method { text-align: center; margin-top: 7px; font-size: 10px; color: var(--pos-muted); letter-spacing: 0.07em; }

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 240px;
  margin-top: 4px;
}

.new-order-btn {
  padding: 13px;
  border-radius: 14px;
  background: var(--pos-accent);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.32);
  transition: background 0.15s;
  font-family: var(--pos-sans);
}
.new-order-btn:hover { background: var(--pos-accent-strong); }

.print-btn {
  padding: 11px;
  border-radius: 14px;
  background: var(--pos-surface);
  border: 1px solid var(--pos-border);
  color: var(--pos-ink);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: background 0.15s;
  font-family: var(--pos-sans);
}
.print-btn:hover { background: var(--pos-bg); }

/* ── Mobile Bar ── */
.mobile-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 14px;
  background: var(--pos-surface);
  border-top: 1px solid var(--pos-border);
  box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.08);
  z-index: 30;
}

.mobile-cart-btn {
  width: 100%;
  padding: 13px 20px;
  border-radius: 14px;
  background: var(--pos-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.38);
  font-family: var(--pos-sans);
}

.mobile-btn-left { display: flex; align-items: center; gap: 8px; }
.mobile-cart-total {
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 13px;
}

/* ── Utils ── */
.mono { font-family: var(--pos-mono); }
.spin { animation: do-spin 0.75s linear infinite; }

@keyframes do-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--pos-muted);
  font-size: 14px;
  text-align: center;
}
.empty-icon { font-size: 44px; margin-bottom: 10px; opacity: 0.35; }

/* ── Responsive ── */
@media (max-width: 960px) {
  .order-panel {
    position: fixed;
    inset: 0;
    z-index: 40;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    width: 100%;
  }
  .order-panel.mobile-open { transform: translateY(0); }
  .mobile-bar { display: block; }
  .catalog-grid { padding-bottom: 80px; }
}

/* ── Print ── */
@media print {
  body > *:not(#printable-receipt) { display: none !important; }
  .no-print { display: none !important; }
  #printable-receipt {
    position: fixed;
    inset: 0;
    background: white;
    padding: 32px;
    display: flex !important;
    flex-direction: column;
    align-items: center;
  }
}
</style>
