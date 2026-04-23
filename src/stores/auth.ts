import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  username: string
  role: 'cashier' | 'manager'
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('authToken'))
  const storedUser = localStorage.getItem('authUser')
  const user = ref<User | null>(storedUser ? JSON.parse(storedUser) : null)
  const onboardingCompleted = ref<boolean>(localStorage.getItem('onboardingCompleted') === 'true')

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isCashier = computed(() => user.value?.role === 'cashier')
  const isManager = computed(() => user.value?.role === 'manager')

  // Actions
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await response.json()
      token.value = data.token
      user.value = data.user

      // Persist to localStorage
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', JSON.stringify(data.user))

      if (data.user.role === 'manager') {
        await fetchOnboardingStatus()
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    onboardingCompleted.value = false
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.removeItem('onboardingCompleted')
  }

  const signupOwner = async (payload: {
    username: string
    password: string
    firstName: string
    lastName: string
    phone: string
    country: string
    email?: string
  }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create owner account')
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const fetchOnboardingStatus = async () => {
    if (!token.value || !isManager.value) {
      return false
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/onboarding/status`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.value}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding status')
      }

      const data = await response.json()
      onboardingCompleted.value = Boolean(data.onboardingCompleted)
      localStorage.setItem('onboardingCompleted', String(onboardingCompleted.value))
      return onboardingCompleted.value
    } catch (error) {
      onboardingCompleted.value = false
      localStorage.setItem('onboardingCompleted', 'false')
      return false
    }
  }

  const completeOnboarding = async (payload: {
    storeName: string
    address?: string
    phone: string
    email?: string
    currency?: string
    taxRate?: number
  }) => {
    if (!token.value) {
      return { success: false, error: 'Missing auth token' }
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/onboarding/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.value}`,
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to complete onboarding')
      }

      onboardingCompleted.value = true
      localStorage.setItem('onboardingCompleted', 'true')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const createUser = async (username: string, password: string, role: 'cashier' | 'manager') => {
    if (!isManager.value) {
      return { success: false, error: 'Only managers can create users' }
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.value}`,
          },
          body: JSON.stringify({ username, password, role }),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create user')
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return {
    // State
    token,
    user,
    onboardingCompleted,
    // Computed
    isAuthenticated,
    isCashier,
    isManager,
    // Actions
    login,
    logout,
    signupOwner,
    fetchOnboardingStatus,
    completeOnboarding,
    createUser,
  }
})
