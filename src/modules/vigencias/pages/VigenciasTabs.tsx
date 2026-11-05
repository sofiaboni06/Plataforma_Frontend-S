import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

export default function VigenciasTabs({
  puedeVerAnios,
  puedeVerEspecial,
}: {
  puedeVerAnios: boolean
  puedeVerEspecial: boolean
}) {
  if (!puedeVerAnios || !puedeVerEspecial) return null

  return (
    <nav
      aria-label="Tipo de vigencia"
      className="mb-4 flex w-full gap-1.5 rounded-2xl border border-sena-line bg-white/55 p-1.5 sm:w-fit"
    >
      <TabLink to="/vigencias" end>
        Años fiscales
      </TabLink>
      <TabLink to="/vigencias/especial">
        Vigencia especial
      </TabLink>
    </nav>
  )
}

function TabLink({
  to,
  end,
  children,
}: {
  to: string
  end?: boolean
  children: string
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'inline-flex h-11 flex-1 items-center justify-center rounded-xl px-5 text-sm font-semibold whitespace-nowrap transition-[background-color,color,transform,box-shadow] duration-150 ease-out sm:flex-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena',
          'active:scale-[0.97]',
          isActive
            ? 'bg-sena text-white shadow-brand'
            : 'text-sena-dark hover:bg-sena-veil',
        )
      }
    >
      {children}
    </NavLink>
  )
}
