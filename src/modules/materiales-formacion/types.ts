export type MaterialFormacionUnidad = {
  id: number
  nombre: string
  abreviatura: string
}

export type MaterialFormacionPrograma = {
  id: number
  codigo: string
  nombre: string
  version: string
  estado?: boolean
}

export type MaterialFormacionElemento = {
  id: number
  nombre: string
  codigo: string | null
  estado: boolean
  urlFotografia?: string | null
  /** Datos de identificación del propio elemento (no son stock de inventario). */
  marca?: string | null
  clasificacion?: { id: number; nombre: string } | null
  unidadMedida: MaterialFormacionUnidad | null
}

/**
 * Un material de formación asigna un elemento del inventario a un programa,
 * con su cantidad base. El elemento no se copia: solo se referencia.
 */
export type MaterialFormacionApi = {
  id: number
  idPrograma: number
  idElemento: number
  cantidadBase: number
  observaciones: string | null
  estado: boolean
  createdAt?: string | null
  updatedAt?: string | null
  programa: MaterialFormacionPrograma | null
  elemento: MaterialFormacionElemento | null
}

export type CreateMaterialFormacionPayload = {
  idPrograma: number
  idElemento: number
  cantidadBase: number
  observaciones?: string
  estado?: boolean
}

export type UpdateMaterialFormacionPayload = {
  idPrograma?: number
  idElemento?: number
  cantidadBase?: number
  observaciones?: string | null
  estado?: boolean
}

export type SolicitudMaterialFormacionEstado = 'pendiente' | 'atendida' | 'cancelada'

/**
 * Solicitud de material de formación: pide un material de la lista maestra
 * de un programa (NO es una solicitud de inventario: no lleva obra, bodega,
 * entregas ni devoluciones).
 */
export type SolicitudMaterialFormacionApi = {
  id: number
  idMaterial: number
  idPrograma: number | null
  idElemento: number | null
  cantidadSolicitada: number
  observaciones: string | null
  estado: SolicitudMaterialFormacionEstado
  createdAt?: string | null
  updatedAt?: string | null
  solicitante: string | null
  programa: MaterialFormacionPrograma | null
  elemento: MaterialFormacionElemento | null
}

export type CreateSolicitudMaterialFormacionPayload = {
  idMaterial: number
  cantidadSolicitada: number
  observaciones?: string
}
