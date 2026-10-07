import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useEffect, useState } from 'react'
import SenaMark from '@/shared/components/icons/SenaMark'
import { useAuth } from '@/modules/auth/context/auth'
import type { NavIconName } from '@/shared/constants/navigation'
import { visibleInventoryScreens } from '@/modules/inventario/navigation'
import { grantedModuleLinks, toNavIcon } from '@/shared/lib/access'
import { cn } from '@/shared/lib/cn'
import { CloseIcon, LogoutIcon, NavIcon } from '@/shared/components/icons/AppIcons'

type SidebarProps = {
  isOpen: boolean
  isDesktopOpen: boolean
  onClose: () => void
}

const itemClass =
  'flex w-full items-center rounded-[15px] text-left font-medium transition duration-150'

const activeClass =
  'bg-gradient-to-r from-[#009d4d] via-[#00a651] to-[#19bf57] text-white shadow-[0_10px_26px_rgba(0,166,81,0.42)] ring-1 ring-white/20'

const nestedActiveClass =
  'bg-gradient-to-r from-[#0aa74c] via-[#12ba54] to-[#28c764] text-white shadow-[0_6px_18px_rgba(0,0,0,0.20)] ring-1 ring-white/[0.14]'

const idleClass = 'text-white/85 hover:bg-white/10 hover:text-white'

export default function Sidebar({ isOpen, isDesktopOpen, onClose }: SidebarProps) {
  const { logout, modules, isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const granted = grantedModuleLinks(modules, isAdmin, user?.permissions)
  const inventoryScreens = visibleInventoryScreens({
    isAdmin,
    permissions: user?.permissions,
  })

  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith('/inventario'),
  )

  useEffect(() => {
    if (location.pathname.startsWith('/inventario')) {
      setInventoryOpen(true)
    }
  }, [location.pathname])

  return (
    <aside
      id="navegacion-principal"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-62.5 flex-col overflow-y-auto overflow-x-clip',
        'bg-linear-to-b from-sena-dark to-sena-forest',
        'shadow-[0_0_70px_rgba(0,77,50,0.28)]',
        'transition-transform duration-200 ease-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        isDesktopOpen ? 'md:translate-x-0' : 'md:-translate-x-full',
      )}
      aria-label="Módulos del sistema"
    >
      {/* Luz difusa en la parte alta del sidelateral */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(120%_70%_at_0%_0%,rgba(255,255,255,0.14),rgba(255,255,255,0)_62%)]"
      />

      <div className="relative flex items-center justify-between px-7 pt-4 pb-4">
        <Link
          to="/inicio"
          className="inline-flex items-center gap-3.5 text-white"
          aria-label="SENA, inicio"
          onClick={onClose}
        >
          <SenaMark className="h-14 w-14" />

          <span className="text-[1.625rem] font-bold tracking-tight">
            SENA
          </span>
        </Link>

        <button
          type="button"
          className="rounded-lg p-1 text-white/80 transition hover:bg-white/10 md:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <nav className="relative flex flex-none flex-col gap-1 px-4 pt-2">
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
                  'gap-3 px-3.5 py-2 text-base',
                  location.pathname.startsWith('/inventario')
                    ? activeClass
                    : idleClass,
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
                    'text-xs text-current/70 transition-transform duration-150',
                    inventoryOpen && 'rotate-180',
                  )}
                >
                  ⌄
                </span>
              </button>

              {inventoryOpen ? (
                <div
                  id="menu-inventario"
                  className="mt-1.5 mb-3 ml-[0.85rem] flex flex-col gap-1"
                >
                  {inventoryScreens.map((screen) => (
                    <SideLink
                      key={screen.to}
                      to={screen.to}
                      icon="inventory"
                      nested
                      end={false}
                      onClose={onClose}
                    >
                      {screen.label}
                    </SideLink>
                  ))}
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
              end={false}
              onClose={onClose}
            >
              Perfiles
            </SideLink>
          </>
        ) : null}
      </nav>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 overflow-hidden"
      >
        <svg
          viewBox="0 0 266 224"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          fill="none"
        >
          <g stroke="#16b955" strokeWidth="1" opacity="0.32">
            <path d="M-14 188C32 155 70 137 111 148c38 10 78 31 169-61" />
            <path d="M-14 194C34 162 73 144 114 155c38 10 78 31 166-58" />
            <path d="M-14 200C36 169 76 151 117 162c38 10 78 30 163-55" />
            <path d="M-14 206C38 176 79 158 120 169c38 10 78 29 160-52" />
            <path d="M-14 212C40 183 82 165 123 176c38 10 78 28 157-49" />
            <path d="M-14 218C42 190 85 172 126 183c38 10 78 27 154-46" />
            <path d="M-14 224C44 197 88 179 129 190c38 10 78 26 151-43" />
            <path d="M-14 230C46 204 91 186 132 197c38 10 78 25 148-40" />
            <path d="M-14 236C48 211 94 193 135 204c38 10 78 24 145-37" />
            <path d="M-14 242C50 218 97 200 138 211c38 10 78 23 142-34" />
            <path d="M-14 248C52 225 100 207 141 218c38 10 78 22 139-31" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 mt-auto flex justify-center px-4 pb-6">
        <button
          type="button"
          className={cn(itemClass, idleClass, 'justify-center gap-3 px-3.5 py-2 text-base')}
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
          nested
            ? 'gap-2 rounded-xl px-2 py-1 pl-3 pr-1 text-sm'
            : 'gap-3 px-3.5 py-2 text-base',
          isActive ? nestedActiveClass : idleClass,
        )
      }
    >
      <NavIcon
        name={icon}
        className={
          nested
            ? 'size-4 shrink-0 opacity-90'
            : 'size-[1.15rem] shrink-0'
        }
      />

      {children}
    </NavLink>
  )
}
