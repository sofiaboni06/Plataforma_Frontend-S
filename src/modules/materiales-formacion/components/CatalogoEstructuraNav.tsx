import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import type { FormacionScreenCode } from '@/modules/materiales-formacion/navigation'

const ITEMS: Array<{ code: FormacionScreenCode; to: string; label: string }> = [
  { code: 'redes', to: '/formacion/redes', label: 'Redes' },
  { code: 'lineas', to: '/formacion/lineas', label: 'Líneas de red' },
  { code: 'niveles', to: '/formacion/niveles', label: 'Niveles' },
]

const chip =
  'inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena'

export default function CatalogoEstructuraNav() {
  const { can } = useFormacionAccess()
  const { pathname } = useLocation()
  const items = ITEMS.filter((item) => can(item.code, 'list'))

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Link
        to="/formacion"
        className={cn(
          chip,
          'gap-2 border border-sena-line bg-white text-sena-dark shadow-hairline hover:border-sena/45 hover:text-sena',
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-4 shrink-0" aria-hidden="true">
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver
      </Link>

      {items.length > 1 ? (
        <nav
          aria-label="Otras vistas de esta estructura"
          className="flex flex-wrap items-center gap-2"
        >
          {items.map((item) => {
            const active = pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  chip,
                  active
                    ? 'bg-sena text-white shadow-brand-sm'
                    : 'border border-sena-line bg-white text-sena-dark shadow-hairline hover:border-sena/45 hover:text-sena',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      ) : null}
    </div>
  )
}
