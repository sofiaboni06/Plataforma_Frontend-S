import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon } from '../icons/AppIcons'

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
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'ok' && 'bg-sena/12 text-sena',
        tone === 'warn' && 'bg-amber-100 text-amber-800',
        tone === 'danger' && 'bg-red-100 text-red-700',
      )}
    >
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
    <div className="rounded-2xl bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-sena-text">{title}</h1>
      <p className="mt-1 text-sm text-sena-text/60">{subtitle}</p>

      <div className="mt-6 flex gap-5 overflow-x-auto border-b border-sena-dark/10 text-sm font-medium">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={
              tab === activeTab
                ? 'shrink-0 border-b-2 border-sena pb-3 text-sena'
                : 'shrink-0 pb-3 text-sena-text/50 hover:text-sena-text'
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex h-11 w-full max-w-md items-center gap-2 rounded-xl bg-sena-muted px-3">
          <SearchIcon className="size-4 text-sena-text/40" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-sena-text/40"
          />
        </label>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sena px-4 text-sm font-semibold text-white"
        >
          <PlusIcon className="size-4" />
          {addLabel}
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-sena-dark/10 text-sena-text/55">
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-3 font-medium">
                  {column.label}
                </th>
              ))}
              <th className="px-3 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-sena-dark/8 last:border-b-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-3 text-sena-text">
                    {column.render(row)}
                  </td>
                ))}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2 text-sena">
                    <button type="button" className="rounded-md p-1 hover:bg-sena-muted" aria-label="Ver">
                      <SearchIcon className="size-4" />
                    </button>
                    <button type="button" className="rounded-md p-1 hover:bg-sena-muted" aria-label="Editar">
                      <PencilIcon className="size-4" />
                    </button>
                    <button type="button" className="rounded-md p-1 text-red-500 hover:bg-red-50" aria-label="Eliminar">
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-sena-text/50">{footer}</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((page) => (
            <span
              key={page}
              className={cn(
                'grid size-8 place-items-center rounded-lg text-sm',
                page === 1 ? 'bg-sena text-white' : 'text-sena-text/60',
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
