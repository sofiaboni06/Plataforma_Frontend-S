import {
  formatFechaDia,
  hoyDia,
  inputClass,
  inputErrorClass,
} from '@/modules/solicitudes/lib/presentacion'

/*
 * Fecha límite de devolución de un préstamo de equipo. Bodega la confirma o
 * la ajusta al entregar (o después, si se corre el plazo). Desde ese día, si
 * algo sigue afuera, al instructor y a bodega les llega un aviso diario.
 */
export default function CampoPlazo({
  id,
  value,
  onChange,
  propuesta,
  invalido = false,
  label = 'Fecha límite de devolución',
}: {
  id: string
  value: string
  onChange: (value: string) => void
  propuesta?: string | null
  invalido?: boolean
  label?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex flex-wrap items-center gap-x-2 text-sm font-semibold text-sena-text">
        {label}
        <span className="text-sena">*</span>
        <span className="text-xs font-normal text-sena-text-soft">
          {propuesta
            ? `El instructor propuso el ${formatFechaDia(propuesta)}`
            : 'El instructor no propuso fecha'}
        </span>
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={hoyDia()}
        onChange={(event) => onChange(event.target.value)}
        className={invalido ? inputErrorClass : inputClass}
        required
      />
      <p className="mt-1.5 text-xs text-sena-text-soft">
        Desde ese día, mientras quede algo afuera, el instructor y bodega reciben un aviso diario.
      </p>
    </div>
  )
}
