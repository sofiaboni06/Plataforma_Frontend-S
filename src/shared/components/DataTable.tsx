import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { SearchIcon } from '@/shared/components/icons/AppIcons'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-sena-dark">
          {title.toUpperCase()}
        </h1>

        <p className="mt-1 text-sm text-sena-text/60">{description}</p>
      </div>

      {action}
    </div>
  )
}

export function ErrorBanner({
  message,
  onClose,
}: {
  message: string
  onClose?: () => void
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{message}</span>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="font-semibold text-red-700 hover:text-red-900"
        >
          Cerrar
        </button>
      ) : null}
    </div>
  )
}

export function FilterCard({ children }: { children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sena-dark/8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">{children}</div>
    </section>
  )
}

export function FilterGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-sena-text/60">{label}</label>

      {children}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-sena-text/40" />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-sena-dark/10 bg-white pl-10 pr-3 text-sm text-sena-text outline-none placeholder:text-sena-text/40 focus:border-sena focus:ring-2 focus:ring-sena/20"
      />
    </div>
  )
}

export function ClearFiltersButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-sena-dark/10 bg-white px-4 text-sm font-medium text-sena-text/70 hover:bg-sena-muted disabled:cursor-not-allowed disabled:opacity-45"
    >
      Limpiar filtros
    </button>
  )
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/8">
      {children}
    </section>
  )
}

export function TableLoading({ label }: { label: string }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-sena-text/55">{label}</div>
  )
}

export function TableHeader({
  children,
  align = 'left',
  width,
}: {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
}) {
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-sena-dark',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        align === 'left' && 'text-left',
        width,
      )}
    >
      {children}
    </th>
  )
}

/**
 * Anchos compartidos por todas las tablas del listado. Con `table-fixed` hacen
 * que Estado y Acciones caigan en el mismo punto en cada pantalla, sin importar
 * qué muestren las columnas de datos.
 */
export const tableColumns = {
  name: 'w-[28%]',
  relation: 'w-[26%]',
  count: 'w-[15%]',
  status: 'w-[15%]',
  actions: 'w-[16%]',
} as const

export const tableClass = 'w-full min-w-[900px] table-fixed text-sm'

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-sena-dark/6 last:border-b-0 hover:bg-sena-muted/40">
      {children}
    </tr>
  )
}

export function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number
  children: ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-sena-text/45">
        {children}
      </td>
    </tr>
  )
}

export function ActionButton({
  children,
  title,
  onClick,
  danger = false,
  disabled = false,
}: {
  children: ReactNode
  title: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md p-1 transition-colors',
        danger ? 'text-sena-text/40 hover:text-red-600' : 'text-sena-text/40 hover:text-sena',
        disabled && 'cursor-not-allowed opacity-30',
      )}
    >
      {children}
    </button>
  )
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-center gap-3">{children}</div>
}

function PageButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center rounded-lg text-sena-text/45 hover:bg-sena-muted disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  from,
  to,
  total,
  noun,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  from: number
  to: number
  total: number
  noun: string
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-sena-dark/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-sena-text/55">
        Mostrando {from} - {to} de {total} {noun}
      </span>

      <div className="flex items-center gap-1">
        <PageButton disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          ‹
        </PageButton>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={cn(
              'grid size-8 place-items-center rounded-lg text-sm font-semibold',
              item === page ? 'bg-sena text-white' : 'text-sena-text/55 hover:bg-sena-muted',
            )}
          >
            {item}
          </button>
        ))}

        <PageButton disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          ›
        </PageButton>
      </div>
    </div>
  )
}
