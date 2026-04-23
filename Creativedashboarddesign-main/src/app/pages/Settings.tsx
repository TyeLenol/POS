import React, { useState } from "react";
import {
  Store, Palette, Shield, Bell, CreditCard, Save, ChevronDown, Sun, Moon, Monitor,
  Receipt, Percent, Upload,
  CheckCircle2, Database, Download,
  RefreshCw, KeyRound, Eye, EyeOff, Zap
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/cn";

const inputClass = "w-full px-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-sm text-[var(--text-color)] placeholder-[var(--text-muted)]";
const labelClass = "text-sm font-medium text-[var(--text-color)] mb-1.5 block";
const sectionTitle = "text-base font-semibold text-[var(--text-color)] mb-4 pb-3 border-b border-[var(--border-color)]";
const cardClass = "bento-card p-6 space-y-5";

type TabId = "store" | "pos" | "appearance" | "receipt" | "payments" | "security" | "notifications" | "data";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        enabled ? "bg-[var(--color-pos-accent)]" : "bg-[var(--border-color)]"
      )}
    >
      <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200", enabled ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border-color)] last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--text-color)]">{label}</div>
        {description && <div className="text-xs text-[var(--text-muted)] mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("store");
  const [saved, setSaved] = useState(false);

  // Store settings
  const [storeName, setStoreName] = useState("Diagon Alley POS");
  const [storeEmail, setStoreEmail] = useState("admin@diagonalley.com");
  const [storePhone, setStorePhone] = useState("+233 24 000 0000");
  const [storeAddress, setStoreAddress] = useState("93 Diagon Alley, London");
  const [storeCity, setStoreCity] = useState("London");
  const [storeCountry, setStoreCountry] = useState("United Kingdom");
  const [currency, setCurrency] = useState("GHS");
  const [currencySymbol, setCurrencySymbol] = useState("GH₵");
  const [timezone, setTimezone] = useState("Africa/Accra");
  const [language, setLanguage] = useState("en");
  const [businessType, setBusinessType] = useState("Retail");
  const [vatNumber, setVatNumber] = useState("VAT-123456789");

  // POS settings
  const [taxRate, setTaxRate] = useState("10");
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [discountEnabled, setDiscountEnabled] = useState(true);
  const [maxDiscount, setMaxDiscount] = useState("20");
  const [requirePin, setRequirePin] = useState(false);
  const [barcodeScanner, setBarcodeScanner] = useState(true);
  const [autoRoundCash, setAutoRoundCash] = useState(false);
  const [lowStockDefault, setLowStockDefault] = useState("10");

  // Receipt settings
  const [receiptHeader, setReceiptHeader] = useState("Thank you for shopping at Diagon Alley!");
  const [receiptFooter, setReceiptFooter] = useState("Returns accepted within 7 days with receipt.");
  const [showLogo, setShowLogo] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [emailReceipt, setEmailReceipt] = useState(true);
  const [paperSize, setPaperSize] = useState("80mm");

  // Payments
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);
  const [acceptMobileMoney, setAcceptMobileMoney] = useState(true);
  const [defaultPayment, setDefaultPayment] = useState("Cash");
  const [splitPayment, setSplitPayment] = useState(false);
  const [tipsEnabled, setTipsEnabled] = useState(false);
  const [tipPercents, setTipPercents] = useState("10,15,20");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [pinLock, setPinLock] = useState(false);
  const [pin, setPin] = useState("");

  // Notifications
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyNewSale, setNotifyNewSale] = useState(false);
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(true);
  const [notifyRefunds, setNotifyRefunds] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySMS, setNotifySMS] = useState(false);
  const [summaryTime, setSummaryTime] = useState("20:00");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "store", label: "Store", icon: Store },
    { id: "pos", label: "POS", icon: Zap },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "receipt", label: "Receipt", icon: Receipt },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data & Backup", icon: Database },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] tracking-tight">Settings</h1>
          <p className="text-[var(--text-muted)] text-sm">Manage your store preferences, security, and account settings.</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-sm font-medium animate-in slide-in-from-top-2">
            <CheckCircle2 size={16} /> Settings saved!
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="bento-card p-2 space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium w-full text-left",
                  activeTab === tab.id
                    ? "bg-[var(--color-pos-accent-soft)] text-[var(--color-pos-accent-strong)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-color)] hover:text-[var(--text-color)]"
                )}
              >
                <tab.icon size={17} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-5 min-w-0">

          {/* ── STORE ─────────────────────────────────────────────────── */}
          {activeTab === "store" && (
            <>
              <div className={cardClass}>
                <h2 className={sectionTitle}>Store Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Store Name</label>
                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Business Type</label>
                    <div className="relative">
                      <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}>
                        {["Retail", "Food & Beverage", "Pharmacy", "Electronics", "Fashion", "General Store", "Other"].map((b) => <option key={b}>{b}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Contact Email</label>
                    <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Contact Phone</label>
                    <input type="tel" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>VAT / Tax Number</label>
                    <input type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Store Address</label>
                    <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>City</label>
                    <input type="text" value={storeCity} onChange={(e) => setStoreCity(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <input type="text" value={storeCountry} onChange={(e) => setStoreCountry(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Regional Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Currency</label>
                    <div className="relative">
                      <select value={currency} onChange={(e) => { setCurrency(e.target.value); setCurrencySymbol(e.target.value === "GHS" ? "GH₵" : e.target.value === "USD" ? "$" : e.target.value === "GBP" ? "£" : "€"); }} className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}>
                        <option value="GHS">GHS — Ghana Cedi (GH₵)</option>
                        <option value="USD">USD — US Dollar ($)</option>
                        <option value="GBP">GBP — British Pound (£)</option>
                        <option value="EUR">EUR — Euro (€)</option>
                        <option value="NGN">NGN — Nigerian Naira (₦)</option>
                        <option value="KES">KES — Kenyan Shilling (KSh)</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Timezone</label>
                    <div className="relative">
                      <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}>
                        {["Africa/Accra", "Africa/Lagos", "Africa/Nairobi", "Africa/Johannesburg", "Europe/London", "America/New_York", "America/Los_Angeles"].map((tz) => <option key={tz}>{tz}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Language</label>
                    <div className="relative">
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}>
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                        <option value="pt">Portuguese</option>
                        <option value="ar">Arabic</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Store Logo</h2>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm">DA</div>
                  <div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--color-pos-accent)] transition-colors">
                      <Upload size={15} />Upload new logo
                    </button>
                    <p className="text-xs text-[var(--text-muted)] mt-2">PNG, JPG, SVG up to 2MB. Recommended: 200×200px.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── POS ───────────────────────────────────────────────────── */}
          {activeTab === "pos" && (
            <>
              <div className={cardClass}>
                <h2 className={sectionTitle}>Tax Configuration</h2>
                <SettingRow label="Enable Tax" description="Apply tax to all transactions">
                  <Toggle enabled={taxEnabled} onChange={setTaxEnabled} />
                </SettingRow>
                {taxEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className={labelClass}>Tax Rate (%)</label>
                      <div className="relative">
                        <input type="number" min={0} max={100} step={0.1} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={cn(inputClass, "pr-10")} />
                        <Percent size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Tax Label</label>
                      <input type="text" defaultValue="VAT" className={inputClass} />
                    </div>
                  </div>
                )}
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Discounts & Promotions</h2>
                <SettingRow label="Allow Discounts" description="Cashiers can apply discounts at checkout">
                  <Toggle enabled={discountEnabled} onChange={setDiscountEnabled} />
                </SettingRow>
                {discountEnabled && (
                  <div>
                    <label className={labelClass}>Maximum Discount Allowed (%)</label>
                    <div className="relative max-w-xs">
                      <input type="number" min={0} max={100} value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} className={cn(inputClass, "pr-10")} />
                      <Percent size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1.5">Discounts above this limit require manager approval.</p>
                  </div>
                )}
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>POS Behaviour</h2>
                <SettingRow label="Barcode Scanner Support" description="Enable USB/Bluetooth barcode scanner input">
                  <Toggle enabled={barcodeScanner} onChange={setBarcodeScanner} />
                </SettingRow>
                <SettingRow label="Auto-Round Cash Transactions" description="Round to nearest denomination">
                  <Toggle enabled={autoRoundCash} onChange={setAutoRoundCash} />
                </SettingRow>
                <SettingRow label="Require Manager PIN for Voids" description="Manager must approve voided transactions">
                  <Toggle enabled={requirePin} onChange={setRequirePin} />
                </SettingRow>
                <div className="pt-2">
                  <label className={labelClass}>Default Low Stock Alert Threshold</label>
                  <input type="number" min={1} value={lowStockDefault} onChange={(e) => setLowStockDefault(e.target.value)} className={cn(inputClass, "max-w-xs")} />
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">Alert when stock falls to or below this number of units.</p>
                </div>
              </div>
            </>
          )}

          {/* ── APPEARANCE ────────────────────────────────────────────── */}
          {activeTab === "appearance" && (
            <>
              <div className={cardClass}>
                <h2 className={sectionTitle}>Theme</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "light", label: "Light", icon: Sun },
                    { id: "dark", label: "Dark", icon: Moon },
                    { id: "system", label: "System", icon: Monitor },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        if (id === "light" && theme === "dark") toggleTheme();
                        else if (id === "dark" && theme === "light") toggleTheme();
                        // "system" just reflects current theme visually
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all",
                        (id === theme || (id === "system" && false))
                          ? "border-[var(--color-pos-accent)] bg-[var(--color-pos-accent-soft)] text-[var(--color-pos-accent-strong)]"
                          : "border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-muted)] hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <Icon size={22} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Accent Color</h2>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Amber (Default)", color: "#f59e0b" },
                    { label: "Blue", color: "#3b82f6" },
                    { label: "Emerald", color: "#10b981" },
                    { label: "Violet", color: "#8b5cf6" },
                    { label: "Rose", color: "#f43f5e" },
                    { label: "Orange", color: "#f97316" },
                  ].map(({ label, color }) => (
                    <div key={color} title={label} className="w-9 h-9 rounded-xl cursor-pointer border-2 border-white dark:border-gray-700 shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)]">Select an accent color for buttons, highlights, and interactive elements.</p>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Display</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Date Format</label>
                    <div className="relative">
                      <select className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}>
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Time Format</label>
                    <div className="relative">
                      <select className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}>
                        <option>12-hour (AM/PM)</option>
                        <option>24-hour</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── RECEIPT ───────────────────────────────────────────────── */}
          {activeTab === "receipt" && (
            <>
              <div className={cardClass}>
                <h2 className={sectionTitle}>Receipt Content</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Receipt Header Message</label>
                    <input type="text" value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} className={inputClass} placeholder="Message shown at top of receipt" />
                  </div>
                  <div>
                    <label className={labelClass}>Receipt Footer Message</label>
                    <input type="text" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} className={inputClass} placeholder="Message shown at bottom of receipt" />
                  </div>
                </div>
                <SettingRow label="Show Store Logo" description="Display logo at top of printed receipt">
                  <Toggle enabled={showLogo} onChange={setShowLogo} />
                </SettingRow>
                <SettingRow label="Show Barcode on Receipt" description="Print a scannable barcode for easy lookup">
                  <Toggle enabled={showBarcode} onChange={setShowBarcode} />
                </SettingRow>
                <SettingRow label="Show Tax Breakdown" description="List tax amount separately on receipt">
                  <Toggle enabled={showTaxBreakdown} onChange={setShowTaxBreakdown} />
                </SettingRow>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Printing</h2>
                <SettingRow label="Auto-Print After Sale" description="Automatically print receipt when sale is completed">
                  <Toggle enabled={autoPrint} onChange={setAutoPrint} />
                </SettingRow>
                <SettingRow label="Email Receipt to Customer" description="Offer to email receipt if customer details are captured">
                  <Toggle enabled={emailReceipt} onChange={setEmailReceipt} />
                </SettingRow>
                <div className="pt-2">
                  <label className={labelClass}>Thermal Printer Paper Width</label>
                  <div className="flex gap-3">
                    {["58mm", "80mm"].map((s) => (
                      <button key={s} onClick={() => setPaperSize(s)} className={cn("px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all", paperSize === s ? "border-[var(--color-pos-accent)] bg-[var(--color-pos-accent-soft)] text-[var(--color-pos-accent-strong)]" : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-gray-300")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── PAYMENTS ──────────────────────────────────────────────── */}
          {activeTab === "payments" && (
            <>
              <div className={cardClass}>
                <h2 className={sectionTitle}>Accepted Payment Methods</h2>
                <SettingRow label="Cash" description="Accept physical cash payments">
                  <Toggle enabled={acceptCash} onChange={setAcceptCash} />
                </SettingRow>
                <SettingRow label="Card (Credit / Debit)" description="Accept card payments via POS terminal">
                  <Toggle enabled={acceptCard} onChange={setAcceptCard} />
                </SettingRow>
                <SettingRow label="Mobile Money" description="Accept MTN MoMo, Telecel Cash, AirtelTigo Money">
                  <Toggle enabled={acceptMobileMoney} onChange={setAcceptMobileMoney} />
                </SettingRow>
                <div className="pt-2">
                  <label className={labelClass}>Default Payment Method</label>
                  <div className="relative max-w-xs">
                    <select value={defaultPayment} onChange={(e) => setDefaultPayment(e.target.value)} className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}>
                      {acceptCash && <option value="Cash">Cash</option>}
                      {acceptCard && <option value="Card">Card</option>}
                      {acceptMobileMoney && <option value="Mobile Money">Mobile Money</option>}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Advanced Payment Options</h2>
                <SettingRow label="Split Payments" description="Allow customers to pay with multiple methods">
                  <Toggle enabled={splitPayment} onChange={setSplitPayment} />
                </SettingRow>
                <SettingRow label="Enable Tips" description="Allow cashiers to add tip amounts">
                  <Toggle enabled={tipsEnabled} onChange={setTipsEnabled} />
                </SettingRow>
                {tipsEnabled && (
                  <div className="pt-2">
                    <label className={labelClass}>Suggested Tip Percentages (comma-separated)</label>
                    <input type="text" value={tipPercents} onChange={(e) => setTipPercents(e.target.value)} className={cn(inputClass, "max-w-xs")} placeholder="e.g. 10,15,20" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SECURITY ──────────────────────────────────────────────── */}
          {activeTab === "security" && (
            <>
              <div className={cardClass}>
                <h2 className={sectionTitle}>Change Password</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <div className="relative">
                      <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={cn(inputClass, "pr-12")} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] p-1">
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative">
                      <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={cn(inputClass, "pr-12")} placeholder="Min. 8 characters" />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] p-1">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Re-enter new password" />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] transition-colors">
                    <KeyRound size={15} />Update Password
                  </button>
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Access Control</h2>
                <SettingRow label="Two-Factor Authentication" description="Require a code from your authenticator app on login">
                  <Toggle enabled={twoFactor} onChange={setTwoFactor} />
                </SettingRow>
                <SettingRow label="POS PIN Lock" description="Lock POS screen after idle period, require PIN to unlock">
                  <Toggle enabled={pinLock} onChange={setPinLock} />
                </SettingRow>
                {pinLock && (
                  <div className="pt-2 max-w-xs">
                    <label className={labelClass}>Set POS PIN (4–6 digits)</label>
                    <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} className={inputClass} placeholder="Enter PIN" />
                  </div>
                )}
                <div className="pt-2 max-w-xs">
                  <label className={labelClass}>Session Timeout (minutes)</label>
                  <input type="number" min={5} max={480} value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className={inputClass} />
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">Auto-logout after this period of inactivity.</p>
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Recent Login Activity</h2>
                <div className="space-y-3">
                  {[
                    { device: "Chrome · macOS", time: "2026-04-22 14:32", location: "Accra, GH", current: true },
                    { device: "Safari · iPhone", time: "2026-04-21 09:15", location: "Accra, GH", current: false },
                    { device: "Chrome · Windows", time: "2026-04-18 18:44", location: "London, UK", current: false },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-color)] flex items-center gap-2">
                          {session.device}
                          {session.current && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">Current</span>}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{session.time} · {session.location}</div>
                      </div>
                      {!session.current && <button className="text-xs text-red-500 hover:underline font-medium">Revoke</button>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── NOTIFICATIONS ─────────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <>
              <div className={cardClass}>
                <h2 className={sectionTitle}>Notification Channels</h2>
                <SettingRow label="Email Notifications" description="Receive alerts to your registered email">
                  <Toggle enabled={notifyEmail} onChange={setNotifyEmail} />
                </SettingRow>
                <SettingRow label="SMS Notifications" description="Receive text messages for critical alerts">
                  <Toggle enabled={notifySMS} onChange={setNotifySMS} />
                </SettingRow>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Inventory Alerts</h2>
                <SettingRow label="Low Stock Alert" description="Notify when a product reaches its low stock threshold">
                  <Toggle enabled={notifyLowStock} onChange={setNotifyLowStock} />
                </SettingRow>
                <SettingRow label="Out of Stock Alert" description="Immediate alert when an item runs out">
                  <Toggle enabled={notifyLowStock} onChange={setNotifyLowStock} />
                </SettingRow>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Sales Notifications</h2>
                <SettingRow label="New Sale Notification" description="Alert for every completed sale (high volume = lots of pings)">
                  <Toggle enabled={notifyNewSale} onChange={setNotifyNewSale} />
                </SettingRow>
                <SettingRow label="Refund / Void Alerts" description="Notify when a transaction is refunded or voided">
                  <Toggle enabled={notifyRefunds} onChange={setNotifyRefunds} />
                </SettingRow>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Reports & Summaries</h2>
                <SettingRow label="Daily Sales Summary" description="End-of-day summary of total revenue and transactions">
                  <Toggle enabled={notifyDailySummary} onChange={setNotifyDailySummary} />
                </SettingRow>
                {notifyDailySummary && (
                  <div className="max-w-xs pt-2">
                    <label className={labelClass}>Send Summary At</label>
                    <input type="time" value={summaryTime} onChange={(e) => setSummaryTime(e.target.value)} className={inputClass} />
                  </div>
                )}
                <SettingRow label="Weekly Performance Report" description="Summary of the week's performance every Monday morning">
                  <Toggle enabled={notifyWeeklyReport} onChange={setNotifyWeeklyReport} />
                </SettingRow>
              </div>
            </>
          )}

          {/* ── DATA & BACKUP ─────────────────────────────────────────── */}
          {activeTab === "data" && (
            <>
              <div className={cardClass}>
                <h2 className={sectionTitle}>Export Data</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Export All Sales (CSV)", icon: Download, desc: "All transactions as a spreadsheet" },
                    { label: "Export Inventory (CSV)", icon: Download, desc: "Full product catalogue" },
                    { label: "Export Staff List (CSV)", icon: Download, desc: "All staff records" },
                    { label: "Export Receipts (PDF)", icon: Download, desc: "All receipts in PDF format" },
                  ].map(({ label, icon: Icon, desc }, i) => (
                    <button key={i} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] hover:border-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-soft)] transition-all text-left group">
                      <div className="w-9 h-9 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-center group-hover:bg-[var(--color-pos-accent)] group-hover:border-[var(--color-pos-accent)] transition-all">
                        <Icon size={16} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--text-color)]">{label}</div>
                        <div className="text-xs text-[var(--text-muted)]">{desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitle}>Backup & Restore</h2>
                <SettingRow label="Automatic Daily Backups" description="Backup all data to cloud storage daily">
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingRow>
                <div className="pt-2">
                  <label className={labelClass}>Backup Time</label>
                  <input type="time" defaultValue="03:00" className={cn(inputClass, "max-w-xs")} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-color)] transition-colors">
                    <RefreshCw size={15} />Create Manual Backup Now
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-color)] transition-colors">
                    <Upload size={15} />Restore from Backup
                  </button>
                </div>
              </div>

              <div className={cardClass}>
                <h2 className="text-base font-semibold text-red-500 mb-4 pb-3 border-b border-[var(--border-color)]">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                    <div>
                      <div className="text-sm font-semibold text-red-700 dark:text-red-400">Clear All Transaction History</div>
                      <div className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">Permanently delete all receipts and transaction records. This cannot be undone.</div>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shrink-0 ml-4">Clear Data</button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                    <div>
                      <div className="text-sm font-semibold text-red-700 dark:text-red-400">Reset to Factory Defaults</div>
                      <div className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">Reset all settings to default. Your data will not be deleted.</div>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shrink-0 ml-4">Reset Settings</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          {activeTab !== "data" && (
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--border-color)] transition-colors border border-[var(--border-color)]">
                Cancel
              </button>
              <button type="button" onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] transition-colors shadow-sm">
                <Save size={15} />Save Changes
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}