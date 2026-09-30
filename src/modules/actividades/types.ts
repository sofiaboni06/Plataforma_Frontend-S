export type Actividad = {
  id: number
  nombre: string
  lugar: string | null
  estado: boolean
}

export type ActividadPayload = {
  nombre: string
  lugar?: string
  estado?: boolean
}