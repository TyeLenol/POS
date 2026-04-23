<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSettings, saveSettings } from '@/api/pos'
import { usePosStore } from '@/stores/pos'

type TabId = 'store' | 'pos' | 'appearance' | 'receipt' | 'payments' | 'security' | 'notifications' | 'data'

const store = usePosStore()

const activeTab = ref<TabId>('store')
const saved = ref(false)
const isSaving = ref(false)
const saveError = ref('')

// Store
const storeName = ref('Diagon Alley POS')
const storeEmail = ref('admin@diagonalley.com')
const storePhone = ref('+233 24 000 0000')
const storeAddress = ref('93 Diagon Alley, London')
const storeCity = ref('London')
const storeCountry = ref('United Kingdom')
const branchName = ref('')
const currency = ref('GHS')
const timezone = ref('Africa/Accra')
const language = ref('en')
const businessType = ref('Retail')
const vatNumber = ref('VAT-123456789')

// POS
const taxRate = ref('10')
const taxLabel = ref('VAT')
const taxEnabled = ref(true)
const discountEnabled = ref(true)
const maxDiscount = ref('20')
const requirePin = ref(false)
const barcodeScanner = ref(true)
const autoRoundCash = ref(false)
const lowStockDefault = ref('10')

// Receipt
const receiptHeader = ref('Thank you for shopping at Diagon Alley!')
const receiptFooter = ref('Returns accepted within 7 days with receipt.')
const showLogo = ref(true)
const showBarcode = ref(true)
const showTaxBreakdown = ref(true)
const autoPrint = ref(false)
const emailReceipt = ref(true)
const paperSize = ref('80mm')

// Payments
const acceptCash = ref(true)
const acceptCard = ref(true)
const acceptMobileMoney = ref(true)
const defaultPayment = ref('Cash')
const splitPayment = ref(false)
const tipsEnabled = ref(false)
const tipPercents = ref('10,15,20')

// Security
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const twoFactor = ref(false)
const sessionTimeout = ref('30')
const pinLock = ref(false)
const pin = ref('')

// Notifications
const notifyLowStock = ref(true)
const notifyNewSale = ref(false)
const notifyDailySummary = ref(true)
const notifyWeeklyReport = ref(true)
const notifyRefunds = ref(true)
const notifyEmail = ref(true)
const notifySMS = ref(false)
const summaryTime = ref('20:00')
const backupTime = ref('03:00')

// Appearance
const selectedTheme = ref('light')

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'store', label: 'Store', icon: 'mdi-store' },
  { id: 'pos', label: 'POS', icon: 'mdi-flash' },
  { id: 'appearance', label: 'Appearance', icon: 'mdi-palette' },
  { id: 'receipt', label: 'Receipt', icon: 'mdi-receipt' },
  { id: 'payments', label: 'Payments', icon: 'mdi-credit-card' },
  { id: 'security', label: 'Security', icon: 'mdi-shield-check' },
  { id: 'notifications', label: 'Notifications', icon: 'mdi-bell' },
  { id: 'data', label: 'Data & Backup', icon: 'mdi-database' },
]

const businessTypes = ['Retail', 'Food & Beverage', 'Pharmacy', 'Electronics', 'Fashion', 'General Store', 'Other']
const currencies = [
  { value: 'GHS', label: 'GHS — Ghana Cedi (GH₵)' },
  { value: 'USD', label: 'USD — US Dollar ($)' },
  { value: 'GBP', label: 'GBP — British Pound (£)' },
  { value: 'EUR', label: 'EUR — Euro (€)' },
  { value: 'NGN', label: 'NGN — Nigerian Naira (₦)' },
  { value: 'KES', label: 'KES — Kenyan Shilling (KSh)' },
]
const timezones = ['Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Europe/London', 'America/New_York', 'America/Los_Angeles']
const accentColors = [
  { label: 'Amber (Default)', color: '#f59e0b' },
  { label: 'Blue', color: '#3b82f6' },
  { label: 'Emerald', color: '#10b981' },
  { label: 'Violet', color: '#8b5cf6' },
  { label: 'Rose', color: '#f43f5e' },
  { label: 'Orange', color: '#f97316' },
]
const loginSessions = [
  { device: 'Chrome · macOS', time: '2026-04-22 14:32', location: 'Accra, GH', current: true },
  { device: 'Safari · iPhone', time: '2026-04-21 09:15', location: 'Accra, GH', current: false },
  { device: 'Chrome · Windows', time: '2026-04-18 18:44', location: 'London, UK', current: false },
]
const exportActions = [
  { label: 'Export All Sales (CSV)', desc: 'All transactions as a spreadsheet' },
  { label: 'Export Inventory (CSV)', desc: 'Full product catalogue' },
  { label: 'Export Staff List (CSV)', desc: 'All staff records' },
  { label: 'Export Receipts (PDF)', desc: 'All receipts in PDF format' },
]

const loadProfile = async () => {
  try {
    const data = await getSettings()
    if (data) {
      if (data.store_name) storeName.value = data.store_name
      if (data.address) storeAddress.value = data.address
      if (data.phone) storePhone.value = data.phone
      if (data.email) storeEmail.value = data.email
      if (data.currency) currency.value = data.currency
      if (data.tax_rate != null) taxRate.value = String(data.tax_rate)
    }
  } catch {
    // fall through — use defaults
  }
}

const handleSave = async () => {
  isSaving.value = true
  saveError.value = ''
  try {
    await saveSettings({
      storeName: storeName.value,
      address: storeAddress.value,
      phone: storePhone.value,
      email: storeEmail.value,
      currency: currency.value,
      taxRate: Number(taxRate.value),
    })
    store.updateSettings({
      storeName: storeName.value,
      branchName: branchName.value,
      address: storeAddress.value,
      phone: storePhone.value,
      email: storeEmail.value,
      currency: currency.value,
      locale: language.value,
      taxRate: Number(taxRate.value),
      taxLabel: taxLabel.value,
      taxEnabled: taxEnabled.value,
    })
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } catch (e: unknown) {
    saveError.value = e instanceof Error ? e.message : 'Failed to save settings'
  } finally {
    isSaving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Manage your store preferences, security, and account settings.</p>
      </div>
      <div v-if="saved" class="saved-toast">
        <span class="mdi mdi-check-circle" style="font-size:16px" />
        Settings saved!
      </div>
    </div>

    <div class="settings-body">
      <!-- Sidebar -->
      <aside class="settings-sidebar">
        <div class="settings-nav bento-card">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-btn"
            :class="{ 'nav-btn--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span :class="['mdi', tab.icon, 'nav-icon']" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </aside>

      <!-- Content -->
      <main class="settings-content">

        <!-- ── STORE ── -->
        <template v-if="activeTab === 'store'">
          <div class="s-card">
            <h2 class="section-title">Store Information</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Store Name</label>
                <input v-model="storeName" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Business Type</label>
                <div class="select-wrap">
                  <select v-model="businessType" class="form-select">
                    <option v-for="b in businessTypes" :key="b">{{ b }}</option>
                  </select>
                  <span class="mdi mdi-chevron-down select-chevron" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Contact Email</label>
                <input v-model="storeEmail" type="email" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input v-model="storePhone" type="tel" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">VAT / Tax Number</label>
                <input v-model="vatNumber" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Store Address</label>
                <input v-model="storeAddress" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">City</label>
                <input v-model="storeCity" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Country</label>
                <input v-model="storeCountry" type="text" class="form-input" />
              </div>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Regional Settings</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Currency</label>
                <div class="select-wrap">
                  <select v-model="currency" class="form-select">
                    <option v-for="c in currencies" :key="c.value" :value="c.value">{{ c.label }}</option>
                  </select>
                  <span class="mdi mdi-chevron-down select-chevron" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Timezone</label>
                <div class="select-wrap">
                  <select v-model="timezone" class="form-select">
                    <option v-for="tz in timezones" :key="tz">{{ tz }}</option>
                  </select>
                  <span class="mdi mdi-chevron-down select-chevron" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Language</label>
                <div class="select-wrap">
                  <select v-model="language" class="form-select">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="pt">Portuguese</option>
                    <option value="ar">Arabic</option>
                  </select>
                  <span class="mdi mdi-chevron-down select-chevron" />
                </div>
              </div>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Store Logo</h2>
            <div class="logo-row">
              <div class="logo-preview">DA</div>
              <div>
                <button class="upload-btn">
                  <span class="mdi mdi-upload" style="font-size:15px" />
                  Upload new logo
                </button>
                <p class="upload-hint">PNG, JPG, SVG up to 2MB. Recommended: 200×200px.</p>
              </div>
            </div>
          </div>
        </template>

        <!-- ── POS ── -->
        <template v-else-if="activeTab === 'pos'">
          <div class="s-card">
            <h2 class="section-title">Tax Configuration</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Enable Tax</div>
                <div class="setting-desc">Apply tax to all transactions</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': taxEnabled }" @click="taxEnabled = !taxEnabled">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': taxEnabled }" />
              </button>
            </div>
            <div v-if="taxEnabled" class="form-grid form-grid--2 mt-3">
              <div class="form-group">
                <label class="form-label">Tax Rate (%)</label>
                <div class="input-icon-wrap">
                  <input v-model="taxRate" type="number" min="0" max="100" step="0.1" class="form-input pr-icon" />
                  <span class="mdi mdi-percent input-icon-r" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Tax Label</label>
                <input v-model="taxLabel" type="text" class="form-input" />
              </div>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Discounts & Promotions</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Allow Discounts</div>
                <div class="setting-desc">Cashiers can apply discounts at checkout</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': discountEnabled }" @click="discountEnabled = !discountEnabled">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': discountEnabled }" />
              </button>
            </div>
            <div v-if="discountEnabled" class="mt-3">
              <label class="form-label">Maximum Discount Allowed (%)</label>
              <div class="input-icon-wrap" style="max-width:300px">
                <input v-model="maxDiscount" type="number" min="0" max="100" class="form-input pr-icon" />
                <span class="mdi mdi-percent input-icon-r" />
              </div>
              <p class="hint-text mt-2">Discounts above this limit require manager approval.</p>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">POS Behaviour</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Barcode Scanner Support</div>
                <div class="setting-desc">Enable USB/Bluetooth barcode scanner input</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': barcodeScanner }" @click="barcodeScanner = !barcodeScanner">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': barcodeScanner }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Auto-Round Cash Transactions</div>
                <div class="setting-desc">Round to nearest denomination</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': autoRoundCash }" @click="autoRoundCash = !autoRoundCash">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': autoRoundCash }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Require Manager PIN for Voids</div>
                <div class="setting-desc">Manager must approve voided transactions</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': requirePin }" @click="requirePin = !requirePin">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': requirePin }" />
              </button>
            </div>
            <div class="mt-3">
              <label class="form-label">Default Low Stock Alert Threshold</label>
              <input v-model="lowStockDefault" type="number" min="1" class="form-input" style="max-width:300px" />
              <p class="hint-text mt-2">Alert when stock falls to or below this number of units.</p>
            </div>
          </div>
        </template>

        <!-- ── APPEARANCE ── -->
        <template v-else-if="activeTab === 'appearance'">
          <div class="s-card">
            <h2 class="section-title">Theme</h2>
            <div class="theme-grid">
              <button
                v-for="th in [{ id: 'light', label: 'Light', icon: 'mdi-weather-sunny' }, { id: 'dark', label: 'Dark', icon: 'mdi-weather-night' }, { id: 'system', label: 'System', icon: 'mdi-monitor' }]"
                :key="th.id"
                class="theme-btn"
                :class="{ 'theme-btn--active': selectedTheme === th.id }"
                @click="selectedTheme = th.id"
              >
                <span :class="['mdi', th.icon]" style="font-size:22px" />
                <span class="theme-btn-label">{{ th.label }}</span>
              </button>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Accent Color</h2>
            <div class="color-swatches">
              <div
                v-for="c in accentColors"
                :key="c.color"
                :title="c.label"
                class="color-swatch"
                :style="{ backgroundColor: c.color }"
              />
            </div>
            <p class="hint-text">Select an accent color for buttons, highlights, and interactive elements.</p>
          </div>

          <div class="s-card">
            <h2 class="section-title">Display</h2>
            <div class="form-grid form-grid--2">
              <div class="form-group">
                <label class="form-label">Date Format</label>
                <div class="select-wrap">
                  <select class="form-select">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                  <span class="mdi mdi-chevron-down select-chevron" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Time Format</label>
                <div class="select-wrap">
                  <select class="form-select">
                    <option>12-hour (AM/PM)</option>
                    <option>24-hour</option>
                  </select>
                  <span class="mdi mdi-chevron-down select-chevron" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── RECEIPT ── -->
        <template v-else-if="activeTab === 'receipt'">
          <div class="s-card">
            <h2 class="section-title">Receipt Content</h2>
            <div class="form-group mb-4">
              <label class="form-label">Receipt Header Message</label>
              <input v-model="receiptHeader" type="text" class="form-input" placeholder="Message shown at top of receipt" />
            </div>
            <div class="form-group mb-4">
              <label class="form-label">Receipt Footer Message</label>
              <input v-model="receiptFooter" type="text" class="form-input" placeholder="Message shown at bottom of receipt" />
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Show Store Logo</div>
                <div class="setting-desc">Display logo at top of printed receipt</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': showLogo }" @click="showLogo = !showLogo">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': showLogo }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Show Barcode on Receipt</div>
                <div class="setting-desc">Print a scannable barcode for easy lookup</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': showBarcode }" @click="showBarcode = !showBarcode">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': showBarcode }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Show Tax Breakdown</div>
                <div class="setting-desc">List tax amount separately on receipt</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': showTaxBreakdown }" @click="showTaxBreakdown = !showTaxBreakdown">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': showTaxBreakdown }" />
              </button>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Printing</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Auto-Print After Sale</div>
                <div class="setting-desc">Automatically print receipt when sale is completed</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': autoPrint }" @click="autoPrint = !autoPrint">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': autoPrint }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Email Receipt to Customer</div>
                <div class="setting-desc">Offer to email receipt if customer details are captured</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': emailReceipt }" @click="emailReceipt = !emailReceipt">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': emailReceipt }" />
              </button>
            </div>
            <div class="mt-3">
              <label class="form-label">Thermal Printer Paper Width</label>
              <div class="paper-size-row">
                <button
                  v-for="s in ['58mm', '80mm']"
                  :key="s"
                  class="paper-size-btn"
                  :class="{ 'paper-size-btn--active': paperSize === s }"
                  @click="paperSize = s"
                >{{ s }}</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ── PAYMENTS ── -->
        <template v-else-if="activeTab === 'payments'">
          <div class="s-card">
            <h2 class="section-title">Accepted Payment Methods</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Cash</div>
                <div class="setting-desc">Accept physical cash payments</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': acceptCash }" @click="acceptCash = !acceptCash">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': acceptCash }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Card (Credit / Debit)</div>
                <div class="setting-desc">Accept card payments via POS terminal</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': acceptCard }" @click="acceptCard = !acceptCard">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': acceptCard }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Mobile Money</div>
                <div class="setting-desc">Accept MTN MoMo, Telecel Cash, AirtelTigo Money</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': acceptMobileMoney }" @click="acceptMobileMoney = !acceptMobileMoney">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': acceptMobileMoney }" />
              </button>
            </div>
            <div class="mt-3 form-group" style="max-width:300px">
              <label class="form-label">Default Payment Method</label>
              <div class="select-wrap">
                <select v-model="defaultPayment" class="form-select">
                  <option v-if="acceptCash" value="Cash">Cash</option>
                  <option v-if="acceptCard" value="Card">Card</option>
                  <option v-if="acceptMobileMoney" value="Mobile Money">Mobile Money</option>
                </select>
                <span class="mdi mdi-chevron-down select-chevron" />
              </div>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Advanced Payment Options</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Split Payments</div>
                <div class="setting-desc">Allow customers to pay with multiple methods</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': splitPayment }" @click="splitPayment = !splitPayment">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': splitPayment }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Enable Tips</div>
                <div class="setting-desc">Allow cashiers to add tip amounts</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': tipsEnabled }" @click="tipsEnabled = !tipsEnabled">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': tipsEnabled }" />
              </button>
            </div>
            <div v-if="tipsEnabled" class="mt-3 form-group" style="max-width:300px">
              <label class="form-label">Suggested Tip Percentages (comma-separated)</label>
              <input v-model="tipPercents" type="text" class="form-input" placeholder="e.g. 10,15,20" />
            </div>
          </div>
        </template>

        <!-- ── SECURITY ── -->
        <template v-else-if="activeTab === 'security'">
          <div class="s-card">
            <h2 class="section-title">Change Password</h2>
            <div class="security-form">
              <div class="form-group">
                <label class="form-label">Current Password</label>
                <div class="input-icon-wrap">
                  <input :type="showCurrent ? 'text' : 'password'" v-model="currentPassword" class="form-input pr-icon" placeholder="••••••••" />
                  <button type="button" class="input-icon-btn" @click="showCurrent = !showCurrent">
                    <span :class="['mdi', showCurrent ? 'mdi-eye-off' : 'mdi-eye']" />
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">New Password</label>
                <div class="input-icon-wrap">
                  <input :type="showNew ? 'text' : 'password'" v-model="newPassword" class="form-input pr-icon" placeholder="Min. 8 characters" />
                  <button type="button" class="input-icon-btn" @click="showNew = !showNew">
                    <span :class="['mdi', showNew ? 'mdi-eye-off' : 'mdi-eye']" />
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" v-model="confirmPassword" class="form-input" placeholder="Re-enter new password" />
              </div>
              <button class="accent-btn">
                <span class="mdi mdi-key" style="font-size:15px" />
                Update Password
              </button>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Access Control</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Two-Factor Authentication</div>
                <div class="setting-desc">Require a code from your authenticator app on login</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': twoFactor }" @click="twoFactor = !twoFactor">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': twoFactor }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">POS PIN Lock</div>
                <div class="setting-desc">Lock POS screen after idle period, require PIN to unlock</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': pinLock }" @click="pinLock = !pinLock">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': pinLock }" />
              </button>
            </div>
            <div v-if="pinLock" class="mt-3 form-group" style="max-width:300px">
              <label class="form-label">Set POS PIN (4–6 digits)</label>
              <input type="password" v-model="pin" :maxlength="6" class="form-input" placeholder="Enter PIN" />
            </div>
            <div class="mt-3 form-group" style="max-width:300px">
              <label class="form-label">Session Timeout (minutes)</label>
              <input type="number" v-model="sessionTimeout" min="5" max="480" class="form-input" />
              <p class="hint-text mt-2">Auto-logout after this period of inactivity.</p>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Recent Login Activity</h2>
            <div class="sessions-list">
              <div v-for="(session, i) in loginSessions" :key="i" class="session-item">
                <div>
                  <div class="session-device">
                    {{ session.device }}
                    <span v-if="session.current" class="session-badge">Current</span>
                  </div>
                  <div class="session-meta">{{ session.time }} · {{ session.location }}</div>
                </div>
                <button v-if="!session.current" class="revoke-btn">Revoke</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ── NOTIFICATIONS ── -->
        <template v-else-if="activeTab === 'notifications'">
          <div class="s-card">
            <h2 class="section-title">Notification Channels</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Email Notifications</div>
                <div class="setting-desc">Receive alerts to your registered email</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': notifyEmail }" @click="notifyEmail = !notifyEmail">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': notifyEmail }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">SMS Notifications</div>
                <div class="setting-desc">Receive text messages for critical alerts</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': notifySMS }" @click="notifySMS = !notifySMS">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': notifySMS }" />
              </button>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Inventory Alerts</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Low Stock Alert</div>
                <div class="setting-desc">Notify when a product reaches its low stock threshold</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': notifyLowStock }" @click="notifyLowStock = !notifyLowStock">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': notifyLowStock }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Out of Stock Alert</div>
                <div class="setting-desc">Immediate alert when an item runs out</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': notifyLowStock }" @click="notifyLowStock = !notifyLowStock">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': notifyLowStock }" />
              </button>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Sales Notifications</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">New Sale Notification</div>
                <div class="setting-desc">Alert for every completed sale (high volume = lots of pings)</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': notifyNewSale }" @click="notifyNewSale = !notifyNewSale">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': notifyNewSale }" />
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Refund / Void Alerts</div>
                <div class="setting-desc">Notify when a transaction is refunded or voided</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': notifyRefunds }" @click="notifyRefunds = !notifyRefunds">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': notifyRefunds }" />
              </button>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Reports & Summaries</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Daily Sales Summary</div>
                <div class="setting-desc">End-of-day summary of total revenue and transactions</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': notifyDailySummary }" @click="notifyDailySummary = !notifyDailySummary">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': notifyDailySummary }" />
              </button>
            </div>
            <div v-if="notifyDailySummary" class="mt-3 form-group" style="max-width:200px">
              <label class="form-label">Send Summary At</label>
              <input type="time" v-model="summaryTime" class="form-input" />
            </div>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Weekly Performance Report</div>
                <div class="setting-desc">Summary of the week's performance every Monday morning</div>
              </div>
              <button class="toggle" :class="{ 'toggle--on': notifyWeeklyReport }" @click="notifyWeeklyReport = !notifyWeeklyReport">
                <span class="toggle-thumb" :class="{ 'toggle-thumb--on': notifyWeeklyReport }" />
              </button>
            </div>
          </div>
        </template>

        <!-- ── DATA & BACKUP ── -->
        <template v-else-if="activeTab === 'data'">
          <div class="s-card">
            <h2 class="section-title">Export Data</h2>
            <div class="export-grid">
              <button v-for="item in exportActions" :key="item.label" class="export-item">
                <div class="export-icon-wrap">
                  <span class="mdi mdi-download export-dl-icon" />
                </div>
                <div>
                  <div class="export-label">{{ item.label }}</div>
                  <div class="export-desc">{{ item.desc }}</div>
                </div>
              </button>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title">Backup & Restore</h2>
            <div class="setting-row">
              <div class="setting-text">
                <div class="setting-label">Automatic Daily Backups</div>
                <div class="setting-desc">Backup all data to cloud storage daily</div>
              </div>
              <button class="toggle toggle--on">
                <span class="toggle-thumb toggle-thumb--on" />
              </button>
            </div>
            <div class="mt-3 form-group" style="max-width:200px">
              <label class="form-label">Backup Time</label>
              <input type="time" v-model="backupTime" class="form-input" />
            </div>
            <div class="btn-row mt-3">
              <button class="outline-btn">
                <span class="mdi mdi-refresh" style="font-size:15px" />
                Create Manual Backup Now
              </button>
              <button class="outline-btn">
                <span class="mdi mdi-upload" style="font-size:15px" />
                Restore from Backup
              </button>
            </div>
          </div>

          <div class="s-card">
            <h2 class="section-title danger-title">Danger Zone</h2>
            <div class="danger-items">
              <div class="danger-item">
                <div>
                  <div class="danger-item-title">Clear All Transaction History</div>
                  <div class="danger-item-desc">Permanently delete all receipts and transaction records. This cannot be undone.</div>
                </div>
                <button class="danger-btn">Clear Data</button>
              </div>
              <div class="danger-item">
                <div>
                  <div class="danger-item-title">Reset to Factory Defaults</div>
                  <div class="danger-item-desc">Reset all settings to default. Your data will not be deleted.</div>
                </div>
                <button class="danger-btn">Reset Settings</button>
              </div>
            </div>
          </div>
        </template>

        <!-- Save row (all tabs except data) -->
        <div v-if="activeTab !== 'data'" class="save-row">
          <button type="button" class="cancel-btn">Cancel</button>
          <button type="button" class="save-btn" :disabled="isSaving" @click="handleSave">
            <span class="mdi mdi-content-save" style="font-size:15px" />
            {{ isSaving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>

        <p v-if="saveError" class="save-error">{{ saveError }}</p>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.settings-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
@media (min-width: 1024px) { .settings-page { padding: 32px; } }

.settings-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (min-width: 768px) {
  .settings-header { flex-direction: row; align-items: center; justify-content: space-between; }
}

.page-title { font-size: 24px; font-weight: 700; color: var(--text-color); letter-spacing: -0.02em; }
.page-sub   { font-size: 14px; color: var(--text-muted); margin-top: 2px; }

.saved-toast {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  font-size: 14px;
  font-weight: 500;
}

/* ── Body ── */
.settings-body { display: flex; flex-direction: column; gap: 24px; }
@media (min-width: 768px) { .settings-body { flex-direction: row; align-items: flex-start; } }

/* ── Sidebar ── */
.settings-sidebar { width: 100%; flex-shrink: 0; }
@media (min-width: 768px) { .settings-sidebar { width: 224px; } }

.settings-nav { padding: 8px; display: flex; flex-direction: column; gap: 2px; }

.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  width: 100%;
  text-align: left;
  transition: background 0.15s, color 0.15s;
  font-family: var(--pos-sans);
}
.nav-btn:hover { background: var(--bg-color); color: var(--text-color); }
.nav-btn--active { background: var(--color-pos-accent-soft); color: var(--color-pos-accent-strong); }
.nav-icon { font-size: 17px; }

/* ── Content ── */
.settings-content { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }

/* ── Card ── */
.s-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--pos-radius-lg);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}
.danger-title { color: #ef4444; }

/* ── Forms ── */
.form-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 640px) { .form-grid { grid-template-columns: 1fr 1fr; } }
.form-grid--2 { grid-template-columns: 1fr 1fr; }

.form-group { display: flex; flex-direction: column; }
.form-label { font-size: 14px; font-weight: 500; color: var(--text-color); margin-bottom: 6px; }

.form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  outline: none;
  font-size: 14px;
  color: var(--text-color);
  font-family: var(--pos-sans);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input::placeholder { color: var(--text-muted); }
.form-input:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--color-pos-accent-soft);
}
.form-input.pr-icon { padding-right: 44px; }

.select-wrap { position: relative; }
.form-select {
  width: 100%;
  padding: 12px 36px 12px 16px;
  border-radius: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  outline: none;
  font-size: 14px;
  color: var(--text-color);
  font-family: var(--pos-sans);
  appearance: none;
  cursor: pointer;
}
.form-select:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--color-pos-accent-soft);
}
.select-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.input-icon-wrap { position: relative; }
.input-icon-r {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: var(--text-muted);
  pointer-events: none;
}
.input-icon-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.hint-text { font-size: 12px; color: var(--text-muted); }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mb-4 { margin-bottom: 16px; }

/* ── Setting row ── */
.setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}
.setting-row:last-of-type { border-bottom: none; }
.setting-text { flex: 1; }
.setting-label { font-size: 14px; font-weight: 500; color: var(--text-color); }
.setting-desc  { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

/* ── Toggle ── */
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 24px;
  width: 44px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 9999px;
  border: 2px solid transparent;
  background: var(--border-color);
  transition: background 0.2s;
  padding: 0;
}
.toggle--on { background: var(--color-pos-accent); }
.toggle-thumb {
  pointer-events: none;
  display: inline-block;
  height: 20px;
  width: 20px;
  border-radius: 9999px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
  transform: translateX(0);
}
.toggle-thumb--on { transform: translateX(20px); }

/* ── Logo ── */
.logo-row { display: flex; align-items: center; gap: 16px; }
.logo-preview {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fbbf24, #d97706);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 24px;
  flex-shrink: 0;
}
.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  font-family: var(--pos-sans);
}
.upload-btn:hover { color: var(--text-color); border-color: var(--color-pos-accent); }
.upload-hint { font-size: 12px; color: var(--text-muted); margin-top: 8px; }

/* ── Theme ── */
.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-radius: 16px;
  border: 2px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--pos-sans);
}
.theme-btn:hover { border-color: #d1d5db; }
.theme-btn--active {
  border-color: var(--color-pos-accent);
  background: var(--color-pos-accent-soft);
  color: var(--color-pos-accent-strong);
}
.theme-btn-label { font-size: 14px; font-weight: 500; }

/* ── Accent colors ── */
.color-swatches { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  transition: transform 0.15s;
}
.color-swatch:hover { transform: scale(1.1); }

/* ── Paper size ── */
.paper-size-row { display: flex; gap: 12px; margin-top: 8px; }
.paper-size-btn {
  padding: 10px 20px;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--pos-sans);
}
.paper-size-btn:hover { border-color: #d1d5db; }
.paper-size-btn--active {
  border-color: var(--color-pos-accent);
  background: var(--color-pos-accent-soft);
  color: var(--color-pos-accent-strong);
}

/* ── Security ── */
.security-form { display: flex; flex-direction: column; gap: 16px; max-width: 448px; }
.sessions-list { display: flex; flex-direction: column; gap: 12px; }
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border-radius: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
}
.session-device {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}
.session-badge {
  font-size: 10px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
}
.session-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.revoke-btn {
  font-size: 12px;
  color: #ef4444;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-family: var(--pos-sans);
}
.revoke-btn:hover { text-decoration: underline; }

/* ── Export ── */
.export-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 640px) { .export-grid { grid-template-columns: 1fr 1fr; } }
.export-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  font-family: var(--pos-sans);
}
.export-item:hover {
  border-color: var(--color-pos-accent);
  background: var(--color-pos-accent-soft);
}
.export-item:hover .export-icon-wrap {
  background: var(--color-pos-accent);
  border-color: var(--color-pos-accent);
}
.export-item:hover .export-dl-icon { color: white; }
.export-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.export-dl-icon { font-size: 16px; color: var(--text-muted); transition: color 0.15s; }
.export-label { font-size: 14px; font-weight: 500; color: var(--text-color); }
.export-desc  { font-size: 12px; color: var(--text-muted); }

/* ── Danger zone ── */
.danger-items { display: flex; flex-direction: column; gap: 16px; }
.danger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.danger-item-title { font-size: 14px; font-weight: 600; color: #b91c1c; }
.danger-item-desc  { font-size: 12px; color: #b91c1c; opacity: 0.8; margin-top: 2px; }
.danger-btn {
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: #ef4444;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 16px;
  transition: background 0.15s;
  font-family: var(--pos-sans);
}
.danger-btn:hover { background: #dc2626; }

/* ── Buttons ── */
.accent-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--color-pos-accent);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  font-family: var(--pos-sans);
}
.accent-btn:hover { background: var(--color-pos-accent-strong); }

.outline-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: var(--pos-sans);
}
.outline-btn:hover { background: var(--bg-color); color: var(--text-color); }

.btn-row { display: flex; flex-wrap: wrap; gap: 12px; }

/* ── Save row ── */
.save-row { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; }
.cancel-btn {
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--pos-sans);
}
.cancel-btn:hover { color: var(--text-color); background: var(--border-color); }
.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--color-pos-accent);
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: background 0.15s;
  font-family: var(--pos-sans);
}
.save-btn:hover:not(:disabled) { background: var(--color-pos-accent-strong); }
.save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.save-error { font-size: 13px; color: #ef4444; text-align: right; }
</style>
