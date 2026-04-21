<template>
  <v-container fluid class="signup-shell">
    <v-row class="signup-grid" no-gutters>
      <v-col cols="12" md="5" class="signup-brand">
        <div class="brand-panel">
          <div class="brand-mark">DA</div>
          <div>
            <p class="brand-kicker">Owner/Admin setup</p>
            <h1 class="brand-title">Launch your POS workspace.</h1>
            <p class="brand-subtitle">
              Create the owner account to unlock onboarding and configure your store.
            </p>
          </div>
          <div class="brand-note">
            You will create cashier accounts later from the admin dashboard.
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="7" class="signup-form">
        <div class="form-panel">
          <div class="form-header">
            <p class="eyebrow">Create owner account</p>
            <h2 class="form-title">Business admin sign-up</h2>
            <p class="form-subtitle">Phone is required. Email is optional.</p>
          </div>

          <v-alert v-if="error" type="error" variant="tonal" closable class="mb-6">
            {{ error }}
          </v-alert>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.firstName" label="First name" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.lastName" label="Last name" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.country" label="Country" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.phone" label="Phone number" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.email" label="Email (optional)" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.username" label="Username" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.password"
                label="Password"
                type="password"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.confirmPassword"
                label="Confirm password"
                type="password"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div class="form-actions">
            <v-btn variant="text" @click="goToLogin">Back to login</v-btn>
            <v-btn color="primary" :loading="isLoading" @click="handleSignup">
              Create owner account
            </v-btn>
          </div>

          <v-card class="bg-surface pa-4 mt-6" flat>
            <p class="text-caption font-weight-bold mb-2">Next step:</p>
            <p class="text-caption">
              After sign-up, you will complete onboarding before accessing the POS.
            </p>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref('')

const form = reactive({
  firstName: '',
  lastName: '',
  country: '',
  phone: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
})

const goToLogin = () => {
  router.push('/login')
}

const handleSignup = async () => {
  error.value = ''

  if (!form.firstName || !form.lastName || !form.country || !form.phone) {
    error.value = 'Please fill in all required fields.'
    return
  }

  if (!form.username || !form.password || !form.confirmPassword) {
    error.value = 'Username and password are required.'
    return
  }

  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  const result = await authStore.signupOwner({
    username: form.username,
    password: form.password,
    firstName: form.firstName,
    lastName: form.lastName,
    phone: form.phone,
    country: form.country,
    email: form.email || undefined,
  })

  if (result.success) {
    router.push('/login')
  } else {
    error.value = result.error || 'Failed to create owner account.'
  }

  isLoading.value = false
}
</script>

<style scoped>
.signup-shell {
  min-height: 100vh;
  padding: 0;
}

.signup-grid {
  min-height: 100vh;
}

.signup-brand {
  background: linear-gradient(150deg, #1f2a44 0%, #0f172a 70%);
  color: #f9fafb;
  padding: 48px;
  display: flex;
  align-items: center;
}

.brand-panel {
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  color: #fcd34d;
}

.brand-title {
  font-size: 30px;
  line-height: 1.2;
}

.brand-subtitle {
  color: #e5e7eb;
}

.brand-note {
  font-size: 13px;
  color: #fcd34d;
}

.signup-form {
  background: var(--pos-sand);
  padding: 48px;
  display: flex;
  align-items: center;
}

.form-panel {
  width: 100%;
  max-width: 560px;
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
  font-size: 24px;
  margin-top: 10px;
}

.form-subtitle {
  color: var(--pos-muted);
  margin-top: 8px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  gap: 12px;
}

@media (max-width: 960px) {
  .signup-brand {
    display: none;
  }

  .signup-form {
    padding: 32px 20px;
  }
}
</style>
