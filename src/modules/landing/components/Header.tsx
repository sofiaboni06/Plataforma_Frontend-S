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
    <header className="relative z-30 bg-[#005c3d] text-white">
      <div className="mx-auto flex h-[84px] max-w-[1280px] items-center gap-4 px-5 lg:h-[92px] lg:px-10">
        <a href="#inicio" aria-label="SENA, inicio" className="flex w-[118px] shrink-0 items-center">
          <img src="/img/logo-sena.svg" alt="SENA" className="h-[58px] w-auto object-contain" />
        </a>

        <nav className="hidden h-full flex-1 items-center justify-center gap-9 lg:flex">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setActive(item.label)}
              className={[
                'relative flex h-full items-center whitespace-nowrap text-[16px] font-medium text-white/95',
                active === item.label
                  ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-t-full after:bg-[#ffb300]'
                  : 'hover:text-white',
              ].join(' ')}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          to="/login"
          className="ml-auto hidden h-[46px] shrink-0 items-center gap-2.5 rounded-full bg-[#0b925f] px-5 text-[15px] font-semibold text-white shadow-sm transition hover:brightness-110 lg:ml-0 lg:flex"
        >
          <UserGlyph />
          <span>Iniciar sesión</span>
        </Link>

        <button
          type="button"
          className="ml-auto grid size-11 place-items-center rounded-full border border-white/25 bg-white/10 lg:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
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
        <div className="border-t border-white/10 bg-[#005c3d] px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => {
                  setActive(item.label)
                  setOpen(false)
                }}
                className="rounded-lg px-2 py-2 text-[16px] font-medium text-white"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/login"
              className="mt-2 inline-flex h-[46px] items-center justify-center gap-2.5 rounded-full bg-[#0b925f] px-5 text-[15px] font-semibold text-white"
            >
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
