export type VigenciaApi = {
  anio: number
  activa: boolean
  fechaApertura: string | null
  fechaCierre: string | null
}

export type CreateVigenciaPayload = {
  anio: number
  activa: boolean
  fecha_apertura: string
  fecha_cierre: string
}

export type UpdateVigenciaPayload = CreateVigenciaPayload