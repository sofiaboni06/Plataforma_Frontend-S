import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  ActionButton,
  ErrorBanner,
  PageHeader,
  RowActions,
  TableCard,
  TableHeader,
  TableLoading,
  TableRow,
  pageButtonClass,
  tableClass,
} from '@/shared/components/DataTable'
import {
  AlertIcon,
  EyeIcon,
  FilterBroomIcon,
  HomeIcon,
  SearchIcon,
} from '@/shared/components/icons/AppIcons'
import { ApiError } from '@/shared/lib/api'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import { useNotifications } from '@/modules/notificaciones/context/notifications'
import { getAllAlertas } from '@/modules/alertas/data/alertas'
import type { AlertaApi, TipoAlerta } from '@/modules/alertas/types'

type EstadoFiltro = 'Activas' | 'Cerradas' | 'Todas'

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

const TABS: Array<{ label: string; type: TipoAlerta | 'Todos' }> = [
  { label: 'Todas las alertas', type: 'Todos' },
  { label: 'Agotados', type: 'agotado' },
  { label: 'Por agotarse', type: 'por_agotarse' },
]

const dayKey = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
const dayLabel = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
const timeLabel = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' })

export default function AlertsPage() {
  const navigate = useNavigate()
  const { permit } = useInventoryAccess()
  const canViewElemento = permit('elemento.ver')
  const { lastArrival } = useNotifications()

  const [alertas, setAlertas] = useState<AlertaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(TABS[0].label)
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
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

  const tabCount = (type: TipoAlerta | 'Todos') =>
    type === 'Todos'
      ? byStatusAndFilters.length
      : byStatusAndFilters.filter((alerta) => alerta.tipo === type).length

  const filteredAlerts = useMemo(() => {
    const tabType = TABS.find((tab) => tab.label === activeTab)?.type ?? 'Todos'
    return tabType === 'Todos'
      ? byStatusAndFilters
      : byStatusAndFilters.filter((alerta) => alerta.tipo === tabType)
  }, [activeTab, byStatusAndFilters])

  const summary = useMemo(() => {
    const activas = alertas.filter((alerta) => alerta.estado)
    return {
      agotados: activas.filter((alerta) => alerta.tipo === 'agotado').length,
      porAgotarse: activas.filter((alerta) => alerta.tipo === 'por_agotarse').length,
      activas: activas.length,
      cerradas: alertas.length - activas.length,
    }
  }, [alertas])

  const pageCount = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageAlerts = filteredAlerts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const updateDraft = <K extends keyof AlertFilters>(key: K, value: AlertFilters[K]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  const applyFilters = () => {
    setFilters(draftFilters)
    setActiveTab(TABS[0].label)
    setPage(1)
  }

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setFilters(DEFAULT_FILTERS)
    setActiveTab(TABS[0].label)
    setPage(1)
  }

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

      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.9fr)]">
        <TableCard>
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-sena-hairline bg-white/40 px-3 pt-2 sm:px-5">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.label}
                onClick={() => {
                  setActiveTab(tab.label)
                  setPage(1)
                }}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition sm:px-4 ${
                  activeTab === tab.label
                    ? 'border-sena text-sena-dark'
                    : 'border-transparent text-sena-text-soft hover:text-sena-dark'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.label ? 'bg-sena text-white' : 'bg-sena-soft text-sena-strong'}`}>
                  {tabCount(tab.type)}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <TableLoading label="Cargando alertas…" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <TableHeader width="w-[17%]">Tipo</TableHeader>
                      <TableHeader width="w-[26%]">Elemento</TableHeader>
                      <TableHeader width="w-[22%]">Detalle</TableHeader>
                      <TableHeader width="w-[15%]">Fecha</TableHeader>
                      <TableHeader width="w-[12%]">Estado</TableHeader>
                      <TableHeader width="w-[8%]" align="center">Acciones</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {pageAlerts.length ? pageAlerts.map((alerta) => (
                      <TableRow key={alerta.id}>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sena-text">
                            <AlertTypeMark type={alerta.tipo} />
                            {TIPO_LABEL[alerta.tipo]}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="block font-semibold text-sena-text">{alerta.elemento?.nombre ?? `Elemento ${alerta.idElemento}`}</span>
                          <span className="mt-0.5 block text-[11px] text-sena-text-soft">{alerta.elemento?.codigo ?? '—'}</span>
                        </td>
                        <td className="px-3 py-3 text-xs text-sena-strong">{alertDetail(alerta)}</td>
                        <td className="px-3 py-3 text-xs text-sena-text">
                          {alerta.fecha ? (
                            <time dateTime={alerta.fecha}>
                              {dayLabel.format(new Date(alerta.fecha))}
                              <span className="mt-0.5 block text-[11px] text-sena-text-soft">{timeLabel.format(new Date(alerta.fecha))}</span>
                            </time>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <AlertStatusPill alerta={alerta} />
                        </td>
                        <td className="px-3 py-3">
                          <RowActions>
                            {canViewElemento ? (
                              <ActionButton
                                title="Ver elemento"
                                onClick={() => navigate(`/inventario/elementos/${alerta.idElemento}`)}
                              >
                                <EyeIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                          </RowActions>
                        </td>
                      </TableRow>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-sena-text-soft">
                          {alertas.length === 0
                            ? 'No hay alertas. Todo el stock está por encima de su mínimo.'
                            : 'No hay alertas que coincidan con los filtros.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sena-hairline px-5 py-3.5 text-xs text-sena-strong sm:px-6">
                <p>Mostrando {pageAlerts.length} de {filteredAlerts.length} alertas</p>
                <nav aria-label="Paginación de alertas" className="flex items-center gap-1.5">
                  <button type="button" className={pageButtonClass} aria-label="Página anterior" disabled={currentPage <= 1} onClick={() => setPage(Math.max(1, currentPage - 1))}>
                    ‹
                  </button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      aria-current={currentPage === pageNumber ? 'page' : undefined}
                      onClick={() => setPage(pageNumber)}
                      className={`grid size-9 place-items-center rounded-xl text-sm font-semibold ${currentPage === pageNumber ? 'bg-sena text-white shadow-brand-sm' : 'text-sena-strong hover:bg-sena-soft'}`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button type="button" className={pageButtonClass} aria-label="Página siguiente" disabled={currentPage >= pageCount} onClick={() => setPage(Math.min(pageCount, currentPage + 1))}>
                    ›
                  </button>
                </nav>
              </div>
            </>
          )}
        </TableCard>

        <aside className="flex flex-col gap-4">
          <section className="rounded-[22px] border border-glass-line bg-glass/85 p-4 shadow-surface backdrop-blur-glass sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-sena-dark">
              <span className="grid size-7 place-items-center rounded-lg bg-sena-soft text-sena"><AlertIcon className="size-4" /></span>
              Resumen de alertas
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <SummaryTile label="Agotados" count={summary.agotados} symbol="!" tone="red" />
              <SummaryTile label="Por agotarse" count={summary.porAgotarse} symbol="!" tone="amber" />
              <SummaryTile label="Activas" count={summary.activas} symbol="●" tone="green" />
              <SummaryTile label="Cerradas" count={summary.cerradas} symbol="✓" tone="slate" />
            </div>
          </section>

          <section className="rounded-[22px] border border-glass-line bg-glass/85 p-4 shadow-surface backdrop-blur-glass sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-sena-dark">
                <FilterBroomIcon className="size-4 text-sena" />
                Filtros
              </h2>
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-sena-strong hover:text-sena-dark">
                Limpiar
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <FilterField label="Tipo de alerta" htmlFor="alert-type">
                <select id="alert-type" value={draftFilters.type} onChange={(event) => updateDraft('type', event.target.value as AlertFilters['type'])} className={filterControlClass}>
                  <option value="Todos">Todos</option>
                  <option value="agotado">Agotado</option>
                  <option value="por_agotarse">Por agotarse</option>
                </select>
              </FilterField>
              <FilterField label="Estado" htmlFor="alert-status">
                <select id="alert-status" value={draftFilters.status} onChange={(event) => updateDraft('status', event.target.value as EstadoFiltro)} className={filterControlClass}>
                  <option value="Activas">Activas</option>
                  <option value="Cerradas">Cerradas</option>
                  <option value="Todas">Todas</option>
                </select>
              </FilterField>
              <FilterField label="Elemento" htmlFor="alert-product">
                <input id="alert-product" value={draftFilters.product} onChange={(event) => updateDraft('product', event.target.value)} placeholder="Buscar por nombre o código..." className={filterControlClass} />
              </FilterField>
              <fieldset>
                <legend className="mb-1.5 text-[11px] font-semibold text-sena-text">Rango de fechas</legend>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input aria-label="Desde" type="date" value={draftFilters.from} onChange={(event) => updateDraft('from', event.target.value)} className={filterControlClass} />
                  <span aria-hidden="true" className="text-xs text-sena-text-soft">→</span>
                  <input aria-label="Hasta" type="date" value={draftFilters.to} onChange={(event) => updateDraft('to', event.target.value)} className={filterControlClass} />
                </div>
              </fieldset>
              <button type="button" onClick={applyFilters} className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sena px-4 text-xs font-bold text-white shadow-brand-sm transition hover:bg-sena-dark">
                <SearchIcon className="size-4" />
                Aplicar filtros
              </button>
            </div>
          </section>
        </aside>
      </div>
    </AppLayout>
  )
}

function alertDetail(alerta: AlertaApi) {
  if (alerta.tipo === 'agotado') return `Sin existencias. El mínimo es ${alerta.cantidadMinima}.`
  return `Quedan ${alerta.cantidad}. El mínimo es ${alerta.cantidadMinima}.`
}

const filterControlClass = 'h-10 w-full min-w-0 rounded-xl border border-sena-line bg-white/75 px-3 text-xs text-sena-text outline-none transition focus:border-sena focus:ring-2 focus:ring-sena/15'

function FilterField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold text-sena-text">{label}</label>
      {children}
    </div>
  )
}

function AlertTypeMark({ type }: { type: TipoAlerta }) {
  const className = type === 'agotado'
    ? 'bg-red-100 text-red-600'
    : 'bg-amber-100 text-amber-600'

  return (
    <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${className}`}>
      !
    </span>
  )
}

function AlertStatusPill({ alerta }: { alerta: AlertaApi }) {
  if (!alerta.estado) {
    return <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">Cerrada</span>
  }

  const className = alerta.tipo === 'agotado'
    ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700'

  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${className}`}>Activa</span>
}

function SummaryTile({ label, count, symbol, tone }: { label: string; count: number; symbol: string; tone: 'red' | 'amber' | 'green' | 'slate' }) {
  const colors = {
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-emerald-100 text-emerald-700',
    slate: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="flex min-h-[76px] items-center gap-2.5 rounded-xl border border-white/70 bg-white/65 px-3 py-2.5">
      <span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${colors[tone]}`}>{symbol}</span>
      <span>
        <strong className="block text-lg leading-5 text-sena-dark">{count}</strong>
        <span className="text-[10px] leading-4 text-sena-text-soft">{label}</span>
      </span>
    </div>
  )
}
