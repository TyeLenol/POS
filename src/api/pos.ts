import { useAuthStore } from '@/stores/auth'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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
