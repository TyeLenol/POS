import { defineStore } from 'pinia'

import { sampleProducts } from '@/data/products'
import { createOrder, getProducts, getReceipts } from '@/api/pos'
import type {
  CartItem,
  CustomerInfo,
  PaymentInfo,
  PaymentMethod,
  Product,
  Receipt,
  StoreSettings,
} from '@/types/pos'

const createReceiptNumber = (index: number) => {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  return `RC-${datePart}-${String(index).padStart(4, '0')}`
}

const defaultCustomer: CustomerInfo = {
  name: '',
  phone: '',
  note: '',
}

const defaultPayment: PaymentInfo = {
  method: null,
  status: 'idle',
  reference: '',
  phone: '',
  network: '',
  ussdCode: '',
  email: '',
  paidAmount: 0,
}

const defaultSettings: StoreSettings = {
  storeName: 'Diagon Alley POS',
  branchName: 'Main Street',
  address: '12 Market Road, Accra',
  phone: '+233 24 000 0000',
  email: 'hello@diagonalley.shop',
  currency: 'GHS',
  locale: 'en-GH',
  taxRate: 0.075,
  taxEnabled: true,
  taxLabel: 'VAT',
}

export const usePosStore = defineStore('pos', {
  state: () => ({
    products: sampleProducts as Product[],
    cart: [] as CartItem[],
    customer: { ...defaultCustomer },
    payment: { ...defaultPayment },
    receipts: [] as Receipt[],
    settings: { ...defaultSettings },
  }),
  getters: {
    cartCount: (state) => state.cart.reduce((total, item) => total + item.quantity, 0),
    subtotal: (state) =>
      state.cart.reduce((total, item) => total + item.product.price * item.quantity, 0),
    tax: (state) => {
      if (!state.settings.taxEnabled) {
        return 0
      }
      return (
        state.cart.reduce((total, item) => total + item.product.price * item.quantity, 0) *
        state.settings.taxRate
      )
    },
    total: (state) => {
      const subtotal = state.cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      )
      const tax = state.settings.taxEnabled ? subtotal * state.settings.taxRate : 0
      return subtotal + tax
    },
  },
  actions: {
    addToCart(product: Product) {
      const existing = this.cart.find((item) => item.product.id === product.id)
      if (existing) {
        existing.quantity += 1
        return
      }
      this.cart.push({ product, quantity: 1 })
    },
    updateQuantity(productId: string, quantity: number) {
      const item = this.cart.find((entry) => entry.product.id === productId)
      if (!item) {
        return
      }
      item.quantity = Math.max(1, Math.min(quantity, 99))
    },
    removeFromCart(productId: string) {
      this.cart = this.cart.filter((item) => item.product.id !== productId)
    },
    clearCart() {
      this.cart = []
    },
    setCustomerInfo(partial: Partial<CustomerInfo>) {
      this.customer = { ...this.customer, ...partial }
    },
    selectPaymentMethod(method: PaymentMethod) {
      this.payment.method = method
      this.payment.status = 'initiated'
      this.payment.paidAmount = this.total
    },
    updatePaymentInfo(partial: Partial<PaymentInfo>) {
      this.payment = { ...this.payment, ...partial }
    },
    markPaymentAwaiting() {
      if (!this.payment.method) {
        return
      }
      this.payment.status = 'awaiting'
    },
    markPaymentSuccess() {
      if (!this.payment.method) {
        return
      }
      this.payment.status = 'success'
    },
    markPaymentFailed() {
      if (!this.payment.method) {
        return
      }
      this.payment.status = 'failed'
    },
    resetPayment() {
      this.payment = { ...defaultPayment }
    },
    updateSettings(partial: Partial<StoreSettings>) {
      this.settings = { ...this.settings, ...partial }
    },
    startNewOrder() {
      this.clearCart()
      this.resetPayment()
      this.customer = { ...defaultCustomer }
    },
    async loadProducts() {
      try {
        const products = await getProducts()
        if (Array.isArray(products) && products.length > 0) {
          this.products = products
        }
      } catch (error) {
        console.warn('Failed to load products', error)
      }
    },
    async loadReceipts() {
      try {
        const receipts = await getReceipts()
        if (Array.isArray(receipts)) {
          this.receipts = receipts
        }
      } catch (error) {
        console.warn('Failed to load receipts', error)
      }
    },
    async completeOrder() {
      if (!this.payment.method || this.cart.length === 0) {
        return
      }
      const payload = {
        customer: {
          name: this.customer.name,
          phone: this.customer.phone,
          email: this.payment.email || null,
        },
        items: this.cart.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku,
          name: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity,
        })),
        totals: {
          subtotal: this.subtotal,
          tax: this.tax,
          total: this.total,
          currency: this.settings.currency,
        },
        payment: {
          method: this.payment.method,
          status: this.payment.status,
          reference: this.payment.reference || null,
          amount: this.payment.paidAmount || this.total,
          provider: this.payment.method,
        },
      }

      try {
        await createOrder(payload)
        await this.loadReceipts()
      } catch (error) {
        const index = this.receipts.length + 1
        const receipt: Receipt = {
          id: `receipt-${Date.now()}`,
          number: createReceiptNumber(index),
          createdAt: new Date().toISOString(),
          items: this.cart.map((item) => ({ ...item })),
          subtotal: this.subtotal,
          tax: this.tax,
          total: this.total,
          paymentMethod: this.payment.method,
          status: this.payment.status === 'success' ? 'paid' : 'failed',
          customer: { ...this.customer },
        }
        this.receipts.unshift(receipt)
        console.warn('Failed to persist order', error)
      }
      this.clearCart()
      this.resetPayment()
      this.customer = { ...defaultCustomer }
    },
  },
})
