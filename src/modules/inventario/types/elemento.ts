export type ElementoApi = {
  id: number
  idSubcategoria: number
  idStand: number
  nombre: string
  cantidad: number
  estado: boolean
  idUnidadMedida: number
  codigo: string
  descripcion: string | null
  marca: string | null
  urlFotografia: string | null
  subcategoria: {
    id: number
    nombre: string
  } | null
  stand: {
    id: number
    nombre: string
    idBodega: number
    bodega?: {
      id: number
      nombre: string
    } | null
  } | null
  unidadMedida: {
    id: number
    nombre: string
    abreviatura: string
  } | null
}

export type CreateElementoPayload = {
  idSubcategoria: number
  idStand: number
  nombre: string
  cantidad: number
  estado: boolean
  idUnidadMedida: number
  codigo: string
  descripcion?: string | null
  marca?: string | null
  urlFotografia?: string | null
}

export type UpdateElementoPayload = Partial<CreateElementoPayload>

export type UnidadMedidaApi = {
  id: number
  nombre: string
  abreviatura: string
  estado: boolean
}
