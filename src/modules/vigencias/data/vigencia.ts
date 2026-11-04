// src/modules/vigencias/data/vigencia.ts
import { api } from '@/shared/lib/api'
import type {
  VigenciaApi,
  CreateVigenciaPayload,
  UpdateVigenciaPayload,
  VigenciaEspecialApi,
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

export function getVigenciasEspeciales(anio: number): Promise<VigenciaEspecialApi[]> {
  return api<VigenciaEspecialApi[]>(`${BASE_PATH}/${anio}/especiales`)
}

export function crearVigenciaEspecial(
  anio: number,
  payload: { nombre: string; monto: number },
): Promise<VigenciaEspecialApi> {
  return api<VigenciaEspecialApi>(`${BASE_PATH}/${anio}/especiales`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function actualizarVigenciaEspecial(
  anio: number,
  id: number,
  payload: { monto?: number; activa?: boolean; nombre?: string },
): Promise<VigenciaEspecialApi> {
  return api<VigenciaEspecialApi>(`${BASE_PATH}/${anio}/especiales/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function agregarProgramaEspecial(
  anio: number,
  id: number,
  programaId: number,
): Promise<VigenciaEspecialApi> {
  return api<VigenciaEspecialApi>(`${BASE_PATH}/${anio}/especiales/${id}/programas`, {
    method: 'POST',
    body: JSON.stringify({ programaId }),
  })
}

export function quitarProgramaEspecial(
  anio: number,
  id: number,
  programaId: number,
): Promise<void> {
  return api<void>(`${BASE_PATH}/${anio}/especiales/${id}/programas/${programaId}`, {
    method: 'DELETE',
  })
}

export type RepartoEspecial = {
  id: number
  nombre: string
  monto: number
  repartido: number
  sinRepartir: number
  coordinadores: Array<{ id: number; fullName: string; monto: number }>
}

export type EspecialParaRepartir = {
  id: number
  nombre: string
  anio: number
  monto: number
  areas: Array<{ id: number; nombre: string; monto: number }>
}

export function getRepartoEspecial(anio: number, id: number) {
  return api<RepartoEspecial>(`${BASE_PATH}/${anio}/especiales/${id}/reparto`)
}

export function asignarCoordinadorEspecial(anio: number, id: number, idUsuario: number, monto: number) {
  return api<RepartoEspecial>(`${BASE_PATH}/${anio}/especiales/${id}/coordinadores`, {
    method: 'PUT',
    body: JSON.stringify({ idUsuario, monto }),
  })
}

export function especialesParaRepartir(anio: number) {
  return api<EspecialParaRepartir[]>(`${BASE_PATH}/${anio}/especiales/para-repartir`)
}

export function asignarAreaEspecial(anio: number, id: number, redId: number, monto: number) {
  return api<{ id: number; monto: number; areas: EspecialParaRepartir['areas'] }>(
    `${BASE_PATH}/${anio}/especiales/${id}/areas`,
    {
      method: 'PUT',
      body: JSON.stringify({ redId, monto }),
    },
  )
}