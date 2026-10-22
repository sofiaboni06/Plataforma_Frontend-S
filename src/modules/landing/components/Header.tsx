import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navigation = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Oferta de formación', href: '#oferta' },
  { label: 'Sedes', href: '#sedes' },
  { label: 'Noticias', href: '#noticias' },
  { label: 'Contacto', href: '#contacto' },
]

const INDICATOR_WIDTH = 26

/* Estilo del texto de la opción activa. Va en línea para no depender de la
   regla vieja `.lp-nav-link.is-active` (y su ::after) de landing.css. */
const ACTIVE_LINK_STYLE = { color: '#fff', fontWeight: 600 } as const

/* Última posición de la línea. Cada página monta su propio Header, así que
   se recuerda aquí para que al cambiar de página la línea parta de donde
   estaba y se deslice, en vez de aparecer de la nada. */
let lastIndicatorX: number | null = null

/** Devuelve la opción del menú que corresponde a un hash ("#oferta" → "Oferta de formación"). */
function labelFromHash(hash: string) {
  return navigation.find((item) => item.href === hash)?.label ?? 'Inicio'
}

/* Scroll animado propio. No usa `behavior: 'smooth'` del navegador porque ese
   depende de la configuración del sistema (si las animaciones están
   desactivadas, el salto es instantáneo). Aquí la animación va en JavaScript
   y se ve igual en todos los equipos. */
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function smoothScrollTo(getTargetY: () => number): () => void {
  const startY = window.scrollY
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const distance = Math.abs(getTargetY() - startY)
  if (distance < 2) return () => {}

  // Más distancia, más duración (entre 0,5 s y 1,1 s). Con "reducir movimiento", 0,3 s.
  const duration = reduceMotion ? 300 : Math.min(1100, Math.max(500, distance * 0.35))

  let raf = 0
  let startTime: number | null = null
  const interrupts = ['wheel', 'touchstart', 'keydown'] as const

  const stop = () => {
    cancelAnimationFrame(raf)
    interrupts.forEach((type) => window.removeEventListener(type, stop))
  }
  // Si la persona mueve la página con rueda, dedo o teclado, se cancela la animación.
  interrupts.forEach((type) => window.addEventListener(type, stop, { passive: true }))

  const step = (now: number) => {
    if (startTime === null) startTime = now
    const progress = Math.min((now - startTime) / duration, 1)
    // El destino se recalcula en cada frame por si el layout cambia (imágenes que cargan).
    const endY = getTargetY()
    window.scrollTo({
      top: startY + (endY - startY) * easeInOutCubic(progress),
      behavior: 'instant' as ScrollBehavior, // ignora cualquier `scroll-behavior` del CSS
    })
    if (progress < 1) raf = requestAnimationFrame(step)
    else stop()
  }

  raf = requestAnimationFrame(step)
  return stop
}

/** Posición de scroll a la que debe llegar la sección, respetando su `scroll-margin-top`. */
function targetYFor(el: HTMLElement, id: string) {
  if (id === 'inicio') return 0
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  const maxY = document.documentElement.scrollHeight - window.innerHeight
  const y = el.getBoundingClientRect().top + window.scrollY - margin
  return Math.min(Math.max(y, 0), Math.max(maxY, 0))
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const onHome = location.pathname === '/'
  const onEquipo = location.pathname === '/equipo'

  const [active, setActive] = useState(() => labelFromHash(location.hash))
  const activeLabel = onEquipo ? 'Equipo Sigma' : active
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [indicatorX, setIndicatorX] = useState<number | null>(lastIndicatorX)

  /* Mide dónde debe quedar la línea (centrada bajo la opción activa).
     Se hace en el siguiente frame para que el navegador pinte primero la
     posición anterior y la transición CSS tenga desde dónde moverse. */
  useEffect(() => {
    const measure = () => {
      const nav = navRef.current
      const link = linkRefs.current[activeLabel]
      if (!nav || !link) return
      const navBox = nav.getBoundingClientRect()
      const linkBox = link.getBoundingClientRect()
      const x = linkBox.left - navBox.left + linkBox.width / 2 - INDICATOR_WIDTH / 2
      lastIndicatorX = x
      // Fuerza al navegador a calcular el estilo con la posición ANTERIOR
      // antes de cambiarla. Sin esto, si el cambio ocurre antes del primer
      // pintado, no hay "desde dónde" y la línea salta sin animación.
      indicatorRef.current?.getBoundingClientRect()
      setIndicatorX(x)
    }

    // Dos frames: deja que el navegador pinte primero la posición anterior.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(measure)
    })
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    document.fonts?.ready.then(measure)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.removeEventListener('resize', onResize)
    }
  }, [activeLabel])

  /* En la landing: sincroniza la opción activa con el hash y se desliza
     hasta la sección. Se reintenta unos instantes por si la sección todavía
     no se ha pintado (p. ej. al llegar desde /equipo). */
  useEffect(() => {
    if (!onHome) return

    setActive(labelFromHash(location.hash))

    if (!location.hash) return
    const id = location.hash.slice(1)
    let tries = 0
    let timer: number | undefined
    let cancelScroll: () => void = () => {}

    const scrollToSection = () => {
      const el = document.getElementById(id)
      if (el) {
        cancelScroll = smoothScrollTo(() => targetYFor(el, id))
        return
      }
      if (id === 'inicio') {
        cancelScroll = smoothScrollTo(() => 0)
        return
      }
      if (++tries < 15) timer = window.setTimeout(scrollToSection, 80)
    }

    scrollToSection()
    return () => {
      window.clearTimeout(timer)
      cancelScroll()
    }
    // location.key cambia en cada navegación, incluso al pulsar el mismo enlace dos veces
  }, [onHome, location.hash, location.key])

  const sectionLink = (hash: string) => ({ pathname: '/', hash })

  return (
    <header className="lp-bar">
      <div className="lp-bar-inner">
        <Link to={sectionLink('#inicio')} aria-label="SENA, inicio" className="lp-logo">
          <img src="/img/logo-sena.svg" alt="SENA" />
        </Link>

        <nav className="lp-nav" ref={navRef} style={{ position: 'relative' }}>
          {navigation.map((item) => (
            <Link
              key={item.label}
              ref={(el) => {
                linkRefs.current[item.label] = el
              }}
              to={sectionLink(item.href)}
              className="lp-nav-link"
              style={activeLabel === item.label ? ACTIVE_LINK_STYLE : undefined}
            >
              {item.label}
            </Link>
          ))}

          <Link
            ref={(el) => {
              linkRefs.current['Equipo Sigma'] = el
            }}
            to="/equipo"
            aria-current={onEquipo ? 'page' : undefined}
            className="lp-nav-link"
            style={onEquipo ? ACTIVE_LINK_STYLE : undefined}
          >
            Equipo Sigma
          </Link>

          {indicatorX !== null ? (
            <span
              ref={indicatorRef}
              className="lp-nav-indicator"
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                bottom: 15,
                width: INDICATOR_WIDTH,
                height: 3,
                borderRadius: 999,
                backgroundImage: 'linear-gradient(90deg, #ddf58a, #a6e93e)',
                boxShadow: '0 0 10px rgba(166, 233, 62, 0.85), 0 0 20px rgba(166, 233, 62, 0.45)',
                pointerEvents: 'none',
                transform: `translateX(${indicatorX}px)`,
                transition: reduceMotion ? 'none' : 'transform 0.5s cubic-bezier(0.65, 0.05, 0.25, 1)',
              }}
            />
          ) : null}
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
              <Link
                key={item.label}
                to={sectionLink(item.href)}
                onClick={() => setOpen(false)}
                className="lp-panel-link"
              >
                {item.label}
              </Link>
            ))}

            <Link to="/equipo" className="lp-panel-link" onClick={() => setOpen(false)}>
              Equipo Sigma
            </Link>

            <Link to="/login" onClick={() => setOpen(false)} className="lp-btn lp-btn-login mt-3 w-full">
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