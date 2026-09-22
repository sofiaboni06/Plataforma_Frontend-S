import { api } from '@/shared/lib/api'
import type {
  BodegaApi,
  CreateBodegaPayload,
  CreateStandPayload,
  StandApi,
  UpdateBodegaPayload,
  UpdateStandPayload,
} from '@/modules/inventario/types/bodega'

export async function getBodegas(): Promise<BodegaApi[]> {
  return api<BodegaApi[]>('/bodegas')
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

export async function createBodega(
  payload: CreateBodegaPayload,
): Promise<BodegaApi> {
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

export async function getStandsByBodega(
  bodegaId: string | number,
): Promise<StandApi[]> {
  if (!bodegaId) return []

  return api<StandApi[]>(`/bodegas/${bodegaId}/stands`)
}

export async function getStand(
  standId: string | number,
): Promise<StandApi | null> {
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
  bodegaId: string | number,
  payload: CreateStandPayload,
): Promise<StandApi> {
  return api<StandApi>(`/bodegas/${bodegaId}/stands`, {
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

export async function deleteStand(
  standId: string | number,
): Promise<void> {
  await api<unknown>(`/bodegas/stands/${standId}`, {
    method: 'DELETE',
  })
}