import React, { useState } from "react";
import {
  Search, Download, Printer, X, CheckCircle2, XCircle,
  ShoppingCart, User, CreditCard, Clock, Hash, ChevronDown
} from "lucide-react";
import { cn } from "../utils/cn";

type ReceiptItem = { name: string; sku: string; category: string; qty: number; unitPrice: number; total: number };
type Receipt = {
  id: string;
  date: string;
  time: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: "Cash" | "Card" | "Mobile Money";
  amountTendered: number;
  changeDue: number;
  cashier: { id: string; name: string };
  customer: { name: string; email: string; phone: string } | null;
  status: "completed" | "refunded" | "voided";
  notes: string;
};

const MOCK_RECEIPTS: Receipt[] = [
  {
    id: "RCP-2026-0001", date: "2026-04-22", time: "14:30", status: "completed",
    items: [
      { name: "Pumpkin Pasties", sku: "SKU-001", category: "Snacks", qty: 3, unitPrice: 5.50, total: 16.50 },
      { name: "Butterbeer (Draft)", sku: "SKU-002", category: "Beverages", qty: 2, unitPrice: 8.00, total: 16.00 },
      { name: "Chocolate Frogs", sku: "SKU-003", category: "Sweets", qty: 2, unitPrice: 6.50, total: 13.00 },
    ],
    subtotal: 45.50, tax: 4.55, discount: 5.05, total: 45.00,
    paymentMethod: "Cash", amountTendered: 50.00, changeDue: 5.00,
    cashier: { id: "S001", name: "Harry Potter" },
    customer: { name: "Albus Dumbledore", email: "albus@hogwarts.edu", phone: "+44 7700 900001" },
    notes: "Regular customer - loyalty points applied.",
  },
  {
    id: "RCP-2026-0002", date: "2026-04-22", time: "15:15", status: "completed",
    items: [
      { name: "Felix Felicis (Vial)", sku: "SKU-009", category: "Potions", qty: 1, unitPrice: 150.00, total: 150.00 },
    ],
    subtotal: 150.00, tax: 15.00, discount: 0, total: 165.00,
    paymentMethod: "Card", amountTendered: 165.00, changeDue: 0,
    cashier: { id: "S002", name: "Ron Weasley" },
    customer: { name: "Severus Snape", email: "snape@hogwarts.edu", phone: "+44 7700 900002" },
    notes: "",
  },
  {
    id: "RCP-2026-0003", date: "2026-04-22", time: "16:02", status: "completed",
    items: [
      { name: "Every Flavour Beans", sku: "SKU-004", category: "Sweets", qty: 2, unitPrice: 4.00, total: 8.00 },
      { name: "Licorice Wands", sku: "SKU-005", category: "Sweets", qty: 2, unitPrice: 3.50, total: 7.00 },
    ],
    subtotal: 15.00, tax: 0, discount: 0, total: 15.00,
    paymentMethod: "Mobile Money", amountTendered: 15.00, changeDue: 0,
    cashier: { id: "S003", name: "Hermione Granger" },
    customer: null,
    notes: "",
  },
  {
    id: "RCP-2026-0004", date: "2026-04-22", time: "16:45", status: "refunded",
    items: [
      { name: "Cauldron Cakes", sku: "SKU-006", category: "Snacks", qty: 5, unitPrice: 7.00, total: 35.00 },
      { name: "Gillywater", sku: "SKU-007", category: "Beverages", qty: 3, unitPrice: 3.00, total: 9.00 },
      { name: "Sugar Quills", sku: "SKU-010", category: "Sweets", qty: 5, unitPrice: 2.50, total: 12.50 },
    ],
    subtotal: 56.50, tax: 5.65, discount: 0, total: 62.15,
    paymentMethod: "Cash", amountTendered: 65.00, changeDue: 2.85,
    cashier: { id: "S001", name: "Harry Potter" },
    customer: { name: "Draco Malfoy", email: "draco@malfoymanor.com", phone: "+44 7700 900003" },
    notes: "Refunded — items found to be expired.",
  },
  {
    id: "RCP-2026-0005", date: "2026-04-21", time: "11:20", status: "completed",
    items: [
      { name: "Exploding Bonbons", sku: "SKU-008", category: "Sweets", qty: 4, unitPrice: 5.00, total: 20.00 },
      { name: "Chocolate Frogs", sku: "SKU-003", category: "Sweets", qty: 3, unitPrice: 6.50, total: 19.50 },
      { name: "Butterbeer (Draft)", sku: "SKU-002", category: "Beverages", qty: 1, unitPrice: 8.00, total: 8.00 },
    ],
    subtotal: 47.50, tax: 4.75, discount: 2.25, total: 50.00,
    paymentMethod: "Card", amountTendered: 50.00, changeDue: 0,
    cashier: { id: "S004", name: "Neville Longbottom" },
    customer: { name: "Luna Lovegood", email: "luna@quibbler.com", phone: "+44 7700 900004" },
    notes: "",
  },
  {
    id: "RCP-2026-0006", date: "2026-04-21", time: "13:40", status: "voided",
    items: [
      { name: "Pumpkin Pasties", sku: "SKU-001", category: "Snacks", qty: 10, unitPrice: 5.50, total: 55.00 },
    ],
    subtotal: 55.00, tax: 5.50, discount: 0, total: 60.50,
    paymentMethod: "Cash", amountTendered: 0, changeDue: 0,
    cashier: { id: "S003", name: "Hermione Granger" },
    customer: null,
    notes: "Voided before payment was processed.",
  },
];

const paymentColors: Record<Receipt["paymentMethod"], string> = {
  Cash: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  Card: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  "Mobile Money": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
};

const statusConfig = {
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", icon: CheckCircle2 },
  refunded: { cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20", label: "Refunded", icon: XCircle },
  voided: { cls: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20", label: "Voided", icon: XCircle },
};

export default function Receipts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCashier, setFilterCashier] = useState("All");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const cashiers = ["All", ...Array.from(new Set(MOCK_RECEIPTS.map((r) => r.cashier.name)))];

  const filteredReceipts = MOCK_RECEIPTS.filter((r) => {
    const matchSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    const matchCashier = filterCashier === "All" || r.cashier.name === filterCashier;
    return matchSearch && matchStatus && matchCashier;
  });

  const handlePrint = (e: React.MouseEvent, rcp: Receipt) => {
    e.stopPropagation();
    window.print();
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] tracking-tight">Receipts</h1>
          <p className="text-[var(--text-muted)] text-sm">View and manage all transaction records.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Receipts", value: MOCK_RECEIPTS.length, color: "text-[var(--text-color)]" },
          { label: "Completed", value: MOCK_RECEIPTS.filter((r) => r.status === "completed").length, color: "text-emerald-600" },
          { label: "Refunded", value: MOCK_RECEIPTS.filter((r) => r.status === "refunded").length, color: "text-red-500" },
          { label: "Today's Total", value: `GH₵${MOCK_RECEIPTS.filter((r) => r.date === "2026-04-22" && r.status === "completed").reduce((s, r) => s + r.total, 0).toFixed(2)}`, color: "text-[var(--color-pos-accent-strong)]" },
        ].map((s, i) => (
          <div key={i} className="bento-card p-5">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-1">{s.label}</div>
            <div className={cn("text-2xl font-bold font-mono", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input type="text" placeholder="Search receipt ID or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] text-sm text-[var(--text-color)]" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="pl-3 pr-8 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] text-sm text-[var(--text-color)] appearance-none cursor-pointer">
              <option value="All">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
              <option value="voided">Voided</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterCashier} onChange={(e) => setFilterCashier(e.target.value)} className="pl-3 pr-8 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] text-sm text-[var(--text-color)] appearance-none cursor-pointer">
              {cashiers.map((c) => <option key={c} value={c}>{c === "All" ? "All Cashiers" : c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-color)] border-b border-[var(--border-color)]">
              <tr>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Receipt ID</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date & Time</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cashier</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Payment</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Total</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredReceipts.map((rcp) => {
                const status = statusConfig[rcp.status];
                return (
                  <tr key={rcp.id} className="hover:bg-[var(--surface-color)] transition-colors cursor-pointer" onClick={() => setSelectedReceipt(rcp)}>
                    <td className="p-4 text-sm font-mono font-medium text-[var(--text-color)]">{rcp.id}</td>
                    <td className="p-4 text-sm text-[var(--text-muted)]">
                      <div>{rcp.date}</div>
                      <div className="text-xs mt-0.5 flex items-center gap-1"><Clock size={11} />{rcp.time}</div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-color)]">
                      {rcp.customer ? (
                        <div>
                          <div className="font-medium">{rcp.customer.name}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">{rcp.customer.phone}</div>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] italic text-xs">Walk-in</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-[var(--text-muted)]">{rcp.cashier.name}</td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", paymentColors[rcp.paymentMethod])}>
                        {rcp.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-mono font-medium text-right text-[var(--text-color)]">GH₵{rcp.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", status.cls)}>{status.label}</span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => handlePrint(e, rcp)} className="p-2 text-[var(--text-muted)] hover:text-[var(--color-pos-accent-strong)] hover:bg-[var(--color-pos-accent-soft)] rounded-lg transition-colors" title="Print">
                          <Printer size={15} />
                        </button>
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--color-pos-accent-strong)] hover:bg-[var(--color-pos-accent-soft)] rounded-lg transition-colors" title="Download">
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredReceipts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-[var(--bg-color)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-color)]">
                <Search className="text-[var(--text-muted)]" size={22} />
              </div>
              <h3 className="font-medium text-[var(--text-color)]">No receipts found</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Receipt Detail Modal ───────────────────────────────────────────── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReceipt(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-pos-accent-soft)] flex items-center justify-center">
                  <ShoppingCart size={20} className="text-[var(--color-pos-accent-strong)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-color)]">{selectedReceipt.id}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{selectedReceipt.date} at {selectedReceipt.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", statusConfig[selectedReceipt.status].cls)}>
                  {statusConfig[selectedReceipt.status].label}
                </span>
                <button onClick={() => setSelectedReceipt(null)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-color)] transition-colors ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Receipt "paper" look */}
              <div className="bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                {/* Store header */}
                <div className="text-center py-4 border-b border-dashed border-[var(--border-color)]">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">DA</span>
                  </div>
                  <div className="font-bold text-[var(--text-color)]">Diagon Alley POS</div>
                  <div className="text-xs text-[var(--text-muted)]">93 Diagon Alley, London</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">{selectedReceipt.id}</div>
                </div>

                {/* Items */}
                <div className="px-4 py-3">
                  <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Items Purchased</div>
                  <div className="space-y-2">
                    {selectedReceipt.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-[var(--text-color)]">{item.name}</span>
                          <div className="text-xs text-[var(--text-muted)]">{item.qty} × GH₵{item.unitPrice.toFixed(2)}</div>
                        </div>
                        <span className="font-mono font-medium text-[var(--text-color)]">GH₵{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-dashed border-[var(--border-color)] mt-3 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm text-[var(--text-muted)]">
                      <span>Subtotal</span>
                      <span className="font-mono">GH₵{selectedReceipt.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedReceipt.tax > 0 && (
                      <div className="flex justify-between text-sm text-[var(--text-muted)]">
                        <span>Tax (10%)</span>
                        <span className="font-mono">GH₵{selectedReceipt.tax.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedReceipt.discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Discount</span>
                        <span className="font-mono">−GH₵{selectedReceipt.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[var(--text-color)] font-bold border-t border-[var(--border-color)] pt-2 mt-2">
                      <span>TOTAL</span>
                      <span className="font-mono text-lg">GH₵{selectedReceipt.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[var(--text-muted)]">
                      <span>Amount Tendered</span>
                      <span className="font-mono">GH₵{selectedReceipt.amountTendered.toFixed(2)}</span>
                    </div>
                    {selectedReceipt.changeDue > 0 && (
                      <div className="flex justify-between text-sm text-[var(--text-muted)]">
                        <span>Change Due</span>
                        <span className="font-mono">GH₵{selectedReceipt.changeDue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard size={14} className="text-[var(--text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Payment</span>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", paymentColors[selectedReceipt.paymentMethod])}>
                    {selectedReceipt.paymentMethod}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash size={14} className="text-[var(--text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Items</span>
                  </div>
                  <div className="font-bold font-mono text-[var(--text-color)]">{selectedReceipt.items.reduce((s, i) => s + i.qty, 0)} units</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <User size={14} className="text-[var(--text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cashier</span>
                  </div>
                  <div className="text-sm font-medium text-[var(--text-color)]">{selectedReceipt.cashier.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{selectedReceipt.cashier.id}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <User size={14} className="text-[var(--text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Customer</span>
                  </div>
                  {selectedReceipt.customer ? (
                    <>
                      <div className="text-sm font-medium text-[var(--text-color)]">{selectedReceipt.customer.name}</div>
                      <div className="text-xs text-[var(--text-muted)] truncate">{selectedReceipt.customer.email}</div>
                      <div className="text-xs text-[var(--text-muted)]">{selectedReceipt.customer.phone}</div>
                    </>
                  ) : (
                    <div className="text-sm text-[var(--text-muted)] italic">Walk-in customer</div>
                  )}
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                  <span className="font-medium">Note: </span>{selectedReceipt.notes}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-5 border-t border-[var(--border-color)] flex justify-end gap-3">
              <button onClick={() => setSelectedReceipt(null)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-color)] border border-[var(--border-color)] transition-colors">
                Close
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-color)] border border-[var(--border-color)] transition-colors">
                <Printer size={15} />Print
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] transition-colors">
                <Download size={15} />Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}