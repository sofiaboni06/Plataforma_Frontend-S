export type ItemApi = {
  id: number
  nombre: string
  descripcion: string | null
  idSubcategoria: number
  estado: boolean
  subcategoria: {
    id: number
    nombre: string
    idCategoria: number
    categoria: {
      id: number
      nombre: string
    } | null
  } | null
}

export type CreateItemPayload = {
  idSubcategoria: number
  nombre: string
  descripcion?: string | null
  estado?: boolean
}

export type UpdateItemPayload = Partial<CreateItemPayload>
