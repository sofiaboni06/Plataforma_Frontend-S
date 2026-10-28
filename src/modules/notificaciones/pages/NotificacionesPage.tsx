import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { BellIcon } from '@/shared/components/icons/AppIcons'
import Button from '@/shared/components/ui/Button'
import {
  ErrorBanner,
  PageHeader,
  TableCard,
  TableLoading,
} from '@/shared/components/DataTable'
import { ApiError } from '@/shared/lib/api'
import { useNotifications } from '@/modules/notificaciones/context/notifications'
import { getNotificacion } from '@/modules/notificaciones/data/notificaciones'
import {
  notificationDetailPath,
  notificationMark,
  notificationPath,
  notificationPreview,
  timeAgo,
} from '@/modules/notificaciones/lib/presentacion'
import type { LineaDetalleNotificacion, NotificacionApi } from '@/modules/notificaciones/types'

function Lineas({
  titulo,
  lineas,
  mostrarMotivo,
}: {
  titulo: string
  lineas: LineaDetalleNotificacion[]
  mostrarMotivo?: boolean
}) {
  if (!lineas.length) return null
  return (
    <section className="grid gap-4">
      <h3 className="text-xl font-bold text-sena-text">{titulo}</h3>
      <ul className="grid gap-4">
        {lineas.map((linea) => (
          <li key={`${titulo}-${linea.producto}`} className="grid gap-2">
            <p className="text-lg font-semibold text-sena-text">{linea.producto}</p>
            <p className="text-base text-sena-strong">
              {linea.pedida != null && linea.autorizada != null
                ? `Pediste ${linea.pedida} y se autorizaron ${linea.autorizada}`
                : linea.cantidad != null
                  ? `${linea.cantidad}`
                  : null}
              {linea.queda != null && linea.queda > 0 ? ` · quedan ${linea.queda} pendientes` : ''}
            </p>
            {mostrarMotivo && linea.motivo ? (
              <p className="max-w-3xl text-[1.35rem] leading-snug font-semibold text-sena-text">
                {linea.motivo}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function DetalleAviso({
  notification,
  onOpenRelated,
}: {
  notification: NotificacionApi
  onOpenRelated: () => void
}) {
  const detalle = notification.detalle
  const related = notificationPath(notification)
  return (
    <article className="grid gap-8 px-2 py-2 sm:px-4">
      <header className="grid gap-3">
        <h2 className="max-w-4xl text-3xl font-bold leading-tight text-sena-text sm:text-4xl">
          {notification.titulo}
        </h2>
        <p className="text-base text-sena-strong">{timeAgo(notification.fecha)}</p>
        {detalle?.ficha || detalle?.programa ? (
          <p className="text-lg text-sena-strong">
            {[detalle.programa, detalle.ficha && `Ficha ${detalle.ficha}`].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </header>

      {detalle ? (
        <div className="grid max-w-3xl gap-8">
          <Lineas titulo="Autorizado" lineas={detalle.entregados ?? []} />
          <Lineas titulo="Ajustado" lineas={detalle.ajustados ?? []} mostrarMotivo />
          <Lineas titulo="No autorizado" lineas={detalle.rechazados ?? []} mostrarMotivo />
          <Lineas titulo="Sigue pendiente" lineas={detalle.pendientes ?? []} />
          {detalle.observacion ? (
            <section className="grid gap-2">
              <h3 className="text-xl font-bold text-sena-text">Nota de coordinación</h3>
              <p className="max-w-3xl text-[1.35rem] leading-snug font-semibold text-sena-text">
                {detalle.observacion}
              </p>
            </section>
          ) : null}
        </div>
      ) : (
        <p className="max-w-3xl text-xl leading-relaxed text-sena-text">{notification.mensaje}</p>
      )}

      {related ? (
        <div>
          <Button type="button" onClick={onOpenRelated}>
            Ver el pedido
          </Button>
        </div>
      ) : null}
    </article>
  )
}

export default function NotificacionesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, unread, loading, error, hasMore, loadMore, markRead, markAllRead } = useNotifications()
  const [selected, setSelected] = useState<NotificacionApi | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const selectedId = id ? Number(id) : null
  const fromList = useMemo(
    () => (selectedId ? items.find((item) => item.id === selectedId) ?? null : items[0] ?? null),
    [items, selectedId],
  )

  useEffect(() => {
    document.title = 'Notificaciones | SENA'
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSelected(fromList)
      return
    }
    if (fromList) {
      setSelected(fromList)
      void markRead(selectedId)
      return
    }
    let cancelled = false
    void getNotificacion(selectedId)
      .then((row) => {
        if (cancelled) return
        setSelected(row)
        void markRead(row.id)
      })
      .catch((caught) => {
        if (cancelled) return
        setLoadError(caught instanceof ApiError ? caught.message : 'No se pudo abrir la notificación.')
      })
    return () => {
      cancelled = true
    }
  }, [fromList, selectedId, markRead])

  const openItem = (notification: NotificacionApi) => {
    void markRead(notification.id)
    navigate(notificationDetailPath(notification.id))
  }

  return (
    <AppLayout title="Notificaciones">
      <PageHeader
        icon={<BellIcon />}
        title="Notificaciones"
        description={
          unread ? `Tienes ${unread} sin leer. Abre una para ver el detalle y el motivo.` : 'Estás al día.'
        }
        action={
          <Button variant="secondary" disabled={!unread} onClick={() => void markAllRead()}>
            Marcar todas como leídas
          </Button>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      {loadError ? <ErrorBanner message={loadError} onClose={() => setLoadError(null)} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <TableCard>
          {loading && items.length === 0 ? (
            <TableLoading label="Cargando notificaciones…" />
          ) : items.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-sena-text-soft">No tienes notificaciones.</p>
          ) : (
            <ul>
              {items.map((notification) => {
                const mark = notificationMark(notification.tipo, notification.titulo)
                const active = selected?.id === notification.id
                return (
                  <li key={notification.id} className="border-b border-sena-hairline last:border-b-0">
                    <button
                      type="button"
                      onClick={() => openItem(notification)}
                      className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-sena-soft/60 ${
                        active ? 'bg-sena-soft/80' : ''
                      }`}
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
                            <span className="size-2 shrink-0 rounded-full bg-sena-danger-text" aria-label="No leída" />
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm text-sena-strong">
                          {notificationPreview(notification.mensaje)}
                        </span>
                        <span className="mt-1 block text-xs text-sena-strong">{timeAgo(notification.fecha)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {hasMore ? (
            <div className="px-5 py-4">
              <Button variant="secondary" size="sm" disabled={loading} onClick={() => void loadMore()}>
                {loading ? 'Cargando…' : 'Cargar más'}
              </Button>
            </div>
          ) : null}
        </TableCard>

        <div className="min-h-[28rem] rounded-[24px] border border-glass-line bg-glass/75 px-6 py-8 shadow-hairline backdrop-blur-glass-sm sm:px-10 sm:py-10">
          {selected ? (
            <DetalleAviso
              notification={selected}
              onOpenRelated={() => {
                const path = notificationPath(selected)
                if (path) navigate(path)
              }}
            />
          ) : (
            <p className="text-base text-sena-strong">Elige una notificación para ver el detalle.</p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
