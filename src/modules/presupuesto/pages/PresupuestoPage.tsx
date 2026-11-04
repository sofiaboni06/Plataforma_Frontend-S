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
  TablePagination,
  TableRow,
} from '@/shared/components/DataTable'
import { InventoryIcon, ProgramIcon, ReportIcon, UserIcon } from '@/shared/components/icons/AppIcons'
import { cn } from '@/shared/lib/cn'
import { usePagination } from '@/shared/lib/table'
import { ApiError } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'
import { getVigencias } from '@/modules/vigencias/data/vigencia'
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

/**
 * Estas vistas manejan tablas de dos o tres columnas: no necesitan el ancho
 * mínimo de 900 px de `tableClass`. Conservan `data-table` para compartir el
 * ritmo de fila del resto del sistema, pero se adaptan a pantallas pequeñas.
 */
const tablaRepartoClass = 'data-table w-full min-w-[560px] text-sm'
const tablaLotesClass = 'data-table w-full min-w-[420px] text-sm'

/**
 * Todos los listados del módulo (coordinadores, redes, lotes y aprobados)
 * muestran 10 registros por página. El corte es solo visual: los datos
 * completos siguen en estado y todas las acciones siguen operando.
 */
const PAGE_SIZE = 10

/** Campo de monto dentro de las tablas: mismos estados que el resto de formularios. */
const montoInputClass =
  'h-11 w-full max-w-[10rem] rounded-xl border border-sena-line bg-white px-3 text-sm font-semibold tabular-nums text-sena-text outline-none transition duration-150 hover:border-sena/40 focus:border-sena focus:ring-2 focus:ring-sena/15 disabled:cursor-not-allowed disabled:bg-sena-off-soft disabled:text-sena-text-soft disabled:hover:border-sena-line'

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
  const repartido = Math.max(0, total - queda)
  const avance = total > 0 ? Math.min(100, (repartido / total) * 100) : 0

  return (
    <section className="relative mb-4 overflow-hidden rounded-[26px] border border-sena-line bg-white px-6 py-7 shadow-card sm:px-8">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sena via-sena-bright to-sena/0"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(0,166,81,0.12),transparent_70%)]"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[0.16em] text-sena-strong uppercase">{titulo}</p>
          <p
            className={cn(
              'mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl',
              sePasa ? 'text-sena-danger-text' : 'text-sena-dark',
            )}
          >
            {pesos(queda)}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-sena-strong">
            {total <= 0
              ? 'La subdirectora todavía no te asignó monto en esta vigencia.'
              : sePasa
                ? `Te pasaste de ${pesos(total)}.`
                : `De ${pesos(total)}. Ya van ${pesos(total - queda)} en ${destino}.`}
          </p>

          <div className="mt-5 max-w-md">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-sena-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(avance)}
              aria-label="Proporción del monto ya repartida"
            >
              <span
                className={cn(
                  'block h-full rounded-full transition-[width] duration-500',
                  sePasa ? 'bg-sena-danger-text' : 'bg-sena',
                )}
                style={{ width: `${avance}%` }}
              />
            </div>
            <p className="mt-2 flex items-center justify-between text-[11px] font-medium text-sena-text-soft tabular-nums">
              <span>Repartido</span>
              <span>{Math.round(avance)}%</span>
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-sena-line-soft bg-sena-muted/70 px-6 py-4 lg:min-w-[14rem]">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-sena-text-soft uppercase">
            Monto total
          </p>
          <p className="mt-1 text-xl font-bold text-sena-dark tabular-nums">{pesos(total)}</p>
        </div>
      </div>
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
  const { user, isAdmin } = useAuth()
  const puedeEditar = user?.permissions?.includes('solicitud_programa.editar') === true
  const esAdmin = isAdmin || /^subdirector/i.test(user?.role ?? '')
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
      {aviso ? (
        <p className="mb-4 flex items-start gap-2.5 rounded-2xl border border-sena-ok-line/70 bg-sena-active-soft px-5 py-3 text-sm font-medium text-sena-ok-text">
          <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-sena-ok-text" />
          {aviso}
        </p>
      ) : null}
    </>
  )
}

function SelectorVigencia() {
  const { anios, anio, setAnio } = usePresupuesto()
  return (
    <section className="mb-4 flex flex-col gap-4 rounded-[26px] border border-glass-line bg-glass px-5 py-4 shadow-hairline backdrop-blur-glass sm:flex-row sm:items-end sm:justify-between sm:px-6">
      <div className="flex w-full flex-col gap-1.5 sm:max-w-[13rem]">
        <label htmlFor="vigencia-presupuesto" className="form-label">
          Vigencia
        </label>
        <select
          id="vigencia-presupuesto"
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
      </div>

      <p className="text-xs leading-5 text-sena-text-soft sm:max-w-xs sm:pb-2.5 sm:text-right">
        El monto, el reparto y los lotes se cargan según la vigencia seleccionada.
      </p>
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
          icono: <ReportIcon className="size-5" />,
        },
        {
          titulo: 'Reparto a coordinadores',
          detalle: `${coordinadores} coordinador${coordinadores === 1 ? '' : 'es'}`,
          texto: resumen ? `${pesos(resumen.repartido)} repartidos · ${pesos(resumen.sinRepartir)} sin asignar` : '',
          to: '/presupuesto-formacion/reparto',
          cta: 'Repartir',
          icono: <UserIcon className="size-5" />,
        },
        {
          titulo: 'Lotes',
          detalle: `${totalLotes} lote${totalLotes === 1 ? '' : 's'}`,
          texto: 'Informática, papelería, herramientas. Se eligen en cada material.',
          to: '/presupuesto-formacion/lotes',
          cta: 'Administrar lotes',
          icono: <InventoryIcon className="size-5" />,
        },
      ]
    : [
        {
          titulo: 'Reparto a redes de conocimiento',
          detalle: `${fichas} red${fichas === 1 ? '' : 'es'}`,
          texto: 'La red de conocimiento es el área. Reparte tu monto entre las redes que te asignaron.',
          to: '/presupuesto-formacion/reparto',
          cta: 'Repartir',
          icono: <UserIcon className="size-5" />,
        },
        {
          titulo: 'Lotes',
          detalle: `${totalLotes} lote${totalLotes === 1 ? '' : 's'}`,
          texto: 'Informática, papelería, herramientas. Se eligen en cada material.',
          to: '/presupuesto-formacion/lotes',
          cta: 'Administrar lotes',
          icono: <InventoryIcon className="size-5" />,
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
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        {acciones.map((accion) => (
          <article
            key={accion.to}
            className="group flex flex-col rounded-[26px] border border-glass-line bg-white p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-2xl bg-sena-soft text-sena-dark transition duration-200 group-hover:bg-sena group-hover:text-white group-hover:shadow-brand-sm"
            >
              {accion.icono}
            </span>
            <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-sena-strong uppercase">
              {accion.detalle}
            </p>
            <h2 className="mt-1.5 text-lg font-bold tracking-tight text-sena-text">{accion.titulo}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-sena-text-soft">{accion.texto}</p>
            <div className="mt-5">
              <Button type="button" size="sm" onClick={() => navigate(accion.to)}>
                {accion.cta}
                <span aria-hidden="true" className="ml-1 inline-block transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AppLayout>
  )
}

function Volver() {
  return (
    <Link
      to="/presupuesto-formacion"
      className="inline-flex h-[52px] items-center gap-2 rounded-2xl border border-[#d5e6dc] bg-white px-6 text-sm font-semibold text-[#1b5c40] shadow-hairline transition duration-150 hover:border-[#b7d8c6] hover:bg-[#f4faf6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena"
    >
      <span aria-hidden="true">‹</span>
      Volver al resumen
    </Link>
  )
}

function MontoView() {
  const { esAdmin, anio, monto, setMonto, saving, guardarMontoVigencia, resumen } = usePresupuesto()
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
        <section className="rounded-[26px] border border-glass-line bg-white p-6 shadow-card sm:p-7">
          <header className="border-b border-sena-line-soft pb-4">
            <h2 className="form-section-title mb-0">Monto de la vigencia {anio}</h2>
            <p className="mt-1 text-sm text-sena-text-soft">
              Este valor es el total disponible para repartir en el año.
            </p>
          </header>

          <div className="form-fields mt-5 grid gap-4 sm:max-w-lg">
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
              <div className="rounded-2xl border border-sena-line-soft bg-white px-4 py-3">
                <p className="form-label">Sin repartir</p>
                <p className="mt-1 text-lg font-bold text-sena-dark tabular-nums">
                  {pesos(resumen.sinRepartir)}
                </p>
              </div>
            ) : null}
          </div>

          {esAdmin ? (
            <div className="mt-5 flex justify-end border-t border-sena-line-soft pt-4">
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
    anio,
    resumen,
    montosCoordinador,
    setMontoCoordinador,
    montosFicha,
    setMontoFicha,
    saving,
    asignar,
    asignarAFicha,
  } = usePresupuesto()
  const [pagina, setPagina] = useState(1)

  /* Cambiar de vigencia recarga los datos: la vista vuelve a la página 1. */
  useEffect(() => {
    setPagina(1)
  }, [anio])

  const coordinadores = resumen?.coordinadores ?? []
  const areas = resumen?.areas ?? []
  const pagCoordinadores = usePagination(coordinadores, pagina, PAGE_SIZE)
  const pagAreas = usePagination(areas, pagina, PAGE_SIZE)
  /* Solo se lista una de las dos colecciones según el rol, con su propia página. */
  const paginacion = esAdmin ? pagCoordinadores : pagAreas
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
        <TableCard>
          <header className="flex flex-col gap-3 border-b border-sena-line-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight text-sena-text">
                {esAdmin ? 'Coordinadores del centro' : 'Redes de conocimiento'}
              </h2>
              <p className="mt-1 text-sm text-sena-text-soft">
                Escribe el monto de cada fila y pulsa Asignar para guardarlo.
              </p>
            </div>
            <span className="w-fit shrink-0 rounded-full border border-sena-line bg-sena-muted px-3.5 py-1.5 text-xs font-semibold text-sena-strong tabular-nums">
              {esAdmin
                ? `${coordinadores.length} coordinador${coordinadores.length === 1 ? '' : 'es'}`
                : `${areas.length} red${areas.length === 1 ? '' : 'es'}`}
            </span>
          </header>

          <div className="overflow-x-auto">
            <table className={tablaRepartoClass}>
              <thead>
                <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                  <TableHeader width="w-[42%]">{esAdmin ? 'Coordinador' : 'Red de conocimiento'}</TableHeader>
                  <TableHeader width="w-[34%]">Asignado</TableHeader>
                  <TableHeader align="right" width="w-[24%]">Acción</TableHeader>
                </tr>
              </thead>
              <tbody>
                {!esAdmin ? (
                  areas.length === 0 ? (
                    <TableEmpty colSpan={3}>No tienes redes de conocimiento asignadas.</TableEmpty>
                  ) : (
                    pagAreas.pageRows.map((area) => (
                      <TableRow key={area.id}>
                        <td>
                          <p className="font-semibold text-sena-text">{area.nombre}</p>
                          {area.codigo ? (
                            <p className="mt-0.5 text-xs font-medium text-sena-text-soft">{area.codigo}</p>
                          ) : null}
                        </td>
                        <td>
                          <input
                            className={montoInputClass}
                            type="number"
                            min={0}
                            aria-label={`Monto para ${area.nombre}`}
                            value={montosFicha[area.id] ?? ''}
                            onChange={(event) => setMontoFicha(area.id, event.target.value)}
                          />
                        </td>
                        <td className="text-right">
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
                  pagCoordinadores.pageRows.map((persona) => (
                    <TableRow key={persona.id}>
                      <td className="font-semibold text-sena-text">{persona.fullName}</td>
                      <td>
                        <input
                          className={montoInputClass}
                          type="number"
                          min={0}
                          aria-label={`Monto para ${persona.fullName}`}
                          value={montosCoordinador[persona.id] ?? ''}
                          disabled={!esAdmin}
                          onChange={(event) => setMontoCoordinador(persona.id, event.target.value)}
                        />
                      </td>
                      <td className="text-right">
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

          {paginacion.total > 0 ? (
            <TablePagination
              page={paginacion.currentPage}
              totalPages={paginacion.totalPages}
              onPageChange={setPagina}
              from={paginacion.from}
              to={paginacion.to}
              total={paginacion.total}
              noun={esAdmin ? 'coordinadores' : 'redes'}
            />
          ) : null}
        </TableCard>
      </Cuerpo>
    </AppLayout>
  )
}

function LotesView() {
  const { puedeEditar, anio, lotes, loteNombre, setLoteNombre, saving, guardarLote, resumen } = usePresupuesto()
  const [paginaLotes, setPaginaLotes] = useState(1)
  const [paginaAprobados, setPaginaAprobados] = useState(1)

  /* Cambiar de vigencia recarga los datos: ambos listados vuelven a la página 1. */
  useEffect(() => {
    setPaginaLotes(1)
    setPaginaAprobados(1)
  }, [anio])

  const aprobados = resumen?.porLote ?? []
  const pagLotes = usePagination(lotes, paginaLotes, PAGE_SIZE)
  const pagAprobados = usePagination(aprobados, paginaAprobados, PAGE_SIZE)
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
        <div className="flex flex-col gap-4">
          {puedeEditar ? (
            <section className="rounded-[26px] border border-glass-line bg-white p-6 shadow-card sm:p-7">
              <header className="border-b border-sena-line-soft pb-4">
                <h2 className="form-section-title mb-0">Nuevo lote</h2>
                <p className="mt-1 text-sm text-sena-text-soft">
                  Agrupa los materiales por tipo: informática, papelería, herramientas.
                </p>
              </header>

              <div className="mt-5 grid gap-4 sm:max-w-md">
                <TextField
                  id="lote-nombre"
                  label="Nombre del lote"
                  value={loteNombre}
                  maxLength={80}
                  onChange={(event) => setLoteNombre(event.target.value)}
                />
                <div className="flex justify-start sm:justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving || !loteNombre.trim()}
                    onClick={() => void guardarLote()}
                  >
                    Crear lote
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-[26px] border border-glass-line bg-white shadow-card">
            <div className="p-6 sm:p-7">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sena-line-soft pb-4">
                <h2 className="text-base font-bold tracking-tight text-sena-text">Lotes</h2>
                <span className="rounded-full border border-sena-line bg-sena-muted px-3.5 py-1.5 text-xs font-semibold text-sena-strong tabular-nums">
                  {lotes.length} lote{lotes.length === 1 ? '' : 's'}
                </span>
              </header>

              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {lotes.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-sena-line bg-sena-muted/60 px-4 py-8 text-center text-sm text-sena-text-soft sm:col-span-2">
                    Esta vigencia no tiene lotes.
                  </li>
                ) : (
                  pagLotes.pageRows.map((lote) => (
                    <li
                      key={lote.id}
                      className="flex items-center gap-3 rounded-2xl border border-sena-line bg-sena-surface px-4 py-3 text-sm font-semibold text-sena-text shadow-hairline transition duration-150 hover:border-sena/40 hover:bg-white"
                    >
                      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-sena" />
                      <span className="min-w-0 truncate">{lote.nombre}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {pagLotes.total > 0 ? (
              <TablePagination
                page={pagLotes.currentPage}
                totalPages={pagLotes.totalPages}
                onPageChange={setPaginaLotes}
                from={pagLotes.from}
                to={pagLotes.to}
                total={pagLotes.total}
                noun="lotes"
              />
            ) : null}

            {pagAprobados.total > 0 ? (
              <>
                <div className="border-t border-sena-line-soft px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
                  <div className="overflow-x-auto">
                    <table className={tablaLotesClass}>
                      <thead>
                        <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                          <TableHeader width="w-[60%]">Lote</TableHeader>
                          <TableHeader align="right" width="w-[40%]">Aprobado</TableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {pagAprobados.pageRows.map((lote) => (
                          <TableRow key={lote.nombre}>
                            <td className="font-medium text-sena-text">{lote.nombre}</td>
                            <td className="text-right font-semibold text-sena-dark tabular-nums">
                              {pesos(lote.gastado)}
                            </td>
                          </TableRow>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <TablePagination
                  page={pagAprobados.currentPage}
                  totalPages={pagAprobados.totalPages}
                  onPageChange={setPaginaAprobados}
                  from={pagAprobados.from}
                  to={pagAprobados.to}
                  total={pagAprobados.total}
                  noun="lotes"
                />
              </>
            ) : null}
          </section>
        </div>
      </Cuerpo>
    </AppLayout>
  )
}
