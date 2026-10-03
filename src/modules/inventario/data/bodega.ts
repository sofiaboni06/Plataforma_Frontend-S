import { listAll, api } from '@/shared/lib/api'
import type {
  BodegaApi,
  CreateBodegaPayload,
  CreateStandPayload,
  StandApi,
  SubBodegaApi,
  UpdateBodegaPayload,
  UpdateStandPayload,
} from '@/modules/inventario/types/bodega'

function mergeById<T extends { id: number }>(groups: T[][]) {
  const map = new Map<number, T>()
  for (const group of groups) {
    for (const item of group) map.set(item.id, item)
  }
  return [...map.values()]
}

async function listActiveAndInactive<T extends { id: number }>(
  path: string,
  extra: Record<string, string> = {},
) {
  const [active, inactive] = await Promise.all([
    listAll<T>(path, { ...extra, estado: 'true' }),
    listAll<T>(path, { ...extra, estado: 'false' }),
  ])
  return mergeById([active, inactive])
}

export async function getBodegas(): Promise<BodegaApi[]> {
  return listActiveAndInactive<BodegaApi>('/bodegas')
}

export async function getBodega(id: string | number): Promise<BodegaApi | null> {
  if (!id) return null

  try {
    return await api<BodegaApi>(`/bodegas/${id}`)
  } catch (error) {
    if (
      error instanceof Error &&
      'status' in error &&
      Number((error as { status?: number }).status) === 404
    ) {
      return null
    }

    throw error
  }
}

export async function createBodega(payload: CreateBodegaPayload): Promise<BodegaApi> {
  return api<BodegaApi>('/bodegas', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBodega(
  id: string | number,
  payload: UpdateBodegaPayload,
): Promise<BodegaApi> {
  return api<BodegaApi>(`/bodegas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteBodega(id: string | number): Promise<void> {
  await api<unknown>(`/bodegas/${id}`, {
    method: 'DELETE',
  })
}

export async function getStandsBySubBodega(subBodegaId: string | number): Promise<StandApi[]> {
  if (!subBodegaId) return []
  return listActiveAndInactive<StandApi>(`/bodegas/sub-bodegas/${subBodegaId}/stands`)
}

export async function getStand(standId: string | number): Promise<StandApi | null> {
  if (!standId) return null

  try {
    return await api<StandApi>(`/bodegas/stands/${standId}`)
  } catch (error) {
    if (
      error instanceof Error &&
      'status' in error &&
      Number((error as { status?: number }).status) === 404
    ) {
      return null
    }

    throw error
  }
}

export async function createStand(
  subBodegaId: string | number,
  payload: CreateStandPayload,
): Promise<StandApi> {
  return api<StandApi>(`/bodegas/sub-bodegas/${subBodegaId}/stands`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateStand(
  standId: string | number,
  payload: UpdateStandPayload,
): Promise<StandApi> {
  return api<StandApi>(`/bodegas/stands/${standId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteStand(standId: string | number): Promise<void> {
  await api<unknown>(`/bodegas/stands/${standId}`, {
    method: 'DELETE',
  })
}

export type CreateSubBodegaPayload = {
  nombre: string
  estado?: boolean
}

export type UpdateSubBodegaPayload = {
  nombre?: string
  estado?: boolean
}

export async function getSubBodegas(
  bodegaId: string | number,
): Promise<SubBodegaApi[]> {
  if (!bodegaId) return []

  return listActiveAndInactive<SubBodegaApi>(
    `/bodegas/${bodegaId}/sub-bodegas`,
  )
}

export async function getSubBodega(
  subBodegaId: string | number,
): Promise<SubBodegaApi | null> {
  if (!subBodegaId) return null

  try {
    return await api<SubBodegaApi>(
      `/bodegas/sub-bodegas/${subBodegaId}`,
    )
  } catch (error) {
    if (
      error instanceof Error &&
      'status' in error &&
      Number((error as { status?: number }).status) === 404
    ) {
      return null
    }

    throw error
  }
}

export async function createSubBodega(
  bodegaId: string | number,
  payload: CreateSubBodegaPayload,
): Promise<SubBodegaApi> {
  return api<SubBodegaApi>(
    `/bodegas/${bodegaId}/sub-bodegas`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export async function updateSubBodega(
  subBodegaId: string | number,
  payload: UpdateSubBodegaPayload,
): Promise<SubBodegaApi> {
  return api<SubBodegaApi>(
    `/bodegas/sub-bodegas/${subBodegaId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export async function deleteSubBodega(
  subBodegaId: string | number,
): Promise<void> {
  await api<unknown>(
    `/bodegas/sub-bodegas/${subBodegaId}`,
    {
      method: 'DELETE',
    },
  )
}
