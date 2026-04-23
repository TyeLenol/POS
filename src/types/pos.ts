export type PaymentMethod = 'cash' | 'momo' | 'ussd' | 'paystack'

export type PaymentStatus = 'idle' | 'initiated' | 'awaiting' | 'success' | 'failed'

export interface Product {
  id: string
  name: string
  category: string
  sku: string
  price: number
  stock: number
  barcode?: string
  cost?: number | null
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CustomerInfo {
  name: string
  phone: string
  note: string
}

export interface PaymentInfo {
  method: PaymentMethod | null
  status: PaymentStatus
  reference: string
  phone: string
  network: string
  ussdCode: string
  email: string
  paidAmount: number
}

export interface StoreSettings {
  storeName: string
  branchName: string
  address: string
  phone: string
  email: string
  currency: string
  locale: string
  taxRate: number
  taxEnabled: boolean
  taxLabel: string
}

export interface Receipt {
  id: string
  number: string
  createdAt: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  status: 'paid' | 'failed'
  customer: CustomerInfo
}
