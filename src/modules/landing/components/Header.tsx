import { useState } from 'react'
import { Link } from 'react-router-dom'

const navigation = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Oferta de formación', href: '#oferta' },
  { label: 'Sedes', href: '#sedes' },
  { label: 'Noticias', href: '#noticias' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('Inicio')

  return (
    <header className="lp-bar">
      <div className="lp-bar-inner">
        <a href="#inicio" aria-label="SENA, inicio" className="lp-logo">
          <img src="/img/logo-sena.svg" alt="SENA" />
        </a>

        <nav className="lp-nav">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setActive(item.label)}
              className={`lp-nav-link${active === item.label ? ' is-active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link to="/login" className="lp-btn lp-btn-login hidden shrink-0 lg:inline-flex">
          <UserGlyph />
          <span>Iniciar sesión</span>
        </Link>

        <button
          type="button"
          className="lp-burger"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Menú</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="lp-panel">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => {
                  setActive(item.label)
                  setOpen(false)
                }}
                className="lp-panel-link"
              >
                {item.label}
              </a>
            ))}
            <Link to="/login" className="lp-btn lp-btn-login mt-3 w-full">
              <UserGlyph />
              Iniciar sesión
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

function UserGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M7.5 17C8.55 14.95 10.1 14 12 14C13.9 14 15.45 14.95 16.5 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}