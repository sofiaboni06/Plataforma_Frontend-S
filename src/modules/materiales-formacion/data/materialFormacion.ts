import { api } from '@/shared/lib/api'
import type {
  CreateMaterialFormacionPayload,
  CreateSolicitudMaterialFormacionPayload,
  MaterialFormacionApi,
  MaterialFormacionElemento,
  MaterialFormacionPrograma,
  SolicitudMaterialFormacionApi,
  UpdateMaterialFormacionPayload,
} from '@/modules/materiales-formacion/types'

export function getMaterialesFormacion(): Promise<MaterialFormacionApi[]> {
  return api<MaterialFormacionApi[]>('/materiales-formacion')
}

export function getMaterialFormacion(id: string | number): Promise<MaterialFormacionApi> {
  return api<MaterialFormacionApi>(`/materiales-formacion/${id}`)
}

export function createMaterialFormacion(
  payload: CreateMaterialFormacionPayload,
): Promise<MaterialFormacionApi> {
  return api<MaterialFormacionApi>('/materiales-formacion', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMaterialFormacion(
  id: string | number,
  payload: UpdateMaterialFormacionPayload,
): Promise<MaterialFormacionApi> {
  return api<MaterialFormacionApi>(`/materiales-formacion/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/** La baja es lógica: el backend deja el material en `estado = false`. */
export function disableMaterialFormacion(
  id: string | number,
): Promise<{ message: string }> {
  return api<{ message: string }>(`/materiales-formacion/${id}`, {
    method: 'DELETE',
  })
}

export function getProgramasOpciones(): Promise<MaterialFormacionPrograma[]> {
  return api<MaterialFormacionPrograma[]>('/materiales-formacion/programas')
}

/** Identificación global de elementos para el selector (sin stock ni ubicación). */
export function getCatalogoElementos(): Promise<MaterialFormacionElemento[]> {
  return api<MaterialFormacionElemento[]>('/materiales-formacion/elementos')
}

/** Solicitudes de materiales de formación: flujo propio, no es inventario. */
export function getSolicitudesFormacion(): Promise<SolicitudMaterialFormacionApi[]> {
  return api<SolicitudMaterialFormacionApi[]>('/materiales-formacion/solicitudes')
}

export function createSolicitudFormacion(
  payload: CreateSolicitudMaterialFormacionPayload,
): Promise<SolicitudMaterialFormacionApi> {
  return api<SolicitudMaterialFormacionApi>('/materiales-formacion/solicitudes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
