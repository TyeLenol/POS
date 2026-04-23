import React, { useState, useMemo } from "react";
import {
  Search, Users, ShoppingBag, TrendingUp, ChevronDown,
  ChevronUp, X, Clock, CreditCard, Banknote, Smartphone,
  Mail, Phone, Calendar, History, UserPlus, Receipt,
  ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  MOCK_CUSTOMERS,
  MOCK_CUSTOMER_RECEIPTS,
  Customer,
  CustomerReceipt,
} from "../data/customers";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function paymentIcon(method: string) {
  if (method === "Cash") return <Banknote size={13} />;
  if (method === "Card") return <CreditCard size={13} />;
  return <Smartphone size={13} />;
}

function formatDate(str: string) {
  const d = new Date(str.replace(" ", "T"));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    "  " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const avatarColors = [
  "from-amber-400 to-amber-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-sky-400 to-sky-600",
  "from-rose-400 to-rose-600",
  "from-orange-400 to-orange-600",
  "from-teal-400 to-teal-600",
  "from-indigo-400 to-indigo-600",
];

// ─────────────────────────────────────────────────────────────
// Receipt Row (collapsible)
// ─────────────────────────────────────────────────────────────
function ReceiptRow({ receipt }: { receipt: CustomerReceipt }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-colors",
      open
        ? "border-[var(--color-pos-accent)] bg-[var(--color-pos-accent-soft)]"
        : "border-[var(--border-color)] bg-[var(--bg-color)] hover:border-[var(--color-pos-accent)]"
    )}>
      {/* Collapsed header – always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className={cn(
          "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center",
          open
            ? "bg-[var(--color-pos-accent)] text-white"
            : "bg-[var(--surface-color)] text-[var(--text-muted)] border border-[var(--border-color)]"
        )}>
          <Receipt size={14} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--text-color)] font-mono">{receipt.id}</span>
            <span className={cn(
              "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
              "bg-[var(--surface-color)] text-[var(--text-muted)] border border-[var(--border-color)]"
            )}>
              {paymentIcon(receipt.paymentMethod)}
              {receipt.paymentMethod}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-muted)]">
            <Clock size={11} />
            <span>{formatDate(receipt.date)}</span>
            <span>·</span>
            <span>{receipt.items.length} item{receipt.items.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="font-mono font-bold text-[var(--color-pos-accent-strong)]">
            ₵{receipt.total.toFixed(2)}
          </span>
          {open ? (
            <ChevronUp size={16} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronDown size={16} className="text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="border-t border-[var(--color-pos-accent)]/20 pt-3 space-y-2">
            {/* Items */}
            {receipt.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[var(--text-color)]">
                  <span className="w-5 h-5 rounded-md bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--text-muted)]">
                    {item.qty}
                  </span>
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                  <span className="font-mono text-xs">@ ₵{item.price.toFixed(2)}</span>
                  <span className="font-mono font-semibold text-[var(--text-color)] min-w-[60px] text-right">
                    ₵{(item.qty * item.price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="pt-2 mt-1 border-t border-[var(--color-pos-accent)]/20 space-y-1">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Subtotal</span>
                <span className="font-mono">₵{receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Tax (7.5%)</span>
                <span className="font-mono">₵{receipt.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[var(--text-color)] pt-1">
                <span>Total</span>
                <span className="font-mono text-[var(--color-pos-accent-strong)]">₵{receipt.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Purchase History Modal
// ─────────────────────────────────────────────────────────────
function HistoryModal({
  customer,
  receipts,
  onClose,
}: {
  customer: Customer;
  receipts: CustomerReceipt[];
  onClose: () => void;
}) {
  const sorted = [...receipts].sort(
    (a, b) => new Date(b.date.replace(" ", "T")).getTime() - new Date(a.date.replace(" ", "T")).getTime()
  );

  const colorIdx = parseInt(customer.id.replace(/\D/g, ""), 10) % avatarColors.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center gap-4 p-5 border-b border-[var(--border-color)] bg-[var(--surface-color)]">
          <div className={cn(
            "w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-base shadow-sm",
            avatarColors[colorIdx]
          )}>
            {initials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg text-[var(--text-color)] leading-tight">{customer.name}</h2>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1"><Phone size={11} />{customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail size={11} />{customer.email}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--border-color)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 divide-x divide-[var(--border-color)] border-b border-[var(--border-color)] bg-[var(--bg-color)]">
          <div className="flex flex-col items-center py-3 px-4">
            <span className="font-mono font-bold text-lg text-[var(--color-pos-accent-strong)]">
              {sorted.length}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Receipts</span>
          </div>
          <div className="flex flex-col items-center py-3 px-4">
            <span className="font-mono font-bold text-lg text-[var(--text-color)]">
              ₵{receipts.reduce((s, r) => s + r.total, 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Total Spent</span>
          </div>
          <div className="flex flex-col items-center py-3 px-4">
            <span className="font-mono font-bold text-lg text-[var(--text-color)]">
              ₵{receipts.length > 0 ? (receipts.reduce((s, r) => s + r.total, 0) / receipts.length).toFixed(2) : "0.00"}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Avg. Order</span>
          </div>
        </div>

        {/* Receipt list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
              <ShoppingBag size={36} className="mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-color)] font-medium">No purchase history yet</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">This customer hasn't made any purchases.</p>
            </div>
          ) : (
            sorted.map((r) => <ReceiptRow key={r.id} receipt={r} />)
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Customers Page
// ─────────────────────────────────────────────────────────────
export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([...MOCK_CUSTOMERS]);
  const [search, setSearch] = useState("");
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Sort state
  type SortField = "name" | "orders" | "totalSpent";
  type SortDir   = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir,   setSortDir]   = useState<SortDir>("asc");

  // Add-customer form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = q
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q)
        )
      : [...customers];

    return base.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortField === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === "orders") {
        aVal = MOCK_CUSTOMER_RECEIPTS.filter((r) => r.customerId === a.id).length;
        bVal = MOCK_CUSTOMER_RECEIPTS.filter((r) => r.customerId === b.id).length;
      } else {
        aVal = a.totalSpent;
        bVal = b.totalSpent;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [search, customers, sortField, sortDir]);

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgOrderValue = totalRevenue / customers.reduce((s, c) => s + c.totalOrders, 1);

  const historyReceipts = historyCustomer
    ? MOCK_CUSTOMER_RECEIPTS.filter((r) => r.customerId === historyCustomer.id)
    : [];

  const handleAddCustomer = () => {
    if (!newName.trim() || newPhone.trim().length < 10) return;
    const c: Customer = {
      id: `c-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      totalSpent: 0,
      totalOrders: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setCustomers((prev) => [c, ...prev]);
    setNewName(""); setNewPhone(""); setNewEmail("");
    setShowAddForm(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

      {/* History modal */}
      {historyCustomer && (
        <HistoryModal
          customer={historyCustomer}
          receipts={historyReceipts}
          onClose={() => setHistoryCustomer(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] tracking-tight">Customers</h1>
          <p className="text-[var(--text-muted)] text-sm">{totalCustomers} registered customers</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <div className="bento-card p-5 animate-in fade-in slide-in-from-top-2 duration-200 border-2 border-[var(--color-pos-accent)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-color)]">New Customer</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--border-color)] transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Full Name *</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ama Asante" className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-sm text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Phone Number *</label>
              <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="024 XXX XXXX" className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-sm text-[var(--text-color)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Email <span className="font-normal">(optional)</span></label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="customer@email.com" className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-sm text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--border-color)] transition-colors">Cancel</button>
            <button onClick={handleAddCustomer} disabled={!newName.trim() || newPhone.trim().length < 10} className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] disabled:opacity-50 transition-colors shadow-sm">
              Save Customer
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: totalCustomers.toString(), icon: Users, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
          { label: "Total Revenue",   value: `₵${totalRevenue.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Avg. Order Value", value: `₵${avgOrderValue.toFixed(2)}`, icon: ShoppingBag, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bento-card p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", bg)}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-sm">{label}</p>
              <p className="font-bold text-xl text-[var(--text-color)] font-mono leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Table */}
      <div className="bento-card overflow-hidden">

        {/* ── Toolbar: Search + Sort ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center px-5 py-4 border-b border-[var(--border-color)] bg-[var(--surface-color)]">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-sm text-[var(--text-color)] placeholder-[var(--text-muted)]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] pr-1">
              <SlidersHorizontal size={13} />
              Sort:
            </span>
            {(
              [
                { field: "name"       as SortField, label: "Name"        },
                { field: "orders"     as SortField, label: "Orders"      },
                { field: "totalSpent" as SortField, label: "Total Spent" },
              ] as { field: SortField; label: string }[]
            ).map(({ field, label }) => {
              const active = sortField === field;
              const toggleDir = () => {
                if (active) {
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                } else {
                  setSortField(field);
                  setSortDir("asc");
                }
              };
              return (
                <button
                  key={field}
                  onClick={toggleDir}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                    active
                      ? "bg-[var(--color-pos-accent-soft)] border-[var(--color-pos-accent)] text-[var(--color-pos-accent-strong)]"
                      : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--color-pos-accent)] hover:text-[var(--text-color)]"
                  )}
                >
                  {label}
                  {active ? (
                    sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table Header — sortable columns ── */}
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_2fr_1fr_1.2fr_1fr_120px] gap-4 px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-color)]">
          {(
            [
              { label: "Customer",    field: "name"       as SortField | null },
              { label: "Phone",       field: null },
              { label: "Email",       field: null },
              { label: "Orders",      field: "orders"     as SortField | null },
              { label: "Total Spent", field: "totalSpent" as SortField | null },
              { label: "Joined",      field: null },
              { label: "",            field: null },
            ] as { label: string; field: SortField | null }[]
          ).map(({ label, field }) =>
            field ? (
              <button
                key={label}
                onClick={() => {
                  if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else { setSortField(field); setSortDir("asc"); }
                }}
                className={cn(
                  "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  sortField === field
                    ? "text-[var(--color-pos-accent-strong)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-color)]"
                )}
              >
                {label}
                {sortField === field ? (
                  sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                ) : (
                  <ArrowUpDown size={10} className="opacity-30" />
                )}
              </button>
            ) : (
              <div key={label} className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {label}
              </div>
            )
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border-color)]">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)]">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No customers found</p>
            </div>
          ) : (
            filtered.map((c, idx) => {
              const colorIdx = parseInt(c.id.replace(/\D/g, ""), 10) % avatarColors.length;
              const receiptCount = MOCK_CUSTOMER_RECEIPTS.filter((r) => r.customerId === c.id).length;
              return (
                <div
                  key={c.id}
                  className="flex flex-col md:grid md:grid-cols-[2fr_1.5fr_2fr_1fr_1.2fr_1fr_120px] gap-2 md:gap-4 px-5 py-4 items-start md:items-center hover:bg-[var(--bg-color)] transition-colors group"
                >
                  {/* Name + avatar */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm shadow-sm",
                      avatarColors[colorIdx]
                    )}>
                      {initials(c.name)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[var(--text-color)]">{c.name}</div>
                      <div className="text-xs text-[var(--text-muted)] md:hidden">{c.phone}</div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="hidden md:flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                    <Phone size={13} />
                    <span className="font-mono">{c.phone}</span>
                  </div>

                  {/* Email */}
                  <div className="hidden md:flex items-center gap-1.5 text-sm text-[var(--text-muted)] truncate">
                    {c.email
                      ? <><Mail size={13} className="shrink-0" /><span className="truncate">{c.email}</span></>
                      : <span className="text-[var(--text-muted)] text-xs italic">—</span>
                    }
                  </div>

                  {/* Orders */}
                  <div className="hidden md:flex items-center gap-1.5 text-sm text-[var(--text-color)]">
                    <ShoppingBag size={13} className="text-[var(--text-muted)]" />
                    {receiptCount}
                  </div>

                  {/* Total spent */}
                  <div className="hidden md:block font-mono font-semibold text-sm text-[var(--color-pos-accent-strong)]">
                    ₵{c.totalSpent.toFixed(2)}
                  </div>

                  {/* Joined */}
                  <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Calendar size={12} />
                    {new Date(c.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                  </div>

                  {/* View History button */}
                  <button
                    onClick={() => setHistoryCustomer(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-muted)] hover:text-[var(--color-pos-accent-strong)] hover:border-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-soft)] transition-all md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap"
                  >
                    <History size={13} />
                    View History
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}