import React from "react";
import {
  TrendingUp, Calendar, Award, Target, Users, AlertTriangle,
  BarChart3, Package, ReceiptText, Settings, ArrowRight, ShoppingCart, Clock
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { useNavigate } from "react-router";
import { cn } from "../utils/cn";

const revenueTrend = [
  { day: "Mon", revenue: 5200, transactions: 38 },
  { day: "Tue", revenue: 4800, transactions: 32 },
  { day: "Wed", revenue: 6700, transactions: 51 },
  { day: "Thu", revenue: 5900, transactions: 44 },
  { day: "Fri", revenue: 8100, transactions: 60 },
  { day: "Sat", revenue: 9400, transactions: 72 },
  { day: "Sun", revenue: 8450, transactions: 67 },
];

const peakHours = [
  { hour: "9am", sales: 12 }, { hour: "10am", sales: 28 }, { hour: "11am", sales: 35 },
  { hour: "12pm", sales: 58 }, { hour: "1pm", sales: 62 }, { hour: "2pm", sales: 45 },
  { hour: "3pm", sales: 38 }, { hour: "4pm", sales: 41 }, { hour: "5pm", sales: 53 },
  { hour: "6pm", sales: 30 }, { hour: "7pm", sales: 18 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const kpis = [
    { label: "Today's Revenue", value: "8,450.00", subtitle: "+12% from yesterday", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100", darkBg: "dark:bg-emerald-500/10" },
    { label: "This Week", value: "52,100.50", subtitle: "+5% from last week", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100", darkBg: "dark:bg-blue-500/10" },
    { label: "Today's Transactions", value: "67", subtitle: "Across all cashiers", icon: ShoppingCart, color: "text-violet-600", bg: "bg-violet-100", darkBg: "dark:bg-violet-500/10" },
    { label: "Avg. Order Value", value: "126.12", subtitle: "Per transaction today", icon: Target, color: "text-amber-600", bg: "bg-amber-100", darkBg: "dark:bg-amber-500/10" },
  ];

  const topProducts = [
    { name: "Pumpkin Pasties", sold: 142, revenue: 1250, percent: 85 },
    { name: "Butterbeer (Draft)", sold: 98, revenue: 980, percent: 65 },
    { name: "Chocolate Frogs", sold: 86, revenue: 688, percent: 55 },
    { name: "Every Flavour Beans", sold: 74, revenue: 370, percent: 40 },
    { name: "Licorice Wands", sold: 45, revenue: 225, percent: 25 },
  ];

  const lowStock = [
    { name: "Felix Felicis", category: "Potions", stock: 2, critical: true },
    { name: "Cauldron Cakes", category: "Snacks", stock: 5, critical: false },
    { name: "Gillywater", category: "Beverages", stock: 1, critical: true },
    { name: "Sugar Quills", category: "Sweets", stock: 4, critical: false },
  ];

  const quickLinks = [
    { label: "Reports", icon: BarChart3, path: "/reports" },
    { label: "Inventory", icon: Package, path: "/inventory" },
    { label: "Staff", icon: Users, path: "/staff" },
    { label: "Receipts", icon: ReceiptText, path: "/receipts" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] tracking-tight">Overview</h1>
          <p className="text-[var(--text-muted)] text-sm">Here's what's happening at your store today.</p>
        </div>
        <div className="text-sm font-medium text-[var(--text-muted)] bg-[var(--surface-color)] px-4 py-2 rounded-full border border-[var(--border-color)]">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <div key={i} className="bento-card p-6 flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-medium text-[var(--text-muted)]">{kpi.label}</span>
              <div className={cn("p-2 rounded-xl", kpi.bg, kpi.darkBg, kpi.color)}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-auto">
              {i !== 2 && <span className="text-sm text-[var(--text-muted)] font-mono">GH₵</span>}
              <span className="text-3xl font-bold text-[var(--text-color)] tracking-tight font-mono">{kpi.value}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">{kpi.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Revenue Trend + Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bento-card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-semibold text-[var(--text-color)]">Revenue Trend (This Week)</h3>
            <button onClick={() => navigate("/reports")} className="text-sm text-[var(--color-pos-accent-strong)] hover:underline font-medium flex items-center gap-1">
              Full report <ArrowRight size={14} />
            </button>
          </div>
          <div className="h-[220px]">
            {/* Gradient defined outside Recharts to avoid its internal <defs> key conflict */}
            <svg width="0" height="0" style={{ position: "absolute" }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-pos-accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-pos-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis key="xaxis" dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis key="yaxis" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v: number, name: string) => [name === "revenue" ? `GH₵${v.toLocaleString()}` : v, name === "revenue" ? "Revenue" : "Transactions"]}
                />
                <Area key="area-revenue" type="monotone" dataKey="revenue" stroke="var(--color-pos-accent)" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={18} className="text-[var(--color-pos-accent)]" />
            <h3 className="text-lg font-semibold text-[var(--text-color)]">Peak Sales Hours</h3>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} barCategoryGap="30%">
                <XAxis key="xaxis" dataKey="hour" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis key="yaxis" hide />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v: number) => [v, "Sales"]}
                />
                <Bar key="bar-sales" dataKey="sales" fill="var(--color-pos-accent)" radius={[4, 4, 0, 0]} opacity={0.85} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Selling Products */}
        <div className="bento-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-color)]">Top Selling Products</h3>
            <button onClick={() => navigate("/reports")} className="text-sm text-[var(--color-pos-accent-strong)] hover:underline font-medium flex items-center gap-1">
              Full report <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-5 flex-1">
            {topProducts.map((product, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-[var(--text-color)]">{product.name}</span>
                  <span className="text-[var(--text-muted)] font-mono">{product.sold} units · GH₵{product.revenue}</span>
                </div>
                <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" style={{ width: `${product.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5 flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => navigate("/staff")} className="bento-card p-5 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group">
              <Users size={22} className="text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-bold text-[var(--text-color)] font-mono">12</div>
              <div className="text-xs text-[var(--text-muted)] font-medium">Active Staff</div>
            </div>
            <div onClick={() => navigate("/inventory")} className="bento-card p-5 cursor-pointer hover:border-red-200 dark:hover:border-red-800 transition-colors group">
              <AlertTriangle size={22} className="text-red-500 mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-bold text-red-500 font-mono">4</div>
              <div className="text-xs text-[var(--text-muted)] font-medium">Low Stock</div>
            </div>
          </div>

          <div className="bento-card p-5 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--text-color)] uppercase tracking-wider mb-4 border-b border-[var(--border-color)] pb-3">Restock Required</h3>
            <div className="space-y-3 flex-1">
              {lowStock.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                  <div>
                    <div className="font-medium text-sm text-[var(--text-color)]">{item.name}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{item.category}</div>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold font-mono border",
                    item.critical
                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                  )}>
                    {item.stock} left
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bento-card p-6">
        <h3 className="text-sm font-semibold text-[var(--text-color)] mb-4">Quick Links</h3>
        <div className="flex flex-wrap gap-4">
          {quickLinks.map((link, i) => (
            <button key={i} onClick={() => navigate(link.path)} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] hover:bg-[var(--color-pos-accent-soft)] hover:text-[var(--color-pos-accent-strong)] hover:border-[var(--color-pos-accent)] transition-all text-sm font-medium text-[var(--text-muted)]">
              <link.icon size={18} />
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}