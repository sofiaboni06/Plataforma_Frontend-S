import { listAll, api } from '@/shared/lib/api'
import type { ObraApi } from '@/modules/solicitudes/types'

export type CreateObraPayload = {
  nombre: string
  idCformacion: number
  estado?: boolean
}

export type UpdateObraPayload = {
  nombre?: string
  estado?: boolean
}

async function listObrasByState(estado: boolean) {
  return listAll<ObraApi>('/obras', { estado: String(estado) })
}

export async function getObras(): Promise<ObraApi[]> {
  const [active, inactive] = await Promise.all([
    listObrasByState(true),
    listObrasByState(false),
  ])

  const byId = new Map<number, ObraApi>()
  for (const obra of [...active, ...inactive]) byId.set(obra.id, obra)

  return [...byId.values()].sort((a, b) => b.id - a.id)
}

export function createObra(payload: CreateObraPayload) {
  return api<ObraApi>('/obras', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateObra(id: number, payload: UpdateObraPayload) {
  return api<ObraApi>(`/obras/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deactivateObra(id: number) {
  return updateObra(id, { estado: false })
}
