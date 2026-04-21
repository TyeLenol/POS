<template>
  <v-container class="pa-4">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Inventory</h1>
      <v-btn color="primary" @click="showForm = true">
        <v-icon left>mdi-plus</v-icon>
        Add Product
      </v-btn>
    </div>

    <!-- Product Form Dialog -->
    <v-dialog v-model="showForm" persistent max-width="500px">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">Add New Product</v-card-title>
        <v-card-text class="pa-6">
          <v-alert v-if="formError" type="error" variant="tonal" closable class="mb-4">
            {{ formError }}
          </v-alert>

          <v-text-field
            v-model="form.sku"
            label="SKU"
            variant="outlined"
            class="mb-4"
            :disabled="isSubmitting"
          />

          <v-text-field
            v-model="form.name"
            label="Product Name"
            variant="outlined"
            class="mb-4"
            :disabled="isSubmitting"
          />

          <v-text-field
            v-model="form.category"
            label="Category"
            variant="outlined"
            class="mb-4"
            :disabled="isSubmitting"
          />

          <v-row class="mb-4">
            <v-col>
              <v-text-field
                v-model.number="form.price"
                label="Price (GHS)"
                type="number"
                variant="outlined"
                step="0.01"
                min="0"
                :disabled="isSubmitting"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model.number="form.cost"
                label="Cost (optional)"
                type="number"
                variant="outlined"
                step="0.01"
                min="0"
                :disabled="isSubmitting"
              />
            </v-col>
          </v-row>

          <v-row class="mb-4">
            <v-col>
              <v-text-field
                v-model.number="form.stock"
                label="Stock"
                type="number"
                variant="outlined"
                min="0"
                :disabled="isSubmitting"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="form.barcode"
                label="Barcode (optional)"
                variant="outlined"
                :disabled="isSubmitting"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showForm = false" :disabled="isSubmitting"> Cancel </v-btn>
          <v-btn color="primary" @click="submitForm" :loading="isSubmitting"> Add Product </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Products List -->
    <v-card>
      <v-data-table :headers="headers" :items="products" :loading="isLoading" items-per-page="10">
        <template #item.price="{ item }">
          {{ formatCurrency(item.price) }}
        </template>
        <template #item.cost="{ item }">
          {{ item.cost ? formatCurrency(item.cost) : '—' }}
        </template>
        <template #item.stock="{ item }">
          <v-chip :color="item.stock > 5 ? 'success' : 'warning'" text-color="white">
            {{ item.stock }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePosStore } from '@/stores/pos'
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
const showForm = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

const form = ref<ProductForm>({
  sku: '',
  name: '',
  category: '',
  price: null,
  cost: null,
  stock: 0,
  barcode: '',
})

const headers = [
  { title: 'SKU', key: 'sku', width: '100px' },
  { title: 'Name', key: 'name' },
  { title: 'Category', key: 'category', width: '120px' },
  { title: 'Price', key: 'price', width: '100px', align: 'right' },
  { title: 'Cost', key: 'cost', width: '100px', align: 'right' },
  { title: 'Stock', key: 'stock', width: '100px', align: 'center' },
  { title: 'Barcode', key: 'barcode', width: '150px' },
]

const products = ref<any[]>([])

const loadProducts = async () => {
  isLoading.value = true
  try {
    await posStore.loadProducts()
    products.value = posStore.products
  } catch (error: any) {
    formError.value = 'Failed to load products'
  } finally {
    isLoading.value = false
  }
}

const submitForm = async () => {
  if (!form.value.sku || !form.value.name || form.value.price === null) {
    formError.value = 'SKU, name, and price are required'
    return
  }

  isSubmitting.value = true
  formError.value = ''

  try {
    const result = await posStore.addProduct({
      sku: form.value.sku,
      name: form.value.name,
      category: form.value.category,
      price: form.value.price,
      cost: form.value.cost,
      stock: form.value.stock || 0,
      barcode: form.value.barcode,
    })

    if (result) {
      showForm.value = false
      // Reset form
      form.value = {
        sku: '',
        name: '',
        category: '',
        price: null,
        cost: null,
        stock: 0,
        barcode: '',
      }
      // Reload products
      await loadProducts()
    }
  } catch (error: any) {
    formError.value = error.message || 'Failed to add product'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
:deep(.v-data-table) {
  background: transparent;
}
</style>
