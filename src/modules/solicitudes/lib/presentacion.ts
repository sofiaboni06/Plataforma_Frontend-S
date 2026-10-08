import type {
  CaracterElemento,
  ElementoApi,
  SolicitudPendienteApi,
} from '@/modules/inventario/types/elemento'
import type {
  EstadoPlazo,
  FacturaApi,
  FacturaEstado,
  FacturaFilaApi,
  SolicitudEstado,
} from '@/modules/solicitudes/types'

/*
 * Solicitudes > Entregar del tipo de las pendientes, ya filtrado por el código
 * del elemento. Si hubiera de material y de equipo, la portada de Solicitudes.
 */
export function rutaEntregar(codigoElemento: string, filas: SolicitudPendienteApi[]) {
  const tipos = new Set(filas.map((fila) => fila.tipo))
  if (tipos.size !== 1) return '/inventario/solicitudes'
  const [tipo] = [...tipos]
  const query = new URLSearchParams({ vista: 'entregar', buscar: codigoElemento })
  return `/inventario/solicitudes/${tipo}?${query}`
}

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

/* El tipo es del elemento; la clasificación solo lo sugiere al crearlo. */
/*
 * El tipo es del elemento. Si no viene (elemento viejo, o un backend sin la
 * migración del tipo), se usa el de su clasificación para no esconderlo.
 */
export function caracterOf(elemento: ElementoApi): CaracterElemento | null {
  const caracter = elemento.caracter ?? elemento.clasificacion?.caracter
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
  if (estado === 'parcial') return 'Entrega parcial'
  return 'Pendiente'
}

/* Bodega todavía puede entregar: no ha salido nada o salió solo una parte. */
export function porEntregar(estado: SolicitudEstado) {
  return estado === 'pendiente' || estado === 'parcial'
}

/* Equipo con unidades afuera (entregado menos devuelto): bodega puede recibirlo. */
export function tieneAfuera(row: { cantidadAfuera?: number | null }) {
  return (row.cantidadAfuera ?? 0) > 0
}

/* Filas de la factura a las que les falta algo: pendientes más parciales. */
export function filasPorEntregar(totales: FacturaApi['totales']) {
  return totales.pendientes + totales.parciales
}

/* Existencia en el estante de la fila. Sin dato (no debería pasar en bodega), se asume que hay. */
export function existenciaDe(fila: FacturaFilaApi) {
  const valor = fila.elemento?.cantidad
  if (valor === undefined || valor === null) return null
  const cantidad = Number(valor)
  return Number.isFinite(cantidad) ? Math.max(0, cantidad) : null
}

/* Lo que saldría de una fila con "Entregar todo lo disponible". */
export function saldria(fila: FacturaFilaApi) {
  if (!porEntregar(fila.estado)) return 0
  const existencia = existenciaDe(fila)
  return existencia === null ? fila.cantidadPendiente : Math.min(fila.cantidadPendiente, existencia)
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

/*
 * Fechas de calendario de las solicitudes (`YYYY-MM-DD`). Se arman con la
 * fecha local para que no se corran un día por la zona horaria.
 */
function aDia(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function deDia(dia: string) {
  const [anio, mes, numero] = dia.split('-').map(Number)
  return new Date(anio, mes - 1, numero)
}

export function hoyDia() {
  return aDia(new Date())
}

export function sumarDias(dia: string, dias: number) {
  const fecha = deDia(dia)
  fecha.setDate(fecha.getDate() + dias)
  return aDia(fecha)
}

/* 2026-10-08 → "08 oct 2026". */
export function formatFechaDia(dia: string | null | undefined) {
  if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return ''

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(deDia(dia))
}

/* Días de atraso respecto a hoy: 0 si vence hoy o todavía no vence. */
export function diasDeAtraso(limite: string | null | undefined) {
  if (!limite) return 0
  const diferencia = deDia(hoyDia()).getTime() - deDia(limite).getTime()
  return Math.max(0, Math.round(diferencia / 86_400_000))
}

/* La fecha que bodega puede confirmar: la primera que no sea anterior a hoy. */
export function plazoInicial(...candidatas: (string | null | undefined)[]) {
  const hoy = hoyDia()
  return candidatas.find((fecha): fecha is string => Boolean(fecha) && fecha! >= hoy) ?? ''
}

export const PLAZO_LABEL: Record<EstadoPlazo, string> = {
  sin_fecha: 'Sin fecha límite',
  al_dia: 'Al día',
  vence_hoy: 'Vence hoy',
  vencido: 'Vencido',
}

/* "Vencido hace 3 días", "Vence hoy", "Al día · hasta 15 oct 2026". */
export function textoPlazo(plazo: EstadoPlazo, limite: string | null | undefined) {
  if (plazo === 'vencido') {
    const dias = diasDeAtraso(limite)
    return `Vencido hace ${dias === 1 ? '1 día' : `${dias} días`}`
  }
  if (plazo === 'al_dia' && limite) return `Hasta ${formatFechaDia(limite)}`
  return PLAZO_LABEL[plazo]
}

export const CARACTER_LABEL: Record<CaracterElemento, string> = {
  devolutivo: 'Devolutivo',
  consumo: 'Consumo',
}

export const inputClass =
  'w-full rounded-2xl border border-sena-line bg-white/80 px-4 py-3 text-sm text-sena-text outline-none transition focus:border-sena focus:bg-white focus:ring-4 focus:ring-sena/10'

export const inputErrorClass =
  'w-full rounded-2xl border border-sena-danger-line bg-sena-danger-soft/40 px-4 py-3 text-sm text-sena-text outline-none transition focus:border-sena-danger-text focus:bg-white focus:ring-4 focus:ring-sena-danger-text/10'
