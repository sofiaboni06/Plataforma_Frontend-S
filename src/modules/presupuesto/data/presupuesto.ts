import { api, apiBlob } from '@/shared/lib/api'

export type PresupuestoFicha = {
  fichaId: number
  numeroFicha: string
  monto: number
  gastado: number
  disponible: number
}

export type PresupuestoLote = {
  nombre: string
  gastado: number
}

export type PresupuestoResumen = {
  anio: number
  monto: number
  repartido: number
  sinRepartir: number
  gastado: number
  disponible: number
  fichas: PresupuestoFicha[]
  porLote: PresupuestoLote[]
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

export function guardarMonto(anio: number, monto: number) {
  return api<PresupuestoResumen>(`${BASE}/monto`, {
    method: 'PUT',
    body: JSON.stringify({ anio, monto }),
  })
}

export function repartirFichas(anio: number, fichas: { fichaId: number; monto: number }[]) {
  return api<PresupuestoResumen>(`${BASE}/fichas`, {
    method: 'PUT',
    body: JSON.stringify({ anio, fichas }),
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
