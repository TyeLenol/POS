import React, { useState, useRef } from "react";
import {
  Plus, Search, Edit2, Trash2, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  X, Upload, Package, AlertTriangle, ChevronDown, ImageIcon, Info
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/cn";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  barcode: string;
  supplier: string;
  unit: string;
  image: string | null;
};

const INITIAL_PRODUCTS: Product[] = [
  { id: "1", sku: "SKU-001", name: "Pumpkin Pasties", description: "Classic wizarding snack, baked fresh daily.", category: "Snacks", price: 5.50, cost: 2.00, stock: 45, lowStockThreshold: 10, barcode: "123456789012", supplier: "Honeydukes Wholesale", unit: "pcs", image: null },
  { id: "2", sku: "SKU-002", name: "Butterbeer (Draft)", description: "A frothy, slightly alcoholic beverage beloved by all.", category: "Beverages", price: 8.00, cost: 3.50, stock: 120, lowStockThreshold: 20, barcode: "123456789013", supplier: "Three Broomsticks Brewery", unit: "pcs", image: null },
  { id: "3", sku: "SKU-003", name: "Chocolate Frogs", description: "Enchanted chocolate frogs with collectable wizard cards inside.", category: "Sweets", price: 6.50, cost: 2.50, stock: 30, lowStockThreshold: 15, barcode: "123456789014", supplier: "Honeydukes Wholesale", unit: "pcs", image: null },
  { id: "4", sku: "SKU-004", name: "Every Flavour Beans", description: "Jelly beans with truly every flavour imaginable.", category: "Sweets", price: 4.00, cost: 1.50, stock: 65, lowStockThreshold: 20, barcode: "123456789015", supplier: "Honeydukes Wholesale", unit: "pcs", image: null },
  { id: "5", sku: "SKU-005", name: "Licorice Wands", description: "Wand-shaped licorice candy.", category: "Sweets", price: 3.50, cost: 1.00, stock: 12, lowStockThreshold: 15, barcode: "123456789016", supplier: "Honeydukes Wholesale", unit: "pcs", image: null },
  { id: "6", sku: "SKU-006", name: "Cauldron Cakes", description: "Cauldron-shaped sponge cakes with cream filling.", category: "Snacks", price: 7.00, cost: 3.00, stock: 8, lowStockThreshold: 10, barcode: "123456789017", supplier: "Madam Malkin's Bakes", unit: "pcs", image: null },
  { id: "7", sku: "SKU-007", name: "Gillywater", description: "Still mineral water infused with gillyweed extract.", category: "Beverages", price: 3.00, cost: 1.00, stock: 0, lowStockThreshold: 10, barcode: "123456789018", supplier: "Madam Puddifoot", unit: "bottle", image: null },
  { id: "8", sku: "SKU-008", name: "Exploding Bonbons", description: "Fizzing sweets that cause a small harmless explosion in your mouth.", category: "Sweets", price: 5.00, cost: 2.00, stock: 22, lowStockThreshold: 10, barcode: "123456789019", supplier: "Weasleys' Wizard Wheezes", unit: "pcs", image: null },
  { id: "9", sku: "SKU-009", name: "Felix Felicis (Vial)", description: "Liquid Luck. Makes the drinker lucky for a period of time. Very rare.", category: "Potions", price: 150.00, cost: 50.00, stock: 2, lowStockThreshold: 5, barcode: "123456789020", supplier: "Slug & Jiggers", unit: "vial", image: null },
  { id: "10", sku: "SKU-010", name: "Sugar Quills", description: "Quill-shaped lollipops that look like you're writing in class.", category: "Sweets", price: 2.50, cost: 0.80, stock: 38, lowStockThreshold: 10, barcode: "123456789021", supplier: "Honeydukes Wholesale", unit: "pcs", image: null },
];

const CATEGORIES = ["Snacks", "Beverages", "Sweets", "Potions", "Stationery", "Other"];
const UNITS = ["pcs", "kg", "g", "litre", "ml", "bottle", "box", "vial", "pack"];
type SortField = "name" | "stock" | "price" | "cost";
type SortDir = "asc" | "desc";

function emptyProduct(): Omit<Product, "id"> {
  return { sku: "", name: "", description: "", category: "Snacks", price: 0, cost: 0, stock: 0, lowStockThreshold: 10, barcode: "", supplier: "", unit: "pcs", image: null };
}

function generateSKU() {
  return "SKU-" + String(Math.floor(Math.random() * 900) + 100);
}

const inputClass = "w-full px-3 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-sm text-[var(--text-color)] placeholder-[var(--text-muted)]";

// ── Lifted to module level so React sees a stable identity across re-renders.
// Defining components inside another component causes them to be remounted on
// every parent render, which resets scroll position and loses focus. ──────────

function Modal({
  title, onClose, children, footer
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <h3 className="font-semibold text-[var(--text-color)]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-color)] transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-5 pt-0 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

function ProductForm({
  form, setForm, imgRef, onImgChange
}: {
  form: Omit<Product, "id"> | Product;
  setForm: (v: any) => void;
  imgRef: React.RefObject<HTMLInputElement | null>;
  onImgChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      {/* Image */}
      <div className="flex justify-center">
        <div
          className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-color)] flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[var(--color-pos-accent)] transition-colors group"
          onClick={() => imgRef.current?.click()}
        >
          {form.image ? (
            <img src={form.image} className="w-full h-full object-cover" alt="product" />
          ) : (
            <>
              <ImageIcon size={22} className="text-[var(--text-muted)] group-hover:text-[var(--color-pos-accent)] transition-colors" />
              <span className="text-[10px] text-[var(--text-muted)] mt-1">Add photo</span>
            </>
          )}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
            <Upload size={18} className="text-white" />
          </div>
        </div>
        <input ref={imgRef as any} type="file" accept="image/*" className="hidden" onChange={onImgChange} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Product Name *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g. Pumpkin Pasties" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">SKU</label>
          <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClass} placeholder="Auto-generated" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Barcode</label>
          <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={inputClass} placeholder="Scan or enter" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Category</label>
          <div className="relative">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={cn(inputClass, "appearance-none cursor-pointer pr-8")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Unit</label>
          <div className="relative">
            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={cn(inputClass, "appearance-none cursor-pointer pr-8")}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Selling Price (GH₵)</label>
          <input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Cost Price (GH₵)</label>
          <input type="number" min={0} step={0.01} value={form.cost} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Stock Quantity</label>
          <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Low Stock Alert (≤)</label>
          <input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 0 })} className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Supplier</label>
          <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={inputClass} placeholder="Supplier name" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={cn(inputClass, "resize-none")} rows={2} placeholder="Optional product description" />
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [showLowStock, setShowLowStock] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form state
  const [addForm, setAddForm] = useState<Omit<Product, "id">>(emptyProduct());
  const [editForm, setEditForm] = useState<Product | null>(null);

  const categories = ["All Categories", ...CATEGORIES];

  const filteredProducts = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === "All Categories" || p.category === categoryFilter;
      const matchStock = !showLowStock || p.stock <= p.lowStockThreshold;
      return matchSearch && matchCat && matchStock;
    })
    .sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="opacity-40" />;
    return sortDir === "asc" ? <ArrowUp size={13} className="text-[var(--color-pos-accent)]" /> : <ArrowDown size={13} className="text-[var(--color-pos-accent)]" />;
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAddForm({ ...addForm, image: URL.createObjectURL(file) });
  };

  const handleEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) setEditForm({ ...editForm, image: URL.createObjectURL(file) });
  };

  const handleAddSubmit = () => {
    if (!addForm.name.trim()) return;
    const newProduct: Product = { ...addForm, id: String(Date.now()), sku: addForm.sku || generateSKU() };
    setProducts([...products, newProduct]);
    setShowAdd(false);
    setAddForm(emptyProduct());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditSubmit = () => {
    if (!editForm) return;
    setProducts(products.map((p) => (p.id === editForm.id ? editForm : p)));
    setShowEdit(false);
    setEditForm(null);
  };

  const handleDelete = () => {
    if (!selectedProduct) return;
    setProducts(products.filter((p) => p.id !== selectedProduct.id));
    setShowDelete(false);
    setSelectedProduct(null);
  };

  const openDetail = (p: Product) => { setSelectedProduct(p); setShowDetail(true); };
  const openEdit = (p: Product, e: React.MouseEvent) => { e.stopPropagation(); setEditForm({ ...p }); setShowEdit(true); };
  const openDelete = (p: Product, e: React.MouseEvent) => { e.stopPropagation(); setSelectedProduct(p); setShowDelete(true); };

  const stockStatus = (p: Product) => {
    if (p.stock === 0) return { label: "Out of stock", cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" };
    if (p.stock <= p.lowStockThreshold) return { label: "Low stock", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" };
    return { label: "In stock", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" };
  };

  const btnSecondary = "px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-color)] border border-[var(--border-color)] transition-colors";
  const btnPrimary = "px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] transition-colors";

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] tracking-tight">Inventory</h1>
          <p className="text-[var(--text-muted)] text-sm">Manage products and monitor stock levels.</p>
        </div>
        {isManager && (
          <button onClick={() => { setAddForm(emptyProduct()); setShowAdd(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] text-white font-medium text-sm shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all active:scale-[0.98]">
            <Plus size={18} />Add Product
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bento-card p-5"><div className="text-xs font-medium text-[var(--text-muted)] mb-1">Total Products</div><div className="text-2xl font-bold font-mono text-[var(--text-color)]">{totalProducts}</div></div>
        <div className="bento-card p-5"><div className="text-xs font-medium text-[var(--text-muted)] mb-1">Stock Value</div><div className="text-2xl font-bold font-mono text-[var(--text-color)]">₵{totalValue.toFixed(2)}</div></div>
        <div className="bento-card p-5 cursor-pointer" onClick={() => setShowLowStock(!showLowStock)}>
          <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Low Stock (≤threshold)</div>
          <div className="text-2xl font-bold font-mono text-amber-500">{lowStockCount}</div>
        </div>
        <div className="bento-card p-5"><div className="text-xs font-medium text-[var(--text-muted)] mb-1">Out of Stock</div><div className="text-2xl font-bold font-mono text-red-500">{outOfStock}</div></div>
      </div>

      {/* Table Container */}
      <div className="bento-card flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row gap-3 bg-[var(--surface-color)]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input type="text" placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] text-sm text-[var(--text-color)]" />
          </div>
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] text-sm text-[var(--text-color)] appearance-none cursor-pointer">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all", showLowStock ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" : "bg-[var(--bg-color)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-amber-300")}
          >
            <AlertTriangle size={14} /> Low Stock Only
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[var(--bg-color)] border-b border-[var(--border-color)] z-10">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-[260px]">
                  <button className="flex items-center gap-1.5 hover:text-[var(--text-color)]" onClick={() => handleSort("name")}>Product <SortIcon field="name" /></button>
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">SKU</th>
                <th className="py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">
                  <button className="flex items-center gap-1.5 ml-auto hover:text-[var(--text-color)]" onClick={() => handleSort("price")}>Price <SortIcon field="price" /></button>
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">
                  <button className="flex items-center gap-1.5 ml-auto hover:text-[var(--text-color)]" onClick={() => handleSort("cost")}>Cost <SortIcon field="cost" /></button>
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">
                  <button className="flex items-center gap-1.5 mx-auto hover:text-[var(--text-color)]" onClick={() => handleSort("stock")}>Stock <SortIcon field="stock" /></button>
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">Status</th>
                {isManager && <th className="py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] bg-[var(--surface-color)]">
              {filteredProducts.map((product) => {
                const status = stockStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-[var(--bg-color)] transition-colors group cursor-pointer" onClick={() => openDetail(product)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden shrink-0">
                          {product.image ? <img src={product.image} className="w-full h-full object-cover" alt="" /> : <Package size={16} className="text-[var(--text-muted)]" />}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-color)]">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-[var(--text-muted)]">{product.sku}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-color)] rounded-md border border-[var(--border-color)]">{product.category}</span>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono font-medium text-right text-[var(--text-color)]">₵{product.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm font-mono font-medium text-right text-[var(--text-muted)]">₵{product.cost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center text-sm font-mono font-bold text-[var(--text-color)]">{product.stock}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", status.cls)}>{status.label}</span>
                    </td>
                    {isManager && (
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => openEdit(product, e)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-pos-accent)] rounded-lg hover:bg-[var(--bg-color)] transition-colors" title="Edit">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={(e) => openDelete(product, e)} className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--bg-color)] transition-colors" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-[var(--bg-color)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-color)]">
                <Package className="text-[var(--text-muted)]" size={22} />
              </div>
              <h3 className="font-medium text-[var(--text-color)]">No products found</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      {showAdd && (
        <Modal
          title="Add New Product"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className={btnSecondary} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={btnPrimary} onClick={handleAddSubmit}>Add Product</button>
            </>
          }
        >
          <ProductForm form={addForm} setForm={setAddForm} imgRef={fileInputRef} onImgChange={handleAddImage} />
        </Modal>
      )}

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      {showDetail && selectedProduct && (
        <Modal
          title="Product Details"
          onClose={() => setShowDetail(false)}
          footer={
            isManager ? (
              <>
                <button className={cn(btnSecondary, "text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10")} onClick={() => { setShowDetail(false); setShowDelete(true); }}>
                  <Trash2 size={14} className="inline mr-1.5" />Delete
                </button>
                <button className={btnPrimary} onClick={() => { setShowDetail(false); setEditForm({ ...selectedProduct }); setShowEdit(true); }}>
                  <Edit2 size={14} className="inline mr-1.5" />Edit Product
                </button>
              </>
            ) : undefined
          }
        >
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden shrink-0">
                {selectedProduct.image ? <img src={selectedProduct.image} className="w-full h-full object-cover" alt="" /> : <Package size={28} className="text-[var(--text-muted)]" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[var(--text-color)] text-lg">{selectedProduct.name}</h4>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-color)] rounded border border-[var(--border-color)]">{selectedProduct.category}</span>
                  <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", stockStatus(selectedProduct).cls)}>{stockStatus(selectedProduct).label}</span>
                </div>
                {selectedProduct.description && <p className="text-sm text-[var(--text-muted)] mt-2">{selectedProduct.description}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["SKU", selectedProduct.sku],
                ["Barcode", selectedProduct.barcode],
                ["Selling Price", `GH₵${selectedProduct.price.toFixed(2)}`],
                ["Cost Price", `GH₵${selectedProduct.cost.toFixed(2)}`],
                ["Gross Margin", `GH₵${(selectedProduct.price - selectedProduct.cost).toFixed(2)} (${(((selectedProduct.price - selectedProduct.cost) / selectedProduct.price) * 100).toFixed(1)}%)`],
                ["Stock Level", `${selectedProduct.stock} ${selectedProduct.unit}`],
                ["Low Stock Alert", `≤${selectedProduct.lowStockThreshold} ${selectedProduct.unit}`],
                ["Supplier", selectedProduct.supplier || "—"],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">{label}</div>
                  <div className="text-sm font-medium text-[var(--text-color)] font-mono">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {showEdit && editForm && (
        <Modal
          title="Edit Product"
          onClose={() => setShowEdit(false)}
          footer={
            <>
              <button className={btnSecondary} onClick={() => setShowEdit(false)}>Cancel</button>
              <button className={btnPrimary} onClick={handleEditSubmit}>Save Changes</button>
            </>
          }
        >
          <ProductForm form={editForm} setForm={setEditForm} imgRef={editFileInputRef} onImgChange={handleEditImage} />
        </Modal>
      )}

      {/* ── Delete Modal ───────────────────────────────────────────────────── */}
      {showDelete && selectedProduct && (
        <Modal title="Delete Product" onClose={() => setShowDelete(false)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
              <Trash2 size={20} className="text-red-500 shrink-0" />
              <div>
                <div className="font-medium text-red-700 dark:text-red-400">Confirm Deletion</div>
                <div className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">This action cannot be undone.</div>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Are you sure you want to delete <strong className="text-[var(--text-color)]">{selectedProduct.name}</strong> ({selectedProduct.sku})? All inventory data for this product will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button className={btnSecondary} onClick={() => setShowDelete(false)}>Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">Delete Product</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}