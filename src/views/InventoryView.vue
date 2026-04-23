<template>
  <div class="inventory-page">
    <div class="page-header">
      <div>
        <div class="eyebrow">Stock management</div>
        <h1 class="page-title">Inventory</h1>
        <p class="page-sub">Manage products and monitor stock levels.</p>
      </div>
      <button v-if="isManager" class="btn-primary" type="button" @click="openAdd">
        <span class="mdi mdi-plus" /> Add product
      </button>
    </div>

    <div class="stats-grid">
      <div class="bento-card stat-card">
        <div class="stat-label">Total products</div>
        <div class="stat-value">{{ totalProducts }}</div>
      </div>
      <div class="bento-card stat-card">
        <div class="stat-label">Stock value</div>
        <div class="stat-value">
          {{ formatCurrency(totalValue, posStore.settings.currency, posStore.settings.locale) }}
        </div>
      </div>
      <div
        class="bento-card stat-card"
        :class="{ 'stat-card--warn': showLowStock }"
        @click="showLowStock = !showLowStock"
      >
        <div class="stat-label">Low stock</div>
        <div class="stat-value stat-value--warn">{{ lowStockCount }}</div>
      </div>
      <div class="bento-card stat-card">
        <div class="stat-label">Out of stock</div>
        <div class="stat-value stat-value--danger">{{ outOfStock }}</div>
      </div>
    </div>

    <div class="bento-card table-card">
      <div class="filters-bar">
        <div class="search-wrap">
          <span class="mdi mdi-magnify search-icon" />
          <input
            v-model="searchTerm"
            type="text"
            class="search-input"
            placeholder="Search by name or SKU..."
          />
        </div>
        <div class="select-wrap">
          <span class="mdi mdi-filter-variant select-prefix" />
          <select v-model="categoryFilter" class="filter-select">
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
          <span class="mdi mdi-chevron-down select-icon" />
        </div>
        <button
          class="toggle-btn"
          :class="{ active: showLowStock }"
          type="button"
          @click="showLowStock = !showLowStock"
        >
          <span class="mdi mdi-alert-circle-outline" /> Low stock only
        </button>
      </div>

      <div class="table-wrap">
        <table class="inventory-table">
          <thead>
            <tr>
              <th>
                <button class="sort-btn" type="button" @click="handleSort('name')">
                  Product <span class="mdi" :class="sortIcon('name')" />
                </button>
              </th>
              <th>SKU</th>
              <th>Category</th>
              <th class="text-right">
                <button class="sort-btn" type="button" @click="handleSort('price')">
                  Price <span class="mdi" :class="sortIcon('price')" />
                </button>
              </th>
              <th class="text-right">
                <button class="sort-btn" type="button" @click="handleSort('cost')">
                  Cost <span class="mdi" :class="sortIcon('cost')" />
                </button>
              </th>
              <th class="text-center">
                <button class="sort-btn" type="button" @click="handleSort('stock')">
                  Stock <span class="mdi" :class="sortIcon('stock')" />
                </button>
              </th>
              <th class="text-center">Status</th>
              <th v-if="isManager" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody v-if="filteredProducts.length">
            <tr
              v-for="product in filteredProducts"
              :key="product.id"
              class="inventory-row"
              @click="openDetail(product)"
            >
              <td>
                <div class="product-cell">
                  <div class="product-icon">
                    <span class="mdi mdi-package-variant" />
                  </div>
                  <span class="product-name">{{ product.name }}</span>
                </div>
              </td>
              <td class="mono muted">{{ product.sku }}</td>
              <td>
                <span class="category-pill">{{ product.category }}</span>
              </td>
              <td class="text-right mono">
                {{
                  formatCurrency(
                    product.price,
                    posStore.settings.currency,
                    posStore.settings.locale,
                  )
                }}
              </td>
              <td class="text-right mono muted">
                {{
                  product.cost
                    ? formatCurrency(
                        product.cost,
                        posStore.settings.currency,
                        posStore.settings.locale,
                      )
                    : '—'
                }}
              </td>
              <td class="text-center mono">{{ product.stock }}</td>
              <td class="text-center">
                <span class="status-pill" :class="stockStatus(product).className">
                  {{ stockStatus(product).label }}
                </span>
              </td>
              <td v-if="isManager" class="text-right" @click.stop>
                <div class="row-actions">
                  <button class="icon-btn" type="button" @click="openEdit(product)">
                    <span class="mdi mdi-pencil-outline" />
                  </button>
                  <button class="icon-btn danger" type="button" @click="openDelete(product)">
                    <span class="mdi mdi-trash-can-outline" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!filteredProducts.length" class="empty-state">
          <div class="empty-icon">
            <span class="mdi mdi-package-variant" />
          </div>
          <div class="empty-title">No products found</div>
          <div class="empty-sub">Try adjusting your search or filters.</div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? 'Edit product' : 'New product' }}</h3>
          <button class="icon-btn" type="button" @click="closeForm">
            <span class="mdi mdi-close" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="form-error">
            <span class="mdi mdi-alert-circle-outline" />
            {{ formError }}
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label>SKU</label>
              <input v-model="form.sku" type="text" class="form-input" :disabled="isSubmitting" />
            </div>
            <div class="form-field">
              <label>Category</label>
              <input
                v-model="form.category"
                type="text"
                class="form-input"
                :disabled="isSubmitting"
              />
            </div>
            <div class="form-field form-field--full">
              <label>Product name</label>
              <input v-model="form.name" type="text" class="form-input" :disabled="isSubmitting" />
            </div>
            <div class="form-field">
              <label>Price (GHS)</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
                :disabled="isSubmitting"
              />
            </div>
            <div class="form-field">
              <label>Cost (optional)</label>
              <input
                v-model.number="form.cost"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
                :disabled="isSubmitting"
              />
            </div>
            <div class="form-field">
              <label>Stock</label>
              <input
                v-model.number="form.stock"
                type="number"
                min="0"
                class="form-input"
                :disabled="isSubmitting"
              />
            </div>
            <div class="form-field">
              <label>Barcode (optional)</label>
              <input
                v-model="form.barcode"
                type="text"
                class="form-input"
                :disabled="isSubmitting"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" type="button" :disabled="isSubmitting" @click="closeForm">
            Cancel
          </button>
          <button class="btn-primary" type="button" :disabled="isSubmitting" @click="submitForm">
            {{ editingId ? 'Save changes' : 'Add product' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDetail && selectedProduct" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Product details</h3>
          <button class="icon-btn" type="button" @click="closeDetail">
            <span class="mdi mdi-close" />
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-top">
            <div class="product-icon large">
              <span class="mdi mdi-package-variant" />
            </div>
            <div>
              <div class="detail-name">{{ selectedProduct.name }}</div>
              <div class="detail-sub mono">{{ selectedProduct.sku }}</div>
            </div>
            <span class="status-pill" :class="stockStatus(selectedProduct).className">
              {{ stockStatus(selectedProduct).label }}
            </span>
          </div>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Category</div>
              <div class="detail-value">{{ selectedProduct.category }}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Price</div>
              <div class="detail-value mono">
                {{
                  formatCurrency(
                    selectedProduct.price,
                    posStore.settings.currency,
                    posStore.settings.locale,
                  )
                }}
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Cost</div>
              <div class="detail-value mono">
                {{
                  selectedProduct.cost
                    ? formatCurrency(
                        selectedProduct.cost,
                        posStore.settings.currency,
                        posStore.settings.locale,
                      )
                    : '—'
                }}
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Stock</div>
              <div class="detail-value mono">{{ selectedProduct.stock }}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Barcode</div>
              <div class="detail-value mono">{{ selectedProduct.barcode || '—' }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer" v-if="isManager">
          <button
            class="btn-ghost danger"
            type="button"
            @click="closeDetail(); openDelete(selectedProduct)"
          >
            Delete
          </button>
          <button
            class="btn-primary"
            type="button"
            @click="closeDetail(); openEdit(selectedProduct)"
          >
            Edit product
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDelete && deletingProduct"
      class="modal-overlay"
      @click.self="showDelete = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Remove product?</h3>
          <button class="icon-btn" type="button" @click="showDelete = false">
            <span class="mdi mdi-close" />
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-text">
            <strong>{{ deletingProduct.name }}</strong> will be removed from the product list. Order
            history is preserved.
          </p>
        </div>
        <div class="modal-footer">
          <button
            class="btn-ghost"
            type="button"
            :disabled="isDeleting"
            @click="showDelete = false"
          >
            Cancel
          </button>
          <button class="btn-danger" type="button" :disabled="isDeleting" @click="confirmDelete">
            {{ isDeleting ? 'Removing...' : 'Remove' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useAuthStore } from '@/stores/auth'
import { usePosStore } from '@/stores/pos'
import type { Product } from '@/types/pos'
import { formatCurrency } from '@/utils/format'

interface ProductForm {
  sku: string
  name: string
  category: string
  price: number | null
  cost: number | null
  stock: number | null
  barcode: string
}

const posStore = usePosStore()
const authStore = useAuthStore()
const isManager = computed(() => authStore.isManager)

type SortField = 'name' | 'stock' | 'price' | 'cost'
type SortDir = 'asc' | 'desc'

const showForm = ref(false)
const showDelete = ref(false)
const showDetail = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const formError = ref('')
const editingId = ref<string | null>(null)
const deletingProduct = ref<Product | null>(null)
const selectedProduct = ref<Product | null>(null)

const searchTerm = ref('')
const categoryFilter = ref('All Categories')
const showLowStock = ref(false)
const sortField = ref<SortField>('name')
const sortDir = ref<SortDir>('asc')

const emptyForm = (): ProductForm => ({
  sku: '',
  name: '',
  category: '',
  price: null,
  cost: null,
  stock: 0,
  barcode: '',
})

const form = ref<ProductForm>(emptyForm())

const products = computed(() => posStore.products)

const categories = computed(() => {
  const list = products.value.map((p) => p.category).filter(Boolean)
  return ['All Categories', ...Array.from(new Set(list))]
})

const lowStockThreshold = 5

const filteredProducts = computed(() => {
  const q = searchTerm.value.toLowerCase().trim()
  return products.value
    .filter((product) => {
      const matchSearch =
        !q || product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q)
      const matchCategory =
        categoryFilter.value === 'All Categories' || product.category === categoryFilter.value
      const matchStock = !showLowStock.value || product.stock <= lowStockThreshold
      return matchSearch && matchCategory && matchStock
    })
    .sort((a, b) => {
      let av: string | number = a[sortField.value] ?? 0
      let bv: string | number = b[sortField.value] ?? 0
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir.value === 'asc' ? -1 : 1
      if (av > bv) return sortDir.value === 'asc' ? 1 : -1
      return 0
    })
})

const totalProducts = computed(() => products.value.length)
const totalValue = computed(() =>
  products.value.reduce((sum, product) => sum + (product.cost ?? 0) * product.stock, 0),
)
const lowStockCount = computed(
  () =>
    products.value.filter((product) => product.stock > 0 && product.stock <= lowStockThreshold)
      .length,
)
const outOfStock = computed(() => products.value.filter((product) => product.stock === 0).length)

const stockStatus = (product: Product) => {
  if (product.stock === 0) {
    return { label: 'Out of stock', className: 'status--out' }
  }
  if (product.stock <= lowStockThreshold) {
    return { label: 'Low stock', className: 'status--low' }
  }
  return { label: 'In stock', className: 'status--good' }
}

const handleSort = (field: SortField) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}

const sortIcon = (field: SortField) => {
  if (sortField.value !== field) return 'mdi-arrow-up-down'
  return sortDir.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

const loadProducts = async () => {
  isLoading.value = true
  try {
    await posStore.loadProducts()
  } finally {
    isLoading.value = false
  }
}

const openAdd = () => {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

const openEdit = (product: Product) => {
  editingId.value = product.id
  form.value = {
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
    cost: product.cost ?? null,
    stock: product.stock,
    barcode: product.barcode ?? '',
  }
  formError.value = ''
  showForm.value = true
}

const openDelete = (product: Product) => {
  deletingProduct.value = product
  showDelete.value = true
}

const openDetail = (product: Product) => {
  selectedProduct.value = product
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  selectedProduct.value = null
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
}

const submitForm = async () => {
  if (!form.value.sku || !form.value.name || !form.value.category || form.value.price === null) {
    formError.value = 'SKU, name, category, and price are required'
    return
  }

  isSubmitting.value = true
  formError.value = ''

  const payload = {
    sku: form.value.sku,
    name: form.value.name,
    category: form.value.category,
    price: form.value.price,
    cost: form.value.cost,
    stock: form.value.stock ?? 0,
    barcode: form.value.barcode || undefined,
  }

  try {
    if (editingId.value) {
      await posStore.updateProduct(editingId.value, payload)
    } else {
      await posStore.addProduct(payload)
    }
    closeForm()
  } catch (error: any) {
    formError.value = error.message || 'Failed to save product'
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingProduct.value) return
  isDeleting.value = true
  try {
    await posStore.deleteProduct(deletingProduct.value.id)
    showDelete.value = false
    deletingProduct.value = null
  } catch (error: any) {
    formError.value = error.message || 'Failed to remove product'
  } finally {
    isDeleting.value = false
  }
}

onMounted(loadProducts)
</script>

<style scoped>
.inventory-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 28px 40px;
  max-width: 1600px;
  margin: 0 auto;
}

@media (max-width: 960px) {
  .inventory-page {
    padding: 20px 16px 32px;
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  margin-top: 4px;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.page-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.btn-primary {
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  background: var(--color-pos-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
}

.btn-primary:hover {
  background: var(--color-pos-accent-strong);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 16px 18px;
  cursor: default;
}
.stat-card--warn {
  border-color: rgba(245, 158, 11, 0.4);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-color);
  font-family: var(--pos-mono);
}

.stat-value--warn {
  color: #d97706;
}
.stat-value--danger {
  color: #dc2626;
}

.table-card {
  overflow: hidden;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface-color);
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 16px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  font-size: 13px;
  color: var(--text-color);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.search-input:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--pos-ring);
}

.select-wrap {
  position: relative;
  min-width: 180px;
}

.select-prefix {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 14px;
}

.filter-select {
  width: 100%;
  padding: 10px 32px 10px 30px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  font-size: 13px;
  color: var(--text-color);
  appearance: none;
  cursor: pointer;
  outline: none;
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.toggle-btn {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.toggle-btn.active {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.4);
  color: #b45309;
}

.table-wrap {
  overflow-x: auto;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 860px;
}

.inventory-table thead {
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
}

.inventory-table th {
  padding: 12px 16px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.inventory-table td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
}

.sort-btn {
  border: none;
  background: transparent;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.sort-btn:hover {
  color: var(--text-color);
}

.inventory-row {
  cursor: pointer;
  transition: background 0.15s;
}
.inventory-row:hover {
  background: var(--bg-color);
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  display: grid;
  place-items: center;
  color: var(--text-muted);
}

.product-icon.large {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  font-size: 20px;
}

.product-name {
  font-weight: 600;
}

.category-pill {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  background: var(--bg-color);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
}

.status--good {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  border-color: rgba(16, 185, 129, 0.25);
}
.status--low {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.25);
}
.status--out {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.25);
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.icon-btn:hover {
  background: var(--bg-color);
  color: var(--color-pos-accent-strong);
}
.icon-btn.danger:hover {
  color: #dc2626;
}

.mono {
  font-family: var(--pos-mono);
}
.muted {
  color: var(--text-muted);
}
.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  font-size: 20px;
}

.empty-title {
  font-weight: 600;
  color: var(--text-color);
}
.empty-sub {
  font-size: 12px;
  margin-top: 4px;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
}

.modal-card {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  background: var(--surface-color);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-weight: 700;
  color: var(--text-color);
}

.modal-body {
  padding: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  border-top: 1px solid var(--border-color);
  padding: 14px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-ghost {
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-ghost:hover {
  background: var(--bg-color);
}
.btn-ghost.danger {
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.4);
}

.btn-danger {
  padding: 8px 14px;
  border-radius: 12px;
  border: none;
  background: #dc2626;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover {
  background: #b91c1c;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.18);
  border-radius: 10px;
  padding: 9px 13px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field--full {
  grid-column: span 2;
}

.form-field label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.form-input {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  font-size: 13px;
  color: var(--text-color);
  outline: none;
}

.form-input:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--pos-ring);
}

.detail-top {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.detail-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color);
}
.detail-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-card {
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: 600;
}

.detail-value {
  font-weight: 600;
  color: var(--text-color);
}

.delete-text {
  font-size: 13px;
  color: var(--text-color);
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .form-field--full {
    grid-column: span 1;
  }
}
</style>
