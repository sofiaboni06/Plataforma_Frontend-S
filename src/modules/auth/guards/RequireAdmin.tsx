import { Navigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/context/auth'
import type { ReactNode } from 'react'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { isReady, token, isAdmin } = useAuth()

  if (!isReady) {
    return (
      <div className="app-shell grid min-h-svh place-items-center bg-sena-muted text-sm text-sena-text/70">
        Cargando sesión…
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/inicio" replace />
  }

  return children
}
