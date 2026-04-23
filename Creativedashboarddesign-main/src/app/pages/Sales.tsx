import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, Smartphone,
  CheckCircle2, AlertTriangle, X, UserPlus, User, ChevronRight, PackageSearch
} from "lucide-react";
import { useCart, Product } from "../context/CartContext";
import { cn } from "../utils/cn";
import { MOCK_CUSTOMERS, Customer } from "../data/customers";

// ─────────────────────────────────────────────────────────────
// Mock Product Data
// ─────────────────────────────────────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Pumpkin Pasties",       price: 5.50,   category: "Snacks",    stock: 45  },
  { id: "2", name: "Butterbeer (Draft)",    price: 8.00,   category: "Beverages", stock: 120 },
  { id: "3", name: "Chocolate Frogs",       price: 6.50,   category: "Sweets",    stock: 30  },
  { id: "4", name: "Every Flavour Beans",  price: 4.00,   category: "Sweets",    stock: 65  },
  { id: "5", name: "Licorice Wands",        price: 3.50,   category: "Sweets",    stock: 12  },
  { id: "6", name: "Cauldron Cakes",        price: 7.00,   category: "Snacks",    stock: 8   },
  { id: "7", name: "Gillywater",            price: 3.00,   category: "Beverages", stock: 0   },
  { id: "8", name: "Exploding Bonbons",     price: 5.00,   category: "Sweets",    stock: 22  },
  { id: "9", name: "Felix Felicis (Vial)",  price: 150.00, category: "Potions",   stock: 2   },
];
const LOW_STOCK_THRESHOLD = 10;
const CATEGORIES = ["All", "Snacks", "Beverages", "Sweets", "Potions"];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type CheckoutStep = "cart" | "payment" | "success";
type PaymentMethod = "cash" | "momo" | "ussd" | "card";
type CustomerSelection = Customer | "walkin";

interface StockRequest {
  product: Product;
  qty: string;
  note: string;
  sent: boolean;
}

// ─────────────────────────────────────────────────────────────
// Shared input style
// ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-sm text-[var(--text-color)] placeholder-[var(--text-muted)]";

// ─────────────────────────────────────────────────────────────
// Stock Request Modal
// ─────────────────────────────────────────────────────────────
function StockRequestModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [qty, setQty] = useState("10");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!qty || Number(qty) <= 0) return;
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] shadow-xl animate-in zoom-in-95 duration-200">
        {!sent ? (
          <>
            <div className="flex items-start justify-between p-5 pb-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="font-semibold text-[var(--text-color)]">Request Stock Adjustment</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{product.name}</p>
              </div>
              <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors rounded-lg hover:bg-[var(--border-color)]">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Current stock badge */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
                product.stock === 0
                  ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                  : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
              )}>
                <AlertTriangle size={15} />
                {product.stock === 0
                  ? "Out of stock — no units available"
                  : `Low stock — only ${product.stock} units remaining`}
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Quantity Requested *
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Notes / Reason <span className="text-[var(--text-muted)] normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={cn(inputCls, "resize-none")}
                  placeholder="e.g. Selling fast, need before weekend..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--border-color)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!qty || Number(qty) <= 0}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] disabled:opacity-50 transition-colors shadow-sm"
                >
                  Send Request
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-semibold text-[var(--text-color)] mb-1">Request Sent!</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Your restock request for <strong>{product.name}</strong> ({qty} units) has been sent to the manager.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Customer Picker (used inside payment step)
// ─────────────────────────────────────────────────────────────
function CustomerPicker({
  selected,
  onSelect,
  customers,
  onNewCustomer,
}: {
  selected: CustomerSelection;
  onSelect: (c: CustomerSelection) => void;
  customers: Customer[];
  onNewCustomer: (phone?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().replace(/\s/g, "");
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.replace(/\s/g, "").includes(q)
      )
      .slice(0, 5);
  }, [query, customers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (c: Customer) => {
    onSelect(c);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onSelect("walkin");
    setQuery("");
    setOpen(false);
  };

  // ── Selected customer view ──
  if (selected !== "walkin") {
    const c = selected as Customer;
    return (
      <div className="rounded-xl bg-[var(--color-pos-accent-soft)] border border-[var(--color-pos-accent)] p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--color-pos-accent)] text-white flex items-center justify-center font-semibold text-sm shrink-0">
          {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-[var(--color-pos-accent-strong)]">{c.name}</div>
          <div className="text-xs text-[var(--text-muted)] truncate">{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
        </div>
        <button
          onClick={handleClear}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
          title="Remove customer"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  // ── Search + Walk-in view ──
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Search input with dropdown */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search name or phone..."
            className={cn(inputCls, "pl-8 pr-8 text-xs py-2")}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
            >
              <X size={13} />
            </button>
          )}

          {/* Suggestions dropdown */}
          {open && query.trim() && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {suggestions.length > 0 ? (
                <>
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      onMouseDown={() => handleSelect(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-color)] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-[var(--color-pos-accent)] text-white flex items-center justify-center font-semibold text-[11px] shrink-0">
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--text-color)] truncate">{c.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{c.phone}</div>
                      </div>
                      <ChevronRight size={13} className="text-[var(--text-muted)] shrink-0" />
                    </button>
                  ))}
                  <div className="border-t border-[var(--border-color)]">
                    <button
                      onMouseDown={() => { setOpen(false); onNewCustomer(query); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[var(--color-pos-accent-strong)] hover:bg-[var(--color-pos-accent-soft)] transition-colors text-sm font-medium"
                    >
                      <UserPlus size={14} />
                      Create new customer
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-3 py-2">
                  <p className="text-xs text-[var(--text-muted)] mb-2">No customer found for "{query}"</p>
                  <button
                    onMouseDown={() => { setOpen(false); onNewCustomer(query); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-pos-accent-strong)] bg-[var(--color-pos-accent-soft)] hover:bg-[var(--color-pos-accent)] hover:text-white transition-colors text-sm font-medium"
                  >
                    <UserPlus size={14} />
                    Create new customer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* +New button */}
        <button
          onClick={() => onNewCustomer()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--color-pos-accent-strong)] hover:border-[var(--color-pos-accent)] transition-colors whitespace-nowrap"
        >
          <UserPlus size={13} />
          New
        </button>
      </div>

      {/* Walk-in default badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[var(--border-color)] text-xs text-[var(--text-muted)]">
        <User size={13} className="shrink-0" />
        <span>Walk-in Customer <span className="text-[10px] ml-1 bg-[var(--border-color)] px-1.5 py-0.5 rounded-full font-medium text-[var(--text-color)]">default</span></span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// New Customer Mini-Form
// ─────────────────────────────────────────────────────────────
function NewCustomerForm({
  prefill,
  onSave,
  onCancel,
}: {
  prefill?: string;
  onSave: (c: Omit<Customer, "id" | "totalSpent" | "totalOrders" | "joinedAt">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(prefill ?? "");
  const [email, setEmail] = useState("");

  const valid = name.trim().length > 0 && phone.trim().length >= 10;

  return (
    <div className="rounded-xl border-2 border-[var(--color-pos-accent)] bg-[var(--color-pos-accent-soft)] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pos-accent-strong)]">New Customer</span>
        <button onClick={onCancel} className="text-[var(--text-muted)] hover:text-[var(--text-color)] p-0.5 rounded-md hover:bg-[var(--border-color)] transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Full Name *</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ama Asante"
            className={cn(inputCls, "py-2 text-xs")}
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Phone Number *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024 XXX XXXX"
            className={cn(inputCls, "py-2 text-xs font-mono")}
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">Email <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@email.com"
            className={cn(inputCls, "py-2 text-xs")}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--text-muted)] border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--border-color)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => valid && onSave({ name: name.trim(), phone: phone.trim(), email: email.trim() })}
          disabled={!valid}
          className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] disabled:opacity-50 transition-colors"
        >
          Save & Attach to Sale
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Sales Page
// ─────────────────────────────────────────────────────────────
export default function Sales() {
  const { items, addItem, updateQuantity, removeItem, clearCart, subtotal, tax, total } = useCart();

  // Product catalog state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [stockRequestProduct, setStockRequestProduct] = useState<Product | null>(null);

  // Checkout flow
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState<string>("");

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([...MOCK_CUSTOMERS]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSelection>("walkin");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerPrefill, setNewCustomerPrefill] = useState<string | undefined>();

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchTerm, activeCategory]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    setCheckoutStep("payment");
  };

  const handleCompleteSale = () => {
    setCheckoutStep("success");
  };

  const handleNewOrder = () => {
    clearCart();
    setCheckoutStep("cart");
    setSearchTerm("");
    setAmountTendered("");
    setSelectedCustomer("walkin");
    setShowNewCustomerForm(false);
  };

  const handleOpenNewCustomerForm = (prefill?: string) => {
    // If prefill looks like a phone, use it; otherwise leave blank
    const looksLikePhone = prefill && /^[0-9+\s-]{7,}$/.test(prefill.replace(/\s/g, ""));
    setNewCustomerPrefill(looksLikePhone ? prefill : undefined);
    setShowNewCustomerForm(true);
  };

  const handleSaveNewCustomer = (data: Omit<Customer, "id" | "totalSpent" | "totalOrders" | "joinedAt">) => {
    const newCustomer: Customer = {
      ...data,
      id: `c-${Date.now()}`,
      totalSpent: 0,
      totalOrders: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    setSelectedCustomer(newCustomer);
    setShowNewCustomerForm(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[var(--bg-color)]">

      {/* Stock Request Modal */}
      {stockRequestProduct && (
        <StockRequestModal
          product={stockRequestProduct}
          onClose={() => setStockRequestProduct(null)}
        />
      )}

      {/* ─── Left Panel: Catalog ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-[var(--border-color)]">
        {/* Search & Filter */}
        <div className="p-4 md:p-6 bg-[var(--surface-color)] border-b border-[var(--border-color)] z-10 space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)] placeholder-[var(--text-muted)]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-[var(--color-pos-accent-strong)] text-white shadow-md shadow-amber-500/20"
                    : "bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--color-pos-accent)] hover:text-[var(--text-color)]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg-color)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-24 lg:pb-0">
            {filteredProducts.map((product) => {
              const isOut = product.stock === 0;
              const isLow = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
              const canRequest = isOut || isLow;
              return (
                <div
                  key={product.id}
                  className={cn(
                    "bento-card flex flex-col p-4 transition-all duration-200 group relative",
                    isOut ? "opacity-60 grayscale" : "hover:border-[var(--color-pos-accent)] cursor-pointer"
                  )}
                  onClick={() => !isOut && addItem(product)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-color)] rounded-md border border-[var(--border-color)]">
                      {product.category}
                    </span>
                    {isLow && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Low stock" />
                    )}
                    {isOut && (
                      <span className="w-2 h-2 rounded-full bg-red-500" title="Out of stock" />
                    )}
                  </div>

                  <h3 className="font-semibold text-[var(--text-color)] text-sm mb-1 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>

                  <div className="mt-auto pt-3 flex items-end justify-between">
                    <span className="font-mono font-bold text-lg text-[var(--color-pos-accent-strong)]">
                      ₵{product.price.toFixed(2)}
                    </span>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-md",
                      isOut
                        ? "bg-red-50 text-red-600 dark:bg-red-500/10"
                        : isLow
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10"
                          : "bg-[var(--bg-color)] text-[var(--text-muted)]"
                    )}>
                      {isOut ? "Out" : `${product.stock} left`}
                    </span>
                  </div>

                  {/* Request Restock button */}
                  {canRequest && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setStockRequestProduct(product); }}
                      className={cn(
                        "mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                        isOut
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                      )}
                    >
                      <PackageSearch size={12} />
                      Request Restock
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Cart / Payment / Success ─── */}
      <div className={cn(
        "w-full lg:w-[400px] flex flex-col h-full bg-[var(--surface-color)] border-l border-[var(--border-color)] absolute lg:relative z-20 transition-transform duration-300 ease-in-out",
        checkoutStep !== "cart" ? "translate-x-0" : "translate-y-full lg:translate-y-0"
      )}>

        {/* Panel Header */}
        <div className="h-[60px] flex items-center justify-between px-6 border-b border-[var(--border-color)] flex-shrink-0">
          <h2 className="font-semibold text-lg text-[var(--text-color)]">
            {checkoutStep === "cart" && "Current Order"}
            {checkoutStep === "payment" && "Checkout"}
            {checkoutStep === "success" && "Receipt"}
          </h2>
          {checkoutStep === "payment" && (
            <button onClick={() => setCheckoutStep("cart")} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)]">
              ← Back
            </button>
          )}
          {checkoutStep === "cart" && items.length > 0 && (
            <button onClick={clearCart} className="text-sm font-medium text-red-500 hover:text-red-700">
              Clear
            </button>
          )}
        </div>

        {/* ── Cart View ── */}
        {checkoutStep === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--surface-color)]">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag size={48} className="mb-4 text-[var(--text-muted)]" />
                  <p className="text-lg font-medium text-[var(--text-color)]">Cart is empty</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Search or click products to add</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col p-4 rounded-2xl bg-[var(--bg-color)] border border-[var(--border-color)] group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-2">
                          <h4 className="font-medium text-sm text-[var(--text-color)] leading-tight">{item.name}</h4>
                          <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">₵{item.price.toFixed(2)}</div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-[var(--surface-color)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-sm">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-[var(--text-color)] hover:bg-[var(--border-color)] transition-colors">
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium text-sm font-mono">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-[var(--text-color)] hover:bg-[var(--border-color)] transition-colors">
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="font-mono font-bold text-[var(--text-color)]">₵{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-6 bg-[var(--bg-color)] border-t border-[var(--border-color)] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>Subtotal</span>
                  <span className="font-mono">₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>Tax (7.5%)</span>
                  <span className="font-mono">₵{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-[var(--text-color)] pt-3 border-t border-[var(--border-color)]">
                  <span>Total</span>
                  <span className="font-mono text-[var(--color-pos-accent-strong)]">₵{total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full py-4 rounded-xl bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all active:scale-[0.98] flex justify-between items-center px-6"
              >
                <span>Checkout</span>
                <span className="font-mono bg-white/20 px-3 py-1 rounded-lg">₵{total.toFixed(2)}</span>
              </button>
            </div>
          </>
        )}

        {/* ── Payment View ── */}
        {checkoutStep === "payment" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 bg-[var(--bg-color)] space-y-5">

              {/* Amount Due */}
              <div className="text-center py-2">
                <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Amount Due</div>
                <div className="text-4xl font-bold font-mono text-[var(--color-pos-accent-strong)] tracking-tight">
                  ₵{total.toFixed(2)}
                </div>
              </div>

              {/* ── Customer Section ── */}
              <div className="bento-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <User size={13} />
                  Customer
                </div>

                {showNewCustomerForm ? (
                  <NewCustomerForm
                    prefill={newCustomerPrefill}
                    onSave={handleSaveNewCustomer}
                    onCancel={() => setShowNewCustomerForm(false)}
                  />
                ) : (
                  <CustomerPicker
                    selected={selectedCustomer}
                    onSelect={setSelectedCustomer}
                    customers={customers}
                    onNewCustomer={(phone) => {
                      setNewCustomerPrefill(phone && /^[0-9+\s-]{7,}$/.test(phone.replace(/\s/g, "")) ? phone : undefined);
                      setShowNewCustomerForm(true);
                    }}
                  />
                )}
              </div>

              {/* ── Payment Method ── */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Payment Method</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    { id: "cash",  label: "Cash",  Icon: Banknote   },
                    { id: "momo",  label: "MoMo",  Icon: Smartphone },
                    { id: "ussd",  label: "USSD",  Icon: Smartphone },
                    { id: "card",  label: "Card",  Icon: CreditCard },
                  ] as const).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all gap-2",
                        paymentMethod === id
                          ? "border-[var(--color-pos-accent)] bg-[var(--color-pos-accent-soft)] text-[var(--color-pos-accent-strong)]"
                          : "border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-muted)]"
                      )}
                    >
                      <Icon size={22} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {paymentMethod === "cash" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Amount Tendered</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono">₵</span>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      className="w-full pl-8 py-3 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] text-xl font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)]"
                      placeholder={total.toFixed(2)}
                    />
                  </div>
                  {Number(amountTendered) >= total && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex justify-between font-medium animate-in fade-in">
                      <span>Change due:</span>
                      <span className="font-mono text-lg font-bold">₵{(Number(amountTendered) - total).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* MoMo input */}
              {paymentMethod === "momo" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Customer Phone</label>
                  <input
                    type="tel"
                    defaultValue={selectedCustomer !== "walkin" ? (selectedCustomer as Customer).phone : ""}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] font-mono text-lg"
                    placeholder="024 XXX XXXX"
                  />
                </div>
              )}
            </div>

            <div className="p-5 bg-[var(--bg-color)] border-t border-[var(--border-color)]">
              <button
                onClick={handleCompleteSale}
                className="w-full py-4 rounded-xl bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] text-white font-semibold text-lg shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all active:scale-[0.98]"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}

        {/* ── Success View ── */}
        {checkoutStep === "success" && (
          <div className="flex flex-col h-full justify-center p-6 bg-[var(--bg-color)] text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 mx-auto bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-color)] mb-1">Payment Successful</h2>
            {selectedCustomer !== "walkin" && (
              <p className="text-sm text-[var(--text-muted)] mb-2">
                Charged to <strong>{(selectedCustomer as Customer).name}</strong>
              </p>
            )}
            <p className="text-[var(--text-muted)] mb-8 font-mono text-sm">
              #{`RC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000).toString().padStart(4, "0")}`}
            </p>
            <div className="space-y-3 max-w-[250px] mx-auto w-full">
              <button onClick={handleNewOrder} className="w-full py-3.5 rounded-xl bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] text-white font-semibold text-lg shadow-md transition-all active:scale-[0.98]">
                New Order
              </button>
              <button className="w-full py-3.5 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] font-medium text-lg hover:bg-[var(--border-color)] transition-all">
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cart Toggle */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-[var(--surface-color)] border-t border-[var(--border-color)] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-30">
        <button
          onClick={() => checkoutStep === "cart" && items.length > 0 ? setCheckoutStep("payment") : setCheckoutStep("cart")}
          className="w-full py-4 rounded-xl bg-[var(--color-pos-accent)] text-white font-semibold text-lg flex justify-between items-center px-6 shadow-[0_4px_14px_0_rgba(245,158,11,0.39)]"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <span>{checkoutStep === "cart" ? "View Cart" : "Back to Cart"}</span>
          </div>
          <span className="font-mono bg-white/20 px-3 py-1 rounded-lg">₵{total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}
