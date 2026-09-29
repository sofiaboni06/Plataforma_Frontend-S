import { api } from '@/shared/lib/api'
import type {
  ClasificacionElementoApi,
  CodigoEstandarApi,
  CreateElementoPayload,
  ElementoApi,
  UnidadMedidaApi,
  UpdateElementoPayload,
} from '@/modules/inventario/types/elemento'

export function getElementos(): Promise<ElementoApi[]> {
  return api<ElementoApi[]>('/inventario/elementos')
}

export function getElemento(id: string | number): Promise<ElementoApi> {
  return api<ElementoApi>(`/inventario/elementos/${id}`)
}

export function createElemento(payload: CreateElementoPayload): Promise<ElementoApi> {
  return api<ElementoApi>('/inventario/elementos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateElemento(
  id: string | number,
  payload: UpdateElementoPayload,
): Promise<ElementoApi> {
  return api<ElementoApi>(`/inventario/elementos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getUnidadesMedida(): Promise<UnidadMedidaApi[]> {
  return api<UnidadMedidaApi[]>('/unidades-medida')
}

export function getClasificacionesActivas(): Promise<ClasificacionElementoApi[]> {
  return api<ClasificacionElementoApi[]>('/clasificaciones-elemento')
}

export async function getClasificaciones(): Promise<ClasificacionElementoApi[]> {
  const [active, inactive] = await Promise.all([
    api<ClasificacionElementoApi[]>('/clasificaciones-elemento'),
    api<ClasificacionElementoApi[]>('/clasificaciones-elemento?estado=false'),
  ])
  const map = new Map<number, ClasificacionElementoApi>()
  for (const item of [...active, ...inactive]) map.set(item.id, item)
  return [...map.values()].sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'))
}

export function createClasificacion(payload: { nombre: string; estado?: boolean }) {
  return api<ClasificacionElementoApi>('/clasificaciones-elemento', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateClasificacion(
  id: string | number,
  payload: { nombre?: string; estado?: boolean },
) {
  return api<ClasificacionElementoApi>(`/clasificaciones-elemento/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function disableClasificacion(id: string | number) {
  return api<ClasificacionElementoApi>(`/clasificaciones-elemento/${id}`, {
    method: 'DELETE',
  })
}

export function getCodigosEstandar(): Promise<CodigoEstandarApi[]> {
  return api<CodigoEstandarApi[]>('/codigos-estandar')
}
