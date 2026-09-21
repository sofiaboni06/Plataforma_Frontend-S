import { Link } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { NavIcon } from '../components/icons/AppIcons'
import SenaMark from '../components/icons/SenaMark'
import { useAuth } from '../lib/auth'
import { grantedModuleLinks, toNavIcon } from '../lib/access'

export default function HomePage() {
  const { user, modules, isAdmin } = useAuth()
  const firstName = user?.fullName.split(' ')[0] ?? 'usuario'
  const cards = grantedModuleLinks(modules)
  const quickLinks = [
    { label: 'Mi perfil', to: '/perfil', icon: 'user' as const },
    ...(isAdmin
      ? [
          { label: 'Usuarios', to: '/usuarios', icon: 'settings' as const },
          { label: 'Perfiles', to: '/perfiles', icon: 'user' as const },
        ]
      : []),
  ]

  return (
    <AppLayout title="Inicio">
      <p className="text-sm font-medium text-sena">Bienvenido</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-sena-text">
        ¡Bienvenido, {firstName}!
      </h1>
      <p className="mt-2 text-sm text-sena-text/60">{user?.location}</p>

      {cards.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article key={card.to} className="rounded-2xl bg-white p-5">
              <div className="grid size-12 place-items-center rounded-xl bg-sena/10 text-sena">
                <NavIcon name={toNavIcon(card.icon)} className="size-6" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-sena-text">{card.label}</h2>
              <p className="mt-1 text-sm leading-5 text-sena-text/60">
                {card.description || 'Ingresa a este módulo con los permisos de tu perfil.'}
              </p>
              <Link to={card.to as string} className="mt-4 inline-flex items-center text-sm font-semibold text-sena">
                Ingresar →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl bg-white px-5 py-6 text-sm text-sena-text/60">
          Tu perfil todavía no tiene módulos asignados. Pídele a un administrador que te asigne uno.
        </p>
      )}

      <h2 className="mt-10 text-lg font-semibold text-sena-text">Accesos rápidos</h2>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-5 text-center"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-sena/10 text-sena">
                <NavIcon name={item.icon} className="size-5" />
              </span>
              <span className="text-sm font-medium text-sena-text">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl bg-sena-dark text-white">
          <div className="grid h-full min-h-[180px] md:grid-cols-2">
            <img src="/img/programa-tecnologia.jpg" alt="" className="h-full min-h-[180px] w-full object-cover" />
            <div className="flex flex-col justify-center px-6 py-5">
              <SenaMark className="h-10 w-10 text-white" />
              <p className="mt-3 text-lg font-semibold leading-6">La formación también construye un mejor país</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
