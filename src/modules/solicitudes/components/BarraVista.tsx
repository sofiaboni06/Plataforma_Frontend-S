import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'

export type PestanaVista<T extends string> = { id: T; label: string }

/*
 * Barra de las vistas de bodega: volver a Solicitudes, las pestañas de la
 * vista y, debajo y separada, la búsqueda con sus filtros. Una sola tarjeta
 * en lugar de dos pegadas.
 */
export default function BarraVista<T extends string>({
  pestanas,
  activa,
  onCambiar,
  volverA = '/inventario/solicitudes',
  children,
}: {
  pestanas: PestanaVista<T>[]
  activa: T
  onCambiar: (id: T) => void
  volverA?: string
  children?: ReactNode
}) {
  return (
    <section className="mb-6 rounded-[26px] border border-glass-line bg-glass shadow-surface backdrop-blur-glass">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:flex-wrap sm:items-center sm:px-7">
        <Link
          to={volverA}
          className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-xl border border-sena-line bg-white/70 px-4 text-sm font-semibold text-sena-strong transition duration-150 hover:border-sena/45 hover:bg-white hover:text-sena-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena"
        >
          <span aria-hidden="true">←</span>
          Solicitudes
        </Link>

        {pestanas.length > 1 ? (
          <>
            <span aria-hidden="true" className="hidden h-7 w-px bg-sena-line sm:block" />
            <div
              role="tablist"
              aria-label="Vista"
              className="flex w-full flex-wrap gap-1.5 rounded-2xl border border-sena-line bg-white/55 p-1.5 sm:w-fit"
            >
              {pestanas.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={id === activa}
                  onClick={() => {
                    if (id !== activa) onCambiar(id)
                  }}
                  className={cn(
                    'h-10 flex-1 rounded-xl px-5 text-sm font-semibold whitespace-nowrap transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena sm:flex-none',
                    id === activa
                      ? 'bg-sena text-white shadow-brand'
                      : 'text-sena-dark hover:bg-sena-veil',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {children ? (
        <div className="flex flex-col gap-5 border-t border-sena-hairline px-6 pt-6 pb-5 sm:px-7 lg:flex-row lg:items-end">
          {children}
        </div>
      ) : null}
    </section>
  )
}

/* Título de cada bloque de una página, con aire arriba y abajo. */
export function TituloSeccion({
  id,
  titulo,
  descripcion,
  accion,
}: {
  id?: string
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-bold text-sena-dark">
          {titulo}
        </h2>
        {descripcion ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-sena-text-soft">{descripcion}</p>
        ) : null}
      </div>
      {accion ? <div className="shrink-0">{accion}</div> : null}
    </div>
  )
}
