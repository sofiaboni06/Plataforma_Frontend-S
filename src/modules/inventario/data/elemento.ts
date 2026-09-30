import { api } from '@/shared/lib/api'
import type {
  ClasificacionElementoApi,
  CodigoEstandarApi,
  CreateElementoPayload,
  ElementoApi,
  UnidadMedidaApi,
  UpdateElementoPayload,
  UsoPresupuestalApi,
} from '@/modules/inventario/types/elemento'

function withCenter(path: string, idCformacion?: number | null, extra?: Record<string, string>) {
  const params = new URLSearchParams()
  if (idCformacion) params.set('idCformacion', String(idCformacion))
  if (extra) {
    for (const [key, value] of Object.entries(extra)) params.set(key, value)
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

function ofThisCenter<T extends { idCformacion?: number }>(rows: T[], idCformacion?: number | null) {
  if (!idCformacion) return rows
  return rows.filter((row) => row.idCformacion == null || row.idCformacion === idCformacion)
}

function byNombre<T extends { nombre: string }>(rows: T[]) {
  return [...rows].sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'))
}

async function listActiveAndOff<T extends { id: number; nombre: string; idCformacion?: number }>(
  path: string,
  idCformacion?: number | null,
) {
  const active = ofThisCenter(await api<T[]>(withCenter(path, idCformacion)), idCformacion)
  let inactive: T[] = []
  try {
    inactive = ofThisCenter(
      await api<T[]>(withCenter(path, idCformacion, { estado: 'false' })),
      idCformacion,
    )
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

export function updateElemento(
  id: string | number,
  payload: UpdateElementoPayload,
): Promise<ElementoApi> {
  return api<ElementoApi>(`/inventario/elementos/${id}`, {
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

export async function getUnidadesMedida(idCformacion?: number | null): Promise<UnidadMedidaApi[]> {
  const rows = await api<UnidadMedidaApi[]>(withCenter('/unidades-medida', idCformacion))
  return byNombre(ofThisCenter(rows, idCformacion))
}

export function getUnidadesMedidaTodas(idCformacion?: number | null) {
  return listActiveAndOff<UnidadMedidaApi>('/unidades-medida', idCformacion)
}

export function createUnidadMedida(payload: {
  nombre: string
  abreviatura: string
  estado?: boolean
  idCformacion?: number
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

export async function getClasificacionesActivas(
  idCformacion?: number | null,
): Promise<ClasificacionElementoApi[]> {
  const rows = await api<ClasificacionElementoApi[]>(withCenter('/clasificaciones-elemento', idCformacion))
  return byNombre(ofThisCenter(rows, idCformacion))
}

export function getClasificaciones(idCformacion?: number | null) {
  return listActiveAndOff<ClasificacionElementoApi>('/clasificaciones-elemento', idCformacion)
}

export function createClasificacion(payload: { nombre: string; estado?: boolean; idCformacion?: number }) {
  return api<ClasificacionElementoApi>('/clasificaciones-elemento', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateClasificacion(
  id: string | number,
  payload: { nombre?: string; estado?: boolean },
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

export async function getCodigosEstandar(idCformacion?: number | null): Promise<CodigoEstandarApi[]> {
  const rows = await api<CodigoEstandarApi[]>(withCenter('/codigos-estandar', idCformacion))
  return byNombre(ofThisCenter(rows, idCformacion))
}

export function createCodigoEstandar(payload: {
  codigo: string
  nombre: string
  idCformacion?: number
}) {
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

export async function getUsosPresupuestales(
  idCformacion?: number | null,
): Promise<UsoPresupuestalApi[]> {
  const rows = await api<UsoPresupuestalApi[]>(withCenter('/usos-presupuestales', idCformacion))
  return byNombre(ofThisCenter(rows, idCformacion))
}

export function getUsosPresupuestalesTodos(idCformacion?: number | null) {
  return listActiveAndOff<UsoPresupuestalApi>('/usos-presupuestales', idCformacion)
}

export function createUsoPresupuestal(payload: {
  nombre: string
  estado?: boolean
  idCformacion?: number
}) {
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
