import { useEffect, useState, type CSSProperties, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { NavIcon } from '@/shared/components/icons/AppIcons'
import { useAuth } from '@/modules/auth/context/auth'
import { grantedModuleLinks, toNavIcon } from '@/shared/lib/access'
import AssignedPrograms from '@/modules/materiales-formacion/components/AssignedPrograms'
import WelcomeOverlay from '@/modules/inicio/components/WelcomeOverlay'
import { useProfilePhoto } from '@/modules/perfil/hooks/useProfilePhoto' 

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
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
const DEFAULT_IMAGE = '/img/noticia-tecnologia.jpg'

export default function HomePage() {
  const { user, modules, isAdmin, loadPhoto } = useAuth()
  const cards = grantedModuleLinks(modules, isAdmin, user?.permissions)

  const [revealed, setRevealed] = useState(false)
  const revealClass = revealed ? ' wl-reveal' : ''
  const revealStyle = (ms: number) =>
    revealed ? ({ ['--wl-delay' as string]: `${ms}ms` } as CSSProperties) : undefined

  const photoSrc = useProfilePhoto(user?.avatarUrl ?? '', loadPhoto, 0)

  useEffect(() => {
    document.title = 'Inicio | SENA'
  }, [])

  const userName = user?.fullName || 'Aprendiz SENA'
  
  const [centerFromLocation, regional] = (user?.location ?? '').split(/\s+[—–]\s+/)
  const trainingCenter = user?.trainingCenter || centerFromLocation || 'Centro de Formación'
  const regionalName = regional || 'Regional'

  const profileImage = photoSrc || DEFAULT_IMAGE

  return (
    <AppLayout title="Inicio">
      <WelcomeOverlay onClosing={() => setRevealed(true)} />

      

<section
  className={`welcome-hero${revealClass}`}
  style={revealStyle(250)}
>
  {/* Fondo decorativo */}
  <div className="welcome-hero__decoration" aria-hidden="true">
    <span className="welcome-dot welcome-dot--one" />
    <span className="welcome-dot welcome-dot--two" />
    <span className="welcome-dot welcome-dot--three" />
    <span className="welcome-square welcome-square--one" />
    <span className="welcome-square welcome-square--two" />
    <span className="welcome-square welcome-square--three" />
    <span className="welcome-circle" />
  </div>

  {/* Contenido izquierdo */}
  <div className="welcome-hero__content">

    {/* Etiqueta institucional */}
    <div className="welcome-hero__badge">
      <span className="welcome-hero__status" />
      <span>PLATAFORMA SENA</span>
      <span className="welcome-hero__separator" />
      <span className="welcome-hero__badge-subtitle">
        Tu espacio de trabajo
      </span>
    </div>

    {/* Mensaje de bienvenida */}
    <div className="welcome-hero__heading">
      <p className="welcome-hero__eyebrow">
        ¡Nos alegra tenerte aquí!
      </p>

      <h1>
        Bienvenido,
        <span className="welcome-hero__username">
          {userName}
        </span>
      </h1>

      <p className="welcome-hero__description">
        Todo lo que necesitas para gestionar tus recursos y continuar tus
        procesos, en un solo lugar.
      </p>
    </div>

    {/* Información del usuario */}
    <div className="welcome-hero__info">

      {/* Centro de formación */}
      <div className="welcome-info-card">
        <span className="welcome-info-card__icon">
          <svg viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6M9 10h.01M15 10h.01" />
          </svg>
        </span>

        <span className="welcome-info-card__text">
          <span className="welcome-info-card__label">
            CENTRO DE FORMACIÓN
          </span>
          <strong>{trainingCenter}</strong>
        </span>
      </div>

      {/* Regional */}
      <div className="welcome-info-card">
        <span className="welcome-info-card__icon">
          <svg viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>

        <span className="welcome-info-card__text">
          <span className="welcome-info-card__label">
            REGIONAL
          </span>
          <strong>{regionalName}</strong>
        </span>
      </div>
    </div>

    {/* Pie de bienvenida */}
    <div className="welcome-hero__footer">

      <div className="welcome-hero__icon-group">
        <span className="welcome-footer-icon welcome-footer-icon--dark">
          <UsersIcon />
        </span>

        <span className="welcome-footer-icon welcome-footer-icon--green">
          <GridIcon />
        </span>

        <span className="welcome-footer-icon welcome-footer-icon--light">
          <ArrowIcon />
        </span>
      </div>

      <span className="welcome-hero__footer-divider" />

      <div className="welcome-hero__footer-text">
        <strong>Todo conectado para ti</strong>
        <span>Formación · Recursos · Gestión</span>
      </div>
    </div>
  </div>

  {/* Fotografía derecha */}
  <div className="welcome-hero__visual">

    <img
      src={profileImage}
      alt={`Fotografía de ${userName}`}
      className="welcome-hero__image"
      loading="eager"
    />

    {/* Capa de color */}
    <div className="welcome-hero__image-overlay" />

    {/* Contenido inferior de la fotografía */}
    <div className="welcome-hero__photo-caption">
      <span className="welcome-hero__caption-line" />

      <div>
        <p>PLATAFORMA DE GESTIÓN</p>
        <h2>Tu espacio, tus oportunidades.</h2>
        <span>Construyendo conocimiento y progreso.</span>
      </div>
    </div>
  </div>
</section>



      <div className={revealClass.trim() || undefined} style={revealStyle(380)}>
        <AssignedPrograms />
      </div>

      {/* Sección de módulos */}
      <section className={`mt-9${revealClass}`} style={revealStyle(510)}>
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
                className="group relative flex flex-col gap-6 rounded-[22px] bg-white/90 px-6 py-6 shadow-card ring-1 ring-sena-line backdrop-blur-glass-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-sena/40 sm:px-8 lg:flex-row lg:items-center"
              >
                <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-sena-soft text-sena-dark transition-transform duration-300 group-hover:scale-105 group-hover:bg-sena group-hover:text-white shadow-xs">
                  <NavIcon name={toNavIcon(card.icon)} className="size-10" />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full bg-sena-soft px-3 py-1 text-[0.6875rem] font-bold tracking-[0.08em] text-sena-dark uppercase">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-sena" />
                    Módulo disponible
                  </span>

                  <h3 className="mt-2.5 text-xl font-bold tracking-tight text-sena-dark transition-colors group-hover:text-sena">
                    {card.label}
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-sena-text/65">
                    {card.to === '/inventario'
                      ? INVENTORY_DESCRIPTION
                      : card.description || 'Ingresa a este módulo con los permisos de tu perfil.'}
                  </p>
                </div>

                <Link
                  to={card.to as string}
                  className="inline-flex w-fit shrink-0 items-center gap-2.5 rounded-full bg-sena px-7 py-3.5 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:bg-sena-bright hover:shadow-lg active:scale-95"
                  aria-label={`Abrir módulo ${card.label}`}
                >
                  Abrir módulo
                  <ArrowIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
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

      {/* Banda inferior de ayuda */}
      <div
        className={`mt-6 flex items-center gap-4 rounded-[20px] border border-sena-line/70 bg-[#e9f7ef]/80 px-5 py-4 sm:px-6 shadow-xs transition-all duration-300 hover:bg-[#e9f7ef]${revealClass}`}
        style={revealStyle(640)}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-sena-dark/70 text-sena-dark bg-white/50">
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