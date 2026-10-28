import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { GrGithub } from 'react-icons/gr'
import { FaLaptopCode, FaMobileAlt, FaPalette, FaUserCheck, FaUsers } from 'react-icons/fa'
import './Equipo.css'
import { createPortal } from 'react-dom'

type Miembro = {
  nombre: string
  rol: string
  github?: string
  avatar: string
  etiquetas?: string[]
}

type TarjetaProps = {
  m: Miembro
  indice: number
  onVerFoto?: (miembro: Miembro) => void
}

function iconoEtiqueta(etiqueta: string): ReactNode {
  const clave = etiqueta
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (clave.includes('movil')) return <FaMobileAlt aria-hidden="true" />
  if (clave.includes('ui') || clave.includes('ux')) return <FaPalette aria-hidden="true" />
  if (
    clave.includes('quality') ||
    clave.includes('product owner') ||
    clave.includes('tech lead') ||
    clave.includes('scrum') ||
    clave.includes('arquitectura') ||
    clave.includes('logica')
  ) {
    return <FaUserCheck aria-hidden="true" />
  }
  if (clave.includes('coordinator')) return <FaUsers aria-hidden="true" />
  if (clave.includes('web') || clave.includes('full stack') || clave.includes('api')) {
    return <FaLaptopCode aria-hidden="true" />
  }
  return null
}

const avatarFallback = (nombre: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0B3D2E&color=fff&size=176&bold=true&format=png`

const equipoActual: Miembro[] = [
  {
    nombre: 'Henry Bastidas',
    rol: 'Product Owner',
    avatar: '/avatars/henry.png',
    etiquetas: ['Product Owner'],
  },
  {
    nombre: 'Alex Jhoan Chaguendo',
    rol: 'Tech Lead & Scrum Master | Solution Architect',
    github: 'ALexjh117',
    avatar: '/avatars/alex_fotogit.jpeg',
    etiquetas: ['Scrum Master', 'Lógica de negocio', 'Full Stack'],
  },
  {
    nombre: 'Sofia Bonilla Gallego',
    rol: 'Scrum Master & Team Coordinator · UI/UX',
    github: 'sofiaboni06',
    avatar: '/avatars/sofia-sg.jpeg',
    etiquetas: ['Full Stack', 'UI/UX', 'Team Coordinator'],
  },
  {
    nombre: 'María Paula Santacruz',
    rol: 'Frontend Developer · Web y Móvil · UI/UX',
    github: 'Paulasantacruz',
    avatar: '/avatars/paula-sg.jpeg',
    etiquetas: ['Web', 'Móvil', 'UI/UX'],
  },
  {
    nombre: 'Yusti Mebel Campo',
    rol: 'Full Stack Developer',
    github: 'mebelcampo',
    avatar: '/avatars/mebel-sg.jpeg',
    etiquetas: ['Full Stack', 'Web', 'Api', 'UI/UX'],
  },
  {
    nombre: 'Andres Mauricio Bustamante',
    rol: 'Full Stack Developer',
    github: 'MauricioG-Dev',
    avatar: '/avatars/mauricio.jpeg',
    etiquetas: ['Full Stack', 'Web', 'Quality Assurance'],
  },
]

function CircuitoFondo() {
  return (
    <svg className="eq-circuit" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="eq-trace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#73efae" stopOpacity="0.42" />
          <stop offset="1" stopColor="#a8f56a" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#eq-trace)" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M40 120h180v80h120 M220 120v200h90" />
        <path d="M80 420h240v-90h160v180" />
        <path d="M40 720h320v-110h80" />
        <path d="M1400 80h-220v140h-90v80" />
        <path d="M1380 380h-180v120h-140" />
        <path d="M1400 780h-260v-90h-70" />
        <path d="M420 60h180v70h220v-40h200" />
        <path d="M380 840h200v-60h280v40h160" />
        <path d="M520 280h80v160h120v80" />
        <path d="M860 220v180h140v90" />
        <path d="M980 520h160v-70h90" />
        <path d="M640 640h90v110" />
      </g>
      <g fill="#00a651" fillOpacity="0.45">
        <circle cx="220" cy="120" r="4" />
        <circle cx="400" cy="200" r="4" />
        <circle cx="320" cy="330" r="3.5" />
        <circle cx="1180" cy="220" r="4" />
        <circle cx="1220" cy="500" r="3.5" />
        <circle cx="1140" cy="690" r="4" />
        <circle cx="600" cy="130" r="3.5" />
        <circle cx="860" cy="400" r="4" />
        <circle cx="1140" cy="450" r="3.5" />
        <circle cx="730" cy="750" r="4" />
        <circle cx="580" cy="780" r="3.5" />
      </g>
      <g fill="none" stroke="#005c3b" strokeOpacity="0.28" strokeWidth="1.2">
        <rect x="248" y="248" width="54" height="36" rx="3" />
        <rect x="1010" y="310" width="70" height="42" rx="3" />
        <rect x="700" y="470" width="48" height="30" rx="3" />
      </g>
    </svg>
  )
}

function TarjetaMiembro({ m, indice, onVerFoto }: TarjetaProps) {
  const src = m.avatar || avatarFallback(m.nombre)

  const foto = (
    <img
      src={src}
      alt={m.nombre}
      className={`eq-person-photo eq-person-photo-${indice + 1}`}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null
        e.currentTarget.src = avatarFallback(m.nombre)
      }}
    />
  )

  return (
    <article className="eq-card" style={{ '--i': indice } as CSSProperties}>
      <span className="eq-card-sheen" aria-hidden="true" />
      <div className="eq-card-index" aria-hidden="true">
        <span>{String(indice + 1).padStart(2, '0')}</span>
        <i />
      </div>
      <button
        type="button"
        className="eq-person-photo-button"
        aria-label={`Ampliar foto de ${m.nombre}`}
        onClick={() => onVerFoto?.(m)}
      >
        {foto}
      </button>
      <div className="eq-card-content">
        <div className="eq-copy">
          <strong>{m.nombre}</strong>
          <p>{m.rol}</p>
          {m.etiquetas ? (
            <div className="eq-tags">
              {m.etiquetas.map((etiqueta) => (
                <span key={etiqueta} className="eq-tag">
                  {iconoEtiqueta(etiqueta)}
                  {etiqueta}
                </span>
              ))}
            </div>
          ) : null}
          {m.github ? (
            <a
              className="eq-github"
              href={`https://github.com/${m.github}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GrGithub aria-hidden="true" /> <span>{m.github}</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function EquipoView() {
  const [fotoGrande, setFotoGrande] = useState<Miembro | null>(null)

  useEffect(() => {
    if (!fotoGrande) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFotoGrande(null)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [fotoGrande])

  return (
    <div className="eq-page" data-variant="pilar">
      <CircuitoFondo />

      <header className="eq-intro">
        <div className="eq-intro-copy">
          <div className="eq-system-state">
            <span aria-hidden="true" />
            Fábrica de Software · Núcleo operativo
          </div>
          <h1>Las personas detrás de <span>SIGMA</span></h1>
          <p>
            Un equipo multidisciplinario construye la plataforma que conecta inventario,
            materiales de formación y los procesos administrativos del centro.
          </p>
        </div>
        <aside className="eq-team-console" aria-label="Resumen del equipo">
          <div className="eq-console-head">
            <img src="/img/logo-fabrica-software.png" alt="Fábrica de Software" />
            <span>Sistema / Equipo</span>
          </div>
          <dl>
            <div>
              <dt>Integrantes</dt>
              <dd>06</dd>
            </div>
            <div>
              <dt>Disciplinas</dt>
              <dd>05</dd>
            </div>
            <div>
              <dt>Objetivo</dt>
              <dd>01</dd>
            </div>
          </dl>
          <p><i /> Todos los perfiles conectados</p>
        </aside>
      </header>

      <section className="eq-block">
        <div className="eq-roster-head">
          <div>
            <span>Directorio de talento</span>
            <h2>Equipo de desarrollo</h2>
          </div>
          <p>Selecciona una fotografía para ampliar el perfil.</p>
        </div>
        <div className="eq-grid eq-pilares">
          {equipoActual.map((m, i) => (
            <TarjetaMiembro key={m.nombre} m={m} indice={i} onVerFoto={setFotoGrande} />
          ))}
        </div>
      </section>

      {fotoGrande
        ? createPortal(
            <div
              className="foto-equipo-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label={`Foto de ${fotoGrande.nombre}`}
              onClick={() => setFotoGrande(null)}
            >
              <button
                type="button"
                className="foto-equipo-close"
                aria-label="Cerrar"
                onClick={() => setFotoGrande(null)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <img
                src={fotoGrande.avatar}
                alt={fotoGrande.nombre}
                className="foto-equipo-photo"
                onClick={(event) => event.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
