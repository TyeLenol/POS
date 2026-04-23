import { useAuthStore } from '@/stores/auth'

const API_BASE = import.meta.env.VITE_API_URL || ''

const request = async (path: string, options?: RequestInit) => {
  const authStore = useAuthStore()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.json()
}

export const getProducts = async () => request('/api/products')

export const getReceipts = async () => request('/api/receipts')

export const createOrder = async (payload: unknown) =>
  request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const createProduct = async (payload: {
  sku: string
  name: string
  category: string
  price: number
  cost?: number | null
  stock?: number
  barcode?: string
}) =>
  request('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateProduct = async (
  id: string,
  payload: {
    sku: string
    name: string
    category: string
    price: number
    cost?: number | null
    stock?: number
    barcode?: string
  },
) =>
  request(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteProduct = async (id: string) =>
  request(`/api/products/${id}`, { method: 'DELETE' })

export const searchCustomers = async (q?: string) =>
  request(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`)

export const createCustomer = async (payload: { name: string; phone: string; email?: string }) =>
  request('/api/customers', { method: 'POST', body: JSON.stringify(payload) })

export const getSettings = async () => request('/api/onboarding/profile')

export const saveSettings = async (payload: {
  storeName?: string
  address?: string
  phone?: string
  email?: string
  currency?: string
  taxRate?: number
}) =>
  request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const getStaff = async () => request('/api/staff')

export const updateStaff = async (
  id: number,
  payload: {
    is_active: boolean
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    role?: string
  },
) => request(`/api/staff/${id}`, { method: 'PUT', body: JSON.stringify(payload) })

export const deleteStaff = async (id: number) =>
  request(`/api/staff/${id}`, { method: 'DELETE' })

export const getReportsSummary = async () => request('/api/reports/summary')

export const getReportsProducts = async () => request('/api/reports/products')

export const getReportsInventory = async () => request('/api/reports/inventory')
