import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'pn_access_token'

// Decode JWT payload (base64url) → { sub, username, role } without a library
function decodeJwtUser(token: string): User | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const data = JSON.parse(json)
    if (data?.sub && data?.username && data?.role) {
      return { id: data.sub, username: data.username, role: data.role }
    }
  } catch {
    // invalid token — return null, caller handles it
  }
  return null
}

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
  // Nested auth object for backward compatibility
  auth: {
    user: User | null
    accessToken: string
    setUser: (user: User | null) => void
    setAccessToken: (token: string) => void
    resetAccessToken: () => void
    reset: () => void
    login: (user: User, token: string) => void
    logout: () => void
  }
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
      const user = decodeJwtUser(token)
      set({ accessToken: token, user, isAuthenticated: true })
    }
  },

  // Nested auth object delegates to flat methods
  auth: {
    get user() {
      return get().user
    },
    get accessToken() {
      return get().accessToken
    },
    setUser: (user) => get().setUser(user),
    setAccessToken: (token) => get().setAccessToken(token),
    resetAccessToken: () => {
      removeCookie(ACCESS_TOKEN)
      set({ accessToken: '' })
    },
    reset: () => {
      removeCookie(ACCESS_TOKEN)
      set({ user: null, accessToken: '', isAuthenticated: false })
    },
    login: (user, token) => get().login(user, token),
    logout: () => get().logout(),
  },
}))
