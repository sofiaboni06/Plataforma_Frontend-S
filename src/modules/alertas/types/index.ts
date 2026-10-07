export type TipoAlerta = 'agotado' | 'por_agotarse'

export type AlertaApi = {
  id: number
  idElemento: number
  tipo: TipoAlerta
  cantidad: number
  cantidadMinima: number
  estado: boolean
  fecha: string | null
  elemento: {
    id: number
    nombre: string
    codigo: string
  } | null
}
