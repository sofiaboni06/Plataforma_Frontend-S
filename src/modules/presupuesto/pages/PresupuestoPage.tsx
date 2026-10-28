import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import TextField from '@/shared/components/ui/TextField'
import {
  ErrorBanner,
  FilterCard,
  PageHeader,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TableRow,
  tableClass,
} from '@/shared/components/DataTable'
import { ProgramIcon } from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'
import type { Ficha } from '@/modules/materiales-formacion/types/formacion'
import { getVigencias } from '@/modules/vigencias/data/vigencia'
import {
  crearLote,
  descargarPresupuesto,
  guardarMonto,
  getLotes,
  getPresupuesto,
  repartirFichas,
  type LoteVigencia,
  type PresupuestoResumen,
} from '@/modules/presupuesto/data/presupuesto'

function pesos(valor: number) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

type FilaReparto = { fichaId: number; numero: string; monto: string; gastado: number }

type PresupuestoState = {
  puedeEditar: boolean
  anios: number[]
  anio: number
  setAnio: (anio: number) => void
  resumen: PresupuestoResumen | null
  monto: string
  setMonto: (valor: string) => void
  filas: FilaReparto[]
  setFilas: Dispatch<SetStateAction<FilaReparto[]>>
  fichas: Ficha[]
  lotes: LoteVigencia[]
  loteNombre: string
  setLoteNombre: (valor: string) => void
  loading: boolean
  saving: boolean
  error: string
  setError: (valor: string) => void
  aviso: string
  setAviso: (valor: string) => void
  suma: number
  guardarMontoVigencia: () => Promise<void>
  guardarReparto: () => Promise<void>
  guardarLote: () => Promise<void>
  descargar: (formato: 'excel' | 'pdf') => Promise<void>
}

const PresupuestoContext = createContext<PresupuestoState | null>(null)

function usePresupuesto() {
  const state = useContext(PresupuestoContext)
  if (!state) throw new Error('Presupuesto fuera de su vista.')
  return state
}

export default function PresupuestoPage() {
  const { user } = useAuth()
  const puedeEditar = user?.permissions?.includes('solicitud_programa.editar') === true
  const [anios, setAnios] = useState<number[]>([])
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [resumen, setResumen] = useState<PresupuestoResumen | null>(null)
  const [monto, setMonto] = useState('')
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [filas, setFilas] = useState<FilaReparto[]>([])
  const [lotes, setLotes] = useState<LoteVigencia[]>([])
  const [loteNombre, setLoteNombre] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    document.title = 'Presupuesto de formación | Sigma'
  }, [])

  useEffect(() => {
    getVigencias()
      .then((lista) => {
        const years = lista.map((item) => item.anio)
        setAnios(years)
        const activa = lista.find((item) => item.activa)
        if (activa) setAnio(activa.anio)
      })
      .catch(() => setAnios([]))
    api<Ficha[]>('/fichas')
      .then((lista) => setFichas(lista.filter((ficha) => ficha.estado)))
      .catch(() => setFichas([]))
  }, [])

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError('')
    Promise.all([getPresupuesto(anio), getLotes(anio)])
      .then(([corte, listaLotes]) => {
        if (cancelado) return
        setResumen(corte)
        setMonto(corte.monto ? String(corte.monto) : '')
        setFilas(
          corte.fichas.map((fila) => ({
            fichaId: fila.fichaId,
            numero: fila.numeroFicha,
            monto: String(fila.monto),
            gastado: fila.gastado,
          })),
        )
        setLotes(listaLotes)
      })
      .catch((caught) => {
        if (!cancelado) setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar el presupuesto.')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [anio])

  const suma = useMemo(
    () => filas.reduce((total, fila) => total + (Number(fila.monto) || 0), 0),
    [filas],
  )

  async function guardarMontoVigencia() {
    setSaving(true)
    setError('')
    setAviso('')
    try {
      const corte = await guardarMonto(anio, Number(monto) || 0)
      setResumen(corte)
      setAviso('Monto de la vigencia guardado.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el monto.')
    } finally {
      setSaving(false)
    }
  }

  async function guardarReparto() {
    setSaving(true)
    setError('')
    setAviso('')
    try {
      const corte = await repartirFichas(
        anio,
        filas
          .filter((fila) => Number(fila.monto) > 0)
          .map((fila) => ({ fichaId: fila.fichaId, monto: Number(fila.monto) })),
      )
      setResumen(corte)
      setAviso('Reparto por ficha guardado.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo repartir el presupuesto.')
    } finally {
      setSaving(false)
    }
  }

  async function guardarLote() {
    const nombre = loteNombre.trim()
    if (!nombre) return
    setSaving(true)
    setError('')
    setAviso('')
    try {
      const lote = await crearLote(anio, nombre)
      setLotes((actual) => [...actual, lote].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setLoteNombre('')
      setAviso('Lote creado. Ya puedes elegirlo en la lista de materiales.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo crear el lote.')
    } finally {
      setSaving(false)
    }
  }

  async function descargar(formato: 'excel' | 'pdf') {
    setError('')
    try {
      await descargarPresupuesto(anio, formato)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo descargar el reporte.')
    }
  }

  const value: PresupuestoState = {
    puedeEditar,
    anios,
    anio,
    setAnio,
    resumen,
    monto,
    setMonto,
    filas,
    setFilas,
    fichas,
    lotes,
    loteNombre,
    setLoteNombre,
    loading,
    saving,
    error,
    setError,
    aviso,
    setAviso,
    suma,
    guardarMontoVigencia,
    guardarReparto,
    guardarLote,
    descargar,
  }

  return (
    <PresupuestoContext.Provider value={value}>
      <Routes>
        <Route index element={<ResumenView />} />
        <Route path="monto" element={<MontoView />} />
        <Route path="reparto" element={<RepartoView />} />
        <Route path="lotes" element={<LotesView />} />
        <Route path="*" element={<Navigate to="/presupuesto-formacion" replace />} />
      </Routes>
    </PresupuestoContext.Provider>
  )
}

function Avisos() {
  const { error, setError, aviso } = usePresupuesto()
  return (
    <>
      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}
      {aviso ? <p className="mb-4 rounded-2xl bg-sena-soft px-5 py-3 text-sm text-sena-dark">{aviso}</p> : null}
    </>
  )
}

function SelectorVigencia({ extra }: { extra?: ReactNode }) {
  const { anios, anio, setAnio } = usePresupuesto()
  return (
    <FilterCard>
      <label className="grid gap-1 text-sm font-semibold text-sena-dark">
        Vigencia
        <select
          className="h-11 rounded-xl border border-sena-line bg-white px-3"
          value={anio}
          onChange={(event) => setAnio(Number(event.target.value))}
        >
          {(anios.length ? anios : [anio]).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
      {extra}
    </FilterCard>
  )
}

function Cuerpo({ children }: { children: ReactNode }) {
  const { loading, resumen } = usePresupuesto()
  if (loading || !resumen) {
    return (
      <TableCard>
        <TableLoading label="Cargando presupuesto…" />
      </TableCard>
    )
  }
  return children
}

function ResumenView() {
  const { resumen, filas, lotes, descargar } = usePresupuesto()
  const navigate = useNavigate()

  const acciones = [
    {
      titulo: 'Monto de la vigencia',
      detalle: resumen ? pesos(resumen.monto) : '—',
      texto: 'Registra el valor que llega para el año.',
      to: '/presupuesto-formacion/monto',
      cta: 'Registrar monto',
    },
    {
      titulo: 'Reparto por ficha',
      detalle: `${filas.length} ficha${filas.length === 1 ? '' : 's'}`,
      texto: resumen ? `${pesos(resumen.repartido)} repartidos · ${pesos(resumen.sinRepartir)} sin asignar` : '',
      to: '/presupuesto-formacion/reparto',
      cta: 'Repartir fichas',
    },
    {
      titulo: 'Lotes',
      detalle: `${lotes.length} lote${lotes.length === 1 ? '' : 's'}`,
      texto: 'Informática, papelería, herramientas. Se eligen en cada material.',
      to: '/presupuesto-formacion/lotes',
      cta: 'Administrar lotes',
    },
  ]

  return (
    <AppLayout title="Presupuesto" showCenterBanner={false}>
      <PageHeader
        icon={<ProgramIcon />}
        title="Presupuesto de formación"
        description="Elige una acción. Cada tarea abre en su propia vista."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void descargar('excel')}>
              Excel
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => void descargar('pdf')}>
              PDF
            </Button>
          </div>
        }
      />
      <Avisos />
      <SelectorVigencia />
      <Cuerpo>
        {resumen ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ['Monto', resumen.monto],
                ['Repartido', resumen.repartido],
                ['Sin repartir', resumen.sinRepartir],
                ['Aprobado', resumen.gastado],
                ['Disponible', resumen.disponible],
              ].map(([etiqueta, valor]) => (
                <article key={String(etiqueta)} className="rounded-[20px] border border-sena-line bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sena-strong">{etiqueta}</p>
                  <p className="mt-1 text-lg font-bold text-sena-dark">{pesos(Number(valor))}</p>
                </article>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {acciones.map((accion) => (
                <article
                  key={accion.to}
                  className="flex flex-col rounded-[24px] border border-sena-line bg-white p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-sena-strong">{accion.detalle}</p>
                  <h2 className="mt-1 text-base font-bold text-sena-dark">{accion.titulo}</h2>
                  <p className="mt-1 flex-1 text-sm text-sena-strong">{accion.texto}</p>
                  <div className="mt-4">
                    <Button type="button" size="sm" onClick={() => navigate(accion.to)}>
                      {accion.cta}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Cuerpo>
    </AppLayout>
  )
}

function VistaAccion({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <AppLayout title="Presupuesto" showCenterBanner={false}>
      <PageHeader
        icon={<ProgramIcon />}
        title={title}
        description={description}
        action={
          <Link
            to="/presupuesto-formacion"
            className="inline-flex h-10 items-center rounded-xl border border-sena-line bg-white px-5 text-sm font-semibold text-sena-dark"
          >
            Volver al resumen
          </Link>
        }
      />
      <Avisos />
      <SelectorVigencia />
      <Cuerpo>{children}</Cuerpo>
    </AppLayout>
  )
}

function MontoView() {
  const { puedeEditar, monto, setMonto, saving, guardarMontoVigencia, resumen } = usePresupuesto()
  return (
    <VistaAccion
      title="Monto de la vigencia"
      description="Valor que llega para el año. Solo el consumo descuenta lo disponible."
    >
      <section className="rounded-[24px] border border-sena-line bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            id="monto-vigencia"
            label="Valor que te llega"
            type="number"
            min={0}
            step="1"
            value={monto}
            disabled={!puedeEditar}
            onChange={(event) => setMonto(event.target.value)}
          />
          {puedeEditar ? (
            <Button type="button" size="sm" disabled={saving} onClick={() => void guardarMontoVigencia()}>
              Guardar monto
            </Button>
          ) : null}
        </div>
        {resumen ? (
          <p className="mt-4 text-sm text-sena-strong">
            Disponible ahora: <span className="font-semibold text-sena-dark">{pesos(resumen.disponible)}</span>
          </p>
        ) : null}
      </section>
    </VistaAccion>
  )
}

function RepartoView() {
  const { puedeEditar, filas, setFilas, fichas, suma, saving, guardarReparto, resumen } = usePresupuesto()
  const [fichaNueva, setFichaNueva] = useState('')
  const disponibles = fichas.filter((ficha) => !filas.some((fila) => fila.fichaId === ficha.id))

  function agregarFicha() {
    const ficha = fichas.find((item) => String(item.id) === fichaNueva)
    if (!ficha) return
    setFilas((actual) => [...actual, { fichaId: ficha.id, numero: ficha.numeroFicha, monto: '', gastado: 0 }])
    setFichaNueva('')
  }

  return (
    <VistaAccion
      title="Reparto por ficha"
      description={
        resumen
          ? `La suma no puede pasar el monto de ${pesos(resumen.monto)}. Ahora vas en ${pesos(suma)}.`
          : 'Asigna el monto entre fichas.'
      }
    >
      <section className="rounded-[24px] border border-sena-line bg-white p-5">
        {puedeEditar ? (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="grid min-w-56 gap-1 text-sm font-semibold text-sena-dark">
              Ficha
              <select
                className="h-11 rounded-xl border border-sena-line bg-white px-3"
                value={fichaNueva}
                onChange={(event) => setFichaNueva(event.target.value)}
              >
                <option value="">Elegir ficha</option>
                {disponibles.map((ficha) => (
                  <option key={ficha.id} value={ficha.id}>
                    {ficha.numeroFicha}
                    {ficha.programa?.nombre ? ` · ${ficha.programa.nombre}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="secondary" size="sm" disabled={!fichaNueva} onClick={agregarFicha}>
              Agregar
            </Button>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr className="border-b border-sena-hairline bg-sena-soft/85">
                <TableHeader>Ficha</TableHeader>
                <TableHeader>Asignado</TableHeader>
                <TableHeader>Aprobado</TableHeader>
                <TableHeader>Queda</TableHeader>
                <TableHeader />
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <TableEmpty colSpan={5}>Todavía no hay fichas en este reparto.</TableEmpty>
              ) : (
                filas.map((fila) => (
                  <TableRow key={fila.fichaId}>
                    <td className="font-semibold">{fila.numero}</td>
                    <td>
                      <input
                        className="h-10 w-36 rounded-xl border border-sena-line px-3"
                        type="number"
                        min={0}
                        value={fila.monto}
                        disabled={!puedeEditar}
                        onChange={(event) =>
                          setFilas((actual) =>
                            actual.map((item) =>
                              item.fichaId === fila.fichaId ? { ...item, monto: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>{pesos(fila.gastado)}</td>
                    <td>{pesos((Number(fila.monto) || 0) - fila.gastado)}</td>
                    <td>
                      {puedeEditar && fila.gastado === 0 ? (
                        <button
                          type="button"
                          className="text-sm font-semibold text-sena-danger-text"
                          onClick={() => setFilas((actual) => actual.filter((item) => item.fichaId !== fila.fichaId))}
                        >
                          Quitar
                        </button>
                      ) : null}
                    </td>
                  </TableRow>
                ))
              )}
            </tbody>
          </table>
        </div>
        {puedeEditar ? (
          <div className="mt-4">
            <Button type="button" size="sm" disabled={saving} onClick={() => void guardarReparto()}>
              Guardar reparto
            </Button>
          </div>
        ) : null}
      </section>
    </VistaAccion>
  )
}

function LotesView() {
  const { puedeEditar, lotes, loteNombre, setLoteNombre, saving, guardarLote, resumen } = usePresupuesto()
  return (
    <VistaAccion
      title="Lotes de la vigencia"
      description="Informática, papelería, herramientas. Se eligen en cada material de la lista maestra."
    >
      <section className="rounded-[24px] border border-sena-line bg-white p-5">
        {puedeEditar ? (
          <div className="flex flex-wrap items-end gap-3">
            <TextField
              id="lote-nombre"
              label="Nombre del lote"
              value={loteNombre}
              maxLength={80}
              onChange={(event) => setLoteNombre(event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving || !loteNombre.trim()}
              onClick={() => void guardarLote()}
            >
              Crear lote
            </Button>
          </div>
        ) : null}
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {lotes.length === 0 ? (
            <li className="text-sm text-sena-strong">Esta vigencia no tiene lotes.</li>
          ) : (
            lotes.map((lote) => (
              <li key={lote.id} className="rounded-xl border border-sena-hairline px-4 py-2 text-sm font-semibold">
                {lote.nombre}
              </li>
            ))
          )}
        </ul>
        {resumen && resumen.porLote.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr className="border-b border-sena-hairline bg-sena-soft/85">
                  <TableHeader>Lote</TableHeader>
                  <TableHeader>Aprobado</TableHeader>
                </tr>
              </thead>
              <tbody>
                {resumen.porLote.map((lote) => (
                  <TableRow key={lote.nombre}>
                    <td>{lote.nombre}</td>
                    <td>{pesos(lote.gastado)}</td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </VistaAccion>
  )
}
