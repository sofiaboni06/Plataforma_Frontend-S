import type { CaracterElemento } from '@/modules/inventario/types/elemento'

/*
 * El tipo del elemento decide cómo se pide: devolutivo como equipo (se presta
 * y se devuelve), consumo como material (se gasta).
 */
export const CARACTER_LABEL: Record<CaracterElemento, string> = {
  devolutivo: 'Devolutivo',
  consumo: 'Consumo',
}

export const CARACTER_AYUDA =
  'Devolutivo: se presta y se devuelve (Solicitudes de equipo). Consumo: se gasta (Solicitudes de material).'

/* Elementos viejos pueden no tenerlo: no se pueden pedir hasta asignarlo. */
export function caracterLabel(caracter: CaracterElemento | null | undefined) {
  return caracter ? CARACTER_LABEL[caracter] : 'Sin tipo'
}
