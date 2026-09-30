export type PrestamoEstado =
  | 'prestado'
  | 'devuelto'
  | 'consumido'

export type Prestamo = {
  id: number
  idElemento: number
  idUsuario: number
  idActividad: number
  cantidad: number
  ficha: string | null
  fecha: string
  estado: PrestamoEstado
  observacion: string | null

  elemento: {
    id: number
    nombre: string
    codigo: string | null
    cantidad: number
  } | null

  usuario: {
    id: number
    nombres: string
    apellidos: string
    fullName: string
    numeroDocumento: string
    email: string
  } | null

  actividad: {
    id: number
    nombre: string
    lugar: string | null
    estado: boolean
  } | null
}

export type CreatePrestamoPayload = {
  idElemento: number
  idUsuario: number
  idActividad: number
  cantidad: number
  ficha?: string
  observacion?: string
}