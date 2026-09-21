import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { grantedModuleLinks, toNavIcon } from '../../lib/access'
import { cn } from '../../lib/cn'
import { CloseIcon, LogoutIcon, NavIcon } from '../icons/AppIcons'
import SenaMark from '../icons/SenaMark'
import type { NavIconName } from '../../constants/navigation'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const itemClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition duration-150'

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout, modules, isAdmin } = useAuth()
  const navigate = useNavigate()
  const granted = grantedModuleLinks(modules)

  return (
    <aside
      id="navegacion-principal"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto bg-sena-dark text-white',
        'transition-transform duration-200 ease-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
      aria-label="Módulos del sistema"
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <Link
          to="/inicio"
          className="inline-flex items-center gap-2 text-white"
          aria-label="SENA, inicio"
          onClick={onClose}
        >
          <SenaMark className="h-10 w-10" />
          <span className="text-lg font-semibold tracking-tight">SENA</span>
        </Link>
        <button
          type="button"
          className="rounded-md p-1 text-white/80 hover:bg-white/10 md:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        <SideLink to="/inicio" icon="home" onClose={onClose}>
          Inicio
        </SideLink>
        {granted.map((item) => (
          <SideLink key={item.to} to={item.to as string} icon={toNavIcon(item.icon)} onClose={onClose}>
            {item.label}
          </SideLink>
        ))}
        <SideLink to="/perfil" icon="user" onClose={onClose}>
          Mi perfil
        </SideLink>
        {isAdmin ? (
          <>
            <SideLink to="/usuarios" icon="settings" onClose={onClose}>
              Usuarios
            </SideLink>
            <SideLink to="/perfiles" icon="user" onClose={onClose}>
              Perfiles
            </SideLink>
          </>
        ) : null}
      </nav>

      <div className="px-3 pb-5">
        <button
          type="button"
          className={cn(itemClass, 'text-white/80 hover:bg-white/10 hover:text-white')}
          onClick={() => {
            void logout().then(() => {
              onClose()
              navigate('/login')
            })
          }}
        >
          <LogoutIcon className="size-[1.15rem] shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function SideLink({
  to,
  icon,
  onClose,
  children,
}: {
  to: string
  icon: NavIconName
  onClose: () => void
  children: string
}) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          itemClass,
          isActive ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white',
        )
      }
    >
      <NavIcon name={icon} className="size-[1.15rem] shrink-0" />
      {children}
    </NavLink>
  )
}
