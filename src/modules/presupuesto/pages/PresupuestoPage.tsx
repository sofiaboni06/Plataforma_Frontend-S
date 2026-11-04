import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import TextField from '@/shared/components/ui/TextField'
import {
  ErrorBanner,
  PageHeader,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TableRow,
  tableClass,
} from '@/shared/components/DataTable'
import { ProgramIcon } from '@/shared/components/icons/AppIcons'
import { ApiError } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'
import { getVigencias } from '@/modules/vigencias/data/vigencia'
import {
  asignarAreaEspecial,
  especialesParaRepartir,
  type EspecialParaRepartir,
} from '@/modules/vigencias/data/vigencia'
import {
  asignarCoordinador,
  asignarArea,
  crearLote,
  descargarPresupuesto,
  getLotes,
  getPresupuesto,
  guardarMonto,
  type LoteVigencia,
  type PresupuestoResumen,
  type VistaAreas,
  type VistaCoordinadores,
} from '@/modules/presupuesto/data/presupuesto'

function pesos(valor: number) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

function MontoGrande({
  total,
  queda,
  titulo,
  destino,
}: {
  total: number
  queda: number
  titulo: string
  destino: string
}) {
  const sePasa = queda < 0
  return (
    <section className="mb-4 rounded-[28px] border border-[#d5e6dc] bg-[#f4faf6] px-6 py-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1b5c40]">{titulo}</p>
      <p
        className={`mt-2 text-4xl font-bold tracking-tight sm:text-6xl ${sePasa ? 'text-sena-danger-text' : 'text-[#145c3e]'}`}
      >
        {pesos(queda)}
      </p>
      <p className="mt-3 text-sm text-sena-strong">
        {total <= 0
          ? 'La subdirectora todavía no te asignó monto en esta vigencia.'
          : sePasa
            ? `Te pasaste de ${pesos(total)}.`
            : `De ${pesos(total)}. Ya van ${pesos(total - queda)} en ${destino}.`}
      </p>
    </section>
  )
}

type PresupuestoState = {
  puedeEditar: boolean
  anios: number[]
  anio: number
  setAnio: (anio: number) => void
  resumen: PresupuestoResumen | null
  monto: string
  setMonto: (valor: string) => void
  esAdmin: boolean
  montosCoordinador: Record<number, string>
  setMontoCoordinador: (id: number, valor: string) => void
  montosFicha: Record<number, string>
  setMontoFicha: (id: number, valor: string) => void
  lotes: LoteVigencia[]
  loteNombre: string
  setLoteNombre: (valor: string) => void
  loading: boolean
  saving: boolean
  error: string
  setError: (valor: string) => void
  aviso: string
  setAviso: (valor: string) => void
  guardarMontoVigencia: () => Promise<void>
  asignar: (idUsuario: number) => Promise<void>
  asignarAFicha: (fichaId: number) => Promise<void>
  guardarLote: () => Promise<void>
  descargar: (formato: 'excel' | 'pdf') => Promise<void>
}

const PresupuestoContext = createContext<PresupuestoState | null>(null)

function usePresupuesto() {
  const state = useContext(PresupuestoContext)
  if (!state) throw new Error('Presupuesto fuera de su vista.')
  return state
}

function montosDesde(filas: Array<{ id: number; monto: number }>) {
  return Object.fromEntries(filas.map((fila) => [fila.id, fila.monto ? String(fila.monto) : '']))
}

export default function PresupuestoPage() {
  const { user } = useAuth()
  const puedeEditar = user?.permissions?.includes('solicitud_programa.editar') === true
  const esAdmin = user?.permissions?.includes('presupuesto.editar') === true
  const [anios, setAnios] = useState<number[]>([])
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [resumen, setResumen] = useState<PresupuestoResumen | null>(null)
  const [monto, setMonto] = useState('')
  const [montosCoordinador, setMontosCoordinador] = useState<Record<number, string>>({})
  const [montosFicha, setMontosFicha] = useState<Record<number, string>>({})
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
        setMontosCoordinador(montosDesde(corte.coordinadores ?? []))
        setMontosFicha(montosDesde(corte.areas ?? []))
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

  function aplicarVista(vista: VistaCoordinadores) {
    setResumen((actual) =>
      actual
        ? {
            ...actual,
            monto: vista.monto,
            repartido: vista.repartido,
            sinRepartir: vista.sinRepartir,
            coordinadores: vista.coordinadores,
          }
        : actual,
    )
    setMontosCoordinador(montosDesde(vista.coordinadores))
  }

  function aplicarFichas(vista: VistaAreas) {
    setResumen((actual) =>
      actual
        ? {
            ...actual,
            monto: vista.monto,
            repartido: vista.repartido,
            sinRepartir: vista.sinRepartir,
            disponible: vista.sinRepartir,
            areas: vista.areas,
          }
        : actual,
    )
    setMontosFicha(montosDesde(vista.areas))
  }

  async function guardarMontoVigencia() {
    setSaving(true)
    setError('')
    setAviso('')
    try {
      const corte = await guardarMonto(anio, Number(monto) || 0)
      setResumen(corte)
      setMonto(corte.monto ? String(corte.monto) : '')
      setMontosCoordinador(montosDesde(corte.coordinadores ?? []))
      setAviso('Monto del centro guardado.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el monto.')
    } finally {
      setSaving(false)
    }
  }

  async function asignar(idUsuario: number) {
    setSaving(true)
    setError('')
    setAviso('')
    try {
      const vista = await asignarCoordinador(anio, idUsuario, Number(montosCoordinador[idUsuario]) || 0)
      aplicarVista(vista)
      setAviso('Asignación guardada. El saldo del centro ya se actualizó.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo asignar el monto.')
    } finally {
      setSaving(false)
    }
  }

  async function asignarAFicha(fichaId: number) {
    setSaving(true)
    setError('')
    setAviso('')
    try {
      const vista = await asignarArea(anio, fichaId, Number(montosFicha[fichaId]) || 0)
      aplicarFichas(vista)
      setAviso('Asignación guardada. Tu saldo ya se actualizó.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo asignar el monto a la red de conocimiento.')
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
    esAdmin,
    anios,
    anio,
    setAnio,
    resumen,
    monto,
    setMonto,
    montosCoordinador,
    setMontoCoordinador: (id, valor) => setMontosCoordinador((actual) => ({ ...actual, [id]: valor })),
    montosFicha,
    setMontoFicha: (id, valor) => setMontosFicha((actual) => ({ ...actual, [id]: valor })),
    lotes,
    loteNombre,
    setLoteNombre,
    loading,
    saving,
    error,
    setError,
    aviso,
    setAviso,
    guardarMontoVigencia,
    asignar,
    asignarAFicha,
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

function SelectorVigencia() {
  const { anios, anio, setAnio } = usePresupuesto()
  return (
    <section className="form-panel mb-4 px-5 py-5 sm:px-6">
      <div className="form-fields grid gap-4 sm:max-w-xs">
        <label className="flex flex-col gap-1.5">
          <span className="form-label">Vigencia</span>
          <select
            className="form-field form-select"
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
      </div>
    </section>
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
  const { resumen, lotes, descargar, esAdmin } = usePresupuesto()
  const navigate = useNavigate()
  const coordinadores = resumen?.coordinadores?.length ?? 0
  const fichas = resumen?.areas?.length ?? 0
  const totalLotes = lotes?.length ?? 0

  const acciones = esAdmin
    ? [
        {
          titulo: 'Monto del centro',
          detalle: resumen ? pesos(resumen.monto) : '—',
          texto: 'Un solo valor para todo el centro en esta vigencia.',
          to: '/presupuesto-formacion/monto',
          cta: 'Asignar monto',
        },
        {
          titulo: 'Reparto a coordinadores',
          detalle: `${coordinadores} coordinador${coordinadores === 1 ? '' : 'es'}`,
          texto: resumen ? `${pesos(resumen.repartido)} repartidos · ${pesos(resumen.sinRepartir)} sin asignar` : '',
          to: '/presupuesto-formacion/reparto',
          cta: 'Repartir',
        },
        {
          titulo: 'Lotes',
          detalle: `${totalLotes} lote${totalLotes === 1 ? '' : 's'}`,
          texto: 'Informática, papelería, herramientas. Se eligen en cada material.',
          to: '/presupuesto-formacion/lotes',
          cta: 'Administrar lotes',
        },
      ]
    : [
        {
          titulo: 'Reparto a redes de conocimiento',
          detalle: `${fichas} red${fichas === 1 ? '' : 'es'}`,
          texto: 'La red de conocimiento es el área. Reparte tu monto entre las redes que te asignaron.',
          to: '/presupuesto-formacion/reparto',
          cta: 'Repartir',
        },
        {
          titulo: 'Lotes',
          detalle: `${totalLotes} lote${totalLotes === 1 ? '' : 's'}`,
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
        description={
          esAdmin
            ? 'El monto es del centro y de la vigencia. De ahí se reparte a cada coordinador.'
            : 'Te asignaron un monto. Cada red de conocimiento es un área: reparte el monto entre tus redes.'
        }
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
      {resumen ? (
        <MontoGrande
          total={resumen.monto}
          queda={resumen.sinRepartir}
          titulo={esAdmin ? 'Mi monto' : 'Te asignaron'}
          destino={esAdmin ? 'coordinadores' : 'redes'}
        />
      ) : null}
      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        {acciones.map((accion) => (
          <article key={accion.to} className="flex flex-col rounded-[24px] border border-sena-line bg-white p-5">
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
      {!esAdmin && resumen ? <RepartoEspecial anio={resumen.anio} /> : null}
    </AppLayout>
  )
}

function Volver() {
  return (
    <Link
      to="/presupuesto-formacion"
      className="inline-flex h-10 items-center rounded-xl border border-[#d5e6dc] bg-white px-4 text-sm font-semibold text-[#1b5c40] hover:bg-[#f4faf6]"
    >
      Volver al resumen
    </Link>
  )
}

function MontoView() {
  const { esAdmin, monto, setMonto, saving, guardarMontoVigencia, resumen } = usePresupuesto()
  if (!esAdmin) return <Navigate to="/presupuesto-formacion" replace />
  return (
    <AppLayout title="Presupuesto" showCenterBanner={false}>
      <PageHeader
        icon={<ProgramIcon />}
        title="Monto del centro"
        description="Un solo valor para el centro en esta vigencia. Cubre todo hasta que la vigencia termine."
        action={<Volver />}
      />
      <Avisos />
      <SelectorVigencia />
      <Cuerpo>
        <section className="form-panel px-5 py-5 sm:px-6">
          <div className="form-fields grid gap-4 sm:grid-cols-2 sm:items-end">
            <TextField
              id="monto-vigencia"
              label="Monto del centro"
              type="number"
              min={0}
              step="1"
              value={monto}
              disabled={!esAdmin}
              onChange={(event) => setMonto(event.target.value)}
            />
            {resumen ? (
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="form-label">Sin repartir</p>
                <p className="mt-1 text-lg font-bold text-[#145c3e]">{pesos(resumen.sinRepartir)}</p>
              </div>
            ) : null}
          </div>
          {esAdmin ? (
            <div className="mt-4 flex justify-end">
              <Button type="button" size="sm" disabled={saving} onClick={() => void guardarMontoVigencia()}>
                Guardar monto
              </Button>
            </div>
          ) : null}
        </section>
      </Cuerpo>
    </AppLayout>
  )
}

function RepartoView() {
  const {
    esAdmin,
    resumen,
    montosCoordinador,
    setMontoCoordinador,
    montosFicha,
    setMontoFicha,
    saving,
    asignar,
    asignarAFicha,
  } = usePresupuesto()
  const coordinadores = resumen?.coordinadores ?? []
  const areas = resumen?.areas ?? []
  const enBorrador = esAdmin
    ? coordinadores.reduce((total, persona) => total + (Number(montosCoordinador[persona.id]) || 0), 0)
    : areas.reduce((total, area) => total + (Number(montosFicha[area.id]) || 0), 0)
  const queda = (resumen?.monto ?? 0) - enBorrador

  return (
    <AppLayout title="Presupuesto" showCenterBanner={false}>
      <PageHeader
        icon={<ProgramIcon />}
        title={esAdmin ? 'Reparto a coordinadores' : 'Reparto a redes de conocimiento'}
        description={
          esAdmin
            ? 'Cada asignación se descuenta del monto del centro.'
            : 'Cada red de conocimiento es un área. Lo que le asignas se descuenta de tu monto.'
        }
        action={<Volver />}
      />
      <Avisos />
      <SelectorVigencia />
      {resumen ? (
        <MontoGrande
          total={resumen.monto}
          queda={queda}
          titulo={esAdmin ? 'Mi monto' : 'Te asignaron'}
          destino={esAdmin ? 'coordinadores' : 'redes'}
        />
      ) : null}
      <Cuerpo>
        <section className="rounded-[24px] border border-sena-line bg-white p-5">
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr className="border-b border-sena-hairline bg-sena-soft/85">
                  <TableHeader>{esAdmin ? 'Coordinador' : 'Red de conocimiento'}</TableHeader>
                  <TableHeader>Asignado</TableHeader>
                  <TableHeader>Acción</TableHeader>
                </tr>
              </thead>
              <tbody>
                {!esAdmin ? (
                  areas.length === 0 ? (
                    <TableEmpty colSpan={3}>No tienes redes de conocimiento asignadas.</TableEmpty>
                  ) : (
                    areas.map((area) => (
                      <TableRow key={area.id}>
                        <td className="font-semibold">
                          {area.nombre}
                          {area.codigo ? (
                            <p className="text-xs font-medium text-sena-strong">{area.codigo}</p>
                          ) : null}
                        </td>
                        <td>
                          <input
                            className="h-10 w-40 rounded-xl border border-sena-line px-3"
                            type="number"
                            min={0}
                            value={montosFicha[area.id] ?? ''}
                            onChange={(event) => setMontoFicha(area.id, event.target.value)}
                          />
                        </td>
                        <td>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={saving || (resumen?.monto ?? 0) <= 0}
                            onClick={() => void asignarAFicha(area.id)}
                          >
                            Asignar
                          </Button>
                        </td>
                      </TableRow>
                    ))
                  )
                ) : coordinadores.length === 0 ? (
                  <TableEmpty colSpan={3}>Este centro no tiene coordinadores activos.</TableEmpty>
                ) : (
                  coordinadores.map((persona) => (
                    <TableRow key={persona.id}>
                      <td className="font-semibold">{persona.fullName}</td>
                      <td>
                        <input
                          className="h-10 w-40 rounded-xl border border-sena-line px-3"
                          type="number"
                          min={0}
                          value={montosCoordinador[persona.id] ?? ''}
                          disabled={!esAdmin}
                          onChange={(event) => setMontoCoordinador(persona.id, event.target.value)}
                        />
                      </td>
                      <td>
                        {esAdmin ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={saving}
                            onClick={() => void asignar(persona.id)}
                          >
                            Asignar
                          </Button>
                        ) : null}
                      </td>
                    </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        {!esAdmin && resumen ? <RepartoEspecial anio={resumen.anio} /> : null}
      </Cuerpo>
    </AppLayout>
  )
}

function RepartoEspecial({ anio }: { anio: number }) {
  const [filas, setFilas] = useState<EspecialParaRepartir[]>([])
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    void especialesParaRepartir(anio)
      .then(setFilas)
      .catch(() => setFilas([]))
  }, [anio])

  if (!filas.length) return null

  return (
    <section className="mt-6 rounded-[24px] border border-sena-line bg-white p-5">
      <h2 className="text-lg font-semibold text-sena-text">Vigencia especial</h2>
      <p className="mt-1 text-sm text-sena-strong">
        La subdirectora te asignó este monto aparte. Distribúyelo en tus áreas.
      </p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {filas.map((especial) => (
        <div key={especial.id} className="mt-4">
          <p className="font-semibold">{especial.nombre} · {especial.monto}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {especial.areas.map((area) => (
              <li key={area.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="min-w-40">{area.nombre}</span>
                <input
                  className="form-field w-32"
                  type="number"
                  min={0}
                  value={montos[`${especial.id}-${area.id}`] ?? String(area.monto)}
                  onChange={(event) =>
                    setMontos((actual) => ({ ...actual, [`${especial.id}-${area.id}`]: event.target.value }))
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    void asignarAreaEspecial(
                      anio,
                      especial.id,
                      area.id,
                      Number(montos[`${especial.id}-${area.id}`] ?? area.monto) || 0,
                    )
                      .then((corte) =>
                        setFilas((actuales) =>
                          actuales.map((fila) =>
                            fila.id === especial.id ? { ...fila, areas: corte.areas } : fila,
                          ),
                        ),
                      )
                      .catch((saveError: unknown) =>
                        setError(saveError instanceof Error ? saveError.message : 'No se pudo distribuir.'),
                      )
                  }
                >
                  Distribuir
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

function LotesView() {
  const { puedeEditar, lotes, loteNombre, setLoteNombre, saving, guardarLote, resumen } = usePresupuesto()
  return (
    <AppLayout title="Presupuesto" showCenterBanner={false}>
      <PageHeader
        icon={<ProgramIcon />}
        title="Lotes de la vigencia"
        description="Informática, papelería, herramientas. Se eligen en cada material de la lista maestra."
        action={<Volver />}
      />
      <Avisos />
      <SelectorVigencia />
      <Cuerpo>
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
          {resumen && (resumen.porLote?.length ?? 0) > 0 ? (
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
      </Cuerpo>
    </AppLayout>
  )
}
