import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { NavIcon } from '@/shared/components/icons/AppIcons'
import SenaMark from '@/shared/components/icons/SenaMark'
import { useAuth } from '@/modules/auth/context/auth'
import { grantedModuleLinks, toNavIcon } from '@/shared/lib/access'

export default function HomePage() {
  const { user, modules, isAdmin } = useAuth()
  const firstName = user?.fullName.split(' ')[0] ?? 'usuario'
  const cards = grantedModuleLinks(modules, isAdmin, user?.permissions)
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sena-soft via-sena-veil to-white shadow-card ring-1 ring-sena-line">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-sena/10 blur-2xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/3 size-56 rounded-full bg-sena/8 blur-3xl"
        />

        <div className="relative grid items-center gap-8 px-6 py-9 sm:px-9 lg:grid-cols-[1.4fr_1fr] lg:px-11 lg:py-11">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sena-dark/70">
              Bienvenido
            </p>

            <h1 className="mt-3 text-3xl leading-tight font-bold tracking-tight text-sena-dark sm:text-4xl">
              ¡Bienvenido, {firstName}!
            </h1>

            <p className="mt-3 text-sm text-sena-text/60">{user?.location}</p>

            <div className="mt-7 flex items-center gap-3 border-t border-sena/15 pt-5">
              <SenaMark className="h-9 w-9 shrink-0 text-sena-dark" />
              <p className="text-sm font-semibold leading-5 text-sena-dark/85">
                La formación también construye un mejor país
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl shadow-brand ring-1 ring-sena-dark/10">
            <img
              src="/img/programa-tecnologia.jpg"
              alt=""
              className="h-40 w-full object-cover sm:h-48 lg:h-56"
            />
          </div>
        </div>
      </section>

      {cards.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.to}
              className="group flex flex-col rounded-2xl bg-white p-6 shadow-card ring-1 ring-sena-line transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-sena to-[#00c45c] text-white shadow-brand">
                <NavIcon name={toNavIcon(card.icon)} className="size-7" />
              </span>

              <h2 className="mt-5 text-base font-bold text-sena-dark">{card.label}</h2>

              <p className="mt-2 flex-1 text-sm leading-6 text-sena-text/60">
                {card.description || 'Ingresa a este módulo con los permisos de tu perfil.'}
              </p>

              <Link
                to={card.to as string}
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-sena-soft py-2 pr-2 pl-4 text-sm font-semibold text-sena-dark transition duration-150 group-hover:bg-sena group-hover:text-white"
              >
                Ingresar
                <span
                  aria-hidden="true"
                  className="grid size-7 place-items-center rounded-full bg-white/70 text-sena-dark transition duration-150 group-hover:bg-white/20 group-hover:text-white"
                >
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl bg-white px-5 py-6 text-sm text-sena-text/60 shadow-card ring-1 ring-sena-line">
          Tu perfil todavía no tiene módulos asignados. Pídele a un administrador que te asigne uno.
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight text-sena-dark">Accesos rápidos</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="group flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-card ring-1 ring-sena-line transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sena-soft text-sena transition duration-150 group-hover:bg-sena group-hover:text-white">
                <NavIcon name={item.icon} className="size-5" />
              </span>

              <span className="flex-1 text-sm font-semibold text-sena-text">{item.label}</span>

              <span
                aria-hidden="true"
                className="text-sena/50 transition duration-150 group-hover:translate-x-0.5 group-hover:text-sena"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AppLayout>
  )
}
