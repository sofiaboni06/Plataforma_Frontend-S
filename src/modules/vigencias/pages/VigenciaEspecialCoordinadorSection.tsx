import { useEffect, useState } from 'react'
import Button from '@/shared/components/ui/Button'
import {
  ErrorBanner,
  TableCard,
  TableLoading,
} from '@/shared/components/DataTable'
import {
  asignarAreaEspecial,
  especialesParaRepartir,
  type EspecialParaRepartir,
} from '@/modules/vigencias/data/vigencia'
import type { VigenciaApi } from '@/modules/vigencias/types/vigencia'

function pesos(valor: number) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

export default function VigenciaEspecialCoordinadorSection({
  vigencias,
}: {
  vigencias: VigenciaApi[]
}) {
  const anioActivo = vigencias.find((vigencia) => vigencia.activa)?.anio ?? vigencias[0]?.anio ?? 0
  const [anio, setAnio] = useState(anioActivo)
  const [filas, setFilas] = useState<EspecialParaRepartir[]>([])
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState('')

  useEffect(() => {
    if (anioActivo && !vigencias.some((vigencia) => vigencia.anio === anio)) {
      setAnio(anioActivo)
    }
  }, [anio, anioActivo, vigencias])

  useEffect(() => {
    if (!anio) return
    void cargar(anio)
  }, [anio])

  async function cargar(anioSeleccionado: number) {
    try {
      setCargando(true)
      setError('')
      const especials = await especialesParaRepartir(anioSeleccionado)
      setFilas(especials)
      setMontos(
        Object.fromEntries(
          especials.flatMap((especial) =>
            especial.areas.map((area) => [`${especial.id}-${area.id}`, area.monto ? String(area.monto) : '']),
          ),
        ),
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las vigencias especiales.')
      setFilas([])
    } finally {
      setCargando(false)
    }
  }

  async function distribuir(especial: EspecialParaRepartir, redId: number) {
    const clave = `${especial.id}-${redId}`
    try {
      setGuardando(clave)
      setError('')
      const corte = await asignarAreaEspecial(
        anio,
        especial.id,
        redId,
        Number(montos[clave] ?? 0) || 0,
      )
      setFilas((actuales) =>
        actuales.map((fila) => (fila.id === especial.id ? { ...fila, areas: corte.areas } : fila)),
      )
      setMontos((actual) => ({
        ...actual,
        ...Object.fromEntries(
          corte.areas.map((area) => [`${especial.id}-${area.id}`, area.monto ? String(area.monto) : '']),
        ),
      }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo distribuir el monto.')
    } finally {
      setGuardando('')
    }
  }

  if (!vigencias.length) {
    return (
      <TableCard>
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-sena-text">Todavía no hay años fiscales.</p>
        </div>
      </TableCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

      <TableCard>
        <div className="border-b border-sena-hairline px-5 py-5 sm:px-7">
          <div className="w-full max-w-xs">
            <label htmlFor="anio-especial-coord" className="mb-1.5 block text-sm font-semibold text-sena-text">
              Año
            </label>
            <select
              id="anio-especial-coord"
              className="form-field form-select w-full"
              value={anio}
              onChange={(event) => setAnio(Number(event.target.value))}
            >
              {vigencias.map((vigencia) => (
                <option key={vigencia.anio} value={vigencia.anio}>
                  {vigencia.anio}{vigencia.activa ? ' (activa)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {cargando ? (
          <TableLoading label="Cargando vigencias especiales…" />
        ) : filas.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-sena-text">
              La subdirectora todavía no te asignó monto en una vigencia especial de {anio}.
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-sena-strong">
              Cuando te asigne uno, aparece aquí para que lo repartas en tus redes de conocimiento.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-sena-hairline">
            {filas.map((especial) => {
              const repartido = especial.areas.reduce((suma, area) => suma + area.monto, 0)
              const queda = especial.monto - repartido
              return (
                <li key={especial.id} className="min-w-0 px-5 py-5 sm:px-7">
                  <div className="flex min-w-0 max-w-3xl flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-sena-text">{especial.nombre}</h2>
                      <p className="mt-1 text-sm text-sena-strong">Te asignaron {pesos(especial.monto)}</p>
                    </div>
                    <p className={`text-sm tabular-nums ${queda < 0 ? 'text-sena-danger-text' : 'text-sena-strong'}`}>
                      Quedan {pesos(queda)}
                    </p>
                  </div>

                  {especial.areas.length === 0 ? (
                    <p className="mt-4 text-sm text-sena-strong">No tienes redes de conocimiento para repartir.</p>
                  ) : (
                    <ul className="mt-4 flex max-w-3xl flex-col gap-2">
                      {especial.areas.map((area) => {
                        const clave = `${especial.id}-${area.id}`
                        return (
                          <li
                            key={area.id}
                            className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-center"
                          >
                            <span className="min-w-0 truncate text-sm text-sena-text">{area.nombre}</span>
                            <input
                              className="form-field w-full tabular-nums"
                              type="number"
                              min={0}
                              value={montos[clave] ?? ''}
                              onChange={(event) =>
                                setMontos((actual) => ({ ...actual, [clave]: event.target.value }))
                              }
                              aria-label={`Monto para ${area.nombre}`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={guardando === clave}
                              onClick={() => void distribuir(especial, area.id)}
                            >
                              {guardando === clave ? 'Guardando…' : 'Distribuir'}
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </TableCard>
    </div>
  )
}
