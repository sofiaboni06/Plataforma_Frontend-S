import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useState } from 'react'
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
  const location = useLocation()
  const granted = grantedModuleLinks(modules)

  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith('/inventario/categorias'),
  )

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

          <span className="text-lg font-semibold tracking-tight">
            SENA
          </span>
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
        <SideLink
          to="/inicio"
          icon="home"
          onClose={onClose}
        >
          Inicio
        </SideLink>

        {granted.map((item) => {
          if (item.to !== '/inventario') {
            return (
              <SideLink
                key={item.to}
                to={item.to as string}
                icon={toNavIcon(item.icon)}
                onClose={onClose}
              >
                {item.label}
              </SideLink>
            )
          }

          return (
            <div key={item.to}>
              <button
                type="button"
                onClick={() => {
                  setInventoryOpen((value) => !value)
                  navigate('/inventario')
                }}
                className={cn(
                  itemClass,
                  location.pathname.startsWith('/inventario')
                    ? 'bg-white/15 text-white'
                    : 'text-white/85 hover:bg-white/10 hover:text-white',
                )}
                aria-expanded={inventoryOpen}
                aria-controls="menu-inventario"
              >
                <NavIcon
                  name={toNavIcon(item.icon)}
                  className="size-[1.15rem] shrink-0"
                />

                <span className="flex-1">
                  {item.label}
                </span>

                <span
                  className={cn(
                    'text-xs transition-transform duration-150',
                    inventoryOpen && 'rotate-180',
                  )}
                >
                  ⌄
                </span>
              </button>

              {inventoryOpen ? (
                <div
                  id="menu-inventario"
                  className="ml-5 border-l border-white/10 pl-2"
                >
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                    Categorías
                  </p>

                  <SideLink
                    to="/inventario/categorias/crear"
                    icon="inventory"
                    nested
                    onClose={onClose}
                  >
                    Crear categoría
                  </SideLink>

                  <SideLink
                    to="/inventario/categorias"
                    icon="inventory"
                    nested
                    onClose={onClose}
                  >
                    Gestionar categorías
                  </SideLink>
                </div>
              ) : null}
            </div>
          )
        })}

        <SideLink
          to="/perfil"
          icon="user"
          onClose={onClose}
        >
          Mi perfil
        </SideLink>

        {isAdmin ? (
          <>
            <SideLink
              to="/usuarios"
              icon="settings"
              onClose={onClose}
            >
              Usuarios
            </SideLink>

            <SideLink
              to="/perfiles"
              icon="user"
              onClose={onClose}
            >
              Perfiles
            </SideLink>
          </>
        ) : null}
      </nav>

      <div className="px-3 pb-5">
        <button
          type="button"
          className={cn(
            itemClass,
            'text-white/80 hover:bg-white/10 hover:text-white',
          )}
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
  end = true,
  nested = false,
}: {
  to: string
  icon: NavIconName
  onClose: () => void
  children: string
  end?: boolean
  nested?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          itemClass,
          nested && 'pl-3 text-xs',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-white/85 hover:bg-white/10 hover:text-white',
        )
      }
    >
      <NavIcon
        name={icon}
        className={
          nested
            ? 'size-4 shrink-0'
            : 'size-[1.15rem] shrink-0'
        }
      />

      {children}
    </NavLink>
  )
}
