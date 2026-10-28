import { api, apiBlob } from '@/shared/lib/api'
import { descargarArchivo } from '@/modules/reportes/lib/export'

export type ListaMaestraItem = {
  id: number
  programaId: number
  codigoUnspsc: string
  producto: string
  descripcionTecnica: string | null
  unidadMedida: string | null
  valorUnitario: number | null
  loteId: number | null
  lote: { id: number; nombre: string } | null
  cantidadBase: number
  caracter: 'consumo' | 'devolutivo' | 'software' | null
  observaciones: string | null
  estado: boolean
}

export type ImportListaMaestraResult = {
  carga: { id: number; registrosOk: number; registrosError: number; estado: string }
  items: ListaMaestraItem[]
  errores: string[]
}

export function getListaMaestra(programaId: number) {
  return api<ListaMaestraItem[]>(`/listas-maestras-material?programaId=${programaId}`)
}

export function createListaMaestra(payload: {
  programaId: number
  codigoUnspsc: string
  producto: string
  descripcionTecnica?: string | null
  unidadMedida?: string | null
  valorUnitario?: number | null
  loteId?: number | null
  cantidadBase: number
  caracter?: ListaMaestraItem['caracter']
  observaciones?: string | null
}) {
  return api<ListaMaestraItem>('/listas-maestras-material', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function importListaMaestra(programaId: number, file: File) {
  const form = new FormData()
  form.append('programaId', String(programaId))
  form.append('archivo', file)
  return api<ImportListaMaestraResult>('/listas-maestras-material/importar', {
    method: 'POST',
    body: form,
  })
}

export function updateListaMaestra(
  id: number,
  payload: {
    codigoUnspsc?: string
    producto?: string
    descripcionTecnica?: string | null
    unidadMedida?: string | null
    valorUnitario?: number | null
    loteId?: number | null
    cantidadBase?: number
    caracter?: ListaMaestraItem['caracter']
    observaciones?: string | null
  },
) {
  return api<ListaMaestraItem>(`/listas-maestras-material/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteListaMaestra(id: number) {
  return api<{ message: string }>(`/listas-maestras-material/${id}`, { method: 'DELETE' })
}

export async function downloadPlantillaListaMaestra(programaId?: number) {
  const query = programaId ? `?programaId=${programaId}` : ''
  const blob = await apiBlob(`/listas-maestras-material/plantilla${query}`)
  descargarArchivo(blob, 'plantilla-lista-maestra.xlsx')
}
