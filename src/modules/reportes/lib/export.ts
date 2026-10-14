import { apiBlob } from '@/shared/lib/api'

export type ReporteFormato = 'excel' | 'pdf'

export type CampoReporte =
  | 'codigo'
  | 'nombre'
  | 'cantidad'
  | 'cantidadMinima'
  | 'estado'
  | 'valorUnitario'
  | 'porcentajeAumento'
  | 'valorConAumento'
  | 'unidad'
  | 'clasificacion'
  | 'caracter'
  | 'bodega'
  | 'subBodega'
  | 'stand'
  | 'item'
  | 'categoria'
  | 'subcategoria'
  | 'codigoEstandar'
  | 'usoPresupuestal'
  | 'descripcion'
  | 'marca'
  | 'color'
  | 'gramaje'

export const CAMPOS_DISPONIBLES: Record<CampoReporte, { label: string; grupo: string }> = {
  codigo: { label: 'Código', grupo: 'Identificación' },
  nombre: { label: 'Nombre', grupo: 'Identificación' },
  cantidad: { label: 'Cantidad', grupo: 'Inventario' },
  cantidadMinima: { label: 'Cantidad Mínima', grupo: 'Inventario' },
  estado: { label: 'Estado', grupo: 'Inventario' },
  valorUnitario: { label: 'Valor Unitario', grupo: 'Valores' },
  porcentajeAumento: { label: '% Aumento', grupo: 'Valores' },
  valorConAumento: { label: 'Valor con Aumento', grupo: 'Valores' },
  unidad: { label: 'Unidad', grupo: 'Especificaciones' },
  clasificacion: { label: 'Clasificación', grupo: 'Especificaciones' },
  caracter: { label: 'Tipo', grupo: 'Especificaciones' },
  marca: { label: 'Marca', grupo: 'Especificaciones' },
  color: { label: 'Color', grupo: 'Especificaciones' },
  gramaje: { label: 'Gramaje', grupo: 'Especificaciones' },
  descripcion: { label: 'Descripción', grupo: 'Especificaciones' },
  bodega: { label: 'Bodega', grupo: 'Ubicación' },
  subBodega: { label: 'Sub-bodega', grupo: 'Ubicación' },
  stand: { label: 'Stand', grupo: 'Ubicación' },
  item: { label: 'Ítem', grupo: 'Clasificación' },
  categoria: { label: 'Categoría', grupo: 'Clasificación' },
  subcategoria: { label: 'Subcategoría', grupo: 'Clasificación' },
  codigoEstandar: { label: 'Código UNSPSC', grupo: 'Clasificación' },
  usoPresupuestal: { label: 'Uso Presupuestal', grupo: 'Clasificación' },
}

export type ReporteBodegaPayload = {
  bodegaId: number
  formato: ReporteFormato
  campos?: CampoReporte[]
}

export type ReporteElementosPayload = {
  bodegaIds?: number[]
  formato: ReporteFormato
  campos?: CampoReporte[]
}

/**
 * Genera un reporte de materiales de una bodega específica en Excel o PDF
 */
export async function generarReporteBodega(payload: ReporteBodegaPayload): Promise<Blob> {
  const params = new URLSearchParams()

  if (payload.campos && payload.campos.length > 0) {
    payload.campos.forEach(campo => params.append('campos', campo))
  }

  const queryString = params.toString()
  const url = queryString
    ? `/reportes/bodega/${payload.bodegaId}/${payload.formato}?${queryString}`
    : `/reportes/bodega/${payload.bodegaId}/${payload.formato}`

  const acceptHeader = payload.formato === 'excel'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/pdf'

  return apiBlob(url, {
    method: 'GET',
    headers: {
      Accept: acceptHeader,
    },
  })
}

/**
 * Genera un reporte de materiales filtrado por las bodegas del usuario
 */
export async function generarReporteElementos(payload: ReporteElementosPayload): Promise<Blob> {
  const params = new URLSearchParams()
  params.append('formato', payload.formato)

  if (payload.bodegaIds && payload.bodegaIds.length > 0) {
    payload.bodegaIds.forEach(id => params.append('bodegaIds', String(id)))
  }

  if (payload.campos && payload.campos.length > 0) {
    payload.campos.forEach(campo => params.append('campos', campo))
  }

  const acceptHeader = payload.formato === 'excel'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/pdf'

  return apiBlob(`/reportes/elementos?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: acceptHeader,
    },
  })
}

/**
 * Descarga un archivo Blob con el nombre especificado
 */
export function descargarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombre
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Genera el nombre del archivo según el formato y la fecha
 */
export function nombreArchivoReporte(tipo: string, formato: ReporteFormato): string {
  const fecha = new Date().toISOString().split('T')[0]
  const extension = formato === 'excel' ? 'xlsx' : 'pdf'
  return `reporte_${tipo}_${fecha}.${extension}`
}
