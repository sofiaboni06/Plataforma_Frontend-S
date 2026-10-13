import { Link } from 'react-router-dom'
import type { ElementoApi } from '@/modules/inventario/types/elemento'

type Severidad = 'agotado' | 'critico' | 'bajo'

const SEVERIDAD: Record<Severidad, { chip: string; barra: string; texto: string; label: string }> = {
  agotado: {
    label: 'Agotado',
    chip: 'bg-sena-danger-soft text-sena-danger-text ring-sena-danger-line',
    barra: 'bg-sena-danger-text',
    texto: 'text-sena-danger-text',
  },
  critico: {
    label: 'Crítico',
    chip: 'bg-orange-50 text-orange-700 ring-orange-200',
    barra: 'bg-orange-500',
    texto: 'text-orange-700',
  },
  bajo: {
    label: 'Bajo',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    barra: 'bg-amber-400',
    texto: 'text-amber-700',
  },
}

function severidad(elemento: ElementoApi): Severidad {
  const minimo = elemento.cantidadMinima || 1
  if (elemento.cantidad <= 0) return 'agotado'
  if (elemento.cantidad / minimo <= 0.5) return 'critico'
  return 'bajo'
}

const VISIBLES = 6

/* Elementos agotados o por agotarse, del más grave al menos grave. */
export default function StockReponerList({ elementos }: { elementos: ElementoApi[] }) {
  const ordenados = [...elementos].sort(
    (a, b) => a.cantidad / (a.cantidadMinima || 1) - b.cantidad / (b.cantidadMinima || 1),
  )
  const visibles = ordenados.slice(0, VISIBLES)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-sena-text">
          Para reponer
          <span className="rounded-full bg-sena-muted px-2 py-0.5 text-xs font-semibold text-sena-strong tabular-nums">
            {elementos.length}
          </span>
        </h4>
        {elementos.length > VISIBLES ? (
          <Link to="/inventario/alertas" className="text-xs font-semibold text-sena-strong hover:text-sena-dark hover:underline">
            Ver todos ({elementos.length})
          </Link>
        ) : null}
      </div>

      {elementos.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-sena-ok-line bg-sena-surface px-6 py-10 text-center">
          <div>
            <p className="text-sm font-semibold text-sena-ok-text">Todo el stock está al día</p>
            <p className="mt-1 text-xs text-sena-text-soft">Ningún elemento está agotado ni por debajo de su mínimo.</p>
          </div>
        </div>
      ) : (
        <ul className="-mx-2 max-h-[26rem] flex-1 space-y-1 overflow-y-auto pr-1">
          {visibles.map((elemento) => {
            const nivel = severidad(elemento)
            const estilo = SEVERIDAD[nivel]
            const minimo = elemento.cantidadMinima ?? 0
            const porcentaje = minimo > 0 ? Math.min(100, Math.round((elemento.cantidad / minimo) * 100)) : 0
            const faltan = Math.max(0, minimo - elemento.cantidad)

            return (
              <li key={elemento.id}>
                <Link
                  to={`/inventario/elementos/${elemento.id}`}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-sena-surface focus-visible:outline-2 focus-visible:outline-sena"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-sena-text" title={elemento.nombre}>
                        {elemento.nombre}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${estilo.chip}`}>
                        {estilo.label}
                      </span>
                    </div>
                    {elemento.codigo ? (
                      <span className="mt-1 inline-block rounded-md bg-sena-muted px-1.5 py-0.5 font-mono text-[11px] text-sena-text-soft">
                        {elemento.codigo}
                      </span>
                    ) : null}
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sena-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={minimo}
                      aria-valuenow={elemento.cantidad}
                      aria-label={`${elemento.cantidad} de ${minimo} mínimo`}
                    >
                      <div className={`h-full rounded-full ${estilo.barra}`} style={{ width: `${Math.max(porcentaje, nivel === 'agotado' ? 0 : 4)}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-sena-text tabular-nums">
                      {elemento.cantidad} <span className="font-normal text-sena-text-soft">de {minimo} mín.</span>
                    </p>
                    {faltan > 0 ? (
                      <p className={`text-xs font-semibold tabular-nums ${estilo.texto}`}>Faltan {faltan}</p>
                    ) : (
                      <p className="text-xs text-sena-text-soft">En el mínimo</p>
                    )}
                  </div>
                  <span aria-hidden="true" className="shrink-0 text-lg text-sena-text-soft transition group-hover:translate-x-0.5 group-hover:text-sena-strong">
                    ›
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
