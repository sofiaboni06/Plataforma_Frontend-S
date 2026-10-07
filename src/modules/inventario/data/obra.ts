import { api } from '@/shared/lib/api'
import type { ObraApi } from '@/modules/solicitudes/types'

export type ObraPayload = {
  nombre: string
  lugar?: string | null
  estado?: boolean
}

export async function getAllObras() {
  const [active, inactive] = await Promise.all([
    api<ObraApi[]>('/obras'),
    api<ObraApi[]>('/obras?estado=false'),
  ])
  const map = new Map<number, ObraApi>()
  for (const item of [...active, ...inactive]) map.set(item.id, item)
  return [...map.values()].sort((left, right) => right.id - left.id)
}

export function createObra(payload: ObraPayload) {
  return api<ObraApi>('/obras', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateObra(id: number, payload: Partial<ObraPayload>) {
  return api<ObraApi>(`/obras/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function disableObra(id: number) {
  return api<{ message: string }>(`/obras/${id}`, { method: 'DELETE' })
}
