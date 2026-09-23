import { api } from '@/shared/lib/api'
import type {
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

export function createElemento(
  payload: CreateElementoPayload,
): Promise<ElementoApi> {
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
