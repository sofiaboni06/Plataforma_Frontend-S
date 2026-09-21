import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, getToken, setToken } from './api'
import type { AppModule, UserProfile } from '../types/profile'

type LoginInput = {
  usuario: string
  password: string
  remember?: boolean
}

type AuthContextValue = {
  token: string | null
  user: UserProfile | null
  modules: AppModule[]
  isReady: boolean
  isAdmin: boolean
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (payload: { email?: string; numeroDocumento?: string }) => Promise<UserProfile>
  changePassword: (payload: {
    currentPassword: string
    password: string
    passwordConfirmation: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<UserProfile | null>(null)
  const [modules, setModules] = useState<AppModule[]>([])
  const [isReady, setIsReady] = useState(false)

  const refreshProfile = async () => {
    const profile = await api<UserProfile>('/account/profile')
    const allowed = await api<AppModule[]>('/modules')
    setUser(profile)
    setModules(allowed)
  }

  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!getToken()) {
        setIsReady(true)
        return
      }

      try {
        await refreshProfile()
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setToken(null)
          setTokenState(null)
          setUser(null)
          setModules([])
        }
      } finally {
        if (!cancelled) setIsReady(true)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      modules,
      isReady,
      isAdmin: user?.role === 'Administrador',
      login: async ({ usuario, password, remember = true }) => {
        const payload = usuario.includes('@') ? { email: usuario, password } : { usuario, password }
        const result = await api<{ token: string; user: UserProfile }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setToken(result.token, remember)
        const allowed = await api<AppModule[]>('/modules')
        setTokenState(result.token)
        setUser(result.user)
        setModules(allowed)
      },
      logout: async () => {
        try {
          if (getToken()) {
            await api('/account/logout', { method: 'POST' })
          }
        } catch {
          /* still clear the session locally */
        }
        setToken(null)
        setTokenState(null)
        setUser(null)
        setModules([])
      },
      refreshProfile,
      updateProfile: async (payload) => {
        const profile = await api<UserProfile>('/account/profile', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setUser(profile)
        return profile
      },
      changePassword: async (payload) => {
        await api('/account/password', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      },
    }),
    [token, user, modules, isReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
