import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ReceiptText, 
  BarChart3, 
  Users, 
  Settings,
  Shield,
  Badge,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  UserRound
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { cn } from "../utils/cn";

export function Shell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!user) {
    return <Outlet />; // login screen handles its own shell
  }

  const isManager = user.role === "manager";

  const managerLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { type: "divider", label: "Analytics" },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/inventory", label: "Inventory", icon: Package },
    { to: "/receipts", label: "Receipts", icon: ReceiptText },
    { type: "divider", label: "Customers" },
    { to: "/customers", label: "Customers", icon: UserRound },
    { type: "divider", label: "Admin" },
    { to: "/staff", label: "Staff", icon: Users },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const cashierLinks = [
    { type: "divider", label: "Operations" },
    { to: "/sales", label: "Customer Cart", icon: ShoppingCart },
    { to: "/inventory", label: "Inventory", icon: Package },
    { to: "/receipts", label: "Receipts", icon: ReceiptText },
    { type: "divider", label: "Customers" },
    { to: "/customers", label: "Customers", icon: UserRound },
  ];

  const links = isManager ? managerLinks : cashierLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[var(--surface-color)] rounded-r-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-[var(--border-color)] overflow-hidden transition-all duration-300">
      <div className={cn("p-6 flex items-center", isCollapsed ? "justify-center px-4" : "space-x-3")}>
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-lg tracking-tight">DA</span>
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">
            <h1 className="font-semibold text-[var(--text-color)] leading-tight">Diagon Alley</h1>
            <p className="text-xs text-[var(--text-muted)] font-medium tracking-wide">Point of Sale</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide py-2">
        {links.map((link, idx) => {
          if (link.type === "divider") {
            if (isCollapsed) {
              return <div key={idx} className="my-4 border-t border-[var(--border-color)] w-8 mx-auto" />;
            }
            return (
              <div key={idx} className="pt-4 pb-2 px-3 animate-in fade-in duration-300">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--text-muted)]">
                  {link.label}
                </p>
              </div>
            );
          }
          const Icon = link.icon;
          return (
            <NavLink
              key={idx}
              to={link.to!}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-xl transition-all duration-200 text-sm font-medium",
                  isCollapsed ? "justify-center p-3" : "space-x-3 px-3 py-2.5",
                  isActive
                    ? "bg-[var(--color-pos-accent-soft)] text-[var(--color-pos-accent-strong)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--border-color)] hover:text-[var(--text-color)]"
                )
              }
              title={isCollapsed ? link.label : undefined}
            >
              {Icon && <Icon size={20} className="shrink-0" />}
              {!isCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Cashier Widget */}
      {!isManager && !isCollapsed && (
        <div className="p-4 mx-4 mb-4 bento-card rounded-2xl bg-[var(--surface-color)] animate-in fade-in duration-300">
          <div className="text-xs text-[var(--text-muted)] mb-1 font-medium">Current Order</div>
          <div className="font-mono text-xl font-semibold text-[var(--color-pos-accent-strong)] mb-2 truncate">
            GH₵{total.toFixed(2)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mb-3">{items.length} items</div>
          <button 
            onClick={() => { clearCart(); navigate('/sales'); }}
            className="w-full py-2 bg-[var(--border-color)] hover:bg-[var(--color-pos-accent-soft)] hover:text-[var(--color-pos-accent-strong)] text-[var(--text-color)] text-sm font-medium rounded-lg transition-colors"
          >
            New Order
          </button>
        </div>
      )}

      {/* Sandbox Mode indicator */}
      <div className={cn("p-4 mt-auto transition-all", isCollapsed && "px-2")}>
        <div className={cn(
          "flex items-center rounded-xl bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]",
          isCollapsed ? "justify-center p-2" : "justify-between px-3 py-2.5"
        )}>
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            {!isCollapsed && <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Sandbox Mode</span>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-color)] transition-colors">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out lg:static group/sidebar",
          isCollapsed ? "w-[80px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <NavContent />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex items-center justify-center absolute top-8 -right-3.5 w-7 h-7 rounded-full bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-color)] shadow-sm z-50 transition-transform duration-300 opacity-0 group-hover/sidebar:opacity-100",
            isCollapsed ? "rotate-180" : "rotate-0"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className="h-[60px] flex items-center justify-between px-4 lg:px-8 border-b border-[var(--border-color)] bg-[var(--surface-color)]/80 backdrop-blur-md z-30">
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 mr-3 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-color)] lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-[var(--text-color)] tracking-tight hidden sm:block">
              {/* Route dependent title could be mapped here, but we'll let pages set their own headers or just show POS */}
              Terminal
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className={cn(
              "hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
              isManager 
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" 
                : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            )}>
              {isManager ? <Shield size={14} /> : <Badge size={14} />}
              <span>{isManager ? "Manager" : "Cashier"}</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[var(--text-muted)] hover:bg-[var(--border-color)] transition-colors"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-pos-navy)] text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
              >
                {user.initials}
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-[var(--surface-color)] border border-[var(--border-color)] z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-[var(--border-color)]">
                      <p className="text-sm font-medium text-[var(--text-color)] truncate">{user.username}</p>
                      <p className="text-xs text-[var(--text-muted)] capitalize">{user.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[var(--bg-color)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}