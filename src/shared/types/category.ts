export type CategoryApi = {
  id: number
  idCformacion: number
  nombre: string
  estado: boolean
}

export type SubcategoryApi = {
  id: number
  idCategoria: number
  nombre: string
  estado: boolean
}
