<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type RoleChoice = 'worker' | 'owner'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('admin')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const selectedRole = ref<RoleChoice | null>(null)

const roleOptions = [
  { value: 'owner' as RoleChoice,  title: 'Manager',  sub: 'Full access',      icon: 'mdi-shield-account-outline' },
  { value: 'worker' as RoleChoice, title: 'Cashier',  sub: 'Sales & receipts', icon: 'mdi-badge-account-outline' },
]

const selectedRoleLabel = computed(() =>
  selectedRole.value === 'owner' ? 'Manager' : 'Cashier',
)

const selectRole = (role: RoleChoice) => {
  selectedRole.value = role
}

const handleLogin = async () => {
  if (!selectedRole.value) { error.value = 'Please choose a role to continue.'; return }
  if (!username.value || !password.value) { error.value = 'Please enter both username and password.'; return }

  isLoading.value = true
  error.value = ''
  const result = await authStore.login(username.value, password.value)

  if (result.success) {
    const roleMismatch =
      (selectedRole.value === 'worker' && authStore.isManager) ||
      (selectedRole.value === 'owner' && authStore.isCashier)

    if (roleMismatch) {
      authStore.logout()
      error.value = 'Wrong role selected. Please pick the correct role for your account.'
      isLoading.value = false
      return
    }
    router.push(authStore.isManager ? '/dashboard' : '/sales')
  } else {
    error.value = result.error || 'Login failed. Please check your credentials.'
  }
  isLoading.value = false
}

const HERO = 'https://images.unsplash.com/photo-1746702475474-e95e3365fe98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080'

const features = [
  { icon: 'mdi-chart-bar',            label: 'Analytics',  desc: 'Real-time insights'   },
  { icon: 'mdi-package-variant-closed', label: 'Inventory',  desc: 'Smart stock control'  },
  { icon: 'mdi-receipt-text-outline',  label: 'Receipts',   desc: 'Digital & print-ready' },
  { icon: 'mdi-account-group-outline', label: 'Staff',      desc: 'Role-based access'    },
]
</script>

<template>
  <div class="login-shell">

    <!-- ── Left: Photo panel ── -->
    <div class="left-panel">
      <img :src="HERO" alt="Store interior" class="hero-img" />
      <div class="overlay-gradient" />
      <div class="overlay-gradient2" />
      <div class="overlay-navy" />
      <div class="dot-grid" />
      <div class="glow-top" />
      <div class="glow-bottom" />

      <div class="left-content">
        <!-- Logo -->
        <div class="left-logo">
          <div class="left-mark">DA</div>
          <div>
            <div class="left-brand-name">Diagon Alley</div>
            <div class="left-brand-sub">Point of Sale</div>
          </div>
        </div>

        <!-- Hero copy -->
        <div class="left-copy">
          <div class="left-eyebrow">Next-generation retail</div>
          <h1 class="left-headline">Commerce<br /><em>reimagined.</em></h1>
          <p class="left-desc">
            A complete POS experience — crafted for modern merchants who demand precision and elegance.
          </p>
        </div>

        <!-- Feature cards -->
        <div class="feature-grid">
          <div v-for="f in features" :key="f.label" class="feature-card">
            <v-icon :icon="f.icon" size="17" class="feature-icon" />
            <div class="feature-label">{{ f.label }}</div>
            <div class="feature-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right: Form panel ── -->
    <div class="right-panel">
      <div class="glow-right-top" />
      <div class="glow-right-bottom" />

      <!-- Mobile logo -->
      <div class="mobile-logo">
        <div class="left-mark" style="width:38px;height:38px;font-size:11px;">DA</div>
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--pos-ink)">Diagon Alley</div>
          <div style="font-size:10px;color:var(--pos-accent-strong);text-transform:uppercase;letter-spacing:0.12em">Point of Sale</div>
        </div>
      </div>

      <div class="form-wrap">
        <div class="form-heading">
          <h2 class="form-title">Welcome <span class="accent-word">back</span></h2>
          <p class="form-sub">Sign in to your POS account to continue.</p>
        </div>

        <!-- Error -->
        <div v-if="error" class="error-banner">
          <v-icon icon="mdi-alert-circle-outline" size="16" />
          {{ error }}
        </div>

        <!-- Role selector -->
        <div class="section-label">Sign in as</div>
        <div class="role-grid">
          <button
            v-for="r in roleOptions"
            :key="r.value"
            class="role-card"
            :class="{ 'role-card--active': selectedRole === r.value }"
            type="button"
            @click="selectRole(r.value)"
          >
            <v-icon
              :icon="r.icon"
              size="20"
              :class="selectedRole === r.value ? 'role-icon--active' : 'role-icon'"
            />
            <div class="role-title">{{ r.title }}</div>
            <div class="role-sub">{{ r.sub }}</div>
            <div v-if="selectedRole === r.value" class="role-check">
              <v-icon icon="mdi-check" size="10" />
            </div>
          </button>
        </div>

        <!-- Fields -->
        <div class="field-group">
          <div class="field-label">Username</div>
          <div class="field-wrap">
            <v-icon icon="mdi-account-outline" size="16" class="field-icon" />
            <input
              v-model="username"
              type="text"
              class="field-input"
              placeholder="Enter your username"
              autocomplete="username"
              :disabled="isLoading"
              @keyup.enter="handleLogin"
            />
          </div>
        </div>

        <div class="field-group">
          <div class="field-label">Password</div>
          <div class="field-wrap">
            <v-icon icon="mdi-lock-outline" size="16" class="field-icon" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              placeholder="••••••••"
              autocomplete="current-password"
              :disabled="isLoading"
              @keyup.enter="handleLogin"
            />
            <button class="pw-toggle" type="button" @click="showPassword = !showPassword">
              <v-icon :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" size="16" />
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          class="submit-btn"
          :class="{ 'submit-btn--loading': isLoading }"
          :disabled="isLoading || !selectedRole"
          @click="handleLogin"
        >
          <span class="submit-shimmer" />
          <span class="submit-content">
            <template v-if="isLoading">
              <svg class="spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in…
            </template>
            <template v-else>
              Sign in as {{ selectedRoleLabel }}
              <v-icon icon="mdi-arrow-right" size="16" />
            </template>
          </span>
        </button>

        <p class="form-footer-note">
          New store owner?
          <button type="button" class="link-btn" @click="router.push('/signup')">Create an account</button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Shell ── */
.login-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--pos-bg);
}

/* ── Left photo panel ── */
.left-panel {
  display: none;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .left-panel { display: flex; width: 52%; }
}

.hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.05);
  filter: saturate(1.1);
}

.overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
}
.overlay-gradient2 {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
}
.overlay-navy {
  position: absolute;
  inset: 0;
  background: rgba(30,58,95,0.3);
  mix-blend-mode: multiply;
}
.dot-grid {
  position: absolute;
  inset: 0;
  opacity: 0.07;
  background-image: radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px);
  background-size: 30px 30px;
}
.glow-top {
  position: absolute;
  top: -96px;
  right: 0;
  width: 384px;
  height: 384px;
  border-radius: 50%;
  background: rgba(245,158,11,0.25);
  filter: blur(80px);
  pointer-events: none;
}
.glow-bottom {
  position: absolute;
  bottom: 0;
  left: -64px;
  width: 288px;
  height: 288px;
  border-radius: 50%;
  background: rgba(180,83,9,0.2);
  filter: blur(60px);
  pointer-events: none;
}

.left-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 40px 48px;
  gap: 0;
}

/* Logo */
.left-logo { display: flex; align-items: center; gap: 12px; }
.left-mark {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  display: grid;
  place-items: center;
  letter-spacing: 0.08em;
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(245,158,11,0.4);
}
.left-brand-name { font-weight: 600; font-size: 14px; color: #fff; line-height: 1; }
.left-brand-sub { font-size: 10px; color: rgba(251,191,36,0.7); text-transform: uppercase; letter-spacing: 0.18em; margin-top: 3px; }

/* Hero copy */
.left-copy { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.left-eyebrow { font-size: 10px; color: rgba(251,191,36,0.6); text-transform: uppercase; letter-spacing: 0.22em; font-weight: 600; margin-bottom: 16px; }

.left-headline {
  font-size: clamp(2.4rem, 3.8vw, 3.4rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin-bottom: 18px;
  font-family: Georgia, 'Times New Roman', serif;
}
.left-headline em { color: #fcd34d; font-style: italic; }

.left-desc { color: rgba(255,255,255,0.55); font-size: 0.9rem; max-width: 280px; line-height: 1.6; margin-bottom: 32px; }

/* Feature grid */
.feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 320px; }

.feature-card {
  padding: 14px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.11);
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(14px);
  transition: border-color 0.25s;
  cursor: default;
}
.feature-card:hover { border-color: rgba(255,255,255,0.22); }
.feature-icon { color: #fbbf24; margin-bottom: 8px; display: block; }
.feature-label { font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 0.03em; }
.feature-desc { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; line-height: 1.3; }

/* ── Right form panel ── */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  padding: 40px 24px;
  position: relative;
  background: var(--pos-bg);
}

.glow-right-top {
  position: absolute;
  top: 0;
  right: 0;
  width: 288px;
  height: 288px;
  border-radius: 50%;
  background: rgba(245,158,11,0.05);
  filter: blur(60px);
  pointer-events: none;
}
.glow-right-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 192px;
  height: 192px;
  border-radius: 50%;
  background: rgba(245,158,11,0.04);
  filter: blur(40px);
  pointer-events: none;
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 36px;
}
@media (min-width: 1024px) { .mobile-logo { display: none; } }

.form-wrap {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
}

/* Heading */
.form-heading { margin-bottom: 24px; }
.form-title { font-size: 1.75rem; font-weight: 700; color: var(--pos-ink); letter-spacing: -0.02em; line-height: 1.2; }
.accent-word { color: var(--pos-accent-strong); }
.form-sub { font-size: 14px; color: var(--pos-muted); margin-top: 6px; }

/* Error */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.2);
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 16px;
}

/* Section label */
.section-label { font-size: 11px; font-weight: 700; color: var(--pos-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px; }

/* Role cards */
.role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }

.role-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  border-radius: 16px;
  border: 2px solid var(--pos-border);
  background: var(--pos-surface);
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
  overflow: hidden;
  font-family: inherit;
}
.role-card:hover { border-color: rgba(245,158,11,0.4); }
.role-card--active { border-color: var(--pos-accent) !important; background: var(--pos-accent-soft) !important; }

.role-icon { color: var(--pos-muted); transition: color 0.18s; }
.role-icon--active { color: var(--pos-accent-strong); }
.role-title { font-size: 13px; font-weight: 700; color: var(--pos-ink); }
.role-sub { font-size: 10px; color: var(--pos-muted); }

.role-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--pos-accent);
  color: #fff;
  display: grid;
  place-items: center;
}

/* Fields */
.field-group { margin-bottom: 14px; }
.field-label { font-size: 11px; font-weight: 600; color: var(--pos-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }

.field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.field-icon {
  position: absolute;
  left: 12px;
  color: var(--pos-muted);
  pointer-events: none;
  flex-shrink: 0;
}
.field-input {
  width: 100%;
  padding: 11px 40px 11px 36px;
  border-radius: 12px;
  border: 1.5px solid var(--pos-border);
  background: var(--pos-surface);
  font-size: 14px;
  color: var(--pos-ink);
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}
.field-input::placeholder { color: var(--pos-muted); }
.field-input:focus {
  border-color: var(--pos-accent);
  box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
}
.field-input:disabled { opacity: 0.6; }

.pw-toggle {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--pos-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  transition: color 0.15s;
}
.pw-toggle:hover { color: var(--pos-ink); }

/* Submit */
.submit-btn {
  position: relative;
  width: 100%;
  margin-top: 20px;
  padding: 14px 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: opacity 0.15s, transform 0.1s;
  box-shadow: 0 4px 16px rgba(245,158,11,0.35);
  font-family: inherit;
}
.submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.submit-shimmer {
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  animation: shimmer 2.2s ease infinite;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  pointer-events: none;
}

.submit-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Footer */
.form-footer-note { text-align: center; font-size: 12px; color: var(--pos-muted); margin-top: 20px; }
.link-btn { background: none; border: none; color: var(--pos-accent-strong); font-weight: 600; cursor: pointer; font-size: 12px; font-family: inherit; }
.link-btn:hover { text-decoration: underline; }
</style>
