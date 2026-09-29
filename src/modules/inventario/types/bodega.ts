export type CentroFormacion = {
  id: number
  nombre: string
}

export type StandResumen = {
  id: number
  nombre: string
  estado: boolean
}

export type SubBodegaApi = {
  id: number
  idBodega: number
  nombre: string
  estado: boolean
  stands?: StandResumen[]
  totalStands: number
  bodega?: {
    id: number
    nombre: string
    idCformacion: number
  } | null
}

export type StandApi = StandResumen & {
  idSubBodega: number
  subBodega?: {
    id: number
    nombre: string
    idBodega: number
  } | null
  bodega?: {
    id: number
    nombre: string
    idCformacion: number
  } | null
}

export type BodegaApi = {
  id: number
  idCformacion?: number
  nombre: string
  estado: boolean
  ubicacion: string | null
  centroFormacion: CentroFormacion | null
  subBodegas: SubBodegaApi[]
  totalSubBodegas: number
}

export type CreateBodegaPayload = {
  nombre: string
  idCformacion?: number
  estado?: boolean
}

export type UpdateBodegaPayload = {
  nombre?: string
  idCformacion?: number
  estado?: boolean
}

export type CreateStandPayload = {
  nombre: string
  estado?: boolean
}

export type UpdateStandPayload = {
  nombre?: string
  estado?: boolean
}
