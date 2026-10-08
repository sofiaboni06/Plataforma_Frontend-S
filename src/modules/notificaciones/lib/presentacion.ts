import type { NotificacionApi, TipoNotificacion } from '@/modules/notificaciones/types'

/*
 * Aviso diario de préstamo vencido (tipo `devolucion_equipo`): "Devolución
 * vencida: SOL-1" o "Hoy vence la devolución de SOL-1". A bodega le llega con
 * " de <persona>" al final; al instructor, sin eso.
 */
const PLAZO = /^(?:Devolución vencida: |Hoy vence la devolución de )(\S+)( de .+)?$/

function plazoDe(notification: Pick<NotificacionApi, 'tipo' | 'titulo'>) {
  if (notification.tipo !== 'devolucion_equipo') return null
  const match = PLAZO.exec(notification.titulo)
  return match ? { codigo: match[1], paraBodega: Boolean(match[2]) } : null
}

export function notificationMark(tipo: TipoNotificacion, titulo = '') {
  if (plazoDe({ tipo, titulo })) {
    return titulo.startsWith('Devolución vencida')
      ? { icon: '!', color: 'bg-red-500 text-white' }
      : { icon: '!', color: 'bg-amber-500 text-white' }
  }
  if (tipo === 'agotado') return { icon: '!', color: 'bg-red-500 text-white' }
  if (tipo === 'por_agotarse') return { icon: '!', color: 'bg-amber-500 text-white' }
  if (tipo === 'entrega_material' || tipo === 'entrega_equipo') {
    return { icon: '✓', color: 'bg-emerald-500 text-white' }
  }
  return { icon: 'i', color: 'bg-sky-500 text-white' }
}

/*
 * Los tipos `solicitud_*` solo le llegan a bodega (pedidos y stock nuevo para
 * solicitudes pendientes): abren directo la vista Entregar. Si el aviso es de
 * una solicitud nueva, llega ya buscada por su código.
 */
export function notificationPath(notification: NotificacionApi) {
  const plazo = plazoDe(notification)
  if (plazo) {
    return plazo.paraBodega
      ? `/inventario/solicitudes/prestamos?${new URLSearchParams({ vista: 'vencidos', buscar: plazo.codigo })}`
      : '/inventario/solicitudes'
  }
  const codigo = /^Nueva solicitud (\S+) de /.exec(notification.titulo)?.[1]
  const entregar =
    notification.tipo === 'solicitud_material' || notification.tipo === 'solicitud_equipo'
      ? `?${new URLSearchParams({ vista: 'entregar', ...(codigo ? { buscar: codigo } : {}) })}`
      : ''
  if (notification.recurso === 'alerta') return '/inventario/alertas'
  if (notification.recurso === 'solicitud_material') {
    return `/inventario/solicitudes/material${entregar}`
  }
  if (notification.recurso === 'solicitud_equipo') return `/inventario/solicitudes/equipo${entregar}`
  return null
}

const relative = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' })

export function timeAgo(fecha: string | null) {
  if (!fecha) return ''
  const seconds = Math.round((new Date(fecha).getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return 'Hace un momento'
  if (abs < 3600) return capitalize(relative.format(Math.round(seconds / 60), 'minute'))
  if (abs < 86400) return capitalize(relative.format(Math.round(seconds / 3600), 'hour'))
  if (abs < 604800) return capitalize(relative.format(Math.round(seconds / 86400), 'day'))
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(fecha))
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
