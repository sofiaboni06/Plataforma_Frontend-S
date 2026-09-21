import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { canOpenPath } from '../../lib/access'
import type { ReactNode } from 'react'

export default function RequireModule({ children }: { children: ReactNode }) {
  const { isReady, token, modules, isAdmin } = useAuth()
  const location = useLocation()

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

  if (!canOpenPath(location.pathname, modules, isAdmin)) {
    return <Navigate to="/inicio" replace />
  }

  return children
}
