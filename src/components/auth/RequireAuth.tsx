import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import type { ReactNode } from 'react'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { token, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return (
      <div className="app-shell grid min-h-svh place-items-center bg-sena-muted text-sm text-sena-text/70">
        Cargando sesión…
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
