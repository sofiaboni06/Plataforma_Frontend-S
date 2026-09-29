import { listAll, api } from '@/shared/lib/api'
import type { CreateItemPayload, ItemApi, UpdateItemPayload } from '@/modules/inventario/types/item'

export async function getAllItems() {
  const [active, inactive] = await Promise.all([
    listAll<ItemApi>('/inventario/items', { estado: 'true' }),
    listAll<ItemApi>('/inventario/items', { estado: 'false' }),
  ])
  const map = new Map<number, ItemApi>()
  for (const item of [...active, ...inactive]) map.set(item.id, item)
  return [...map.values()].sort((left, right) => left.id - right.id)
}

export function getItem(id: string | number) {
  return api<ItemApi>(`/inventario/items/${id}`)
}

export function createItem(payload: CreateItemPayload) {
  return api<ItemApi>('/inventario/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateItem(id: string | number, payload: UpdateItemPayload) {
  return api<ItemApi>(`/inventario/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function disableItem(id: string | number) {
  return api<{ message: string }>(`/inventario/items/${id}`, {
    method: 'DELETE',
  })
}
