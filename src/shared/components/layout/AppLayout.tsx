import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { MenuIcon } from '@/shared/components/icons/AppIcons'
import SenaMark from '@/shared/components/icons/SenaMark'
import { useAuth } from '@/modules/auth/context/auth'
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'
import Sidebar from './Sidebar'

type AppLayoutProps = {
  title: string
  children: ReactNode
  showCenterBanner?: boolean
}

export default function AppLayout({
  title,
  children,
  showCenterBanner = true,
}: AppLayoutProps) {
  const { user } = useAuth()
  const inventoryCenter = useInventoryCenterOptional()
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
    <div className="app-shell app-canvas">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sena-dark focus:shadow-surface"
      >
        Saltar al contenido
      </a>

      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-sena-forest/55 backdrop-blur-[6px] md:hidden"
          aria-label="Cerrar menú"
          onClick={closeSidebar}
        />
      ) : null}

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-svh flex-col md:pl-[266px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-sena-line/50 bg-glass px-5 py-3.5 text-sena-dark backdrop-blur-glass md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-1.5 text-sena-dark transition hover:bg-white/60"
              aria-label="Abrir menú"
              aria-expanded={isSidebarOpen}
              aria-controls="navegacion-principal"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon className="size-6" />
            </button>
            <SenaMark className="h-8 w-8 text-sena" />
            <span className="text-sm font-semibold tracking-tight">{title}</span>
          </div>
        </header>

        <div className="sticky top-0 z-20 hidden items-center justify-between gap-4 border-b border-sena-line/50 bg-glass px-8 py-3 backdrop-blur-glass md:flex">
          <p className="text-[0.9375rem] font-semibold tracking-tight text-sena-dark">{title}</p>

          <div className="flex items-center gap-4">
            <p className="text-sm text-sena-text-soft">{today}</p>

            {user ? (
              <div className="flex items-center gap-3 rounded-full border border-glass-line bg-glass-strong py-1 pr-5 pl-1 backdrop-blur-glass-sm">
                <span className="grid size-9 place-items-center rounded-full bg-sena text-xs font-bold text-white shadow-brand-sm">
                  {user.initials}
                </span>
                <span className="text-sm font-semibold leading-tight text-sena-text">
                  {user.fullName}
                  <span className="block text-xs font-normal text-sena-text-soft">
                    {user.roleLabel}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <main
          id="contenido"
          className="w-full flex-1 px-5 py-3 sm:px-7 sm:py-4"
        >
          {showCenterBanner && inventoryCenter?.isAdmin && inventoryCenter.centerId ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-glass-line bg-glass px-5 py-2 shadow-hairline backdrop-blur-glass">
              <p className="text-[0.8125rem] text-sena-text">
                <span className="text-sena-text-soft">Inventario de</span>{' '}
                <span className="font-semibold">{inventoryCenter.centerName}</span>
                <span className="text-sena-text-soft"> · {inventoryCenter.regional}</span>
              </p>
              <button
                type="button"
                onClick={inventoryCenter.clear}
                className="rounded-full border border-sena-line bg-glass-strong px-5 py-1 text-[0.8125rem] font-semibold text-sena-strong shadow-hairline backdrop-blur-glass-sm transition duration-150 hover:border-sena/45 hover:bg-white/90 hover:text-sena-dark"
              >
                Cambiar centro
              </button>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}
