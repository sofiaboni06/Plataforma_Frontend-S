import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import {
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from '@/shared/components/icons/AppIcons'

export function StatusPill({
  children,
  tone,
}: {
  children: string
  tone: 'ok' | 'warn' | 'danger'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-semibold',
        tone === 'ok' && 'border-sena-ok-line/70 bg-sena-active-soft text-sena-ok-text',
        tone === 'warn' && 'border-sena-warn-line bg-sena-warn-soft text-sena-warn-text',
        tone === 'danger' && 'border-sena-line bg-sena-off-soft text-sena-text-soft',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-[7px] rounded-full',
          tone === 'ok' && 'bg-sena-ok-text',
          tone === 'warn' && 'bg-sena-warn-text',
          tone === 'danger' && 'bg-sena-text-soft',
        )}
      />

      {children}
    </span>
  )
}

type Column<T> = {
  key: string
  label: string
  render: (row: T) => ReactNode
}

type ResourceBoardProps<T> = {
  title: string
  subtitle: string
  icon: ReactNode
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  addLabel: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  footer: string
}

export default function ResourceBoard<T>({
  title,
  subtitle,
  icon,
  tabs,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  searchPlaceholder,
  addLabel,
  columns,
  rows,
  rowKey,
  footer,
}: ResourceBoardProps<T>) {
  return (
    <div className="rounded-[26px] border border-glass-line bg-glass p-7 shadow-surface backdrop-blur-glass sm:p-8">
      {/* Mismo bloque de encabezado que las vistas de gestión de inventario. */}
      <div className="flex items-center gap-6">
        <span
          aria-hidden="true"
          className="grid size-20 shrink-0 place-items-center rounded-full bg-sena text-white shadow-[0_10px_26px_rgba(0,166,81,0.30)] [&>svg]:size-10"
        >
          {icon}
        </span>

        <div className="min-w-0">
          <h1 className="text-[2.125rem] leading-[1.12] font-bold tracking-[-0.02em] text-sena-text">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-[0.9375rem] leading-6 text-sena-text-soft">{subtitle}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              'shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-150',
              tab === activeTab
                ? 'bg-sena text-white shadow-brand-sm'
                : 'border border-sena-line bg-glass-strong text-sena-strong backdrop-blur-glass-sm hover:bg-white/90 hover:text-sena-dark',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex h-[52px] w-full max-w-md items-center gap-3 rounded-2xl border border-sena-line bg-glass-strong pr-5 pl-5 shadow-hairline backdrop-blur-glass-sm transition duration-150 focus-within:border-sena focus-within:bg-white/90 focus-within:shadow-[0_0_0_4px_rgba(0,166,81,0.12)]">
          <SearchIcon className="size-5 shrink-0 text-sena" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-full w-full bg-transparent text-[0.9375rem] text-sena-text outline-none placeholder:text-sena-text-soft/90"
          />
        </label>
        <button
          type="button"
          className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-sena px-7 text-[0.9375rem] font-semibold text-white shadow-brand transition duration-200 hover:-translate-y-0.5 hover:bg-sena-bright"
        >
          <PlusIcon className="size-4" />
          {addLabel}
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[26px] border border-glass-line bg-glass-strong shadow-surface backdrop-blur-glass">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-sena-hairline bg-sena-soft/85 px-6 py-6 text-[0.6875rem] font-bold tracking-[0.13em] text-sena-dark uppercase"
                >
                  {column.label}
                </th>
              ))}
              <th className="border-b border-sena-hairline bg-sena-soft/85 px-6 py-6 text-[0.6875rem] font-bold tracking-[0.13em] text-sena-dark uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-sena-hairline/90 bg-white/55 transition-colors duration-150 last:border-b-0 hover:bg-sena-veil"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-5 text-sena-text">
                    {column.render(row)}
                  </td>
                ))}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-[14px] border border-transparent bg-sena-veil text-sena-dark/85 transition duration-150 hover:bg-white hover:text-sena-dark hover:shadow-hairline"
                      aria-label="Ver"
                    >
                      <SearchIcon className="size-5" />
                    </button>
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-[14px] border border-transparent bg-sena-veil text-sena-dark/85 transition duration-150 hover:bg-white hover:text-sena-dark hover:shadow-hairline"
                      aria-label="Editar"
                    >
                      <PencilIcon className="size-5" />
                    </button>
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-[14px] border border-transparent bg-sena-veil text-sena-dark/85 transition duration-150 hover:bg-white hover:text-sena-dark hover:shadow-hairline hover:bg-sena-danger-soft/85 hover:text-sena-danger-text"
                      aria-label="Eliminar"
                    >
                      <TrashIcon className="size-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-sena-text-soft">{footer}</p>
        <div className="flex items-center gap-2.5">
          {[1, 2, 3, 4].map((page) => (
            <span
              key={page}
              className={cn(
                'grid size-11 place-items-center rounded-[14px] text-sm font-semibold shadow-hairline',
                page === 1
                  ? 'bg-sena text-white shadow-brand'
                  : 'border border-sena-line bg-glass-strong text-sena-strong backdrop-blur-glass-sm',
              )}
            >
              {page}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
