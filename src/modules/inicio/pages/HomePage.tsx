import { useEffect, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { NavIcon } from '@/shared/components/icons/AppIcons'
import { useAuth } from '@/modules/auth/context/auth'
import { grantedModuleLinks, toNavIcon } from '@/shared/lib/access'

/* Iconos locales con la misma familia gráfica del proyecto (trazo 1.8, 24px).
 * No se tocan los iconos compartidos del menú ni de la barra superior. */
type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

function UsersIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.2c1.2-3.2 3.1-4.7 5.5-4.7s4.3 1.5 5.5 4.7" />
      <circle cx="16.8" cy="9" r="2.5" />
      <path d="M16.4 14.7c2 .3 3.5 1.6 4.3 4" />
    </BaseIcon>
  )
}

function GridIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.8" />
    </BaseIcon>
  )
}

function HelpIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4A2.5 2.5 0 0 1 12 7.8c1.4 0 2.5 1 2.5 2.2 0 1.7-2.3 2-2.3 3.5" />
      <path d="M12 16.8h.01" />
    </BaseIcon>
  )
}

function ArrowIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
    </BaseIcon>
  )
}

const INVENTORY_DESCRIPTION = 'Consulta y gestiona los recursos asignados a tu centro.'

export default function HomePage() {
  const { user, modules, isAdmin } = useAuth()
  const cards = grantedModuleLinks(modules, isAdmin, user?.permissions)

  useEffect(() => {
    document.title = 'Inicio | SENA'
  }, [])

  return (
    <AppLayout title="Inicio">
      {/* Banner principal de bienvenida */}
      <section className="overflow-hidden rounded-[28px] bg-linear-to-br from-white via-sena-soft to-sena-veil shadow-card ring-1 ring-sena-line">
        <div className="grid items-stretch gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="px-7 py-9 sm:px-10 lg:py-12">
            <p className="text-xs font-bold tracking-[0.24em] text-sena-dark/70 uppercase">
              Plataforma SENA
            </p>

            <h1 className="mt-3 text-3xl leading-tight font-bold tracking-tight text-sena-dark sm:text-4xl">
              Bienvenido a tu plataforma
            </h1>

            <p className="mt-3 text-[0.9375rem] leading-6 text-sena-text/70">
              Accede a los módulos disponibles de tu centro de formación.
            </p>

            <div className="mt-7 flex items-center gap-3 border-t border-sena/15 pt-5">
              <UsersIcon className="size-7 shrink-0 text-sena-dark" />
              <p className="text-sm font-medium leading-6 text-sena-dark/85">
                Todo lo que necesitas para gestionar tus recursos, en un solo lugar.
              </p>
            </div>
          </div>

          <div className="relative min-h-52 overflow-hidden lg:min-h-full">
            <img
              src="/img/noticia-tecnologia.jpg"
              alt="Aprendices del SENA utilizando un portátil en un ambiente de formación"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-sena/25 mix-blend-multiply"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-r from-sena-soft via-transparent to-transparent"
            />
          </div>
        </div>
      </section>

      {/* Sección de módulos */}
      <section className="mt-9">
        <div className="flex items-center gap-3">
          <GridIcon className="size-7 shrink-0 text-sena-dark" />
          <h2 className="text-xl font-bold tracking-tight text-sena-dark sm:text-2xl">
            Módulos disponibles
          </h2>
        </div>
        <p className="mt-1.5 pl-10 text-sm text-sena-text/60">
          Selecciona un módulo para comenzar.
        </p>

        {cards.length ? (
          <div className="mt-5 flex flex-col gap-4">
            {cards.map((card) => (
              <article
                key={card.to}
                className="flex flex-col gap-6 rounded-[22px] bg-white/90 px-6 py-6 shadow-card ring-1 ring-sena-line backdrop-blur-glass-sm sm:px-8 lg:flex-row lg:items-center"
              >
                <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-sena-soft text-sena-dark">
                  <NavIcon name={toNavIcon(card.icon)} className="size-10" />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full bg-sena-soft px-3 py-1 text-[0.6875rem] font-bold tracking-[0.08em] text-sena-dark uppercase">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-sena" />
                    Módulo disponible
                  </span>

                  <h3 className="mt-2.5 text-xl font-bold tracking-tight text-sena-dark">
                    {card.label}
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-sena-text/65">
                    {card.to === '/inventario'
                      ? INVENTORY_DESCRIPTION
                      : (card.description || 'Ingresa a este módulo con los permisos de tu perfil.')}
                  </p>
                </div>

                <Link
                  to={card.to as string}
                  className="inline-flex w-fit shrink-0 items-center gap-2.5 rounded-full bg-sena px-7 py-3.5 text-sm font-semibold text-white shadow-brand transition duration-150 hover:bg-sena-bright"
                  aria-label={`Abrir módulo ${card.label}`}
                >
                  Abrir módulo
                  <ArrowIcon className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-[22px] bg-white/90 px-6 py-6 text-sm text-sena-text/60 shadow-card ring-1 ring-sena-line">
            Tu perfil todavía no tiene módulos asignados. Pídele a un administrador que te asigne uno.
          </p>
        )}
      </section>

      {/* Banda inferior de ayuda (informativa: no existe sección de ayuda real) */}
      <div className="mt-6 flex items-center gap-4 rounded-[20px] border border-sena-line/70 bg-[#e9f7ef]/80 px-5 py-4 sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-sena-dark/70 text-sena-dark">
          <HelpIcon className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-sena-dark">¿Necesitas ayuda?</p>
          <p className="mt-0.5 truncate text-[0.8125rem] text-sena-text/60 sm:whitespace-normal">
            Selecciona el módulo disponible para acceder a sus herramientas.
          </p>
        </div>

        <span aria-hidden="true" className="shrink-0 text-sena-dark/70">
          <ArrowIcon className="size-5" />
        </span>
      </div>
    </AppLayout>
  )
}
