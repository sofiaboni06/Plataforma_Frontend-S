import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  ErrorBanner,
  PageHeader,
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

  return (
    <AppLayout title="Alertas">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-sena-text-soft">
        <HomeIcon className="size-4" />
        <Link to="/inventario" className="hover:text-sena-strong">
          Inventario
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-sena-strong">Alertas</span>
      </div>

      <PageHeader
        icon={<AlertIcon />}
        title="Alertas"
        description="Elementos de tus bodegas que llegaron a su cantidad mínima o se agotaron. Se cierran solas cuando se repone el stock."
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      <div className="flex flex-col gap-6">
        <section aria-label="Resumen de alertas" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <SummaryTile label="Agotados" ayuda="Activas sin existencias" count={summary.agotado} tone="agotado" onClick={() => { setNivel('agotado'); updateFilter('status', 'Activas') }} />
          <SummaryTile label="Críticos" ayuda="Activas a la mitad del mínimo o menos" count={summary.critico} tone="critico" onClick={() => { setNivel('critico'); updateFilter('status', 'Activas') }} />
          <SummaryTile label="Bajos" ayuda="Activas por debajo del mínimo" count={summary.bajo} tone="bajo" onClick={() => { setNivel('bajo'); updateFilter('status', 'Activas') }} />
          <SummaryTile label="Activas" ayuda="Todas las abiertas" count={summary.activas} tone="activa" onClick={() => { setNivel('todas'); updateFilter('status', 'Activas') }} />
          <SummaryTile label="Cerradas" ayuda="Stock ya repuesto" count={summary.cerradas} tone="cerrada" onClick={() => { setNivel('todas'); updateFilter('status', 'Cerradas') }} />
        </section>

        <TableCard>
          <div className="flex flex-col gap-4 border-b border-sena-hairline p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto]">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sena" />
                <label htmlFor="alert-product" className="sr-only">Buscar elemento</label>
                <input
                  id="alert-product"
                  value={filters.product}
                  onChange={(event) => updateFilter('product', event.target.value)}
                  placeholder="Buscar por nombre o código…"
                  className={cn(filterControlClass, 'pl-9')}
                />
              </div>
              <FilterField label="Tipo de alerta" htmlFor="alert-type">
                <select id="alert-type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value as AlertFilters['type'])} className={filterControlClass}>
                  <option value="Todos">Todos los tipos</option>
                  <option value="agotado">{TIPO_LABEL.agotado}</option>
                  <option value="por_agotarse">{TIPO_LABEL.por_agotarse}</option>
                </select>
              </FilterField>
              <FilterField label="Estado" htmlFor="alert-status">
                <select id="alert-status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value as EstadoFiltro)} className={filterControlClass}>
                  <option value="Activas">Activas</option>
                  <option value="Cerradas">Cerradas</option>
                  <option value="Todas">Todas</option>
                </select>
              </FilterField>
              <fieldset className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <legend className="sr-only">Rango de fechas</legend>
                <input aria-label="Desde" type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} className={filterControlClass} />
                <span aria-hidden="true" className="text-xs text-sena-text-soft">→</span>
                <input aria-label="Hasta" type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} className={filterControlClass} />
              </fieldset>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sena-line bg-white px-4 text-xs font-semibold text-sena-strong transition hover:border-sena/45 hover:text-sena-dark disabled:opacity-45"
              >
                <FilterBroomIcon className="size-4" />
                Limpiar
              </button>
            </div>

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
                      'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition',
                      active ? 'bg-sena text-white ring-sena' : 'bg-white text-sena-strong ring-sena-line hover:ring-sena/45',
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

          {loading ? (
            <TableLoading label="Cargando alertas…" />
          ) : pageAlerts.length ? (
            <ul className="divide-y divide-sena-line-soft px-2 sm:px-4">
              {pageAlerts.map((alerta) => (
                <li key={alerta.id}>
                  <AlertRow alerta={alerta} canViewElemento={canViewElemento} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid place-items-center px-6 py-16 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-sena-active-soft text-sena-ok-text">
                  <AlertIcon className="size-6" />
                </span>
                <p className="mt-3 text-sm font-semibold text-sena-text">
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

const filterControlClass = 'h-10 w-full min-w-0 rounded-xl border border-sena-line bg-white px-3 text-xs text-sena-text outline-none transition focus:border-sena focus:ring-2 focus:ring-sena/15'

function FilterField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="sr-only">{label}</label>
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
      <span aria-hidden="true" className={cn('hidden size-10 shrink-0 place-items-center rounded-xl sm:grid', cerrada ? 'bg-slate-100 text-slate-500' : estilo.chip)}>
        <AlertIcon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-sena-text" title={nombre}>{nombre}</p>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', cerrada ? 'bg-slate-100 text-slate-600 ring-slate-200' : estilo.chip)}>
            {cerrada ? 'Cerrada' : estilo.label}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-sena-text-soft">
          {alerta.elemento?.codigo ? (
            <span className="rounded-md bg-sena-muted px-1.5 py-0.5 font-mono">{alerta.elemento.codigo}</span>
          ) : null}
          <span>{TIPO_LABEL[alerta.tipo]}</span>
          {alerta.fecha ? (
            <time dateTime={alerta.fecha}>
              {dayLabel.format(new Date(alerta.fecha))} · {timeLabel.format(new Date(alerta.fecha))}
            </time>
          ) : null}
        </div>
        <div
          className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-sena-muted"
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

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-sena-text tabular-nums">
          {alerta.cantidad} <span className="font-normal text-sena-text-soft">de {minimo} mín.</span>
        </p>
        {faltan > 0 ? (
          <p className={cn('text-xs font-semibold tabular-nums', cerrada ? 'text-sena-text-soft' : estilo.texto)}>Faltan {faltan}</p>
        ) : (
          <p className="text-xs text-sena-text-soft">En el mínimo</p>
        )}
      </div>

      {canViewElemento ? (
        <span aria-hidden="true" className="shrink-0 text-lg text-sena-text-soft transition group-hover:translate-x-0.5 group-hover:text-sena-strong">
          ›
        </span>
      ) : null}
    </>
  )

  const base = 'group flex items-center gap-3 rounded-xl px-3 py-4 sm:gap-4'

  return canViewElemento ? (
    <Link
      to={`/inventario/elementos/${alerta.idElemento}`}
      title="Ver elemento"
      className={cn(base, 'transition hover:bg-sena-surface focus-visible:outline-2 focus-visible:outline-sena', cerrada && 'opacity-75')}
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
  onClick,
}: {
  label: string
  ayuda: string
  count: number
  tone: Severidad | 'activa' | 'cerrada'
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
      className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-sena-line bg-white p-4 text-left shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-sena"
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1.5', color.barra)} />
      <span aria-hidden="true" className={cn('grid size-10 shrink-0 place-items-center rounded-xl ring-1', color.icono)}>
        <AlertIcon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-sena-text-soft">{label}</span>
        <strong className={cn('block text-2xl leading-tight tabular-nums', color.numero)}>{count}</strong>
        <span className="block truncate text-[11px] text-sena-text-soft">{ayuda}</span>
      </span>
    </button>
  )
}
