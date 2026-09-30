import { api } from '@/shared/lib/api'
import type {
  Actividad,
  ActividadPayload,
} from '@/modules/actividades/types'

export function getActividades() {
  return api<Actividad[]>('/actividades')
}

export function createActividad(
  payload: ActividadPayload,
) {
  return api<Actividad>('/actividades', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateActividad(
  id: number,
  payload: Partial<ActividadPayload>,
) {
  return api<Actividad>(`/actividades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteActividad(id: number) {
  return api<{ message: string }>(
    `/actividades/${id}`,
    {
      method: 'DELETE',
    },
  )
}