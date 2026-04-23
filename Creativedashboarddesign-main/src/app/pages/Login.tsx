import React, { useState, useId } from "react";
import { useNavigate, useInRouterContext, MemoryRouter } from "react-router";
import {
  Eye, EyeOff, AlertCircle, ChevronDown,
  Shield, UserCog, Wallet, BarChart3, Package, FileText, Users,
  ArrowRight, CheckCircle2, Mail, X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, AuthProvider } from "../context/AuthContext";
import { cn } from "../utils/cn";

/* ─────────────────────── constants ──────────────────────── */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1746702475474-e95e3365fe98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwYm91dGlxdWUlMjBzdG9yZSUyMGdvbGRlbiUyMGhvdXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzY4Mjk5ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080";

const COUNTRIES = [
  { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "Ethiopia", code: "ET", dialCode: "+251", flag: "🇪🇹" },
  { name: "Tanzania", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
  { name: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
  { name: "Senegal", code: "SN", dialCode: "+221", flag: "🇸🇳" },
  { name: "Côte d'Ivoire", code: "CI", dialCode: "+225", flag: "🇨🇮" },
  { name: "Cameroon", code: "CM", dialCode: "+237", flag: "🇨🇲" },
  { name: "Zimbabwe", code: "ZW", dialCode: "+263", flag: "🇿🇼" },
  { name: "Zambia", code: "ZM", dialCode: "+260", flag: "🇿🇲" },
  { name: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
  { name: "Botswana", code: "BW", dialCode: "+267", flag: "🇧🇼" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
];

const LEFT_FEATURES = [
  { Icon: BarChart3, label: "Analytics", desc: "Real-time insights" },
  { Icon: Package, label: "Inventory", desc: "Smart stock control" },
  { Icon: FileText, label: "Receipts", desc: "Digital & print-ready" },
  { Icon: Users, label: "Staff", desc: "Role-based access" },
];

/* ─────────────────────── password strength ──────────────────────── */
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const meta = [
    { label: "Too short", bar: "bg-red-400" },
    { label: "Weak", bar: "bg-red-400" },
    { label: "Fair", bar: "bg-orange-400" },
    { label: "Good", bar: "bg-amber-400" },
    { label: "Strong", bar: "bg-emerald-400" },
  ];
  return { score, ...meta[score] };
}

/* ─────────────────────── shared input styles ──────────────────────── */
const inputBase =
  "w-full px-4 py-3 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)]/60 focus:border-[var(--color-pos-accent)]/60 transition-all text-[var(--text-color)] placeholder-[var(--text-muted)] text-sm";

/* ─────────────────────── FloatingLabel input ──────────────────────── */
interface FieldProps {
  label: string;
  id?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
}

function Field({ label, id, type = "text", value, onChange, placeholder, rightSlot, autoComplete }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const uid = useId();
  const resolvedId = id ?? uid;
  const active = focused || !!value;

  return (
    <div className="relative group">
      {/* floating label */}
      <label
        htmlFor={resolvedId}
        className={cn("absolute left-4 transition-all duration-200 pointer-events-none select-none z-10 text-[11px] text-[13px]", active
    ? "-top-2.5 text-[10px] px-1 bg-[var(--bg-color)] text-[var(--color-pos-accent-strong)] font-semibold rounded tracking-wide"
    : "top-3 text-sm text-[var(--text-muted)]")}
      >
        {label}
      </label>
      <input
        id={resolvedId}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={active ? placeholder : ""}
        className={cn(inputBase, rightSlot ? "pr-12" : "")}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  );
}

/* ─────────────────────── main component ──────────────────────── */
function LoginInner() {
  const [isSignUp, setIsSignUp] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [role, setRole] = useState<"manager" | "cashier">("manager");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Sign-up
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [dialCode, setDialCode] = useState(COUNTRIES[0].dialCode);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login, onboardingCompleted } = useAuth();
  const navigate = useNavigate();

  const strength = getStrength(password);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = COUNTRIES.find((c) => c.code === e.target.value);
    if (found) { setCountry(found); setDialCode(found.dialCode); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate latency

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) { setError("Please enter your full name."); setLoading(false); return; }
      if (!email.trim()) { setError("Please enter your email address."); setLoading(false); return; }
      if (!phone.trim()) { setError("Please enter your phone number."); setLoading(false); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); setLoading(false); return; }
      login(`${firstName} ${lastName}`, "manager");
      navigate("/onboarding");
    } else {
      if (!loginEmail.trim() || !loginPassword) { setError("Please enter your credentials."); setLoading(false); return; }
      login(loginEmail, role);
      if (role === "manager") {
        if (!onboardingCompleted) navigate("/onboarding");
        else navigate("/dashboard");
      } else {
        navigate("/sales");
      }
    }
    setLoading(false);
  };

  const switchMode = (toSignUp: boolean) => {
    setIsSignUp(toSignUp);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setLoginPassword("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-color)]">

      {/* ══════════════════ LEFT MEDIA PANEL ══════════════════ */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden">
        {/* Hero photo */}
        <img
          src={HERO_IMAGE}
          alt="Store interior"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          style={{ filter: "saturate(1.1)" }}
        />

        {/* Layered overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-[var(--color-pos-navy)]/30 mix-blend-multiply" />

        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Ambient glow blobs */}
        <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-amber-500/25 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-amber-700/20 blur-[60px] pointer-events-none" />

        {/* ── Content layer ── */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo lockup */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-600/40">
              <span className="text-white font-bold text-sm tracking-tighter">DA</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm tracking-wide leading-none">Diagon Alley</p>
              <p className="text-amber-400/70 text-[10px] tracking-[0.18em] uppercase mt-0.5">Point of Sale</p>
            </div>
          </motion.div>

          {/* Centre hero copy */}
          <div className="flex-1 flex flex-col justify-center mt-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="text-amber-400/60 text-[10px] tracking-[0.22em] uppercase font-semibold mb-5">
                Next-generation retail
              </p>
              <h1
                className="text-white leading-[1.05] tracking-tight mb-6"
                style={{ fontSize: "clamp(2.6rem, 4vw, 3.6rem)", fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Commerce<br />
                <em className="text-amber-300 not-italic" style={{ fontStyle: "italic" }}>
                  reimagined.
                </em>
              </h1>
              <p className="text-white/55 text-[0.9rem] max-w-[280px] leading-relaxed">
                A complete POS experience — crafted for modern merchants who demand precision and elegance.
              </p>
            </motion.div>

            {/* ── Bento feature cards ── */}
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-sm">
              {LEFT_FEATURES.map(({ Icon, label, desc }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.3 + i * 0.07 }}
                  className="group relative p-4 rounded-2xl overflow-hidden border border-white/[0.11] hover:border-white/20 transition-all duration-300 cursor-default"
                  style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(14px)" }}
                >
                  {/* hover shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />
                  <Icon size={17} className="text-amber-400 mb-2.5" />
                  <p className="text-white text-xs font-semibold tracking-wide leading-none">{label}</p>
                  <p className="text-white/45 text-[11px] mt-1 leading-none">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-between pt-6 border-t border-white/10"
          >
            
            
          </motion.div>
        </div>
      </div>

      {/* ══════════════════ RIGHT FORM PANEL ══════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto px-5 sm:px-10 bg-[var(--bg-color)] relative">
        {/* subtle warm gradient backdrop */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-amber-400/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-[420px] py-10">

          {/* Mobile logo (hidden on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden flex items-center gap-3 justify-center mb-10"
          >
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-white font-bold text-sm">DA</span>
            </div>
            <div>
              <p className="text-[var(--text-color)] font-semibold text-sm leading-none">Diagon Alley</p>
              <p className="text-[var(--color-pos-accent-strong)] text-[10px] tracking-widest uppercase mt-0.5">Point of Sale</p>
            </div>
          </motion.div>

          {/* ── Heading ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "hd-su" : "hd-li"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="mb-7"
            >
              <h2
                className="tracking-tight text-[var(--text-color)]"
                style={{ fontSize: "1.75rem" }}
              >
                {isSignUp ? (
                  <>Create your <span className="text-[var(--color-pos-accent-strong)]" style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}>account</span></>
                ) : (
                  <>Welcome <span className="text-[var(--color-pos-accent-strong)] not-italic" style={{ fontFamily: "Inter, sans-serif" }}>back</span></>
                )}
              </h2>
              <p className="text-[var(--text-muted)] text-sm mt-1.5">
                {isSignUp
                  ? "Set up your store as a Manager to get started."
                  : "Sign in to your POS account to continue."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* ── Mode toggle pill ── */}
          <div className="flex p-1 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] mb-7 shadow-sm">
            {(["Sign In", "Create Account"] as const).map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => switchMode(i === 1)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  (i === 1) === isSignUp
                    ? "bg-[var(--color-pos-accent)] text-white shadow-md shadow-amber-500/25"
                    : "text-[var(--text-muted)] hover:text-[var(--text-color)]"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Error banner ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center gap-3"
              >
                <AlertCircle size={16} className="text-red-500 dark:text-red-400 shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Forms ── */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {isSignUp ? (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Albus" autoComplete="given-name" />
                    <Field label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dumbledore" autoComplete="family-name" />
                  </div>

                  {/* Email */}
                  <Field label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />

                  {/* Country */}
                  <div className="relative">
                    <label className={cn(
                      "absolute left-4 z-10 transition-all duration-200 pointer-events-none select-none",
                      country ? "-top-2.5 text-[10px] px-1 bg-[var(--bg-color)] text-[var(--color-pos-accent-strong)] font-semibold rounded tracking-wide"
                               : "top-3 text-sm text-[var(--text-muted)]"
                    )}>Country</label>
                    <select
                      value={country.code}
                      onChange={handleCountryChange}
                      className={cn(inputBase, "appearance-none pr-9 cursor-pointer")}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>

                  {/* Phone */}
                  <div className="flex gap-2">
                    <div className="relative w-28 shrink-0">
                      <select
                        value={dialCode}
                        onChange={(e) => setDialCode(e.target.value)}
                        className={cn(inputBase, "appearance-none pr-6 text-center cursor-pointer")}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                    <div className="flex-1">
                      <Field label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="024 000 0000" autoComplete="tel" />
                    </div>
                  </div>

                  {/* Password with strength */}
                  <div className="space-y-2">
                    <Field
                      label="Password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      rightSlot={
                        <button type="button" onClick={() => setShowPw(!showPw)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    {/* Strength bar */}
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1.5"
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((n) => (
                            <div
                              key={n}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-all duration-400",
                                strength.score >= n ? strength.bar : "bg-[var(--border-color)]"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Password strength:{" "}
                          <span className={cn(
                            "font-medium",
                            strength.score <= 1 ? "text-red-500" :
                            strength.score === 2 ? "text-orange-500" :
                            strength.score === 3 ? "text-amber-500" : "text-emerald-500"
                          )}>{strength.label}</span>
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="relative">
                    <Field
                      label="Confirm Password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      rightSlot={
                        confirmPassword && confirmPassword === password ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors">
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )
                      }
                    />
                  </div>

                  {/* Manager notice */}
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/8">
                    <Shield size={15} className="text-[var(--color-pos-accent-strong)] mt-0.5 shrink-0" />
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Sign-up is for{" "}
                      <strong className="text-[var(--color-pos-accent-strong)]">Managers only</strong>.
                      Cashier accounts are created by the manager from the Staff section.
                    </p>
                  </div>
                </motion.div>

              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Email */}
                  <Field label="Email or Username" type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Enter your email" autoComplete="username" />

                  {/* Password */}
                  <div>
                    <Field
                      label="Password"
                      type={showLoginPw ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      rightSlot={
                        <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors">
                          {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    <div className="flex justify-end mt-2">
                      <button type="button" onClick={() => setShowForgotModal(true)} className="text-[11px] text-[var(--color-pos-accent-strong)] hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] tracking-wide uppercase mb-2.5">Sign in as</p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { r: "manager" as const, label: "Manager", sub: "Full access", Icon: UserCog },
                        { r: "cashier" as const, label: "Cashier", sub: "Sales & receipts", Icon: Wallet },
                      ]).map(({ r, label, sub, Icon }) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={cn(
                            "relative flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-200 overflow-hidden group",
                            role === r
                              ? "border-[var(--color-pos-accent)] bg-[var(--color-pos-accent-soft)]"
                              : "border-[var(--border-color)] bg-[var(--surface-color)] hover:border-amber-200 dark:hover:border-amber-700/40"
                          )}
                        >
                          {role === r && (
                            <motion.div
                              layoutId="role-bg"
                              className="absolute inset-0 bg-amber-400/8 dark:bg-amber-400/6 rounded-2xl"
                              transition={{ duration: 0.2 }}
                            />
                          )}
                          <Icon
                            size={20}
                            className={cn(
                              "relative z-10 transition-colors",
                              role === r ? "text-[var(--color-pos-accent-strong)]" : "text-[var(--text-muted)]"
                            )}
                          />
                          <span className={cn("relative z-10 text-sm font-semibold transition-colors", role === r ? "text-[var(--color-pos-accent-strong)]" : "text-[var(--text-color)]")}>{label}</span>
                          <span className={cn("relative z-10 text-[10px] transition-colors", role === r ? "text-[var(--color-pos-accent-strong)]/70" : "text-[var(--text-muted)]")}>{sub}</span>
                          {role === r && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--color-pos-accent)] flex items-center justify-center">
                              <CheckCircle2 size={10} className="text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Submit CTA ── */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative w-full mt-6 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all",
                "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500",
                "shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40",
                loading && "opacity-80 cursor-not-allowed"
              )}
            >
              {/* shimmer overlay */}
              <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_ease_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {isSignUp ? "Creating account…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    {isSignUp ? "Create Account & Set Up Store" : "Sign In"}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[var(--text-muted)] text-xs mt-8">
            {isSignUp ? "Already have an account?" : "New store owner?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(!isSignUp)}
              className="text-[var(--color-pos-accent-strong)] font-semibold hover:underline"
            >
              {isSignUp ? "Sign in instead" : "Create an account"}
            </button>
          </p>
        </div>

        {/* ══════════════════ FORGOT PASSWORD MODAL ══════════════════ */}
        <AnimatePresence>
          {showForgotModal && (
            <>
              {/* Backdrop */}
              <motion.div
                key="fp-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowForgotModal(false)}
              />

              {/* Modal */}
              <motion.div
                key="fp-modal"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none"
              >
                <div
                  className="relative w-full max-w-sm rounded-3xl bg-[var(--surface-color)] border border-[var(--border-color)] shadow-2xl p-8 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--border-color)] transition-all"
                  >
                    <X size={15} />
                  </button>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-pos-accent-soft)] border border-amber-200/50 dark:border-amber-500/20 flex items-center justify-center mb-5">
                    <Mail size={20} className="text-[var(--color-pos-accent-strong)]" />
                  </div>

                  {/* Copy */}
                  <h3 className="text-[var(--text-color)] mb-2" style={{ fontSize: "1.1rem" }}>
                    Reset your password
                  </h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6">
                    To change your password, contact support at{" "}
                    <a
                      href="mailto:support@dalley.com"
                      className="text-[var(--color-pos-accent-strong)] font-medium hover:underline"
                    >
                      support@dalley.com
                    </a>{" "}
                    for assistance.
                  </p>

                  {/* CTA */}
                  <a
                    href="mailto:support@dalley.com"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] text-white text-sm font-semibold transition-all shadow-md shadow-amber-500/25"
                  >
                    <Mail size={15} />
                    Email Support
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Safe wrapper: provides MemoryRouter + AuthProvider when rendered
      outside the real RouterProvider (e.g. Figma Make isolated preview) ── */
export default function Login() {
  const inRouter = useInRouterContext();
  if (!inRouter) {
    return (
      <AuthProvider>
        <MemoryRouter>
          <LoginInner />
        </MemoryRouter>
      </AuthProvider>
    );
  }
  return <LoginInner />;
}