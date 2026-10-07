import { api, apiPage } from '@/shared/lib/api'
import type { NotificacionApi } from '@/modules/notificaciones/types'

export function getNotificaciones(page = 1, perPage = 20) {
  return apiPage<NotificacionApi>('/account/notifications', {
    page: String(page),
    perPage: String(perPage),
  })
}

export async function getNoLeidas() {
  const { meta } = await apiPage<NotificacionApi>('/account/notifications', {
    leida: 'false',
    perPage: '1',
  })
  return meta.total
}

export function marcarNotificacion(id: number, leida = true) {
  return api<NotificacionApi>(`/account/notifications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ leida }),
  })
}

export function marcarTodas(leida = true) {
  return api<{ total: number }>('/account/notifications', {
    method: 'PATCH',
    body: JSON.stringify({ leida }),
  })
}
