import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  PageHeader,
  TableCard,
  TableHeader,
  TableRow,
  pageButtonClass,
  tableClass,
} from '@/shared/components/DataTable'
import {
  AlertIcon,
  FilterBroomIcon,
  HomeIcon,
  SearchIcon,
} from '@/shared/components/icons/AppIcons'

type AlertType = 'Vencimiento' | 'Stock bajo' | 'Movimiento'
type AlertStatus = 'Crítica' | 'Advertencia' | 'Info'
type AlertRow = {
  id: number
  type: AlertType
  product: string
  code: string
  detail: string
  date: string
  time: string
  status: AlertStatus
}

type AlertFilters = {
  type: AlertType | 'Todos'
  status: AlertStatus | 'Todos'
  product: string
  from: string
  to: string
}

const ALERTS: AlertRow[] = [
  { id: 1, type: 'Vencimiento', product: 'Suero fisiológico 0.9%', code: 'MED-003', detail: 'Vence en 3 días', date: '2026-08-06', time: '08:45 a. m.', status: 'Crítica' },
  { id: 2, type: 'Stock bajo', product: 'Guantes estériles', code: 'INS-001', detail: 'Quedan 5 unidades', date: '2026-08-06', time: '07:32 a. m.', status: 'Advertencia' },
  { id: 3, type: 'Stock bajo', product: 'Jeringa 10 ml', code: 'MED-007', detail: 'Quedan 8 unidades', date: '2026-08-05', time: '06:18 p. m.', status: 'Advertencia' },
  { id: 4, type: 'Movimiento', product: 'Paracetamol 500 mg', code: 'MED-005', detail: 'Ingreso de 50 unidades', date: '2026-08-05', time: '05:40 a. m.', status: 'Info' },
  { id: 5, type: 'Vencimiento', product: 'Amoxicilina 500 mg', code: 'MED-008', detail: 'Vence en 7 días', date: '2026-08-05', time: '04:22 a. m.', status: 'Crítica' },
  { id: 6, type: 'Stock bajo', product: 'Gasas estériles', code: 'INS-002', detail: 'Quedan 20 unidades', date: '2026-08-05', time: '09:15 a. m.', status: 'Advertencia' },
  { id: 7, type: 'Stock bajo', product: 'Termómetro digital', code: 'EQU-001', detail: 'Quedan 3 unidades', date: '2026-08-05', time: '08:50 a. m.', status: 'Advertencia' },
  { id: 8, type: 'Stock bajo', product: 'Mascarillas N95', code: 'INS-003', detail: 'Quedan 10 unidades', date: '2026-08-04', time: '04:22 p. m.', status: 'Advertencia' },
  { id: 9, type: 'Vencimiento', product: 'Suero fisiológico 0.9%', code: 'MED-001', detail: 'Vence en 5 días', date: '2026-08-04', time: '01:10 p. m.', status: 'Crítica' },
  { id: 10, type: 'Movimiento', product: 'Guantes estériles', code: 'INS-001', detail: 'Salida de 15 unidades', date: '2026-08-04', time: '12:45 a. m.', status: 'Info' },
  { id: 11, type: 'Stock bajo', product: 'Solución antiséptica', code: 'MED-010', detail: 'Quedan 4 unidades', date: '2026-08-03', time: '10:15 a. m.', status: 'Advertencia' },
  { id: 12, type: 'Vencimiento', product: 'Guantes de nitrilo', code: 'INS-006', detail: 'Vence en 9 días', date: '2026-08-03', time: '07:20 a. m.', status: 'Crítica' },
]

const DEFAULT_FILTERS: AlertFilters = {
  type: 'Todos',
  status: 'Todos',
  product: '',
  from: '2026-08-01',
  to: '2026-08-06',
}

const TABS = [
  { label: 'Todas las alertas', type: 'Todos' as const, count: ALERTS.length },
  { label: 'Stock bajo', type: 'Stock bajo' as const, count: 6 },
  { label: 'Vencimientos', type: 'Vencimiento' as const, count: 4 },
  { label: 'Movimientos', type: 'Movimiento' as const, count: 2 },
]

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['label']>(TABS[0].label)
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const filteredAlerts = useMemo(() => {
    const tabType = TABS.find((tab) => tab.label === activeTab)?.type
    const selectedType = filters.type !== 'Todos' ? filters.type : tabType
    const search = filters.product.trim().toLowerCase()

    return ALERTS.filter((alert) => {
      const matchesType = selectedType === 'Todos' || alert.type === selectedType
      const matchesStatus = filters.status === 'Todos' || alert.status === filters.status
      const matchesProduct = !search || `${alert.product} ${alert.code}`.toLowerCase().includes(search)
      const matchesFrom = !filters.from || alert.date >= filters.from
      const matchesTo = !filters.to || alert.date <= filters.to
      return matchesType && matchesStatus && matchesProduct && matchesFrom && matchesTo
    })
  }, [activeTab, filters])

  const pageCount = Math.max(1, Math.ceil(filteredAlerts.length / 10))
  const pageAlerts = filteredAlerts.slice((page - 1) * 10, page * 10)
  const visibleCount = pageAlerts.length

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
        description="Monitorea y gestiona las alertas del sistema en tiempo real."
      />

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
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <TableHeader width="w-[5%]">
                    <input type="checkbox" aria-label="Seleccionar todas las alertas" className="size-3.5 accent-[#00a651]" />
                  </TableHeader>
                  <TableHeader width="w-[16%]">Tipo</TableHeader>
                  <TableHeader width="w-[22%]">Producto</TableHeader>
                  <TableHeader width="w-[20%]">Detalle</TableHeader>
                  <TableHeader width="w-[17%]">Fecha</TableHeader>
                  <TableHeader width="w-[13%]">Estado</TableHeader>
                  <TableHeader width="w-[7%]" align="center">Acciones</TableHeader>
                </tr>
              </thead>
              <tbody>
                {pageAlerts.length ? pageAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`Seleccionar alerta de ${alert.product}`} className="size-3.5 accent-[#00a651]" />
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sena-text">
                        <AlertTypeMark type={alert.type} />
                        {alert.type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block font-semibold text-sena-text">{alert.product}</span>
                      <span className="mt-0.5 block text-[11px] text-sena-text-soft">{alert.code}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-sena-strong">{alert.detail}</td>
                    <td className="px-3 py-3 text-xs text-sena-text">
                      <time dateTime={alert.date}>
                        {formatAlertDate(alert.date)}
                        <span className="mt-0.5 block text-[11px] text-sena-text-soft">{alert.time}</span>
                      </time>
                    </td>
                    <td className="px-3 py-3">
                      <AlertStatusPill status={alert.status} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button type="button" aria-label={`Más acciones para ${alert.product}`} className="grid size-8 place-items-center rounded-lg text-lg leading-none text-sena-text-soft hover:bg-sena-soft hover:text-sena-dark">
                        ⋯
                      </button>
                    </td>
                  </TableRow>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-sena-text-soft">
                      No hay alertas que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sena-hairline px-5 py-3.5 text-xs text-sena-strong sm:px-6">
            <p>Mostrando {visibleCount} de {filteredAlerts.length} alertas</p>
            <nav aria-label="Paginación de alertas" className="flex items-center gap-1.5">
              <button type="button" className={pageButtonClass} aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  aria-current={page === pageNumber ? 'page' : undefined}
                  onClick={() => setPage(pageNumber)}
                  className={`grid size-9 place-items-center rounded-xl text-sm font-semibold ${page === pageNumber ? 'bg-sena text-white shadow-brand-sm' : 'text-sena-strong hover:bg-sena-soft'}`}
                >
                  {pageNumber}
                </button>
              ))}
              <button type="button" className={pageButtonClass} aria-label="Página siguiente" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
                ›
              </button>
            </nav>
          </div>
        </TableCard>

        <aside className="flex flex-col gap-4">
          <section className="rounded-[22px] border border-glass-line bg-glass/85 p-4 shadow-surface backdrop-blur-glass sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-sena-dark">
              <span className="grid size-7 place-items-center rounded-lg bg-sena-soft text-sena"><AlertIcon className="size-4" /></span>
              Resumen de alertas
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <SummaryTile label="Vencimientos" count="4" symbol="!" tone="red" />
              <SummaryTile label="Stock bajo" count="6" symbol="!" tone="amber" />
              <SummaryTile label="Movimientos" count="2" symbol="↗" tone="green" />
              <SummaryTile label="Críticas" count="0" symbol="i" tone="slate" />
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
                  <option>Todos</option>
                  <option>Stock bajo</option>
                  <option>Vencimiento</option>
                  <option>Movimiento</option>
                </select>
              </FilterField>
              <FilterField label="Estado" htmlFor="alert-status">
                <select id="alert-status" value={draftFilters.status} onChange={(event) => updateDraft('status', event.target.value as AlertFilters['status'])} className={filterControlClass}>
                  <option>Todos</option>
                  <option>Crítica</option>
                  <option>Advertencia</option>
                  <option>Info</option>
                </select>
              </FilterField>
              <FilterField label="Producto" htmlFor="alert-product">
                <input id="alert-product" value={draftFilters.product} onChange={(event) => updateDraft('product', event.target.value)} placeholder="Buscar producto..." className={filterControlClass} />
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

const filterControlClass = 'h-10 w-full min-w-0 rounded-xl border border-sena-line bg-white/75 px-3 text-xs text-sena-text outline-none transition focus:border-sena focus:ring-2 focus:ring-sena/15'

function FilterField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold text-sena-text">{label}</label>
      {children}
    </div>
  )
}

function AlertTypeMark({ type }: { type: AlertType }) {
  const className = type === 'Vencimiento'
    ? 'bg-red-100 text-red-600'
    : type === 'Stock bajo'
      ? 'bg-amber-100 text-amber-600'
      : 'bg-emerald-100 text-emerald-700'

  return (
    <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${className}`}>
      {type === 'Movimiento' ? '↗' : '!'}
    </span>
  )
}

function AlertStatusPill({ status }: { status: AlertStatus }) {
  const className = status === 'Crítica'
    ? 'bg-red-100 text-red-700'
    : status === 'Advertencia'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700'

  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${className}`}>{status}</span>
}

function SummaryTile({ label, count, symbol, tone }: { label: string; count: string; symbol: string; tone: 'red' | 'amber' | 'green' | 'slate' }) {
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

function formatAlertDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}