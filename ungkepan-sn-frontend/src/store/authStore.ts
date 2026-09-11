import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomerUser } from '../api/client'

interface AuthState {
  token: string
  user: CustomerUser | null
  setAuth: (token: string, user: CustomerUser) => void
  setUser: (user: CustomerUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: '',
      user: null,

      setAuth: (token, user) => {
        localStorage.setItem('customer_token', token)
        set({ token, user })
      },
      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('customer_token')
        set({ token: '', user: null })
      },
    }),
    { name: 'ungkepan-sn-auth' }
  )
)