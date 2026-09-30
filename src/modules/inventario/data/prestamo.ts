import { api } from '@/shared/lib/api'

import type {
  CreatePrestamoPayload,
  Prestamo,
  PrestamoEstado,
} from '@/modules/inventario/types/prestamo'

export function getPrestamos() {
  return api<Prestamo[]>('/prestamos')
}

export function getPrestamo(id: number) {
  return api<Prestamo>(`/prestamos/${id}`)
}

export function createPrestamo(
  payload: CreatePrestamoPayload,
) {
  return api<Prestamo>('/prestamos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePrestamo(
  id: number,
  payload: {
    idActividad?: number
    ficha?: string
    observacion?: string
    estado?: PrestamoEstado
  },
) {
  return api<Prestamo>(`/prestamos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function devolverPrestamo(id: number) {
  return api<Prestamo>(
    `/prestamos/${id}/devolucion`,
    {
      method: 'POST',
    },
  )
}

export function cambiarEstadoPrestamo(
  id: number,
  estado: PrestamoEstado,
) {
  return api<Prestamo>(
    `/prestamos/${id}/estado`,
    {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    },
  )
}