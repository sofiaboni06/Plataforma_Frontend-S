import type { CaracterElemento, ElementoApi } from '@/modules/inventario/types/elemento'
import type { FacturaEstado, SolicitudEstado } from '@/modules/solicitudes/types'

export function personName(person?: { nombres: string; apellidos: string } | null) {
  const name = `${person?.nombres ?? ''} ${person?.apellidos ?? ''}`.trim()
  return name || '—'
}

export function availableOf(elemento: ElementoApi) {
  const value = Number(
    (elemento as ElementoApi & { disponible?: number }).disponible ?? elemento.cantidad,
  )

  return Number.isFinite(value) ? value : 0
}

export function caracterOf(elemento: ElementoApi): CaracterElemento | null {
  const caracter = (elemento.clasificacion as { caracter?: string | null } | null)?.caracter
  return caracter === 'consumo' || caracter === 'devolutivo' ? caracter : null
}

export function formatDate(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDay(value: string | null | undefined) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function requestTone(estado: SolicitudEstado) {
  if (estado === 'entregado') return 'ok' as const
  if (estado === 'devuelto') return 'danger' as const
  return 'warn' as const
}

export function requestLabel(estado: SolicitudEstado) {
  if (estado === 'entregado') return 'Entregado'
  if (estado === 'devuelto') return 'Devuelto'
  return 'Pendiente'
}

export const FACTURA_LABEL: Record<FacturaEstado, string> = {
  pendiente: 'Pendiente',
  parcial: 'Entrega parcial',
  entregado: 'Equipo por devolver',
  cerrado: 'Cerrada',
}

export function facturaTone(estado: FacturaEstado) {
  if (estado === 'entregado') return 'ok' as const
  if (estado === 'cerrado') return 'danger' as const
  return 'warn' as const
}

export const CARACTER_LABEL: Record<CaracterElemento, string> = {
  devolutivo: 'Devolutivo',
  consumo: 'Consumo',
}

export const inputClass =
  'w-full rounded-2xl border border-sena-line bg-white/80 px-4 py-3 text-sm text-sena-text outline-none transition focus:border-sena focus:bg-white focus:ring-4 focus:ring-sena/10'

export const inputErrorClass =
  'w-full rounded-2xl border border-sena-danger-line bg-sena-danger-soft/40 px-4 py-3 text-sm text-sena-text outline-none transition focus:border-sena-danger-text focus:bg-white focus:ring-4 focus:ring-sena-danger-text/10'
