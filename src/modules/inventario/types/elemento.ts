export type ClasificacionElementoApi = {
  id: number
  idCformacion?: number
  nombre: string
  estado: boolean
}

export type UsoPresupuestalApi = {
  id: number
  idCformacion?: number
  nombre: string
  estado: boolean
}

export type CodigoEstandarApi = {
  id: number
  idCformacion?: number
  codigo: string
  nombre: string
}

export type ElementoApi = {
  id: number
  idItem: number | null
  idSubcategoria: number
  idStand: number
  nombre: string
  cantidad: number
  gramaje: number | null
  idClasificacion: number | null
  clasificacion: {
    id: number
    nombre: string
  } | null
  valorUnitarioPromedio: number | null
  porcentajeAumento: number | null
  valorConAumento: number | null
  estado: boolean
  idUnidadMedida: number
  codigo: string
  idCodigoEstandar: number | null
  codigoEstandar: CodigoEstandarApi | null
  idUsoPresupuestal?: number | null
  usoPresupuestal?: {
    id: number
    nombre: string
  } | null
  descripcion: string | null
  marca: string | null
  color: string | null
  urlFotografia: string | null
  item: {
    id: number
    nombre: string
    descripcion: string | null
    idSubcategoria: number
  } | null
  subcategoria: {
    id: number
    nombre: string
  } | null
  stand: {
    id: number
    nombre: string
    idSubBodega: number
    subBodega?: {
      id: number
      nombre: string
      idBodega: number
    } | null
  } | null
  unidadMedida: {
    id: number
    nombre: string
    abreviatura: string
  } | null
}

export type CreateElementoPayload = {
  idItem: number
  idStand: number
  cantidad: number
  estado: boolean
  idUnidadMedida: number
  codigo: string
  gramaje?: number | null
  descripcion?: string | null
  marca?: string | null
  color?: string | null
  idClasificacion?: number | null
  valorUnitarioPromedio?: number | null
  porcentajeAumento?: number | null
  idCodigoEstandar?: number | null
  idUsoPresupuestal?: number | null
}

export type UpdateElementoPayload = Partial<CreateElementoPayload>

export type UnidadMedidaApi = {
  id: number
  idCformacion?: number
  nombre: string
  abreviatura: string
  estado: boolean
}

export type CatalogoElementoKind = 'clasificacion' | 'unidad' | 'uso' | 'codigo'
