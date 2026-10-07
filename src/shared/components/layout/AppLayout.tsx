import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon, MenuIcon } from '@/shared/components/icons/AppIcons'
import SenaMark from '@/shared/components/icons/SenaMark'
import { useAuth } from '@/modules/auth/context/auth'
import { useNotifications } from '@/modules/notificaciones/context/notifications'
import {
  notificationMark,
  notificationPath,
  timeAgo,
} from '@/modules/notificaciones/lib/presentacion'
import type { NotificacionApi } from '@/modules/notificaciones/types'
import Sidebar from './Sidebar'

type AppLayoutProps = {
  title: string
  children: ReactNode
  showCenterBanner?: boolean
}

const POPOVER_LIMIT = 8

export default function AppLayout({
  title,
  children,
}: AppLayoutProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const notifications = useNotifications()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const unreadLabel = notifications.unread > 99 ? '99+' : String(notifications.unread)

  const openNotification = (notification: NotificacionApi) => {
    void notifications.markRead(notification.id)
    const path = notificationPath(notification)
    setIsNotificationsOpen(false)
    if (path) navigate(path)
  }
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
                    aria-label={
                      notifications.unread
                        ? `Notificaciones, ${notifications.unread} sin leer`
                        : 'Notificaciones'
                    }
                    aria-expanded={isNotificationsOpen}
                    aria-controls="notifications-popover"
                    title="Notificaciones"
                    onClick={() => setIsNotificationsOpen((open) => !open)}
                  >
                    <BellIcon className="size-6" />
                    {notifications.unread ? (
                      <span className="absolute -top-0.5 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#e53935] px-1 text-[10px] leading-none font-bold text-white">
                        {unreadLabel}
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
                          className="whitespace-nowrap text-[10px] font-medium text-sena-strong transition hover:text-sena-dark disabled:opacity-40"
                          disabled={!notifications.unread}
                          onClick={() => void notifications.markAllRead()}
                        >
                          Marcar todas como leídas
                        </button>
                      </div>

                      <ul className="max-h-[min(62vh,390px)] overflow-y-auto">
                        {notifications.items.length === 0 ? (
                          <li className="px-4 py-8 text-center text-[11px] text-sena-text-soft">
                            {notifications.loading
                              ? 'Cargando notificaciones…'
                              : notifications.error ?? 'No tienes notificaciones.'}
                          </li>
                        ) : (
                          notifications.items.slice(0, POPOVER_LIMIT).map((notification) => {
                            const mark = notificationMark(notification.tipo)
                            return (
                              <li key={notification.id} className="border-b border-sena-line/60">
                                <button
                                  type="button"
                                  onClick={() => openNotification(notification)}
                                  className="flex min-h-[65px] w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-white/55"
                                >
                                  <span
                                    className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-bold ${mark.color}`}
                                    aria-hidden="true"
                                  >
                                    {mark.icon}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold leading-4">
                                      {notification.titulo}
                                      {!notification.leida ? (
                                        <span className="size-1.5 rounded-full bg-red-500" aria-label="No leída" />
                                      ) : null}
                                    </span>
                                    <span className="mt-0.5 block text-[9px] leading-[1.35] text-sena-text">
                                      {notification.mensaje}
                                    </span>
                                    <span className="mt-1 block text-[8px] text-sena-text-soft">
                                      {timeAgo(notification.fecha)}
                                    </span>
                                  </span>
                                  <span className="pt-2 text-sm leading-none text-sena-text/70" aria-hidden="true">
                                    ›
                                  </span>
                                </button>
                              </li>
                            )
                          })
                        )}
                      </ul>

                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1.5 bg-[#e2f7e9] px-3 py-2.5 text-[10px] font-bold text-sena-dark transition hover:bg-[#d6f1df]"
                        onClick={() => {
                          setIsNotificationsOpen(false)
                          navigate('/perfil', { state: { tab: 'notifications' } })
                        }}
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
          {children}
        </main>
      </div>
    </div>
  )
}
