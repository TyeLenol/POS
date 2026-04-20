const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const request = async (path: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
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
