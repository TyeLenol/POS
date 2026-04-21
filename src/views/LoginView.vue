<template>
  <v-container class="login-container" max-width="sm">
    <v-row class="align-center justify-center min-vh">
      <v-col class="text-center">
        <!-- Logo / Title -->
        <div class="mb-8">
          <h1 class="text-h3 font-weight-bold mb-2">Diagon Alley</h1>
          <p class="text-subtitle-1 text-disabled">Point of Sale System</p>
        </div>

        <!-- Login Card -->
        <v-card class="login-card" elevation="0" outlined>
          <v-card-text class="pa-8">
            <h2 class="text-h5 font-weight-bold mb-6 text-center">Sign In</h2>

            <!-- Alert for errors -->
            <v-alert v-if="error" type="error" variant="tonal" closable class="mb-6">
              {{ error }}
            </v-alert>

            <!-- Username Field -->
            <v-text-field
              v-model="username"
              label="Username"
              type="text"
              variant="outlined"
              class="mb-4"
              :disabled="isLoading"
              prepend-inner-icon="mdi-account"
              @keyup.enter="handleLogin"
            />

            <!-- Password Field -->
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              variant="outlined"
              class="mb-6"
              :disabled="isLoading"
              prepend-inner-icon="mdi-lock"
              @keyup.enter="handleLogin"
            />

            <!-- Login Button -->
            <v-btn
              block
              size="large"
              color="primary"
              :loading="isLoading"
              @click="handleLogin"
              class="mb-4"
            >
              Sign In
            </v-btn>

            <!-- Demo credentials hint -->
            <v-card class="bg-surface pa-4 mt-6" flat>
              <p class="text-caption font-weight-bold mb-2">Demo Credentials:</p>
              <p class="text-caption mb-1"><strong>Username:</strong> admin</p>
              <p class="text-caption"><strong>Password:</strong> (set on first login)</p>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('admin')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password'
    return
  }

  isLoading.value = true
  error.value = ''

  const result = await authStore.login(username.value, password.value)

  if (result.success) {
    // Redirect based on role
    const redirectPath = authStore.isManager ? '/dashboard' : '/sales'
    router.push(redirectPath)
  } else {
    error.value = result.error || 'Login failed. Please try again.'
  }

  isLoading.value = false
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.min-vh {
  min-height: 100vh;
}

.login-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
