// src/modules/vigencias/data/vigencia.ts
import { api } from '@/shared/lib/api'
import type {
  VigenciaApi,
  CreateVigenciaPayload,
  UpdateVigenciaPayload,
} from '@/modules/vigencias/types/vigencia'

const BASE_PATH = '/vigencias' // El api client ya debería tener el /api/v1 configurado

export async function getVigencias(): Promise<VigenciaApi[]> {
  return api<VigenciaApi[]>(BASE_PATH)
}

export async function createVigencia(payload: CreateVigenciaPayload): Promise<VigenciaApi> {
  return api<VigenciaApi>(BASE_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateVigencia(anio: number, payload: UpdateVigenciaPayload): Promise<VigenciaApi> {
  return api<VigenciaApi>(`${BASE_PATH}/${anio}`, {
    method: 'PUT', // Ojo: tu routes.ts usa router.put('/:id', ...) para vigencias
    body: JSON.stringify(payload),
  })
}

export async function deleteVigencia(anio: number): Promise<void> {
  await api<unknown>(`${BASE_PATH}/${anio}`, {
    method: 'DELETE',
  })
}