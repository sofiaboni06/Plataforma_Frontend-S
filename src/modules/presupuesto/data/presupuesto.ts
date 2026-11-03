import { api, apiBlob } from '@/shared/lib/api'

export type PresupuestoPrograma = {
  programaId: number
  codigo: string | null
  nombre: string
  monto: number
  pedido: number
  aprobado: number
  disponible: number
  sePasa: boolean
}

export type PresupuestoLote = {
  nombre: string
  gastado: number
}

export type CoordinadorPresupuesto = {
  id: number
  fullName: string
  monto: number
}

export type AreaPresupuesto = {
  id: number
  nombre: string
  codigo: string | null
  monto: number
}

export type FichaPresupuesto = {
  id: number
  numeroFicha: string
  programa: string
  monto: number
}

export type PresupuestoResumen = {
  anio: number
  idCformacion: number
  monto: number
  repartido: number
  sinRepartir: number
  pedido: number
  aprobado: number
  disponible: number
  sePasa: boolean
  programas: PresupuestoPrograma[]
  coordinadores: CoordinadorPresupuesto[]
  areas: AreaPresupuesto[]
  fichas: FichaPresupuesto[]
  porLote: PresupuestoLote[]
}

export type VistaCoordinadores = {
  anio: number
  idCformacion: number
  monto: number
  repartido: number
  sinRepartir: number
  coordinadores: CoordinadorPresupuesto[]
}

export type LoteVigencia = {
  id: number
  anio: number
  nombre: string
}

const BASE = '/presupuesto-formacion'

export function getPresupuesto(anio: number) {
  return api<PresupuestoResumen>(`${BASE}?anio=${anio}`)
}

export function getCoordinadoresPresupuesto(anio: number) {
  return api<VistaCoordinadores>(`${BASE}/coordinadores?anio=${anio}`)
}

export function guardarMonto(anio: number, monto: number) {
  return api<PresupuestoResumen>(`${BASE}/monto`, {
    method: 'PUT',
    body: JSON.stringify({ anio, monto }),
  })
}

export type VistaFichas = {
  anio: number
  monto: number
  repartido: number
  sinRepartir: number
  fichas: FichaPresupuesto[]
}

export type VistaAreas = {
  anio: number
  monto: number
  repartido: number
  sinRepartir: number
  areas: AreaPresupuesto[]
}

export function asignarArea(anio: number, programaId: number, monto: number) {
  return api<VistaAreas>(`${BASE}/areas`, {
    method: 'PUT',
    body: JSON.stringify({ anio, programaId, monto }),
  })
}

export function asignarFicha(anio: number, fichaId: number, monto: number) {
  return api<VistaFichas>(`${BASE}/fichas`, {
    method: 'PUT',
    body: JSON.stringify({ anio, fichaId, monto }),
  })
}

export function asignarCoordinador(anio: number, idUsuario: number, monto: number) {
  return api<VistaCoordinadores>(`${BASE}/coordinadores`, {
    method: 'PUT',
    body: JSON.stringify({ anio, idUsuario, monto }),
  })
}

export function getLotes(anio: number) {
  return api<LoteVigencia[]>(`${BASE}/lotes?anio=${anio}`)
}

export function crearLote(anio: number, nombre: string) {
  return api<LoteVigencia>(`${BASE}/lotes`, {
    method: 'POST',
    body: JSON.stringify({ anio, nombre }),
  })
}

export async function descargarPresupuesto(anio: number, formato: 'excel' | 'pdf') {
  const blob = await apiBlob(`${BASE}/descargar?anio=${anio}&formato=${formato}`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `presupuesto-${anio}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`
  link.click()
  URL.revokeObjectURL(url)
}
