import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Transmit } from '@adonisjs/transmit-client'
import Toast from '@/shared/components/ui/Toast'
import { ApiError } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'
import {
  getNoLeidas,
  getNotificaciones,
  marcarNotificacion,
  marcarTodas,
} from '@/modules/notificaciones/data/notificaciones'
import type { NotificacionApi } from '@/modules/notificaciones/types'

const PER_PAGE = 20

type NotificationsContextValue = {
  items: NotificacionApi[]
  unread: number
  loading: boolean
  error: string | null
  hasMore: boolean
  /** Último aviso que llegó en vivo. Las pantallas lo usan para recargar su lista. */
  lastArrival: NotificacionApi | null
  reload: () => Promise<void>
  loadMore: () => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth()
  const userId = user?.id ?? null

  const [items, setItems] = useState<NotificacionApi[]>([])
  const [unread, setUnread] = useState(0)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastArrival, setLastArrival] = useState<NotificacionApi | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [first, total] = await Promise.all([getNotificaciones(1, PER_PAGE), getNoLeidas()])
      setItems(first.data)
      setPage(1)
      setLastPage(first.meta.lastPage)
      setUnread(total)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar las notificaciones.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (page >= lastPage) return
    setLoading(true)
    try {
      const next = await getNotificaciones(page + 1, PER_PAGE)
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id))
        return [...current, ...next.data.filter((item) => !seen.has(item.id))]
      })
      setPage(next.meta.currentPage)
      setLastPage(next.meta.lastPage)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar más notificaciones.')
    } finally {
      setLoading(false)
    }
  }, [page, lastPage])

  const markRead = useCallback(async (id: number) => {
    const target = items.find((item) => item.id === id)
    if (!target || target.leida) return
    setItems((current) => current.map((item) => (item.id === id ? { ...item, leida: true } : item)))
    setUnread((current) => Math.max(0, current - 1))
    try {
      await marcarNotificacion(id, true)
    } catch {
      await reload()
    }
  }, [items, reload])

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((item) => ({ ...item, leida: true })))
    setUnread(0)
    try {
      await marcarTodas(true)
    } catch {
      await reload()
    }
  }, [reload])

  useEffect(() => {
    if (!token || userId == null) {
      setItems([])
      setUnread(0)
      setPage(1)
      setLastPage(1)
      setLastArrival(null)
      return
    }

    // El stream de eventos no manda el header; el token va solo en el POST de suscripción.
    const transmit = new Transmit({
      baseUrl: window.location.origin,
      beforeSubscribe: (request) => {
        request.headers.set('Authorization', `Bearer ${token}`)
      },
      beforeUnsubscribe: (request) => {
        request.headers.set('Authorization', `Bearer ${token}`)
      },
    })

    // 'connected' también se dispara al reconectar: se recarga para no perder lo que llegó mientras tanto.
    let connectedOnce = false
    const onConnected = () => {
      if (connectedOnce) void reload()
      connectedOnce = true
    }
    transmit.on('connected', onConnected)

    const canal = transmit.subscription(`notificaciones/${userId}`)
    const stop = canal.onMessage<NotificacionApi>((aviso) => {
      setItems((current) => [aviso, ...current.filter((item) => item.id !== aviso.id)])
      if (!aviso.leida) setUnread((current) => current + 1)
      setLastArrival(aviso)
      setToast(aviso.titulo)
    })
    void canal.create()
    void reload()

    return () => {
      stop()
      transmit.off('connected', onConnected)
      void canal.delete().finally(() => transmit.close())
    }
  }, [token, userId, reload])

  const closeToast = useCallback(() => setToast(null), [])

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unread,
      loading,
      error,
      hasMore: page < lastPage,
      lastArrival,
      reload,
      loadMore,
      markRead,
      markAllRead,
    }),
    [items, unread, loading, error, page, lastPage, lastArrival, reload, loadMore, markRead, markAllRead],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {toast ? <Toast message={toast} onClose={closeToast} /> : null}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationsProvider')
  }
  return context
}
