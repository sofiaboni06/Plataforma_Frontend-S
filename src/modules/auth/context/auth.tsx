import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, apiBlob, ApiError, getToken, setToken } from '@/shared/lib/api'
import type { AppModule, UserProfile } from '@/shared/types/profile'

type LoginInput = {
  usuario: string
  password: string
  remember?: boolean
}

export type UpdateProfileInput = {
  nombres?: string
  apellidos?: string
  tipoDocumento?: string
  numeroDocumento?: string
  email?: string
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
  updateProfile: (payload: UpdateProfileInput) => Promise<UserProfile>
  changePassword: (payload: {
    currentPassword: string
    password: string
    passwordConfirmation: string
  }) => Promise<void>
  loadPhoto: () => Promise<Blob>
  uploadPhoto: (file: File) => Promise<void>
  removePhoto: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const PHOTO_PATH = '/account/profile/foto'

function mergeProfile(profile: UserProfile, current: UserProfile | null | undefined): UserProfile {
  return {
    ...profile,
    permissions: profile.permissions ?? current?.permissions,
    isAdmin: profile.isAdmin ?? current?.isAdmin,
    bodegaIds: profile.bodegaIds ?? current?.bodegaIds,
    bodegas: profile.bodegas ?? current?.bodegas,
    trainingCenterId: profile.trainingCenterId ?? current?.trainingCenterId,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<UserProfile | null>(null)
  const [modules, setModules] = useState<AppModule[]>([])
  const [isReady, setIsReady] = useState(false)

  const clearSession = () => {
    setToken(null)
    setTokenState(null)
    setUser(null)
    setModules([])
  }

  // Si el token venció (401) en cualquier llamada del perfil, se cierra la sesión local.
  async function guarded<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) clearSession()
      throw error
    }
  }

  const refreshProfile = async () => {
    const profile = await api<UserProfile>('/account/profile')
    const allowed = await api<AppModule[]>('/modules')
    setUser((current) => mergeProfile(profile, current))
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
          clearSession()
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
      isAdmin: user?.isAdmin === true || user?.role === 'Administrador',
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
        clearSession()
      },
      refreshProfile,
      updateProfile: (payload) =>
        guarded(async () => {
          const profile = await api<UserProfile>('/account/profile', {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
          let merged = profile
          setUser((current) => {
            merged = mergeProfile(profile, current)
            return merged
          })
          return merged
        }),
      changePassword: (payload) =>
        guarded(async () => {
          await api('/account/password', {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        }),
      loadPhoto: () => guarded(() => apiBlob(PHOTO_PATH)),
      uploadPhoto: (file) =>
        guarded(async () => {
          const form = new FormData()
          form.append('fotografia', file)
          const profile = await api<UserProfile | null>(PHOTO_PATH, {
            method: 'POST',
            body: form,
          })
          setUser((current) => {
            if (!current) return current
            return profile
              ? mergeProfile(profile, current)
              : { ...current, avatarUrl: `/api/v1${PHOTO_PATH}` }
          })
        }),
      removePhoto: () =>
        guarded(async () => {
          const profile = await api<UserProfile | null>(PHOTO_PATH, { method: 'DELETE' })
          setUser((current) => {
            if (!current) return current
            return profile && typeof profile === 'object'
              ? mergeProfile(profile, current)
              : { ...current, avatarUrl: '' }
          })
        }),
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