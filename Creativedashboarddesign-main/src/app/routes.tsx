import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Shell } from "./components/Shell";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import { useAuth } from "./context/AuthContext";

import Reports from "./pages/Reports";
import Receipts from "./pages/Receipts";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";
import Customers from "./pages/Customers";

// Root layout: provides all contexts inside the router tree so every
// component rendered by the router can access ThemeContext, AuthContext, CartContext.
function Root() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Outlet />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Simple wrapper for protected routes
function RequireAuthManager({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "cashier") return <Navigate to="/sales" replace />;
  return <>{children}</>;
}

function RequireAuthCashier({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "manager") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireAuthAny({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const NavigateToLogin = () => <Navigate to="/login" replace />;
const DashboardPage = () => <RequireAuthManager><Dashboard /></RequireAuthManager>;
const SalesPage = () => <RequireAuthCashier><Sales /></RequireAuthCashier>;
const InventoryPage = () => <RequireAuthAny><Inventory /></RequireAuthAny>;
const ReportsPage = () => <RequireAuthManager><Reports /></RequireAuthManager>;
const ReceiptsPage = () => <RequireAuthAny><Receipts /></RequireAuthAny>;
const StaffPage = () => <RequireAuthManager><Staff /></RequireAuthManager>;
const SettingsPage = () => <RequireAuthManager><Settings /></RequireAuthManager>;
const CustomersPage = () => <RequireAuthAny><Customers /></RequireAuthAny>;
const OnboardingPage = () => <RequireAuthManager><Onboarding /></RequireAuthManager>;

const NotFoundPage = () => (
  <div className="p-8 text-center text-[var(--text-muted)]">
    <h2 className="text-2xl font-bold mb-2">404 - Not Found</h2>
    <p>The page you are looking for doesn&apos;t exist.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    // Root provides all context providers — no path so it wraps everything
    path: "/",
    Component: Root,
    children: [
      // Full-page routes (no Shell sidebar/header)
      { path: "login", Component: Login },
      { path: "onboarding", Component: OnboardingPage },
      // Shell-wrapped routes (sidebar + header layout)
      {
        Component: Shell,
        children: [
          { index: true, Component: NavigateToLogin },
          { path: "dashboard", Component: DashboardPage },
          { path: "sales", Component: SalesPage },
          { path: "inventory", Component: InventoryPage },
          { path: "reports", Component: ReportsPage },
          { path: "receipts", Component: ReceiptsPage },
          { path: "staff", Component: StaffPage },
          { path: "settings", Component: SettingsPage },
          { path: "customers", Component: CustomersPage },
          { path: "*", Component: NotFoundPage },
        ],
      },
    ],
  },
]);