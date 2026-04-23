import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Check, Store, MapPin, Phone, Mail, DollarSign, Percent, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    storeName: "",
    branchName: "",
    address: "",
    phone: "",
    email: "",
    currency: "GHS",
    taxRate: "7.5",
    taxLabel: "VAT"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboarding();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bento-card p-8 sm:p-12 relative overflow-hidden">
        {/* Soft decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-pos-accent-soft)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
            <Store size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-[var(--text-color)] tracking-tight">Welcome to Diagon Alley</h2>
          <p className="mt-2 text-[var(--text-muted)] text-lg font-light">Let's set up your store profile before you begin.</p>
        </div>

        <form className="mt-10 space-y-8 relative z-10" onSubmit={handleSubmit}>
          {/* Section 1: Basic Info */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-[var(--text-color)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
              Store Details
            </h3>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-color)] ml-1">Store Name *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <Store size={18} />
                  </div>
                  <input
                    required
                    name="storeName"
                    value={form.storeName}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)] placeholder-[var(--text-muted)]"
                    placeholder="e.g. Flourish & Blotts"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-color)] ml-1">Branch Name</label>
                <input
                  name="branchName"
                  value={form.branchName}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)] placeholder-[var(--text-muted)]"
                  placeholder="Main Branch"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-[var(--text-color)] ml-1">Address</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <MapPin size={18} />
                  </div>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)] placeholder-[var(--text-muted)]"
                    placeholder="123 Cobblestone Way"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-color)] ml-1">Phone</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <Phone size={18} />
                  </div>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)] placeholder-[var(--text-muted)]"
                    placeholder="+233..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-color)] ml-1">Email</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <Mail size={18} />
                  </div>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)] placeholder-[var(--text-muted)]"
                    placeholder="shop@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Finances */}
          <div className="space-y-5 pt-4">
            <h3 className="text-lg font-semibold text-[var(--text-color)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
              Financial Settings
            </h3>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-color)] ml-1">Currency</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <DollarSign size={18} />
                  </div>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)] appearance-none"
                  >
                    <option value="GHS">GHS (₵)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-color)] ml-1">Tax Label</label>
                <input
                  name="taxLabel"
                  value={form.taxLabel}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)]"
                  placeholder="e.g. VAT"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--text-color)] ml-1">Tax Rate (%)</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <Percent size={18} />
                  </div>
                  <input
                    name="taxRate"
                    type="number"
                    step="0.1"
                    value={form.taxRate}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-[var(--text-color)]"
                    placeholder="7.5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] text-white font-semibold text-lg shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)]"
            >
              Complete Setup
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
