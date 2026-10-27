import { useNavigate } from 'react-router-dom'
import Button from '@/shared/components/ui/Button'
import { useNotifications } from '@/modules/notificaciones/context/notifications'
import {
  notificationMark,
  notificationPath,
  timeAgo,
} from '@/modules/notificaciones/lib/presentacion'
import { BellIcon } from '@/modules/perfil/components/icons'

export default function NotificationsPanel() {
  const navigate = useNavigate()
  const { items, unread, loading, error, hasMore, loadMore, markRead, markAllRead } =
    useNotifications()

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-sena-text">Notificaciones</h3>
          <p className="mt-0.5 text-sm text-sena-text/55">
            {unread ? `Tienes ${unread} sin leer.` : 'Estás al día.'}
          </p>
        </div>
        <Button variant="secondary" size="sm" disabled={!unread} onClick={() => void markAllRead()}>
          Marcar todas como leídas
        </Button>
      </div>

      {error ? (
        <div className="perfil-pop mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-sena-dark/15 bg-sena-muted/40 px-4 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-white text-sena shadow-sm ring-1 ring-sena-dark/10">
            <BellIcon className="size-6" />
          </span>
          <p className="mt-3 text-sm text-sena-text/60">
            {loading ? 'Cargando notificaciones…' : 'No tienes notificaciones.'}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {items.map((notification, index) => {
            const mark = notificationMark(notification.tipo, notification.titulo)
            const path = notificationPath(notification)
            return (
              <li
                key={notification.id}
                className="perfil-rise"
                style={{ ['--delay' as string]: `${Math.min(index, 8) * 45}ms` }}
              >
                <button
                  type="button"
                  onClick={() => {
                    void markRead(notification.id)
                    if (path) navigate(path)
                  }}
                  className={`group relative flex w-full items-start gap-3.5 overflow-hidden rounded-xl border px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    notification.leida
                      ? 'border-sena-dark/10 bg-white hover:bg-sena-muted/50'
                      : 'border-sena/25 bg-emerald-50/60'
                  }`}
                >
                  {!notification.leida ? (
                    <span className="absolute inset-y-0 left-0 w-1 bg-sena" aria-hidden="true" />
                  ) : null}
                  <span
                    className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${mark.color}`}
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
                    <span className="mt-0.5 block text-sm whitespace-pre-line text-sena-text/75">
                      {notification.mensaje}
                    </span>
                    <span className="mt-1.5 block text-xs text-sena-text/50">
                      {timeAgo(notification.fecha)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore ? (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" size="sm" disabled={loading} onClick={() => void loadMore()}>
            {loading ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}