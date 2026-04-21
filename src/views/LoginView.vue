<template>
  <v-container fluid class="login-shell">
    <v-row class="login-grid" no-gutters>
      <v-col cols="12" md="6" class="login-brand">
        <div class="brand-panel">
          <div class="brand-mark">DA</div>
          <div class="brand-text">
            <p class="brand-kicker">Diagon Alley POS</p>
            <h1 class="brand-title">Run the floor with confidence.</h1>
            <p class="brand-subtitle">
              Modern checkout, inventory, and insights designed for fast-moving teams.
            </p>
          </div>
          <div class="brand-metrics">
            <div>
              <p class="metric-label">Daily flow</p>
              <p class="metric-value">12 min setup</p>
            </div>
            <div>
              <p class="metric-label">Staff ready</p>
              <p class="metric-value">Role-based access</p>
            </div>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="login-form">
        <div class="form-panel">
          <div class="form-header">
            <p class="eyebrow">Welcome back</p>
            <h2 class="form-title">Sign in to your workspace</h2>
            <p class="form-subtitle">Select your role to unlock the right tools.</p>
          </div>

          <v-alert v-if="error" type="error" variant="tonal" closable class="mb-6">
            {{ error }}
          </v-alert>

          <div class="role-grid">
            <v-card
              v-for="roleOption in roleOptions"
              :key="roleOption.value"
              class="role-card"
              :class="{ active: selectedRole === roleOption.value }"
              elevation="0"
              @click="selectRole(roleOption.value)"
            >
              <v-icon :icon="roleOption.icon" size="28" />
              <div>
                <p class="role-title">{{ roleOption.title }}</p>
                <p class="role-desc">{{ roleOption.description }}</p>
              </div>
            </v-card>
          </div>

          <v-text-field
            v-model="username"
            label="Username"
            type="text"
            variant="outlined"
            class="mb-4"
            :disabled="isLoading || !selectedRole"
            prepend-inner-icon="mdi-account"
            @keyup.enter="handleLogin"
          />

          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            variant="outlined"
            class="mb-6"
            :disabled="isLoading || !selectedRole"
            prepend-inner-icon="mdi-lock"
            @keyup.enter="handleLogin"
          />

          <v-btn
            block
            size="large"
            color="primary"
            :loading="isLoading"
            :disabled="!selectedRole"
            @click="handleLogin"
            class="mb-4"
          >
            Sign in as {{ selectedRoleLabel }}
          </v-btn>

          <div class="form-footer">
            <p class="helper">Owner/Admin? Create your account to get started.</p>
            <v-btn variant="text" color="secondary" @click="goToSignup">Create owner account</v-btn>
          </div>

          <v-card class="bg-surface pa-4 mt-6" flat>
            <p class="text-caption font-weight-bold mb-2">Demo Credentials:</p>
            <p class="text-caption mb-1"><strong>Username:</strong> admin</p>
            <p class="text-caption"><strong>Password:</strong> (set on first login)</p>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type RoleChoice = 'worker' | 'owner'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('admin')
const password = ref('')
const isLoading = ref(false)
const error = ref('')
const selectedRole = ref<RoleChoice | null>(null)

const roleOptions = [
  {
    value: 'worker' as RoleChoice,
    title: 'Worker',
    description: 'Cashier access for sales and receipts.',
    icon: 'mdi-badge-account-outline',
  },
  {
    value: 'owner' as RoleChoice,
    title: 'Owner/Admin',
    description: 'Full control of reports, staff, and settings.',
    icon: 'mdi-shield-account-outline',
  },
]

const selectedRoleLabel = computed(() =>
  selectedRole.value === 'owner' ? 'Owner/Admin' : 'Worker',
)

const selectRole = (role: RoleChoice) => {
  selectedRole.value = role
}

const goToSignup = () => {
  router.push('/signup')
}

const handleLogin = async () => {
  if (!selectedRole.value) {
    error.value = 'Please choose a role to continue.'
    return
  }

  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password.'
    return
  }

  isLoading.value = true
  error.value = ''

  const result = await authStore.login(username.value, password.value)

  if (result.success) {
    const roleMismatch =
      (selectedRole.value === 'worker' && authStore.isManager) ||
      (selectedRole.value === 'owner' && authStore.isCashier)

    if (roleMismatch) {
      authStore.logout()
      error.value = 'Role mismatch. Please select the correct role.'
      isLoading.value = false
      return
    }

    const redirectPath = authStore.isManager ? '/dashboard' : '/sales'
    router.push(redirectPath)
  } else {
    error.value = result.error || 'Login failed. Please try again.'
  }

  isLoading.value = false
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  padding: 0;
}

.login-grid {
  min-height: 100vh;
}

.login-brand {
  background: linear-gradient(140deg, #1f2a44 0%, #111827 60%);
  color: #f9fafb;
  display: flex;
  align-items: center;
  padding: 48px;
}

.brand-panel {
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brand-mark {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--pos-accent);
  display: grid;
  place-items: center;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.brand-kicker {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 11px;
  opacity: 0.7;
}

.brand-title {
  font-size: 34px;
  margin-top: 12px;
  line-height: 1.2;
}

.brand-subtitle {
  color: #e5e7eb;
  margin-top: 12px;
}

.brand-metrics {
  display: flex;
  gap: 32px;
}

.metric-label {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 10px;
  color: #fcd34d;
}

.metric-value {
  font-weight: 600;
  margin-top: 6px;
}

.login-form {
  display: flex;
  align-items: center;
  padding: 48px;
  background: var(--pos-sand);
}

.form-panel {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
}

.form-header {
  margin-bottom: 24px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 11px;
  color: var(--pos-muted);
}

.form-title {
  font-size: 26px;
  margin-top: 10px;
}

.form-subtitle {
  color: var(--pos-muted);
  margin-top: 8px;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.role-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--pos-border);
  background: #ffffff;
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-card.active {
  border-color: var(--pos-accent);
  box-shadow: 0 10px 24px rgba(217, 119, 6, 0.2);
  transform: translateY(-2px);
}

.role-title {
  font-weight: 600;
}

.role-desc {
  font-size: 12px;
  color: var(--pos-muted);
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.helper {
  font-size: 13px;
  color: var(--pos-muted);
}

@media (max-width: 960px) {
  .login-brand {
    display: none;
  }

  .login-form {
    padding: 32px 20px;
  }

  .role-grid {
    grid-template-columns: 1fr;
  }
}
</style>
