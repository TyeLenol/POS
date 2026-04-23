import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  BarChart3, TrendingUp, Download, FileText, ShoppingCart,
  Users, Package, Tag, Clock, ChevronDown, Calendar, Filter
} from "lucide-react";
import { cn } from "../utils/cn";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const generateDailySales = () => {
  const days: { date: string; revenue: number; transactions: number; profit: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const base = 4000 + Math.random() * 6000;
    days.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.round(base),
      transactions: Math.round(base / 120),
      profit: Math.round(base * 0.38),
    });
  }
  return days;
};

const DAILY_DATA = generateDailySales();

const WEEKLY_DATA = [
  { week: "Wk 17", revenue: 38200, transactions: 284, profit: 14500 },
  { week: "Wk 18", revenue: 42100, transactions: 311, profit: 16000 },
  { week: "Wk 19", revenue: 39800, transactions: 295, profit: 15100 },
  { week: "Wk 20", revenue: 45600, transactions: 338, profit: 17300 },
  { week: "Wk 21", revenue: 41200, transactions: 305, profit: 15650 },
  { week: "Wk 22", revenue: 48900, transactions: 362, profit: 18580 },
  { week: "Wk 23", revenue: 52100, transactions: 389, profit: 19800 },
];

const MONTHLY_DATA = [
  { month: "May", revenue: 142000, transactions: 1050, profit: 53960 },
  { month: "Jun", revenue: 158000, transactions: 1170, profit: 60040 },
  { month: "Jul", revenue: 135000, transactions: 1000, profit: 51300 },
  { month: "Aug", revenue: 171000, transactions: 1265, profit: 64980 },
  { month: "Sep", revenue: 148000, transactions: 1095, profit: 56240 },
  { month: "Oct", revenue: 162000, transactions: 1200, profit: 61560 },
  { month: "Nov", revenue: 185000, transactions: 1370, profit: 70300 },
  { month: "Dec", revenue: 221000, transactions: 1635, profit: 83980 },
  { month: "Jan", revenue: 138000, transactions: 1021, profit: 52440 },
  { month: "Feb", revenue: 149000, transactions: 1102, profit: 56620 },
  { month: "Mar", revenue: 167000, transactions: 1236, profit: 63460 },
  { month: "Apr", revenue: 174000, transactions: 1288, profit: 66120 },
];

const PEAK_HOURS = [
  { hour: "8am", sales: 8 }, { hour: "9am", sales: 22 }, { hour: "10am", sales: 41 },
  { hour: "11am", sales: 55 }, { hour: "12pm", sales: 78 }, { hour: "1pm", sales: 82 },
  { hour: "2pm", sales: 61 }, { hour: "3pm", sales: 53 }, { hour: "4pm", sales: 60 },
  { hour: "5pm", sales: 71 }, { hour: "6pm", sales: 44 }, { hour: "7pm", sales: 25 },
  { hour: "8pm", sales: 12 },
];

const PRODUCTS = [
  { name: "Pumpkin Pasties", category: "Snacks", sold: 412, revenue: 2266, profit: 824, trend: "+18%" },
  { name: "Butterbeer (Draft)", category: "Beverages", sold: 368, revenue: 2944, profit: 1104, trend: "+9%" },
  { name: "Chocolate Frogs", category: "Sweets", sold: 341, revenue: 2217, profit: 853, trend: "+22%" },
  { name: "Felix Felicis (Vial)", category: "Potions", sold: 18, revenue: 2700, profit: 1800, trend: "+5%" },
  { name: "Every Flavour Beans", category: "Sweets", sold: 298, revenue: 1192, profit: 447, trend: "+3%" },
  { name: "Cauldron Cakes", category: "Snacks", sold: 231, revenue: 1617, profit: 462, trend: "-4%" },
  { name: "Exploding Bonbons", category: "Sweets", sold: 187, revenue: 935, profit: 374, trend: "+12%" },
  { name: "Gillywater", category: "Beverages", sold: 143, revenue: 429, profit: 286, trend: "-8%" },
  { name: "Licorice Wands", category: "Sweets", sold: 89, revenue: 312, profit: 89, trend: "-15%" },
  { name: "Sugar Quills", category: "Sweets", sold: 67, revenue: 201, profit: 67, trend: "-21%" },
];

const CATEGORIES = [
  { name: "Sweets", value: 982, revenue: 4857, color: "#f59e0b" },
  { name: "Beverages", value: 511, revenue: 3373, color: "#3b82f6" },
  { name: "Snacks", value: 643, revenue: 3883, color: "#10b981" },
  { name: "Potions", value: 18, revenue: 2700, color: "#8b5cf6" },
];

const CASHIERS = [
  { name: "Harry Potter", id: "S001", transactions: 312, revenue: 41280, avgOrder: 132.3, topProduct: "Pumpkin Pasties" },
  { name: "Ron Weasley", id: "S002", transactions: 287, revenue: 36150, avgOrder: 126.0, topProduct: "Butterbeer (Draft)" },
  { name: "Hermione Granger", id: "S003", transactions: 341, revenue: 44530, avgOrder: 130.6, topProduct: "Chocolate Frogs" },
  { name: "Neville Longbottom", id: "S004", transactions: 198, revenue: 22140, avgOrder: 111.8, topProduct: "Every Flavour Beans" },
];

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];

// ─── Helper Components ────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color = "text-[var(--text-color)]" }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bento-card p-5">
    <p className="text-xs font-medium text-[var(--text-muted)] mb-2">{label}</p>
    <p className={cn("text-2xl font-bold font-mono", color)}>{value}</p>
    {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
  </div>
);

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "var(--surface-color)",
    borderColor: "var(--border-color)",
    borderRadius: "12px",
    fontSize: "12px",
  },
  itemStyle: { color: "var(--color-pos-accent-strong)" },
};

// ─── Export Helpers ───────────────────────────────────────────────────────────

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Period = "daily" | "weekly" | "monthly";
type TabId = "overview" | "sales" | "products" | "categories" | "staff";

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [period, setPeriod] = useState<Period>("weekly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterCashier, setFilterCashier] = useState("All");
  const [sortField, setSortField] = useState<"sold" | "revenue" | "profit">("revenue");

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "sales", label: "Sales Analysis", icon: TrendingUp },
    { id: "products", label: "Product Performance", icon: Package },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "staff", label: "Staff Performance", icon: Users },
  ];

  const chartData = period === "daily" ? DAILY_DATA.slice(-14) : period === "weekly" ? WEEKLY_DATA : MONTHLY_DATA;
  const xKey = period === "daily" ? "date" : period === "weekly" ? "week" : "month";

  const sortedProducts = useMemo(
    () => [...PRODUCTS].sort((a, b) => b[sortField] - a[sortField]),
    [sortField]
  );

  const filteredProducts = useMemo(
    () => filterCategory === "All" ? sortedProducts : sortedProducts.filter((p) => p.category === filterCategory),
    [sortedProducts, filterCategory]
  );

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalTransactions = chartData.reduce((s, d) => s + d.transactions, 0);
  const totalProfit = chartData.reduce((s, d) => s + d.profit, 0);
  const avgOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const prevData = period === "weekly" ? WEEKLY_DATA.slice(-14, -7) : [];
  const prevRevenue = prevData.reduce((s, d) => s + d.revenue, 0);
  const growthPct = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : null;

  const handleExportCSV = () => {
    if (activeTab === "sales") {
      const headers = [xKey, "Revenue (GH₵)", "Transactions", "Profit (GH₵)"];
      const rows = chartData.map((d) => [(d as any)[xKey], d.revenue, d.transactions, d.profit]);
      downloadCSV(`sales-${period}.csv`, headers, rows);
    } else if (activeTab === "products") {
      const headers = ["Product", "Category", "Units Sold", "Revenue (GH₵)", "Profit (GH₵)", "Trend"];
      const rows = filteredProducts.map((p) => [p.name, p.category, p.sold, p.revenue, p.profit, p.trend]);
      downloadCSV("product-performance.csv", headers, rows);
    } else if (activeTab === "categories") {
      const headers = ["Category", "Units Sold", "Revenue (GH₵)"];
      const rows = CATEGORIES.map((c) => [c.name, c.value, c.revenue]);
      downloadCSV("categories.csv", headers, rows);
    } else if (activeTab === "staff") {
      const headers = ["Cashier", "Transactions", "Revenue (GH₵)", "Avg. Order (GH₵)", "Top Product"];
      const rows = CASHIERS.map((c) => [c.name, c.transactions, c.revenue, c.avgOrder, c.topProduct]);
      downloadCSV("staff-performance.csv", headers, rows);
    } else {
      const headers = ["Metric", "Value"];
      const rows = [
        ["Total Revenue", `GH₵${totalRevenue.toLocaleString()}`],
        ["Total Transactions", totalTransactions],
        ["Total Profit", `GH₵${totalProfit.toLocaleString()}`],
        ["Avg. Order Value", `GH₵${avgOrder.toFixed(2)}`],
      ];
      downloadCSV("overview.csv", headers, rows);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] tracking-tight">Reports & Analytics</h1>
          <p className="text-[var(--text-muted)] text-sm">Comprehensive insights for your store's performance.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--color-pos-accent)] hover:text-[var(--color-pos-accent-strong)] px-4 py-2 rounded-xl transition-all">
            <FileText size={16} />
            Export CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 text-sm font-medium text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] px-4 py-2 rounded-xl transition-all shadow-sm">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bento-card p-4 flex flex-wrap gap-3 items-center">
        <Filter size={16} className="text-[var(--text-muted)] shrink-0" />
        <span className="text-sm font-medium text-[var(--text-muted)] mr-1">Filters:</span>

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[var(--text-muted)]" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)]" />
          <span className="text-[var(--text-muted)] text-sm">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)]" />
        </div>

        <div className="relative">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-sm pl-3 pr-8 py-1.5 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] appearance-none cursor-pointer">
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>

        <div className="relative">
          <select value={filterCashier} onChange={(e) => setFilterCashier(e.target.value)} className="text-sm pl-3 pr-8 py-1.5 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] appearance-none cursor-pointer">
            <option value="All">All Cashiers</option>
            {CASHIERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>

        {(dateFrom || dateTo || filterCategory !== "All" || filterCashier !== "All") && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); setFilterCategory("All"); setFilterCashier("All"); }} className="text-xs text-red-500 hover:underline font-medium">
            Clear filters
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-color)] overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "border border-b-0 border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--color-pos-accent-strong)] -mb-px pb-3"
                : "text-[var(--text-muted)] hover:text-[var(--text-color)]"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ───────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={`GH₵${totalRevenue.toLocaleString()}`} sub={growthPct ? `${growthPct}% vs prev period` : undefined} color="text-emerald-600" />
            <StatCard label="Total Transactions" value={totalTransactions.toLocaleString()} sub="Completed sales" />
            <StatCard label="Gross Profit" value={`GH₵${totalProfit.toLocaleString()}`} sub={`${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin`} color="text-blue-600" />
            <StatCard label="Avg. Order Value" value={`GH₵${avgOrder.toFixed(2)}`} sub="Per transaction" color="text-violet-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bento-card p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-[var(--text-color)] flex items-center gap-2"><TrendingUp size={18} className="text-[var(--color-pos-accent)]" />Revenue vs Profit</h3>
                <div className="flex gap-2">
                  {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                    <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all", period === p ? "bg-[var(--color-pos-accent-soft)] text-[var(--color-pos-accent-strong)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-color)]")}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[260px]">
                {/* Gradients hoisted outside Recharts to avoid internal <defs> key collision */}
                <svg width="0" height="0" style={{ position: "absolute" }}>
                  <defs>
                    <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </svg>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis key="xaxis" dataKey={xKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis key="yaxis" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`} />
                    <Tooltip key="tooltip" {...chartTooltipStyle} formatter={(v: number, n: string) => [`GH₵${v.toLocaleString()}`, n === "revenue" ? "Revenue" : "Profit"]} />
                    <Area key="area-revenue" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#revG)" isAnimationActive={false} />
                    <Area key="area-profit" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profG)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bento-card p-6">
              <h3 className="font-semibold text-[var(--text-color)] flex items-center gap-2 mb-5"><Clock size={18} className="text-[var(--color-pos-accent)]" />Peak Sales Hours</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={PEAK_HOURS} barCategoryGap="25%">
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis key="xaxis" dataKey="hour" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis key="yaxis" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip key="tooltip" {...chartTooltipStyle} formatter={(v: number) => [v, "Transactions"]} />
                    <Bar key="bar-sales" dataKey="sales" fill="var(--color-pos-accent)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {PEAK_HOURS.map((entry, index) => (
                        <Cell key={index} fill={entry.sales >= 70 ? "#d97706" : "var(--color-pos-accent)"} opacity={entry.sales >= 70 ? 1 : 0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Transactions per period */}
          <div className="bento-card p-6">
            <h3 className="font-semibold text-[var(--text-color)] flex items-center gap-2 mb-5"><ShoppingCart size={18} className="text-[var(--color-pos-accent)]" />Transaction Volume</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis key="xaxis" dataKey={xKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis key="yaxis" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip key="tooltip" {...chartTooltipStyle} formatter={(v: number) => [v, "Transactions"]} />
                  <Bar key="bar-transactions" dataKey="transactions" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.85} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Sales Analysis Tab ─────────────────────────────────────────────── */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-[var(--text-muted)]">Period:</span>
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn("px-4 py-1.5 rounded-xl text-sm font-medium transition-all border", period === p ? "bg-[var(--color-pos-accent-soft)] text-[var(--color-pos-accent-strong)] border-[var(--color-pos-accent)]" : "border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-color)]")}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={`GH₵${totalRevenue.toLocaleString()}`} sub={growthPct ? `${Number(growthPct) > 0 ? "+" : ""}${growthPct}% vs last period` : "No comparison"} color={growthPct && Number(growthPct) > 0 ? "text-emerald-600" : "text-red-500"} />
            <StatCard label="Total Transactions" value={totalTransactions.toLocaleString()} sub="Completed orders" />
            <StatCard label="Total Profit" value={`GH₵${totalProfit.toLocaleString()}`} sub={`${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin`} />
            <StatCard label="Avg. Order Value" value={`GH₵${avgOrder.toFixed(2)}`} />
          </div>

          <div className="bento-card p-6">
            <h3 className="font-semibold text-[var(--text-color)] mb-5">{period.charAt(0).toUpperCase() + period.slice(1)} Sales Total (GH₵)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis key="xaxis" dataKey={xKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis key="yaxis" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`} />
                  <Tooltip key="tooltip" {...chartTooltipStyle} formatter={(v: number) => [`GH₵${v.toLocaleString()}`, "Revenue"]} />
                  <Bar key="bar-revenue" dataKey="revenue" fill="var(--color-pos-accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bento-card p-6">
            <h3 className="font-semibold text-[var(--text-color)] mb-5">Sales Trend Comparison</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis key="xaxis" dataKey={xKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis key="yaxis-left" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`} yAxisId="left" />
                  <YAxis key="yaxis-right" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} yAxisId="right" orientation="right" />
                  <Tooltip key="tooltip" {...chartTooltipStyle} />
                  <Legend key="legend" wrapperStyle={{ fontSize: "12px" }} />
                  <Line key="line-revenue" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="Revenue (GH₵)" yAxisId="left" isAnimationActive={false} />
                  <Line key="line-transactions" type="monotone" dataKey="transactions" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Transactions" yAxisId="right" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data table */}
          <div className="bento-card overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)]">
              <h3 className="font-semibold text-[var(--text-color)]">Detailed {period.charAt(0).toUpperCase() + period.slice(1)} Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-color)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Period</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Revenue</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Transactions</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Profit</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Avg. Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {chartData.slice().reverse().map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-color)] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[var(--text-color)]">{(row as any)[xKey]}</td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-color)]">GH₵{row.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-muted)]">{row.transactions}</td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-emerald-600">GH₵{row.profit.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-muted)]">GH₵{(row.revenue / row.transactions).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Performance Tab ────────────────────────────────────────── */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm font-medium text-[var(--text-muted)]">Sort by:</span>
              {(["revenue", "sold", "profit"] as const).map((f) => (
                <button key={f} onClick={() => setSortField(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", sortField === f ? "bg-[var(--color-pos-accent-soft)] text-[var(--color-pos-accent-strong)] border-[var(--color-pos-accent)]" : "border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-color)]")}>
                  {f === "sold" ? "Units Sold" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Sellers */}
            <div className="bento-card p-6">
              <h3 className="font-semibold text-[var(--text-color)] mb-5 flex items-center gap-2 text-emerald-600">
                <TrendingUp size={18} />Top Sellers
              </h3>
              <div className="space-y-4">
                {filteredProducts.slice(0, 5).map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-muted)] w-4">#{i + 1}</span>
                        <span className="text-sm font-medium text-[var(--text-color)]">{p.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-color)] text-[var(--text-muted)] border border-[var(--border-color)]">{p.category}</span>
                      </div>
                      <span className={cn("text-xs font-bold", p.trend.startsWith("+") ? "text-emerald-500" : "text-red-500")}>{p.trend}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" style={{ width: `${(p[sortField] / filteredProducts[0][sortField]) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-[var(--text-muted)] w-24 text-right">
                        {sortField === "sold" ? `${p.sold} units` : `GH₵${p[sortField].toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Performers */}
            <div className="bento-card p-6">
              <h3 className="font-semibold text-[var(--text-color)] mb-5 flex items-center gap-2 text-red-500">
                <TrendingUp size={18} className="rotate-180" />Low Performers
              </h3>
              <div className="space-y-4">
                {[...filteredProducts].reverse().slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-color)]">{p.name}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{p.category} · {p.sold} units sold</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-[var(--text-color)]">GH₵{p.revenue.toLocaleString()}</div>
                      <div className={cn("text-xs font-bold", p.trend.startsWith("+") ? "text-emerald-500" : "text-red-500")}>{p.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full product table */}
          <div className="bento-card overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)]">
              <h3 className="font-semibold text-[var(--text-color)]">All Product Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-color)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Qty Sold</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Revenue</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Profit</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-color)] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[var(--text-color)]">{p.name}</td>
                      <td className="px-5 py-3"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-color)] rounded border border-[var(--border-color)]">{p.category}</span></td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-color)]">{p.sold}</td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-color)]">GH₵{p.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-emerald-600">GH₵{p.profit.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right"><span className={cn("text-xs font-bold", p.trend.startsWith("+") ? "text-emerald-500" : "text-red-500")}>{p.trend}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Categories Tab ─────────────────────────────────────────────────── */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((c, i) => (
              <div key={i} className="bento-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-medium text-[var(--text-muted)]">{c.name}</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[var(--text-color)]">{c.value.toLocaleString()}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">units sold</div>
                <div className="text-sm font-mono font-medium text-[var(--text-color)] mt-1">GH₵{c.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bento-card p-6">
              <h3 className="font-semibold text-[var(--text-color)] mb-5">Sales by Category (Units)</h3>
              <div className="h-[280px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={CATEGORIES} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" nameKey="name" paddingAngle={3}>
                      {CATEGORIES.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [v + " units", n]} contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px", fontSize: "12px" }} />
                    <Legend formatter={(value) => <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bento-card p-6">
              <h3 className="font-semibold text-[var(--text-color)] mb-5">Revenue by Category (GH₵)</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CATEGORIES} layout="vertical" barCategoryGap="25%">
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                    <XAxis key="xaxis" type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₵${(v / 1000).toFixed(1)}k`} />
                    <YAxis key="yaxis" dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={65} />
                    <Tooltip key="tooltip" {...chartTooltipStyle} formatter={(v: number) => [`GH₵${v.toLocaleString()}`, "Revenue"]} />
                    <Bar key="bar-revenue" dataKey="revenue" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {CATEGORIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bento-card overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)]">
              <h3 className="font-semibold text-[var(--text-color)]">Category Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-color)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Units Sold</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Revenue</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {CATEGORIES.map((c, i) => {
                    const totalUnits = CATEGORIES.reduce((s, x) => s + x.value, 0);
                    return (
                      <tr key={i} className="hover:bg-[var(--bg-color)] transition-colors">
                        <td className="px-5 py-3 flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-sm font-medium text-[var(--text-color)]">{c.name}</span>
                        </td>
                        <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-color)]">{c.value.toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-color)]">GH₵{c.revenue.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-[var(--border-color)] h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(c.value / totalUnits) * 100}%`, backgroundColor: c.color }} />
                            </div>
                            <span className="text-xs font-mono text-[var(--text-muted)]">{((c.value / totalUnits) * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Staff Performance Tab ──────────────────────────────────────────── */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {CASHIERS.map((c, i) => (
              <div key={i} className="bento-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-color)]">{c.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{c.id}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Transactions</span><span className="font-mono font-medium text-[var(--text-color)]">{c.transactions}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Revenue</span><span className="font-mono font-medium text-[var(--text-color)]">GH₵{c.revenue.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Avg. Order</span><span className="font-mono font-medium text-[var(--text-color)]">GH₵{c.avgOrder}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-muted)]">Top product</div>
                  <div className="text-xs font-medium text-[var(--color-pos-accent-strong)] mt-0.5">{c.topProduct}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bento-card p-6">
            <h3 className="font-semibold text-[var(--text-color)] mb-5">Revenue by Cashier</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CASHIERS} barCategoryGap="35%">
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis key="xaxis" dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.split(" ")[0]} />
                  <YAxis key="yaxis" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`} />
                  <Tooltip key="tooltip" {...chartTooltipStyle} formatter={(v: number, n: string) => [`GH₵${v.toLocaleString()}`, n === "revenue" ? "Revenue" : n]} />
                  <Bar key="bar-revenue" dataKey="revenue" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {CASHIERS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bento-card overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)]">
              <h3 className="font-semibold text-[var(--text-color)]">Full Cashier Leaderboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-color)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rank</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cashier</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Transactions</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Revenue</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Avg. Order</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Top Product</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {[...CASHIERS].sort((a, b) => b.revenue - a.revenue).map((c, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-color)] transition-colors">
                      <td className="px-5 py-3">
                        <span className={cn("w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold", i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : i === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400" : "bg-[var(--bg-color)] text-[var(--text-muted)] border border-[var(--border-color)]")}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-sm font-medium text-[var(--text-color)]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-color)]">{c.transactions}</td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-color)]">GH₵{c.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm font-mono text-right text-[var(--text-color)]">GH₵{c.avgOrder}</td>
                      <td className="px-5 py-3 text-sm text-[var(--text-muted)]">{c.topProduct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}