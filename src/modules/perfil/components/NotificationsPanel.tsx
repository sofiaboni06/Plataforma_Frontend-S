import { useNavigate } from 'react-router-dom'
import Button from '@/shared/components/ui/Button'
import { useNotifications } from '@/modules/notificaciones/context/notifications'
import {
  notificationMark,
  notificationPath,
  timeAgo,
} from '@/modules/notificaciones/lib/presentacion'

export default function NotificationsPanel() {
  const navigate = useNavigate()
  const { items, unread, loading, error, hasMore, loadMore, markRead, markAllRead } = useNotifications()

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sena-text/70">
          {unread ? `Tienes ${unread} sin leer.` : 'Estás al día.'}
        </p>
        <Button variant="secondary" size="sm" disabled={!unread} onClick={() => void markAllRead()}>
          Marcar todas como leídas
        </Button>
      </div>

      {error ? <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {items.length === 0 ? (
        <p className="rounded-xl bg-sena-muted px-4 py-8 text-center text-sm text-sena-text/60">
          {loading ? 'Cargando notificaciones…' : 'No tienes notificaciones.'}
        </p>
      ) : (
        <ul className="divide-y divide-sena-dark/8 overflow-hidden rounded-xl border border-sena-dark/10">
          {items.map((notification) => {
            const mark = notificationMark(notification.tipo, notification.titulo)
            const path = notificationPath(notification)
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => {
                    void markRead(notification.id)
                    if (path) navigate(path)
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-sena-muted/60 ${notification.leida ? '' : 'bg-emerald-50/50'}`}
                >
                  <span
                    className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${mark.color}`}
                    aria-hidden="true"
                  >
                    {mark.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-sena-text">
                      {notification.titulo}
                      {!notification.leida ? (
                        <span className="size-2 rounded-full bg-red-500" aria-label="No leída" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm whitespace-pre-line text-sena-text/75">{notification.mensaje}</span>
                    <span className="mt-1 block text-xs text-sena-text/50">{timeAgo(notification.fecha)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore ? (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" disabled={loading} onClick={() => void loadMore()}>
            {loading ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
