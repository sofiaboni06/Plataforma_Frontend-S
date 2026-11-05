import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/shared/lib/api'
import Button from '@/shared/components/ui/Button'
import { CloseIcon, PlusIcon } from '@/shared/components/icons/AppIcons'
import {
  ErrorBanner,
  TableCard,
  TableLoading,
} from '@/shared/components/DataTable'
import {
  actualizarVigenciaEspecial,
  agregarProgramaEspecial,
  asignarCoordinadorEspecial,
  crearVigenciaEspecial,
  getRepartoEspecial,
  getVigenciasEspeciales,
  quitarProgramaEspecial,
  type RepartoEspecial,
} from '@/modules/vigencias/data/vigencia'
import type { VigenciaApi, VigenciaEspecialApi } from '@/modules/vigencias/types/vigencia'

type ProgramaOpcion = {
  id: number
  codigo: string
  nombre: string
}

function pesos(valor: number) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

export default function VigenciaEspecialSection({
  vigencias,
  puedeEditar,
}: {
  vigencias: VigenciaApi[]
  puedeEditar: boolean
}) {
  const anioActivo = vigencias.find((vigencia) => vigencia.activa)?.anio ?? vigencias[0]?.anio ?? 0
  const [anio, setAnio] = useState(anioActivo)
  const [especiales, setEspeciales] = useState<VigenciaEspecialApi[]>([])
  const [programas, setProgramas] = useState<ProgramaOpcion[]>([])
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [programaPorEspecial, setProgramaPorEspecial] = useState<Record<number, string>>({})
  const [reparto, setReparto] = useState<Record<number, RepartoEspecial>>({})
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [asignando, setAsignando] = useState('')

  useEffect(() => {
    if (anioActivo && !vigencias.some((vigencia) => vigencia.anio === anio)) {
      setAnio(anioActivo)
    }
  }, [anio, anioActivo, vigencias])

  useEffect(() => {
    if (!anio) return
    void cargar(anio)
  }, [anio, puedeEditar])

  useEffect(() => {
    void api<ProgramaOpcion[]>('/programas-formacion')
      .then(setProgramas)
      .catch(() => setProgramas([]))
  }, [])

  async function cargar(anioSeleccionado: number) {
    try {
      setCargando(true)
      setError('')
      const filas = await getVigenciasEspeciales(anioSeleccionado)
      setEspeciales(filas)
      if (puedeEditar) {
        const cortes = await Promise.all(filas.map((fila) => getRepartoEspecial(anioSeleccionado, fila.id)))
        setReparto(Object.fromEntries(cortes.map((corte) => [corte.id, corte])))
      } else {
        setReparto({})
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las vigencias especiales.')
    } finally {
      setCargando(false)
    }
  }

  async function crear(event: FormEvent) {
    event.preventDefault()
    if (!anio) return
    try {
      setGuardando(true)
      setError('')
      await crearVigenciaEspecial(anio, {
        nombre: nombre.trim(),
        monto: Number(monto || 0),
      })
      setNombre('')
      setMonto('')
      await cargar(anio)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear la vigencia especial.')
    } finally {
      setGuardando(false)
    }
  }

  async function agregar(especialId: number) {
    const programaId = Number(programaPorEspecial[especialId])
    if (!programaId) return
    try {
      setError('')
      const actualizada = await agregarProgramaEspecial(anio, especialId, programaId)
      setEspeciales((actuales) => actuales.map((fila) => (fila.id === especialId ? actualizada : fila)))
      setProgramaPorEspecial((actual) => ({ ...actual, [especialId]: '' }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo agregar el programa.')
    }
  }

  async function quitar(especialId: number, programaId: number) {
    try {
      setError('')
      await quitarProgramaEspecial(anio, especialId, programaId)
      await cargar(anio)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo retirar el programa.')
    }
  }

  async function guardarMonto(especial: VigenciaEspecialApi, valor: string) {
    try {
      setError('')
      const actualizada = await actualizarVigenciaEspecial(anio, especial.id, { monto: Number(valor || 0) })
      setEspeciales((actuales) => actuales.map((fila) => (fila.id === especial.id ? { ...actualizada, programas: fila.programas } : fila)))
      if (puedeEditar) {
        const corte = await getRepartoEspecial(anio, especial.id)
        setReparto((actual) => ({ ...actual, [especial.id]: corte }))
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el monto.')
    }
  }

  async function asignar(especialId: number, personaId: number, montoActual: number) {
    const clave = `${especialId}-${personaId}`
    try {
      setAsignando(clave)
      setError('')
      const corte = await asignarCoordinadorEspecial(
        anio,
        especialId,
        personaId,
        Number(montos[clave] ?? montoActual) || 0,
      )
      setReparto((actual) => ({ ...actual, [especialId]: corte }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo repartir.')
    } finally {
      setAsignando('')
    }
  }

  if (!vigencias.length) {
    return (
      <TableCard>
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-sena-text">Todavía no hay años fiscales.</p>
          <p className="mt-1 text-sm text-sena-strong">
            Crea una vigencia para poder abrir una especial.
          </p>
          <Link
            to="/vigencias"
            className="mt-4 inline-flex h-11 items-center rounded-xl bg-sena px-5 text-sm font-semibold text-white shadow-brand transition duration-150 ease-out hover:bg-sena-bright active:scale-[0.97]"
          >
            Ir a años fiscales
          </Link>
        </div>
      </TableCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

      <TableCard>
        <div className="flex flex-col gap-5 border-b border-sena-hairline px-5 py-5 sm:px-7">
          <div className="w-full max-w-xs">
            <label htmlFor="anio-especial" className="mb-1.5 block text-sm font-semibold text-sena-text">
              Año
            </label>
            <select
              id="anio-especial"
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

          {puedeEditar ? (
            <form onSubmit={crear} className="flex w-full min-w-0 max-w-3xl flex-col gap-3">
              <div className="grid w-full min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <label htmlFor="nombre-especial" className="text-sm font-semibold text-sena-text">
                    Nombre
                  </label>
                  <input
                    id="nombre-especial"
                    className="form-field"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    required
                    minLength={3}
                    maxLength={120}
                    placeholder="Programas nuevos"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="monto-especial" className="text-sm font-semibold text-sena-text">
                    Monto
                  </label>
                  <input
                    id="monto-especial"
                    className="form-field"
                    type="number"
                    min={0}
                    step="0.01"
                    value={monto}
                    onChange={(event) => setMonto(event.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Button type="submit" icon={<PlusIcon className="size-4" />} disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Abrir especial'}
                </Button>
              </div>
            </form>
          ) : null}
        </div>

        {cargando ? (
          <TableLoading label="Cargando vigencias especiales…" />
        ) : especiales.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-sena-text">
              {anio} no tiene vigencias especiales.
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-sena-strong">
              {puedeEditar
                ? 'Completa el nombre y el monto para abrir una cuando un programa llega después del reparto.'
                : 'Se abren cuando un programa técnico o tecnológico llega después de que el monto del año ya se repartió.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-sena-hairline">
            {especiales.map((especial) => {
              const corte = reparto[especial.id]
              return (
                <li key={especial.id} className="min-w-0 px-5 py-5 sm:px-7">
                  <div className="flex min-w-0 max-w-3xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-sena-text">{especial.nombre}</h2>
                      <p className="mt-1 text-sm text-sena-strong">
                        {especial.programas.length === 1
                          ? '1 programa'
                          : `${especial.programas.length} programas`}
                      </p>
                    </div>
                    {puedeEditar ? (
                      <label className="flex w-40 shrink-0 flex-col gap-1 text-sm font-semibold text-sena-text sm:items-end">
                        Monto
                        <input
                          key={`${especial.id}-${especial.monto}`}
                          className="form-field w-full text-right tabular-nums"
                          type="number"
                          min={0}
                          defaultValue={especial.monto}
                          onBlur={(event) => {
                            if (Number(event.target.value) !== especial.monto) {
                              void guardarMonto(especial, event.target.value)
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <p className="text-lg font-semibold tabular-nums text-sena-text">
                        {pesos(especial.monto)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {especial.programas.length === 0 ? (
                      <p className="text-sm text-sena-strong">Sin programas asignados.</p>
                    ) : (
                      especial.programas.map((programa) => (
                        <span
                          key={programa.id}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-sena-soft px-3 py-1.5 text-sm text-sena-text"
                        >
                          <span className="truncate">
                            {programa.codigo ? `${programa.codigo} ` : ''}
                            {programa.nombre}
                          </span>
                          {puedeEditar ? (
                            <button
                              type="button"
                              className="grid size-5 shrink-0 place-items-center rounded-full text-sena-strong transition duration-150 ease-out hover:bg-white hover:text-sena-danger-text"
                              aria-label={`Quitar ${programa.nombre ?? 'programa'}`}
                              onClick={() => void quitar(especial.id, programa.id)}
                            >
                              <CloseIcon className="size-3.5" />
                            </button>
                          ) : null}
                        </span>
                      ))
                    )}
                  </div>

                  {puedeEditar ? (
                    <div className="mt-3 grid w-full min-w-0 max-w-3xl grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <select
                        className="form-field min-w-0"
                        value={programaPorEspecial[especial.id] ?? ''}
                        onChange={(event) =>
                          setProgramaPorEspecial((actual) => ({ ...actual, [especial.id]: event.target.value }))
                        }
                      >
                        <option value="">Agregar programa</option>
                        {programas.map((programa) => (
                          <option key={programa.id} value={programa.id}>
                            {programa.codigo} {programa.nombre}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={!programaPorEspecial[especial.id]}
                        onClick={() => void agregar(especial.id)}
                      >
                        Agregar
                      </Button>
                    </div>
                  ) : null}

                  {puedeEditar && corte ? (
                    <div className="mt-5 max-w-3xl border-t border-sena-hairline pt-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-sena-text">Reparto a coordinadores</p>
                        <p className={`text-sm tabular-nums ${corte.sinRepartir < 0 ? 'text-sena-danger-text' : 'text-sena-strong'}`}>
                          Quedan {pesos(corte.sinRepartir)}
                        </p>
                      </div>
                      <ul className="mt-3 flex flex-col gap-2">
                        {corte.coordinadores.map((persona) => {
                          const clave = `${especial.id}-${persona.id}`
                          return (
                            <li
                              key={persona.id}
                              className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-center"
                            >
                              <span className="min-w-0 truncate text-sm text-sena-text">{persona.fullName}</span>
                              <input
                                className="form-field w-full tabular-nums"
                                type="number"
                                min={0}
                                value={montos[clave] ?? String(persona.monto)}
                                onChange={(event) =>
                                  setMontos((actual) => ({ ...actual, [clave]: event.target.value }))
                                }
                                aria-label={`Monto para ${persona.fullName}`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                disabled={asignando === clave}
                                onClick={() => void asignar(especial.id, persona.id, persona.monto)}
                              >
                                {asignando === clave ? 'Asignando…' : 'Asignar'}
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </TableCard>
    </div>
  )
}
