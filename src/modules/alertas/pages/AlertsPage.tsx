import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  ErrorBanner,
  TableCard,
  TableLoading,
  pageButtonClass,
  paginationBarClass,
} from '@/shared/components/DataTable'
import { AlertIcon, FilterBroomIcon, HomeIcon, SearchIcon } from '@/shared/components/icons/AppIcons'
import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib/cn'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import { useNotifications } from '@/modules/notificaciones/context/notifications'
import { getAllAlertas } from '@/modules/alertas/data/alertas'
import type { AlertaApi, TipoAlerta } from '@/modules/alertas/types'

type EstadoFiltro = 'Activas' | 'Cerradas' | 'Todas'
type Severidad = 'agotado' | 'critico' | 'bajo'
type SeveridadFiltro = Severidad | 'todas'

type AlertFilters = {
  type: TipoAlerta | 'Todos'
  status: EstadoFiltro
  product: string
  from: string
  to: string
}

const PAGE_SIZE = 10

const DEFAULT_FILTERS: AlertFilters = {
  type: 'Todos',
  status: 'Activas',
  product: '',
  from: '',
  to: '',
}

const TIPO_LABEL: Record<TipoAlerta, string> = {
  agotado: 'Agotado',
  por_agotarse: 'Por agotarse',
}

const SEVERIDAD: Record<Severidad, { label: string; chip: string; barra: string; texto: string; punto: string }> = {
  agotado: {
    label: 'Agotado',
    chip: 'bg-sena-danger-soft text-sena-danger-text ring-sena-danger-line',
    barra: 'bg-sena-danger-text',
    texto: 'text-sena-danger-text',
    punto: 'bg-sena-danger-text',
  },
  critico: {
    label: 'Crítico',
    chip: 'bg-orange-50 text-orange-700 ring-orange-200',
    barra: 'bg-orange-500',
    texto: 'text-orange-700',
    punto: 'bg-orange-500',
  },
  bajo: {
    label: 'Bajo',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    barra: 'bg-amber-400',
    texto: 'text-amber-700',
    punto: 'bg-amber-400',
  },
}

/* Misma regla que la lista "Para reponer" del tablero. */
function severidad(alerta: AlertaApi): Severidad {
  if (alerta.tipo === 'agotado' || alerta.cantidad <= 0) return 'agotado'
  const minimo = alerta.cantidadMinima || 1
  return alerta.cantidad / minimo <= 0.5 ? 'critico' : 'bajo'
}

function ratio(alerta: AlertaApi) {
  return alerta.cantidad / (alerta.cantidadMinima || 1)
}

const dayKey = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
const dayLabel = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
const timeLabel = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' })

export default function AlertsPage() {
  const { permit } = useInventoryAccess()
  const canViewElemento = permit('elemento.ver')
  const { lastArrival } = useNotifications()

  const [alertas, setAlertas] = useState<AlertaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nivel, setNivel] = useState<SeveridadFiltro>('todas')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setAlertas(await getAllAlertas())
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar las alertas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Alertas | SENA'
    void load()
  }, [])

  useEffect(() => {
    if (lastArrival?.recurso === 'alerta') void load()
  }, [lastArrival])

  const byStatusAndFilters = useMemo(() => {
    const search = filters.product.trim().toLowerCase()

    return alertas.filter((alerta) => {
      const day = alerta.fecha ? dayKey.format(new Date(alerta.fecha)) : ''
      const matchesStatus =
        filters.status === 'Todas' ||
        (filters.status === 'Activas' && alerta.estado) ||
        (filters.status === 'Cerradas' && !alerta.estado)
      const matchesType = filters.type === 'Todos' || alerta.tipo === filters.type
      const matchesProduct =
        !search ||
        `${alerta.elemento?.nombre ?? ''} ${alerta.elemento?.codigo ?? ''}`.toLowerCase().includes(search)
      const matchesFrom = !filters.from || day >= filters.from
      const matchesTo = !filters.to || day <= filters.to
      return matchesStatus && matchesType && matchesProduct && matchesFrom && matchesTo
    })
  }, [alertas, filters])

  const nivelCount = (value: SeveridadFiltro) =>
    value === 'todas' ? byStatusAndFilters.length : byStatusAndFilters.filter((alerta) => severidad(alerta) === value).length

  /* Activas primero; dentro, de la más grave a la menos grave y luego la más reciente. */
  const filteredAlerts = useMemo(() => {
    const rows = nivel === 'todas' ? byStatusAndFilters : byStatusAndFilters.filter((alerta) => severidad(alerta) === nivel)
    return [...rows].sort(
      (a, b) =>
        Number(b.estado) - Number(a.estado) ||
        ratio(a) - ratio(b) ||
        new Date(b.fecha ?? 0).getTime() - new Date(a.fecha ?? 0).getTime(),
    )
  }, [nivel, byStatusAndFilters])

  const summary = useMemo(() => {
    const activas = alertas.filter((alerta) => alerta.estado)
    return {
      agotado: activas.filter((alerta) => severidad(alerta) === 'agotado').length,
      critico: activas.filter((alerta) => severidad(alerta) === 'critico').length,
      bajo: activas.filter((alerta) => severidad(alerta) === 'bajo').length,
      activas: activas.length,
      cerradas: alertas.length - activas.length,
    }
  }, [alertas])

  const pageCount = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageAlerts = filteredAlerts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const desde = filteredAlerts.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const hasta = Math.min(currentPage * PAGE_SIZE, filteredAlerts.length)

  const updateFilter = <K extends keyof AlertFilters>(key: K, value: AlertFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setNivel('todas')
    setPage(1)
  }

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) || nivel !== 'todas'

  const NIVELES: Array<{ value: SeveridadFiltro; label: string }> = [
    { value: 'todas', label: 'Todas' },
    { value: 'agotado', label: 'Agotado' },
    { value: 'critico', label: 'Crítico' },
    { value: 'bajo', label: 'Bajo' },
  ]

  /* Distribución de las activas para la barra del encabezado (solo presentación). */
  const baseActivas = summary.activas || 1
  const segmentos = [
    { label: 'Agotado', count: summary.agotado, color: 'bg-sena-danger-text', pct: (summary.agotado / baseActivas) * 100 },
    { label: 'Crítico', count: summary.critico, color: 'bg-orange-500', pct: (summary.critico / baseActivas) * 100 },
    { label: 'Bajo', count: summary.bajo, color: 'bg-amber-400', pct: (summary.bajo / baseActivas) * 100 },
  ]

  return (
    <AppLayout title="Alertas">
      <section className="relative mb-5 overflow-hidden rounded-[26px] border border-glass-line bg-white shadow-card">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-sena via-sena-bright to-sena/0"
        />

        <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1">
            <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-xs font-medium text-sena-text-soft">
              <HomeIcon className="size-4" />
              <Link to="/inventario" className="transition duration-150 hover:text-sena-strong">
                Inventario
              </Link>
              <span aria-hidden="true">›</span>
              <span className="text-sena-strong">Alertas</span>
            </nav>

            <div className="mt-4 flex items-start gap-4">
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sena text-white shadow-brand-sm"
              >
                <AlertIcon className="size-6" />
              </span>

              <div className="min-w-0">
                <h1 className="text-3xl leading-tight font-bold tracking-tight text-sena-text sm:text-[2.125rem]">
                  Alertas de stock
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-sena-text-soft sm:text-base">
                  Elementos de tus bodegas que llegaron a su cantidad mínima o se agotaron. Se cierran solas cuando se repone el stock.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl border border-sena-ok-line/70 bg-sena-active-soft/70 px-5 py-4 lg:w-[20rem]">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.14em] text-sena-strong uppercase">Alertas activas</p>
                <p className="mt-1 text-xs text-sena-text-soft tabular-nums">de {alertas.length} registradas</p>
              </div>
              <p className="text-3xl leading-none font-bold text-sena-ok-text tabular-nums">{summary.activas}</p>
            </div>

            <div
              className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-white/70"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={summary.activas}
              aria-valuenow={summary.agotado}
              aria-label="Distribución de alertas activas por nivel"
            >
              {segmentos.map((seg) => (
                <span
                  key={seg.label}
                  aria-hidden="true"
                  className={cn('h-full rounded-full transition-[width] duration-500', seg.color)}
                  style={{ width: `${seg.pct}%` }}
                />
              ))}
            </div>

            <ul className="mt-3 grid grid-cols-3 gap-2">
              {segmentos.map((seg) => (
                <li key={seg.label} className="flex min-w-0 items-center gap-1.5 text-[11px] text-sena-strong">
                  <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', seg.color)} />
                  <span className="truncate font-medium">{seg.label}</span>
                  <span className="font-bold text-sena-text tabular-nums">{seg.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      <div className="flex flex-col gap-5">
        <section aria-label="Resumen de alertas" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <SummaryTile label="Agotados" ayuda="Activas sin existencias" count={summary.agotado} tone="agotado" active={nivel === 'agotado' && filters.status === 'Activas'} onClick={() => { setNivel('agotado'); updateFilter('status', 'Activas') }} />
          <SummaryTile label="Críticos" ayuda="Activas a la mitad del mínimo o menos" count={summary.critico} tone="critico" active={nivel === 'critico' && filters.status === 'Activas'} onClick={() => { setNivel('critico'); updateFilter('status', 'Activas') }} />
          <SummaryTile label="Bajos" ayuda="Activas por debajo del mínimo" count={summary.bajo} tone="bajo" active={nivel === 'bajo' && filters.status === 'Activas'} onClick={() => { setNivel('bajo'); updateFilter('status', 'Activas') }} />
          <SummaryTile label="Activas" ayuda="Todas las abiertas" count={summary.activas} tone="activa" active={nivel === 'todas' && filters.status === 'Activas'} onClick={() => { setNivel('todas'); updateFilter('status', 'Activas') }} />
          <SummaryTile label="Cerradas" ayuda="Stock ya repuesto" count={summary.cerradas} tone="cerrada" active={nivel === 'todas' && filters.status === 'Cerradas'} onClick={() => { setNivel('todas'); updateFilter('status', 'Cerradas') }} />
        </section>

        <section aria-label="Filtros de alertas" className="rounded-[26px] border border-glass-line bg-white p-5 shadow-card sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sena-line-soft pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-sena-soft text-sena-dark">
                <FilterBroomIcon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-sena-text">Filtros de la lista</h2>
                <p className="mt-0.5 text-xs text-sena-text-soft">Busca por nombre o código y acota por tipo, estado o fecha.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-sena-line bg-white px-4 text-xs font-semibold text-sena-strong transition duration-150 hover:border-sena/45 hover:bg-sena-surface hover:text-sena-dark disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm"
            >
              <FilterBroomIcon className="size-4" />
              Limpiar filtros
            </button>
          </header>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
            <FilterField label="Buscar elemento" htmlFor="alert-product">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-sena" />
                <input
                  id="alert-product"
                  value={filters.product}
                  onChange={(event) => updateFilter('product', event.target.value)}
                  placeholder="Buscar por nombre o código…"
                  className="form-field pl-10"
                />
              </div>
            </FilterField>
            <FilterField label="Tipo de alerta" htmlFor="alert-type">
              <select id="alert-type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value as AlertFilters['type'])} className="form-field form-select">
                <option value="Todos">Todos los tipos</option>
                <option value="agotado">{TIPO_LABEL.agotado}</option>
                <option value="por_agotarse">{TIPO_LABEL.por_agotarse}</option>
              </select>
            </FilterField>
            <FilterField label="Estado" htmlFor="alert-status">
              <select id="alert-status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value as EstadoFiltro)} className="form-field form-select">
                <option value="Activas">Activas</option>
                <option value="Cerradas">Cerradas</option>
                <option value="Todas">Todas</option>
              </select>
            </FilterField>
            <div className="flex flex-col gap-1.5">
              <span aria-hidden="true" className={filterLabelClass}>
                Rango de fechas
              </span>
              <fieldset className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <legend className="sr-only">Rango de fechas</legend>
                <input aria-label="Desde" type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} className="form-field" />
                <span aria-hidden="true" className="text-xs text-sena-text-soft">→</span>
                <input aria-label="Hasta" type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} className="form-field" />
              </fieldset>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-sena-line-soft pt-4">
            <span className={filterLabelClass}>Severidad</span>
            <div role="tablist" aria-label="Severidad" className="flex flex-wrap gap-2">
              {NIVELES.map((item) => {
                const active = nivel === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setNivel(item.value)
                      setPage(1)
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition duration-150',
                      active ? 'bg-sena text-white ring-sena shadow-brand-sm' : 'bg-white text-sena-strong ring-sena-line hover:ring-sena/45 hover:text-sena-dark',
                    )}
                  >
                    {item.value !== 'todas' ? (
                      <span aria-hidden="true" className={cn('size-2 rounded-full', active ? 'bg-white' : SEVERIDAD[item.value].punto)} />
                    ) : null}
                    {item.label}
                    <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', active ? 'bg-white/20' : 'bg-sena-soft')}>
                      {nivelCount(item.value)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <TableCard>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sena-line-soft px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-sena-text sm:text-base">Lista de alertas</h2>
              <p className="mt-0.5 text-xs text-sena-text-soft">Las alertas más graves se muestran primero.</p>
            </div>
            {!loading ? (
              <span className="rounded-full border border-sena-line bg-sena-muted px-3.5 py-1.5 text-xs font-semibold text-sena-strong tabular-nums">
                {filteredAlerts.length} {filteredAlerts.length === 1 ? 'resultado' : 'resultados'}
              </span>
            ) : null}
          </header>

          {loading ? (
            <TableLoading label="Cargando alertas…" />
          ) : pageAlerts.length ? (
            <>
              <div
                aria-hidden="true"
                className={cn(
                  'hidden border-b border-sena-line-soft bg-sena-muted/60 px-5 pb-3 pt-3.5 text-[11px] font-bold tracking-[0.12em] text-sena-strong uppercase sm:px-6 lg:grid',
                  columnasAlerta,
                )}
              >
                <span>Elemento</span>
                <span>Nivel</span>
                <span>Fecha</span>
                <span>Existencias</span>
                <span className="text-right">{canViewElemento ? 'Acción' : ''}</span>
              </div>
              <ul className="divide-y divide-sena-line-soft">
                {pageAlerts.map((alerta) => (
                  <li key={alerta.id}>
                    <AlertRow alerta={alerta} canViewElemento={canViewElemento} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="grid place-items-center px-5 py-16 text-center sm:px-6 sm:py-20">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-sena-active-soft text-sena-ok-text ring-1 ring-sena-ok-line/70">
                  <AlertIcon className="size-7" />
                </span>
                <p className="mt-4 text-sm font-bold tracking-tight text-sena-text sm:text-base">
                  {alertas.length === 0 ? 'Todo el stock está al día' : 'No hay alertas que coincidan con los filtros'}
                </p>
                <p className="mt-1 text-xs text-sena-text-soft">
                  {alertas.length === 0
                    ? 'Ningún elemento está por debajo de su mínimo.'
                    : 'Prueba con otra búsqueda o limpia los filtros.'}
                </p>
                {alertas.length > 0 && hasFilters ? (
                  <button type="button" onClick={clearFilters} className="mt-4 text-xs font-semibold text-sena-strong hover:underline">
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {!loading && filteredAlerts.length > 0 ? (
            <nav aria-label="Paginación de alertas" className={cn(paginationBarClass, 'px-4 sm:px-7')}>
              <p className="text-sm text-sena-strong tabular-nums" aria-live="polite">
                Mostrando {desde}–{hasta} de {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alerta' : 'alertas'}
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
                <button type="button" className={pageBoton} disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                  ‹ Anterior
                </button>
                <span className="text-sm font-semibold whitespace-nowrap text-sena-text tabular-nums">
                  Página {currentPage} de {pageCount}
                </span>
                <button type="button" className={pageBoton} disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                  Siguiente ›
                </button>
              </div>
            </nav>
          ) : null}
        </TableCard>
      </div>
    </AppLayout>
  )
}

const pageBoton = cn(pageButtonClass, 'w-auto px-3 text-sm font-semibold whitespace-nowrap sm:px-4')

/** Etiqueta visible de cada filtro, igual que en FilterGroup de DataTable. */
const filterLabelClass = 'text-[11px] font-semibold tracking-[0.1em] text-sena-strong uppercase'

/**
 * Plantilla compartida entre la cabecera de columnas y cada fila de la lista:
 * así los encabezados caen exactamente sobre sus datos en pantallas grandes,
 * y en móvil todo se reordena en dos columnas legibles.
 */
const columnasAlerta =
  'gap-x-4 gap-y-3 sm:gap-x-6 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,7rem)_minmax(0,9rem)_minmax(0,10.5rem)_minmax(0,6rem)] lg:items-center lg:gap-y-0'

function FilterField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={filterLabelClass}>{label}</label>
      {children}
    </div>
  )
}

function AlertRow({ alerta, canViewElemento }: { alerta: AlertaApi; canViewElemento: boolean }) {
  const nivel = severidad(alerta)
  const estilo = SEVERIDAD[nivel]
  const cerrada = !alerta.estado
  const minimo = alerta.cantidadMinima ?? 0
  const porcentaje = minimo > 0 ? Math.min(100, Math.round((alerta.cantidad / minimo) * 100)) : 0
  const faltan = Math.max(0, minimo - alerta.cantidad)
  const nombre = alerta.elemento?.nombre ?? `Elemento ${alerta.idElemento}`

  const contenido = (
    <>
      {/* Elemento */}
      <div className="col-span-2 flex min-w-0 items-start gap-3 lg:col-span-1">
        <span aria-hidden="true" className={cn('grid size-10 shrink-0 place-items-center rounded-xl ring-1', cerrada ? 'bg-slate-100 text-slate-500 ring-slate-200' : estilo.chip)}>
          <AlertIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sena-text" title={nombre}>{nombre}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-sena-text-soft">
            {alerta.elemento?.codigo ? (
              <span className="rounded-md bg-sena-muted px-1.5 py-0.5 font-mono text-sena-strong">{alerta.elemento.codigo}</span>
            ) : null}
            <span>{TIPO_LABEL[alerta.tipo]}</span>
          </div>
        </div>
      </div>

      {/* Nivel */}
      <div className="min-w-0">
        <span className={cn('inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1', cerrada ? 'bg-slate-100 text-slate-600 ring-slate-200' : estilo.chip)}>
          <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', cerrada ? 'bg-slate-400' : estilo.punto)} />
          <span className="truncate">{cerrada ? 'Cerrada' : estilo.label}</span>
        </span>
      </div>

      {/* Fecha */}
      <div className="min-w-0">
        {alerta.fecha ? (
          <time dateTime={alerta.fecha} className="block text-xs tabular-nums text-sena-text-soft">
            <span className="block font-semibold text-sena-strong">{dayLabel.format(new Date(alerta.fecha))}</span>
            <span className="block">{timeLabel.format(new Date(alerta.fecha))}</span>
          </time>
        ) : (
          <span aria-hidden="true" className="text-xs text-sena-text-soft">—</span>
        )}
      </div>

      {/* Existencias */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-sena-text tabular-nums">
          {alerta.cantidad} <span className="font-normal text-sena-text-soft">de {minimo} mín.</span>
        </p>
        {faltan > 0 ? (
          <p className={cn('text-xs font-semibold tabular-nums', cerrada ? 'text-sena-text-soft' : estilo.texto)}>Faltan {faltan}</p>
        ) : (
          <p className="text-xs text-sena-text-soft">En el mínimo</p>
        )}
        <div
          className="mt-2 h-1.5 w-full max-w-[8rem] overflow-hidden rounded-full bg-sena-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={minimo}
          aria-valuenow={alerta.cantidad}
          aria-label={`${alerta.cantidad} de ${minimo} mínimo`}
        >
          <div
            className={cn('h-full rounded-full', cerrada ? 'bg-slate-300' : estilo.barra)}
            style={{ width: `${Math.max(porcentaje, alerta.cantidad > 0 ? 4 : 0)}%` }}
          />
        </div>
      </div>

      {/* Acción */}
      <div className="min-w-0 justify-self-end">
        {canViewElemento ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sena-line bg-white px-3 py-1.5 text-xs font-semibold text-sena-strong transition duration-150 group-hover:border-sena group-hover:bg-sena group-hover:text-white">
            Ver
            <span aria-hidden="true">›</span>
          </span>
        ) : null}
      </div>
    </>
  )

  const base = cn('group grid w-full grid-cols-2 px-5 py-4 text-left transition duration-150 sm:px-6 sm:py-5', columnasAlerta)

  return canViewElemento ? (
    <Link
      to={`/inventario/elementos/${alerta.idElemento}`}
      title="Ver elemento"
      className={cn(base, 'hover:bg-sena-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena', cerrada && 'opacity-75')}
    >
      {contenido}
    </Link>
  ) : (
    <div className={cn(base, cerrada && 'opacity-75')}>{contenido}</div>
  )
}

function SummaryTile({
  label,
  ayuda,
  count,
  tone,
  active = false,
  onClick,
}: {
  label: string
  ayuda: string
  count: number
  tone: Severidad | 'activa' | 'cerrada'
  active?: boolean
  onClick: () => void
}) {
  const colors: Record<typeof tone, { icono: string; barra: string; numero: string }> = {
    agotado: { icono: SEVERIDAD.agotado.chip, barra: SEVERIDAD.agotado.barra, numero: SEVERIDAD.agotado.texto },
    critico: { icono: SEVERIDAD.critico.chip, barra: SEVERIDAD.critico.barra, numero: SEVERIDAD.critico.texto },
    bajo: { icono: SEVERIDAD.bajo.chip, barra: SEVERIDAD.bajo.barra, numero: SEVERIDAD.bajo.texto },
    activa: { icono: 'bg-sena-active-soft text-sena-ok-text ring-sena-ok-line', barra: 'bg-sena', numero: 'text-sena-ok-text' },
    cerrada: { icono: 'bg-slate-100 text-slate-600 ring-slate-200', barra: 'bg-slate-300', numero: 'text-slate-600' },
  }
  const color = colors[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-[24px] border bg-white p-5 text-left shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-sena active:translate-y-0',
        active ? 'border-sena ring-2 ring-sena/20' : 'border-sena-line hover:border-sena/45',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('absolute inset-x-0 top-0 h-1 transition-opacity', color.barra, active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100')}
      />

      <span className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className={cn('grid size-11 shrink-0 place-items-center rounded-2xl ring-1 transition duration-200 group-hover:scale-105', color.icono)}>
          <AlertIcon className="size-5" />
        </span>
        {active ? (
          <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-sena text-[11px] font-bold text-white shadow-brand-sm">
            ✓
          </span>
        ) : (
          <span aria-hidden="true" className="text-lg leading-none text-sena-line transition duration-150 group-hover:translate-x-0.5 group-hover:text-sena">
            ›
          </span>
        )}
      </span>

      <span className="block">
        <strong className={cn('block text-[2.1rem] leading-none font-bold tabular-nums', color.numero)}>{count}</strong>
        <span className="mt-2 block text-sm font-semibold text-sena-text">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-sena-text-soft">{ayuda}</span>
      </span>
    </button>
  )
}
