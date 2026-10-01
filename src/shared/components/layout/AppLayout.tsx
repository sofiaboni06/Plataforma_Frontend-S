import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BellIcon, MenuIcon } from '@/shared/components/icons/AppIcons'
import SenaMark from '@/shared/components/icons/SenaMark'
import { useAuth } from '@/modules/auth/context/auth'
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'
import Sidebar from './Sidebar'

type AppLayoutProps = {
  title: string
  children: ReactNode
  showCenterBanner?: boolean
}

const notifications = [
  {
    title: 'Stock bajo',
    message: 'El producto Suero fisiológico 0.9% (MED-003) tiene un stock de 3 unidades.',
    time: 'Hace 5 minutos',
    icon: '!' as const,
    color: 'bg-red-500 text-white',
    unread: true,
  },
  {
    title: 'Movimiento registrado',
    message: 'Se ha registrado una entrada de Gasas estériles (INS-002) - 50 unidades.',
    time: 'Hace 23 minutos',
    icon: '✓' as const,
    color: 'bg-emerald-500 text-white',
    unread: true,
  },
  {
    title: 'Vencimiento próximo',
    message: 'El producto Jeringa 10 ml (MED-007) vence en 3 días (06/08/2026).',
    time: 'Hace 1 hora',
    icon: '!' as const,
    color: 'bg-amber-500 text-white',
    unread: false,
  },
  {
    title: 'Stock normalizado',
    message: 'El producto Mascarillas N95 (INS-003) se encuentra en stock óptimo.',
    time: 'Hace 3 horas',
    icon: 'i' as const,
    color: 'bg-green-600 text-white',
    unread: false,
  },
  {
    title: 'Nuevo producto',
    message: 'Se ha registrado un nuevo producto en el sistema: Termómetro digital (EQU-007).',
    time: 'Hace 5 horas',
    icon: 'i' as const,
    color: 'bg-sky-500 text-white',
    unread: true,
  },
]

export default function AppLayout({
  title,
  children,
  showCenterBanner = true,
}: AppLayoutProps) {
  const { user } = useAuth()
  const inventoryCenter = useInventoryCenterOptional()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [areNotificationsRead, setAreNotificationsRead] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (!isNotificationsOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsNotificationsOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isNotificationsOpen])

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

      <Sidebar
        isOpen={isSidebarOpen}
        isDesktopOpen={isDesktopSidebarOpen}
        onClose={closeSidebar}
      />

      <div
        className={`flex min-h-svh flex-col transition-[padding] duration-200 ${
          isDesktopSidebarOpen ? 'md:pl-[250px]' : ''
        }`}
      >
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-glass-line bg-glass/75 px-5 py-3 text-sena-dark shadow-hairline backdrop-blur-glass sm:px-7 md:min-h-[76px] md:px-8">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-xl text-sena-dark transition hover:bg-white/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena"
              aria-label="Alternar menú principal"
              aria-expanded={
                window.innerWidth >= 768 ? isDesktopSidebarOpen : isSidebarOpen
              }
              aria-controls="navegacion-principal"
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsDesktopSidebarOpen((open) => !open)
                } else {
                  setIsSidebarOpen(true)
                }
              }}
            >
              <MenuIcon className="size-6" />
            </button>
            <SenaMark className="size-8 shrink-0 text-sena md:hidden" />
            <span className="truncate text-sm font-semibold tracking-tight text-sena-dark md:text-[0.9375rem]">
              {title}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <p className="hidden whitespace-nowrap text-sm text-sena-strong sm:block">{today}</p>

            {user ? (
              <>
                <div ref={notificationsRef} className="relative flex items-center gap-2">
                  <button
                    type="button"
                    className="relative grid size-11 shrink-0 place-items-center rounded-full bg-[#d5f2e1] text-sena-dark transition hover:bg-[#c5ebd5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena"
                    aria-label={areNotificationsRead ? 'Notificaciones' : 'Notificaciones, 3 sin leer'}
                    aria-expanded={isNotificationsOpen}
                    aria-controls="notifications-popover"
                    title="Notificaciones"
                    onClick={() => setIsNotificationsOpen((open) => !open)}
                  >
                    <BellIcon className="size-6" />
                    {!areNotificationsRead ? (
                      <span className="absolute -top-0.5 right-0 grid size-4 place-items-center rounded-full bg-[#e53935] text-[10px] leading-none font-bold text-white">
                        3
                      </span>
                    ) : null}
                  </button>
                  <div
                    className="flex items-center gap-2 rounded-full border border-glass-line bg-glass-strong py-1 pr-2 pl-1 shadow-hairline backdrop-blur-glass sm:gap-3 sm:pr-5"
                    aria-label={`${user.fullName}, ${user.roleLabel}`}
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-sena text-xs font-bold text-white shadow-brand-sm sm:size-10">
                      {user.initials}
                    </span>
                    <span className="hidden text-sm font-semibold leading-tight text-sena-text sm:block">
                      {user.fullName}
                      <span className="block text-xs font-normal text-sena-text-soft">
                        {user.roleLabel}
                      </span>
                    </span>
                  </div>

                  {isNotificationsOpen ? (
                    <section
                      id="notifications-popover"
                      className="absolute top-full right-0 z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-white/80 bg-[#f6fff9]/95 text-sena-dark shadow-[0_18px_48px_rgba(0,70,42,0.24)] backdrop-blur-2xl"
                      aria-label="Notificaciones"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-sena-line/70 px-4 py-3">
                        <h2 className="flex items-center gap-2 text-[13px] font-bold">
                          <BellIcon className="size-4" />
                          Notificaciones
                        </h2>
                        <button
                          type="button"
                          className="whitespace-nowrap text-[10px] font-medium text-sena-strong transition hover:text-sena-dark"
                          onClick={() => setAreNotificationsRead(true)}
                        >
                          Marcar todas como leídas
                        </button>
                      </div>

                      <ul className="max-h-[min(62vh,390px)] overflow-y-auto">
                        {notifications.map((notification) => (
                          <li
                            key={notification.title}
                            className="flex min-h-[65px] items-start gap-2.5 border-b border-sena-line/60 px-3.5 py-2.5 transition hover:bg-white/55"
                          >
                            <span
                              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-bold ${notification.color}`}
                              aria-hidden="true"
                            >
                              {notification.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold leading-4">
                                {notification.title}
                                {!areNotificationsRead && notification.unread ? (
                                  <span className="size-1.5 rounded-full bg-red-500" aria-label="No leída" />
                                ) : null}
                              </span>
                              <span className="mt-0.5 block text-[9px] leading-[1.35] text-sena-text">
                                {notification.message}
                              </span>
                              <span className="mt-1 block text-[8px] text-sena-text-soft">
                                {notification.time}
                              </span>
                            </span>
                            <span className="pt-2 text-sm leading-none text-sena-text/70" aria-hidden="true">
                              ›
                            </span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1.5 bg-[#e2f7e9] px-3 py-2.5 text-[10px] font-bold text-sena-dark transition hover:bg-[#d6f1df]"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        Ver todas las notificaciones
                        <span aria-hidden="true">→</span>
                      </button>
                    </section>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </header>

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
