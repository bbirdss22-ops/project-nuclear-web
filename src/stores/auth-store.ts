import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'pn_access_token'

export interface User {
  id: string
  username: string
  role: string
}

interface AuthStore {
  user: User | null
  accessToken: string
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setAccessToken: (token: string) => void
  login: (user: User, token: string) => void
  logout: () => void
  loadFromCookie: () => void
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  accessToken: '',
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setAccessToken: (accessToken) => {
    setCookie(ACCESS_TOKEN, accessToken)
    set({ accessToken })
  },

  login: (user, token) => {
    setCookie(ACCESS_TOKEN, token)
    set({ user, accessToken: token, isAuthenticated: true })
  },

  logout: () => {
    removeCookie(ACCESS_TOKEN)
    set({ user: null, accessToken: '', isAuthenticated: false })
  },

  loadFromCookie: () => {
    const token = getCookie(ACCESS_TOKEN)
    if (token) {
      set({ accessToken: token, isAuthenticated: true })
    }
  },
}))
