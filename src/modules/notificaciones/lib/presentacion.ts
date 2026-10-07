import type { NotificacionApi, TipoNotificacion } from '@/modules/notificaciones/types'

export function notificationMark(tipo: TipoNotificacion) {
  if (tipo === 'agotado') return { icon: '!', color: 'bg-red-500 text-white' }
  if (tipo === 'por_agotarse') return { icon: '!', color: 'bg-amber-500 text-white' }
  if (tipo === 'entrega_material' || tipo === 'entrega_equipo') {
    return { icon: '✓', color: 'bg-emerald-500 text-white' }
  }
  return { icon: 'i', color: 'bg-sky-500 text-white' }
}

export function notificationPath(notification: NotificacionApi) {
  if (notification.recurso === 'alerta') return '/inventario/alertas'
  if (notification.recurso === 'solicitud_material') return '/inventario/solicitudes/material'
  if (notification.recurso === 'solicitud_equipo') return '/inventario/solicitudes/equipo'
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
