import { cn } from '@/shared/lib/cn'
import { textoPlazo } from '@/modules/solicitudes/lib/presentacion'
import type { EstadoPlazo } from '@/modules/solicitudes/types'

/*
 * Cómo va la devolución de lo que sigue afuera. Mismo formato que StatusPill,
 * pero lo vencido va en rojo: es lo que bodega tiene que mirar antes de
 * volver a prestarle a esa persona.
 */
export default function PlazoPill({
  plazo,
  limite,
}: {
  plazo: EstadoPlazo
  limite?: string | null
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-semibold whitespace-nowrap',
        plazo === 'al_dia' && 'border-sena-ok-line/70 bg-sena-active-soft text-sena-ok-text',
        plazo === 'vence_hoy' && 'border-sena-warn-line bg-sena-warn-soft text-sena-warn-text',
        plazo === 'vencido' && 'border-sena-danger-line bg-sena-danger-soft text-sena-danger-text',
        plazo === 'sin_fecha' && 'border-sena-line bg-sena-off-soft text-sena-text-soft',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-[7px] rounded-full',
          plazo === 'al_dia' && 'bg-sena-ok-text',
          plazo === 'vence_hoy' && 'bg-sena-warn-text',
          plazo === 'vencido' && 'bg-sena-danger-text',
          plazo === 'sin_fecha' && 'bg-sena-text-soft',
        )}
      />
      {textoPlazo(plazo, limite)}
    </span>
  )
}
