import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { FilterBroomIcon, SearchIcon } from '@/shared/components/icons/AppIcons'

/**
 * Encabezado estándar de las vistas de gestión.
 *
 * Una sola tarjeta glassmorphism con la misma estructura en todas las pantallas:
 * círculo verde con el icono del recurso, título y descripción agrupados a la
 * izquierda, y la acción principal pegada al extremo derecho.
 * `icon` es solo presentación: cada vista reutiliza el icono que ya usa en el menú.
 */
export function PageHeader({
  title,
  description,
  context,
  action,
  icon,
}: {
  title: string
  description: string
  context?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <section className={cn(
      'mb-4 flex flex-col gap-6 rounded-[24px] border border-glass-line bg-glass/75 px-7 py-6 shadow-hairline backdrop-blur-glass-sm xl:min-h-[154px] xl:flex-row xl:items-center xl:justify-between xl:px-9 xl:py-7',
      context ? 'xl:gap-4' : 'xl:gap-9',
    )}>
      <div className="flex min-w-0 items-center gap-6">
        {icon ? (
          <span
            aria-hidden="true"
            className="grid size-[76px] shrink-0 place-items-center rounded-full bg-sena text-white shadow-[0_10px_26px_rgba(0,166,81,0.30)] [&>svg]:size-10"
          >
            {icon}
          </span>
        ) : null}

        <div className="min-w-0">
          <h1 className="text-[2.25rem] leading-[1.12] font-bold tracking-normal text-sena-text">
            {title}
          </h1>

          {description ? (
            <p className="mt-2.5 max-w-3xl text-base leading-6 text-sena-strong">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {context || action ? (
        <div className="flex shrink-0 flex-col items-start gap-3 xl:flex-row xl:items-start xl:gap-4">
          {context ? <div>{context}</div> : null}
          {action ? (
            <div
              className={cn(
                Boolean(context) && 'xl:mt-4',
                '[&_button]:h-[52px] [&_button]:rounded-2xl [&_button]:px-6 [&_button]:text-sm',
              )}
            >
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
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
    <div className="mb-5 flex items-center justify-between gap-4 rounded-[18px] bg-sena-danger-soft px-5 py-3.5 text-sm text-sena-danger-text ring-1 ring-sena-danger-line">
      <span>{message}</span>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full bg-white/70 px-4 py-1.5 font-semibold transition hover:bg-white"
        >
          Cerrar
        </button>
      ) : null}
    </div>
  )
}

export function FilterCard({ children }: { children: ReactNode }) {
  return (
    <section className="mb-4 rounded-[26px] border border-glass-line bg-glass px-6 py-2.5 shadow-surface backdrop-blur-glass sm:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">{children}</div>
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
    <div className="relative flex flex-col">
      <label className="absolute -top-[9px] left-3.5 z-10 bg-glass-strong px-1.5 text-[0.6875rem] font-bold tracking-[0.14em] text-sena-strong uppercase backdrop-blur-glass-sm">
        {label}
      </label>

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
      <SearchIcon className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-sena" />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[56px] w-full rounded-2xl border border-sena-line bg-glass-strong pr-5 pl-13 text-[0.9375rem] text-sena-text shadow-hairline backdrop-blur-glass-sm outline-none transition duration-150 placeholder:text-sena-text-soft/90 hover:border-sena-line hover:bg-white/90 focus:border-sena focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,166,81,0.12)]"
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
      className="inline-flex h-[56px] shrink-0 items-center justify-center gap-2.5 rounded-2xl border border-sena-line bg-glass-strong px-6 text-sm font-semibold text-sena-dark shadow-hairline backdrop-blur-glass-sm transition duration-150 hover:border-sena/45 hover:bg-white/90 hover:text-sena-dark disabled:cursor-not-allowed disabled:opacity-45"
    >
      <FilterBroomIcon className="size-[18px]" />
      Limpiar filtros
    </button>
  )
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-glass-line bg-glass-strong shadow-surface backdrop-blur-glass">
      {children}
    </section>
  )
}

export function TableLoading({ label }: { label: string }) {
  return (
    <div className="px-6 py-16 text-center text-sm text-sena-text-soft">{label}</div>
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
        'border-b border-sena-hairline bg-sena-soft/85 text-[0.6875rem] font-bold tracking-[0.13em] text-sena-dark uppercase',
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

export const tableClass = 'data-table w-full min-w-[900px] table-fixed text-sm'

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        'border-b border-sena-hairline/90 bg-white/55 transition-colors duration-150 last:border-b-0 hover:bg-sena-veil',
        className,
      )}
    >
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
      <td colSpan={colSpan} className="px-6 py-16 text-center text-sm text-sena-text-soft">
        {children}
      </td>
    </tr>
  )
}

/**
 * Acciones de fila: botones pequeños y limpios, sin recuadros verdes pesados.
 * Solo cambia el contenedor; el handler, el `title` y el icono los decide la vista.
 */
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
        'grid size-10 place-items-center rounded-lg border-0 bg-transparent text-sena-dark transition duration-150 hover:bg-transparent hover:text-sena hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena',
        danger && 'hover:text-sena-danger-text',
        disabled && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-sena-dark hover:shadow-none',
      )}
    >
      {children}
    </button>
  )
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-center gap-2">{children}</div>
}

/** Estilo compartido de los botones de la paginación. */
export const pageButtonClass =
  'grid size-11 place-items-center rounded-[14px] border border-sena-line bg-glass-strong text-sena-dark shadow-hairline backdrop-blur-glass-sm transition duration-150 hover:border-sena/45 hover:bg-white/90 hover:text-sena-dark disabled:cursor-not-allowed disabled:opacity-40'

/** Estilo compartido de la página activa. */
export const pageActiveClass =
  'grid size-11 place-items-center rounded-[14px] bg-sena text-sm font-semibold text-white shadow-brand transition duration-150'

/** Estilo compartido de la barra inferior de la tabla. */
export const paginationBarClass =
  'flex flex-col gap-3 border-t border-sena-hairline bg-white/45 px-7 py-5 sm:flex-row sm:items-center sm:justify-between'

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
      className={pageButtonClass}
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
    <div className={paginationBarClass}>
      <span className="text-sm text-sena-strong">
        Mostrando {from} - {to} de {total} {noun}
      </span>

      <div className="flex items-center gap-2.5">
        <PageButton disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          ‹
        </PageButton>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={item === page ? pageActiveClass : cn(pageButtonClass, 'text-sm font-semibold')}
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