import { api } from '@/shared/lib/api'
import type {
  ClasificacionElementoApi,
  CodigoEstandarApi,
  CreateElementoPayload,
  ElementoApi,
  ElementoGuardadoApi,
  UnidadMedidaApi,
  UpdateElementoPayload,
  UsoPresupuestalApi,
} from '@/modules/inventario/types/elemento'

function byNombre<T extends { nombre: string }>(rows: T[]) {
  return [...rows].sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'))
}

async function listActiveAndOff<T extends { id: number; nombre: string }>(path: string) {
  const active = await api<T[]>(path)
  let inactive: T[] = []
  try {
    inactive = await api<T[]>(`${path}?estado=false`)
  } catch {
    inactive = []
  }
  const map = new Map<number, T>()
  for (const item of [...active, ...inactive]) map.set(item.id, item)
  return byNombre([...map.values()])
}

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

/* Si la cantidad sube, trae `solicitudesPendientes`: lo que bodega puede ir a entregar. */
export function updateElemento(
  id: string | number,
  payload: UpdateElementoPayload,
): Promise<ElementoGuardadoApi> {
  return api<ElementoGuardadoApi>(`/inventario/elementos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function uploadElementoFotografia(id: string | number, file: File): Promise<ElementoApi> {
  const body = new FormData()
  body.append('fotografia', file)
  return api<ElementoApi>(`/inventario/elementos/${id}/fotografia`, {
    method: 'POST',
    body,
  })
}

export async function getUnidadesMedida(): Promise<UnidadMedidaApi[]> {
  const rows = await api<UnidadMedidaApi[]>('/unidades-medida')
  return byNombre(rows)
}

export function getUnidadesMedidaTodas() {
  return listActiveAndOff<UnidadMedidaApi>('/unidades-medida')
}

export function createUnidadMedida(payload: {
  nombre: string
  abreviatura: string
  estado?: boolean
}) {
  return api<UnidadMedidaApi>('/unidades-medida', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUnidadMedida(
  id: string | number,
  payload: { nombre?: string; abreviatura?: string; estado?: boolean },
) {
  return api<UnidadMedidaApi>(`/unidades-medida/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function disableUnidadMedida(id: string | number) {
  return api<UnidadMedidaApi>(`/unidades-medida/${id}`, { method: 'DELETE' })
}

export async function getClasificacionesActivas(): Promise<ClasificacionElementoApi[]> {
  const rows = await api<ClasificacionElementoApi[]>('/clasificaciones-elemento')
  return byNombre(rows)
}

export function getClasificaciones() {
  return listActiveAndOff<ClasificacionElementoApi>('/clasificaciones-elemento')
}

export function createClasificacion(payload: {
  nombre: string
  caracter: 'consumo' | 'devolutivo'
  estado?: boolean
}) {
  return api<ClasificacionElementoApi>('/clasificaciones-elemento', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateClasificacion(
  id: string | number,
  payload: { nombre?: string; caracter?: 'consumo' | 'devolutivo'; estado?: boolean },
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

export async function getCodigosEstandar(): Promise<CodigoEstandarApi[]> {
  const rows = await api<CodigoEstandarApi[]>('/codigos-estandar')
  return byNombre(rows)
}

export function createCodigoEstandar(payload: { codigo: string; nombre: string }) {
  return api<CodigoEstandarApi>('/codigos-estandar', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCodigoEstandar(
  id: string | number,
  payload: { codigo?: string; nombre?: string },
) {
  return api<CodigoEstandarApi>(`/codigos-estandar/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteCodigoEstandar(id: string | number) {
  return api<unknown>(`/codigos-estandar/${id}`, { method: 'DELETE' })
}

export async function getUsosPresupuestales(): Promise<UsoPresupuestalApi[]> {
  const rows = await api<UsoPresupuestalApi[]>('/usos-presupuestales')
  return byNombre(rows)
}

export function getUsosPresupuestalesTodos() {
  return listActiveAndOff<UsoPresupuestalApi>('/usos-presupuestales')
}

export function createUsoPresupuestal(payload: { nombre: string; estado?: boolean }) {
  return api<UsoPresupuestalApi>('/usos-presupuestales', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUsoPresupuestal(
  id: string | number,
  payload: { nombre?: string; estado?: boolean },
) {
  return api<UsoPresupuestalApi>(`/usos-presupuestales/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function disableUsoPresupuestal(id: string | number) {
  return api<UsoPresupuestalApi>(`/usos-presupuestales/${id}`, { method: 'DELETE' })
}
