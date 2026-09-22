export type CentroFormacion = {
  id: number
  nombre: string
}

export type StandApi = {
  id: number
  idStand: number
  idBodega?: number
  nombre: string
  estado: boolean
  bodega?: {
    id: number
    nombre: string
  } | null
}

export type BodegaApi = {
  id: number
  id_bodega: number
  id_cformacion: number | null
  nombre: string
  estado: boolean
  ubicacion: string | null
  centroFormacion: CentroFormacion | null
  stands: StandApi[]
  totalStands: number
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