import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import {
  ActionButton,
  FilterCard,
  PageHeader,
  RowActions,
  SearchInput,
  TableCard,
  TableHeader,
  TableRow,
  pageActiveClass,
  pageButtonClass,
  paginationBarClass,
} from '@/shared/components/DataTable'
import {
  EyeIcon,
  PencilIcon,
  PlusIcon,
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

/**
 * Tablero de recurso.
 *
 * No es un diseño aparte: es el mismo sistema de "Gestionar categorías"
 * (PageHeader + FilterCard + SearchInput + TableCard + TablePagination)
 * montado con las filas que le entrega cada módulo. Por eso Actividades,
 * Material de Formación y Gestión Ambiental se ven igual que el resto de
 * listados sin duplicar una sola clase de estilo.
 */
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
    <>
      <PageHeader
        icon={icon}
        title={title}
        description={subtitle}
        action={
          <button
            type="button"
            className="inline-flex h-[56px] items-center justify-center gap-2.5 rounded-2xl bg-sena px-8 text-[0.9375rem] font-semibold text-white shadow-brand transition duration-200 hover:-translate-y-0.5 hover:bg-sena-bright"
          >
            <PlusIcon className="size-4" />
            {addLabel}
          </button>
        }
      />

      <FilterCard>
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                'h-[56px] shrink-0 rounded-2xl px-5 text-sm font-semibold transition duration-150',
                tab === activeTab
                  ? 'bg-sena text-white shadow-brand'
                  : 'border border-sena-line bg-glass-strong text-sena-dark shadow-hairline backdrop-blur-glass-sm hover:bg-white/90 hover:text-sena-dark',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </FilterCard>

      <TableCard>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[900px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-sena-hairline bg-sena-soft/85">
                {columns.map((column) => (
                  <TableHeader key={column.key}>{column.label}</TableHeader>
                ))}
                <TableHeader align="center" width="w-[16%]">
                  Acciones
                </TableHeader>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(row)}</td>
                  ))}
                  <td>
                    <RowActions>
                      <ActionButton title="Ver" onClick={() => {}}>
                        <EyeIcon className="size-[18px]" />
                      </ActionButton>

                      <ActionButton title="Editar" onClick={() => {}}>
                        <PencilIcon className="size-[18px]" />
                      </ActionButton>

                      <ActionButton title="Eliminar" danger onClick={() => {}}>
                        <TrashIcon className="size-[18px]" />
                      </ActionButton>
                    </RowActions>
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>

        <div className={paginationBarClass}>
          <span className="text-sm text-sena-strong">{footer}</span>

          <div className="flex items-center gap-2.5">
            <span className={cn(pageButtonClass, 'text-sm font-semibold')}>‹</span>
            <span className={pageActiveClass}>1</span>
            <span className={cn(pageButtonClass, 'text-sm font-semibold')}>2</span>
            <span className={cn(pageButtonClass, 'text-sm font-semibold')}>3</span>
            <span className={cn(pageButtonClass, 'text-sm font-semibold')}>›</span>
          </div>
        </div>
      </TableCard>
    </>
  )
}
