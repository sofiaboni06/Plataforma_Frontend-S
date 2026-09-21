import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { MenuIcon } from '@/shared/components/icons/AppIcons'
import SenaMark from '@/shared/components/icons/SenaMark'
import { useAuth } from '@/modules/auth/context/auth'
import Sidebar from './Sidebar'

type AppLayoutProps = {
  title: string
  children: ReactNode
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const today = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  useEffect(() => {
    if (!isSidebarOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar()
    }

    const onResize = () => {
      if (window.innerWidth >= 768) closeSidebar()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [isSidebarOpen, closeSidebar])

  return (
    <div className="app-shell bg-sena-muted">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sena-dark"
      >
        Saltar al contenido
      </a>

      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-sena-forest/40 md:hidden"
          aria-label="Cerrar menú"
          onClick={closeSidebar}
        />
      ) : null}

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="md:pl-60">
        <header className="flex items-center justify-between gap-3 bg-sena-dark px-4 py-3 text-white md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1.5 hover:bg-white/10"
              aria-label="Abrir menú"
              aria-expanded={isSidebarOpen}
              aria-controls="navegacion-principal"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon className="size-6" />
            </button>
            <SenaMark className="h-8 w-8" />
            <span className="text-sm font-semibold">{title}</span>
          </div>
        </header>

        <div className="hidden items-center justify-end gap-4 px-8 py-4 md:flex">
          <p className="text-sm text-sena-text/55">{today}</p>
          {user ? (
            <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1">
              <span className="grid size-8 place-items-center rounded-full bg-sena/15 text-xs font-semibold text-sena-dark">
                {user.initials}
              </span>
              <span className="pr-2 text-sm font-medium text-sena-text">
                {user.fullName}
                <span className="block text-xs font-normal text-sena-text/50">{user.roleLabel}</span>
              </span>
            </div>
          ) : null}
        </div>

        <main id="contenido" className="min-h-svh px-4 pb-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
