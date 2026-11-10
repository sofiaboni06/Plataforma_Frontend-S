/*
 * Mapa interactivo de presencia SENA.
 * El SVG de departamentos se inyecta para poder resaltar cada territorio
 * al pasar el cursor y mostrar la regional y su ciudad sede.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import HomeOriginJourney, { type OriginMode } from '@/modules/landing/components/HomeOriginJourney'

type ExplorerView = 'globe' | 'national' | 'city' | 'campus'

const HOME_KEY = 'Cauca'
const HOME_COORDS = '02°26′N 76°36′W'

type Centro = { nombre: string; lugar: string }

type Sede = {
  regional: string
  ciudad: string
  centros: Centro[]
}

function sede(nombre: string, lugar: string): Centro {
  return { nombre, lugar }
}

const SEDES: Record<string, Sede> = {
  Amazonas: {
    regional: 'Amazonas',
    ciudad: 'Leticia',
    centros: [sede('Centro para la Biodiversidad y el Turismo del Amazonas', 'Leticia')],
  },
  Antioquia: {
    regional: 'Antioquia',
    ciudad: 'Medellín',
    centros: [
      sede('Centro de Comercio', 'Medellín'),
      sede('Centro de Tecnología de la Manufactura Avanzada', 'Medellín'),
      sede('Centro del Diseño y Manufactura del Cuero', 'Itagüí'),
      sede('Complejo Tecnológico Agroindustrial', 'Apartadó'),
    ],
  },
  Arauca: {
    regional: 'Arauca',
    ciudad: 'Arauca',
    centros: [
      sede('Centro de Gestión y Desarrollo Agroindustrial', 'Arauca'),
      sede('Sede Tame', 'Tame'),
    ],
  },
  'Archipiélago de San Andrés, Providencia y Santa Catalina': {
    regional: 'San Andrés',
    ciudad: 'San Andrés',
    centros: [sede('Centro de Formación Turística', 'San Andrés')],
  },
  Atlántico: {
    regional: 'Atlántico',
    ciudad: 'Barranquilla',
    centros: [
      sede('Centro Nacional Colombo Alemán', 'Barranquilla'),
      sede('Centro Industrial y de Aviación', 'Barranquilla'),
      sede('Centro de Comercio y Servicios', 'Barranquilla'),
      sede('Centro para el Desarrollo Agroecológico', 'Sabanalarga'),
    ],
  },
  'Bogota Capital District': {
    regional: 'Distrito Capital',
    ciudad: 'Bogotá',
    centros: [
      sede('Centro de Electricidad, Electrónica y Telecomunicaciones', 'Bogotá'),
      sede('Centro de Gestión Industrial', 'Bogotá'),
      sede('Centro de Tecnologías para la Construcción y la Madera', 'Bogotá'),
      sede('Centro de Comercio y Servicios', 'Bogotá'),
    ],
  },
  Bolívar: {
    regional: 'Bolívar',
    ciudad: 'Cartagena',
    centros: [
      sede('Centro Internacional Náutico, Fluvial y Portuario', 'Mamonal'),
      sede('Centro para la Industria Petroquímica', 'Tesca'),
      sede('Centro de Comercio y Servicios', 'Turbaco'),
      sede('Centro Agroempresarial y Minero', 'Turbaco'),
    ],
  },
  Boyacá: {
    regional: 'Boyacá',
    ciudad: 'Tunja',
    centros: [
      sede('Centro de Comercio y Servicios', 'Tunja'),
      sede('Centro de Desarrollo Agropecuario y Agroindustrial', 'Duitama'),
      sede('Centro Nacional Minero', 'Sogamoso'),
    ],
  },
  Caldas: {
    regional: 'Caldas',
    ciudad: 'Manizales',
    centros: [
      sede('Centro de Automatización Industrial', 'Manizales'),
      sede('Centro de Procesos Industriales', 'Manizales'),
      sede('Centro de Comercio y Servicios', 'Manizales'),
      sede('Centro para la Formación Cafetera', 'Manizales'),
    ],
  },
  Caquetá: {
    regional: 'Caquetá',
    ciudad: 'Florencia',
    centros: [sede('Centro Tecnológico de la Amazonía', 'Florencia')],
  },
  Casanare: {
    regional: 'Casanare',
    ciudad: 'Yopal',
    centros: [sede('Centro Agroindustrial y Fortalecimiento Empresarial', 'Yopal')],
  },
  Cauca: {
    regional: 'Cauca',
    ciudad: 'Popayán',
    centros: [
      sede('Centro de Comercio y Servicios', 'Centro'),
      sede('Centro Agropecuario', 'Alto Cauca'),
      sede('Centro de Teleinformática y Producción Industrial', 'Alto Cauca'),
    ],
  },
  Cesar: {
    regional: 'Cesar',
    ciudad: 'Valledupar',
    centros: [
      sede('Centro Biotecnológico del Caribe', 'Valledupar'),
      sede('Centro de Operación y Mantenimiento Minero', 'Valledupar'),
      sede('Centro Agroempresarial', 'Aguachica'),
    ],
  },
  Chocó: {
    regional: 'Chocó',
    ciudad: 'Quibdó',
    centros: [sede('Centro de Recursos Naturales, Industria y Biodiversidad', 'Quibdó')],
  },
  Córdoba: {
    regional: 'Córdoba',
    ciudad: 'Montería',
    centros: [
      sede('Centro Agropecuario y de Biotecnología El Porvenir', 'Montería'),
      sede('Centro de Comercio, Industria y Turismo', 'Montería'),
    ],
  },
  Cundinamarca: {
    regional: 'Cundinamarca',
    ciudad: 'Soacha',
    centros: [
      sede('Centro Industrial y de Desarrollo Empresarial', 'Soacha'),
      sede('Centro de Biotecnología Agropecuaria', 'Mosquera'),
      sede('Centro Agroecológico y Empresarial', 'Fusagasugá'),
      sede('Centro de Desarrollo Agroempresarial', 'Chía'),
    ],
  },
  Guainía: {
    regional: 'Guainía',
    ciudad: 'Inírida',
    centros: [sede('Centro Ambiental y Ecoturístico', 'Inírida')],
  },
  Guaviare: {
    regional: 'Guaviare',
    ciudad: 'San José del Guaviare',
    centros: [sede('Centro de Desarrollo Agroindustrial, Turístico y Tecnológico', 'San José')],
  },
  Huila: {
    regional: 'Huila',
    ciudad: 'Neiva',
    centros: [
      sede('Centro de la Industria, la Empresa y los Servicios', 'Neiva'),
      sede('Centro de Formación Agroindustrial', 'La Plata'),
      sede('Centro Agroempresarial y Desarrollo Pecuario', 'Garzón'),
    ],
  },
  'La Guajira': {
    regional: 'La Guajira',
    ciudad: 'Riohacha',
    centros: [
      sede('Centro Industrial y de Energías Alternativas', 'Riohacha'),
      sede('Centro Agroempresarial y Acuícola', 'Fonseca'),
    ],
  },
  Magdalena: {
    regional: 'Magdalena',
    ciudad: 'Santa Marta',
    centros: [
      sede('Centro de Logística y Promoción Ecoturística', 'Santa Marta'),
      sede('Centro Acuícola y Agroindustrial', 'Gaira'),
    ],
  },
  Meta: {
    regional: 'Meta',
    ciudad: 'Villavicencio',
    centros: [
      sede('Centro de Industria y Servicios', 'Villavicencio'),
      sede('Centro Agroindustrial del Meta', 'Villavicencio'),
      sede('Centro de Industria y Servicios del Meta', 'Granada'),
    ],
  },
  Nariño: {
    regional: 'Nariño',
    ciudad: 'Pasto',
    centros: [
      sede('Centro Internacional de Producción Limpia', 'Lope'),
      sede('Centro Sur Colombiano de Logística Internacional', 'Ipiales'),
      sede('Centro Agroindustrial y Pesquero', 'Tumaco'),
    ],
  },
  'Norte de Santander': {
    regional: 'Norte de Santander',
    ciudad: 'Cúcuta',
    centros: [
      sede('Centro de la Industria, la Empresa y los Servicios', 'Cúcuta'),
      sede('Centro de Formación para el Desarrollo Rural', 'Ocaña'),
    ],
  },
  Putumayo: {
    regional: 'Putumayo',
    ciudad: 'Mocoa',
    centros: [sede('Centro Agroforestal y Acuícola Arapaima', 'Puerto Asís')],
  },
  Quindío: {
    regional: 'Quindío',
    ciudad: 'Armenia',
    centros: [
      sede('Centro para el Desarrollo Tecnológico de la Construcción', 'Armenia'),
      sede('Centro de Comercio y Turismo', 'Armenia'),
    ],
  },
  Risaralda: {
    regional: 'Risaralda',
    ciudad: 'Pereira',
    centros: [
      sede('Centro de Diseño y Manufactura del Cuero', 'Dosquebradas'),
      sede('Centro de Comercio y Servicios', 'Pereira'),
      sede('Centro Atención Sector Agropecuario', 'Pereira'),
    ],
  },
  Santander: {
    regional: 'Santander',
    ciudad: 'Bucaramanga',
    centros: [
      sede('Centro Industrial de Mantenimiento Integral', 'Girón'),
      sede('Centro de Servicios Empresariales y Turísticos', 'Bucaramanga'),
      sede('Centro Industrial y del Desarrollo Tecnológico', 'Barrancabermeja'),
    ],
  },
  Sucre: {
    regional: 'Sucre',
    ciudad: 'Sincelejo',
    centros: [
      sede('Centro de Comercio y Servicios', 'Sincelejo'),
      sede('Centro Agropecuario', 'Corozal'),
    ],
  },
  Tolima: {
    regional: 'Tolima',
    ciudad: 'Ibagué',
    centros: [
      sede('Centro de Industria y Construcción', 'Ibagué'),
      sede('Centro Agropecuario La Granja', 'Espinal'),
      sede('Centro de Comercio y Servicios', 'Ibagué'),
    ],
  },
  'Valle del Cauca': {
    regional: 'Valle',
    ciudad: 'Cali',
    centros: [
      sede('Centro de Electricidad y Automatización Industrial', 'Cali'),
      sede('Centro de Biotecnología Industrial', 'Palmira'),
      sede('Centro Náutico Pesquero', 'Buenaventura'),
      sede('Centro Latinoamericano de Especies Menores', 'Tuluá'),
    ],
  },
  Vaupés: {
    regional: 'Vaupés',
    ciudad: 'Mitú',
    centros: [sede('Centro de formación', 'Mitú')],
  },
  Vichada: {
    regional: 'Vichada',
    ciudad: 'Puerto Carreño',
    centros: [sede('Centro de Producción y Transformación Agroindustrial', 'Puerto Carreño')],
  },
}

type Pin = { nombre: string; x: number; y: number }

const TABLE_KEYS = [
  'Cauca',
  'Antioquia',
  'Bogota Capital District',
  'Atlántico',
  'Valle del Cauca',
  'Nariño',
  'Santander',
]

type LinkPoint = { key: string; x: number; y: number }

type HoloNet = { ox: number; oy: number; points: LinkPoint[] }

const EMPTY_NET: HoloNet = { ox: 0, oy: 44, points: [] }

const PIN_SPREAD = [
  [0, 0],
  [28, -18],
  [-30, 16],
  [26, 24],
]

let svgMarkup: string | null = null
let svgPromise: Promise<string> | null = null

function loadMapSvg() {
  if (svgMarkup) return Promise.resolve(svgMarkup)
  if (!svgPromise) {
    svgPromise = fetch('/img/mapa-colombia-departamentos.svg')
      .then((response) => response.text())
      .then((markup) => {
        svgMarkup = markup
        return markup
      })
  }
  return svgPromise
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 32" width="22" height="30" aria-hidden="true">
      <path
        d="M12 31.2C12 31.2 22 18.6 22 11.2A10 10 0 1 0 2 11.2C2 18.6 12 31.2 12 31.2Z"
        fill="#E11D2E"
        stroke="#fff"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="11" r="3.4" fill="#fff" />
    </svg>
  )
}

export default function ColombiaMap({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const pathsRef = useRef(new Map<string, SVGPathElement>())
  const [active, setActive] = useState<Sede | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [large, setLarge] = useState(false)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ExplorerView>('globe')
  const [breaking, setBreaking] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [net, setNet] = useState<HoloNet>(EMPTY_NET)
  const viewRef = useRef<ExplorerView>('globe')
  const activeKeyRef = useRef<string | null>(null)
  const reduceRef = useRef(reduceMotion)
  const zoomedRef = useRef(false)
  const linkTimer = useRef<number | null>(null)
  const pendingHome = useRef(false)

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    activeKeyRef.current = activeKey
  }, [activeKey])

  useEffect(() => {
    reduceRef.current = reduceMotion
  }, [reduceMotion])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const measureLinks = useCallback(() => {
    const stage = stageRef.current
    if (!stage || viewRef.current !== 'national') {
      setNet((prev) => (prev.points.length ? EMPTY_NET : prev))
      return
    }
    const rect = stage.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8) return
    const origin = { x: 50, y: 7 }
    const focus = activeKeyRef.current
    const keys = focus ? [focus] : TABLE_KEYS
    const points: LinkPoint[] = []
    for (const key of keys) {
      const path = pathsRef.current.get(key)
      if (!path) continue
      const box = path.getBoundingClientRect()
      const x = ((box.left + box.width / 2 - rect.left) / rect.width) * 100
      const y = ((box.top + box.height / 2 - rect.top) / rect.height) * 100
      if (x < -12 || x > 112 || y < -12 || y > 112) continue
      points.push({ key, x, y })
    }
    setNet((prev) => {
      const same =
        prev.ox === origin.x &&
        prev.oy === origin.y &&
        prev.points.length === points.length &&
        prev.points.every(
          (point, index) =>
            point.key === points[index].key &&
            Math.abs(point.x - points[index].x) < 0.6 &&
            Math.abs(point.y - points[index].y) < 0.6,
        )
      return same ? prev : { ox: origin.x, oy: origin.y, points }
    })
  }, [])

  const scheduleLinks = useCallback(
    (delay?: number) => {
      if (linkTimer.current) window.clearTimeout(linkTimer.current)
      const wait = delay ?? (reduceRef.current ? 40 : 660)
      linkTimer.current = window.setTimeout(() => {
        linkTimer.current = null
        measureLinks()
      }, wait)
    },
    [measureLinks],
  )

  const revealSede = useCallback((path: SVGPathElement, key: string, selected: Sede, tight = false) => {
    const host = hostRef.current
    const zoom = zoomRef.current
    if (!host || !zoom) return

    host.querySelectorAll('.lp-dep.is-active').forEach((node) => node.classList.remove('is-active'))
    path.classList.add('is-active')
    const box = path.getBBox()
    const cx = ((box.x + box.width / 2) / 1024) * 100
    const cy = ((box.y + box.height / 2) / 1024) * 100
    const span = Math.max(box.width, box.height)
    const level = tight
      ? Math.min(3.05, Math.max(2.1, 480 / span))
      : Math.min(2.15, Math.max(1.35, 340 / span))
    zoom.style.transformOrigin = `${cx}% ${cy}%`
    zoom.style.transform = `scale(${level})`
    activeKeyRef.current = key
    setActive(selected)
    setActiveKey(key)
    if (zoomedRef.current) setNet(EMPTY_NET)
    else measureLinks()
    zoomedRef.current = true
    scheduleLinks()

    requestAnimationFrame(() => {
      const stage = stageRef.current?.getBoundingClientRect()
      const rect = path.getBoundingClientRect()
      if (!stage) return
      const baseX = rect.left + rect.width / 2 - stage.left
      const baseY = rect.top + rect.height / 2 - stage.top
      setPins(
        selected.centros.map((centro, index) => {
          const [dx, dy] = PIN_SPREAD[index] ?? PIN_SPREAD[0]
          return { nombre: centro.nombre, x: baseX + dx, y: baseY + dy }
        }),
      )
    })
  }, [measureLinks, scheduleLinks])

  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es')
    if (term.length < 2) return []

    return Object.entries(SEDES)
      .filter(([, item]) =>
        [item.regional, item.ciudad, ...item.centros.flatMap((centro) => [centro.nombre, centro.lugar])]
          .join(' ')
          .toLocaleLowerCase('es')
          .includes(term),
      )
      .slice(0, 6)
  }, [query])

  useEffect(() => {
    const host = hostRef.current
    if (!large || !host) return
    const paths = pathsRef.current
    let cancelled = false

    loadMapSvg()
      .then((markup) => {
        if (cancelled || !host) return
        host.innerHTML = markup
        const svg = host.querySelector('svg')
        const zoom = zoomRef.current
        if (!svg || !zoom) return
        svg.classList.add('lp-colombia-svg')
        svg.removeAttribute('width')
        svg.removeAttribute('height')

        host.querySelectorAll<SVGPathElement>('path[data-dep]').forEach((path) => {
          const key = path.getAttribute('data-dep') ?? ''
          const sede = SEDES[key]
          path.classList.add('lp-dep')
          path.setAttribute('tabindex', sede ? '0' : '-1')
          if (!sede) return
          path.setAttribute('role', 'button')
          path.setAttribute(
            'aria-label',
            `${sede.ciudad}, ${sede.centros.length} ${sede.centros.length === 1 ? 'sede' : 'sedes'}`,
          )
          paths.set(key, path)
          const show = () => {
            if (viewRef.current === 'globe' || viewRef.current === 'campus') return
            revealSede(path, key, sede)
          }
          path.addEventListener('pointerenter', show)
          path.addEventListener('focus', show)
          path.addEventListener('click', show)
        })
        if (pendingHome.current) {
          const homePath = paths.get(HOME_KEY)
          const home = SEDES[HOME_KEY]
          if (homePath && home) {
            pendingHome.current = false
            revealSede(homePath, HOME_KEY, home, true)
          }
        }
        if (viewRef.current === 'national') scheduleLinks(reduceRef.current ? 40 : 80)
      })
      .catch(() => {
        /* El mapa queda vacío si el SVG no carga; el texto de la sección sigue visible. */
      })

    return () => {
      cancelled = true
      paths.clear()
      host.innerHTML = ''
    }
  }, [large, revealSede, scheduleLinks])

  useEffect(() => {
    if (!large) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setLarge(false)
      setView('globe')
      setBreaking(false)
      const zoom = zoomRef.current
      hostRef.current?.querySelectorAll('.lp-dep.is-active').forEach((node) => node.classList.remove('is-active'))
      if (zoom) zoom.style.transform = 'scale(1)'
      setPins([])
      setActive(null)
      activeKeyRef.current = null
      zoomedRef.current = false
      setActiveKey(null)
      setNet(EMPTY_NET)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [large])

  useEffect(() => {
    if (!large || view !== 'national') return
    scheduleLinks(reduceMotion ? 40 : 140)
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(() => measureLinks())
    observer.observe(stage)
    return () => observer.disconnect()
  }, [large, view, reduceMotion, measureLinks, scheduleLinks])

  const close = () => {
    const zoom = zoomRef.current
    hostRef.current?.querySelectorAll('.lp-dep.is-active').forEach((node) => node.classList.remove('is-active'))
    if (zoom) zoom.style.transform = 'scale(1)'
    setPins([])
    setActive(null)
    activeKeyRef.current = null
    setActiveKey(null)
    zoomedRef.current = false
    setNet(EMPTY_NET)
    if (viewRef.current === 'national') scheduleLinks()
  }

  const focusHome = useCallback(
    (tight = true) => {
      const path = pathsRef.current.get(HOME_KEY)
      const home = SEDES[HOME_KEY]
      if (!path || !home) {
        pendingHome.current = true
        return
      }
      pendingHome.current = false
      revealSede(path, HOME_KEY, home, tight)
    },
    [revealSede],
  )

  const goHome = useCallback(() => {
    if (reduceMotion) {
      focusHome(true)
      setView('campus')
      setBreaking(false)
      return
    }
    setBreaking(true)
  }, [focusHome, reduceMotion])

  const handleCity = useCallback(() => {
    focusHome(true)
    setView('city')
  }, [focusHome])

  const handleCampus = useCallback(() => {
    setBreaking(false)
    setView('campus')
  }, [])

  const seeCity = () => setView('city')

  const seeNational = () => {
    setBreaking(false)
    if (view === 'city' || view === 'campus') close()
    setView('national')
  }

  const seeGlobe = () => {
    close()
    setBreaking(false)
    setView('globe')
  }

  const openExplorer = () => {
    setView('globe')
    setBreaking(false)
    setLarge(true)
  }

  const closeExplorer = () => {
    setLarge(false)
    setView('globe')
    setBreaking(false)
    close()
  }

  const selectResult = (key: string, selected: Sede) => {
    const path = pathsRef.current.get(key)
    if (!path) return
    setBreaking(false)
    setView('national')
    revealSede(path, key, selected)
    setQuery('')
  }

  const originMode: OriginMode =
    !large || view === 'national'
      ? 'hidden'
      : breaking
        ? 'breaking'
        : view === 'campus'
          ? 'campus'
          : view === 'city'
            ? 'hidden'
            : 'globe'

  const showingGlobe = large && view === 'globe'
  const showingOrigin = large && (view === 'city' || view === 'campus')

  const map = (
    <div
      className={`lp-colombia${active ? ' is-open' : ''}${large ? ' is-large' : ''}${showingGlobe ? ' is-globe' : ''}${showingOrigin ? ' is-origin' : ''}${view === 'campus' ? ' is-campus' : ''}${large && view === 'national' ? ' is-table' : ''} ${className}`}
      onPointerLeave={large ? undefined : close}
    >
      <div className="lp-map-toolbar">
        {large ? (
          <>
            <div className="lp-map-identity">
              <span className="lp-map-signal" aria-hidden="true" />
              <span>
                <strong>{showingGlobe || showingOrigin ? 'Estamos en Popayán' : 'Red territorial SENA'}</strong>
                <small>{showingGlobe || showingOrigin ? `CTPI · Regional Cauca · ${HOME_COORDS}` : 'Explorador nacional de sedes'}</small>
              </span>
            </div>
            <div className="lp-map-search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca una regional, ciudad o centro"
                aria-label="Buscar regional, ciudad o centro de formación"
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">
                  ×
                </button>
              ) : null}
              {query.trim().length >= 2 ? (
                <div className="lp-map-results">
                  {searchResults.length ? (
                    searchResults.map(([key, result]) => (
                      <button key={key} type="button" onClick={() => selectResult(key, result)}>
                        <span>{result.regional}</span>
                        <small>{result.ciudad} · {result.centros.length} centros</small>
                      </button>
                    ))
                  ) : (
                    <p>No encontramos coincidencias</p>
                  )}
                </div>
              ) : null}
            </div>
            <div className="lp-map-actions">
              {view !== 'globe' && !breaking ? (
                <button type="button" className="lp-map-reset" onClick={seeGlobe}>
                  Globo
                </button>
              ) : null}
              {view !== 'national' ? (
                <button type="button" className="lp-map-reset" onClick={seeNational}>
                  Territorio
                </button>
              ) : null}
              {active && view === 'national' ? (
                <button type="button" className="lp-map-reset" onClick={close}>
                  Restablecer
                </button>
              ) : null}
              <button type="button" className="lp-screen-btn" onClick={closeExplorer}>
                Cerrar <kbd>Esc</kbd>
              </button>
            </div>
          </>
        ) : (
          <div className="lp-map-compact-bar">
            <p className="lp-map-here">
              <span className="lp-map-signal" aria-hidden="true" />
              <span>
                <strong>Popayán, Cauca</strong>
                <small>CTPI · Fábrica de Software</small>
              </span>
            </p>
            <button type="button" className="lp-screen-btn" onClick={openExplorer}>
              Explorar mapa
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div ref={stageRef} className="lp-colombia-stage">
        {large && view === 'national' ? (
          <>
            <div className="lp-holo-floor" aria-hidden="true" />
            <div className="lp-map-scan" aria-hidden="true" />
            <div className="lp-map-readout lp-map-readout-top">
              <span>Cobertura</span>
              <b>32 regionales</b>
            </div>
            <div className="lp-map-readout lp-map-readout-bottom">
              <span>Origen</span>
              <b>Popayán · CTPI</b>
            </div>
            {net.points.length ? (
              <div className="lp-holo-net" aria-hidden="true">
                <svg className="lp-holo-links" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {net.points.map((link) => {
                    const mx = (net.ox + link.x) / 2
                    const my = Math.min(net.oy, link.y) - 7
                    const tone = link.key === 'Cauca' ? 'is-home' : activeKey === link.key ? 'is-hot' : ''
                    return (
                      <path
                        key={link.key}
                        pathLength={1}
                        className={tone}
                        d={`M ${net.ox} ${net.oy} Q ${mx} ${my} ${link.x} ${link.y}`}
                      />
                    )
                  })}
                </svg>
                <span className="lp-holo-source" style={{ left: `${net.ox}%`, top: `${net.oy}%` }} />
                {net.points.map((link) => (
                  <span
                    key={link.key}
                    className={`lp-holo-dot${link.key === 'Cauca' ? ' is-home' : ''}${activeKey === link.key ? ' is-hot' : ''}`}
                    style={{ left: `${link.x}%`, top: `${link.y}%` }}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
        {large ? (
          <div ref={zoomRef} className="lp-colombia-zoom">
            <div ref={hostRef} className="lp-colombia-host" />
          </div>
        ) : (
          <img
            src="/img/mapa-colombia-departamentos.svg"
            alt="Mapa de Colombia por departamentos"
            className="lp-colombia-img"
            decoding="async"
          />
        )}
        {large && view !== 'campus' && pins.map((pin, index) => (
          <span
            key={`${pin.nombre}-${index}`}
            className="lp-pin"
            style={{ left: pin.x, top: pin.y, animationDelay: `${index * 45}ms` }}
          >
            <PinIcon />
            <em>{pin.nombre}</em>
          </span>
        ))}
        {large ? (
          <HomeOriginJourney
            mode={originMode}
            reduceMotion={reduceMotion}
            onCity={handleCity}
            onCampus={handleCampus}
            onGoHome={goHome}
            onSeeCity={seeCity}
          />
        ) : null}
      </div>
      <div className={`lp-sede-card${active || !large || showingGlobe ? ' is-visible' : ''}`} aria-live="polite">
        {active ? (
          <>
            {large ? (
              <span className="lp-sede-status">
                {activeKey === HOME_KEY ? 'Nuestra casa' : 'Regional conectada'}
              </span>
            ) : null}
            <p className="lp-sede-city">{activeKey === HOME_KEY ? 'Popayán' : `Regional ${active.regional}`}</p>
            <p className="lp-sede-kicker">
              {activeKey === HOME_KEY
                ? `Cauca · ${HOME_COORDS}`
                : `${active.ciudad} · ${active.centros.length} ${active.centros.length === 1 ? 'sede' : 'sedes'}`}
            </p>
            <ul className="lp-sede-list">
              {active.centros.map((centro) => (
                <li
                  key={centro.nombre}
                  className={centro.nombre.includes('Teleinformática') ? 'is-home' : undefined}
                >
                  <PinIcon />
                  <span>
                    {centro.nombre}
                    <small>{centro.lugar}{centro.nombre.includes('Teleinformática') ? ' · Fábrica de Software' : ''}</small>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="lp-sede-empty">
            <span aria-hidden="true">+</span>
            <p className="lp-sede-city">{large ? 'Popayán, Cauca' : 'Estamos en Popayán'}</p>
            <p className="lp-sede-hint">
              {large
                ? `CTPI SENA · Fábrica de Software · ${HOME_COORDS}`
                : 'CTPI · Fábrica de Software. Abre el explorador para viajar desde el planeta hasta nuestra casa.'}
            </p>
          </div>
        )}
      </div>
      {large ? (
        <div className="lp-map-footer">
          <span><i /> {showingGlobe ? 'Orbita terrestre' : showingOrigin ? 'Origen CTPI' : 'Mesa territorial'}</span>
          <span>
            {view === 'globe' || breaking
              ? 'VISTA / PLANETA'
              : view === 'campus'
                ? 'VISTA / CAMPUS CTPI'
                : activeKey
                  ? `REGIÓN / ${activeKey.toLocaleUpperCase('es')}`
                  : 'VISTA / NACIONAL'}
          </span>
          <span>
            {showingGlobe ? 'Pulsa A nosotros para romper el globo' : showingOrigin ? 'Popayán · Regional Cauca' : 'Cursor para explorar · Clic para fijar'}
          </span>
        </div>
      ) : null}
    </div>
  )

  if (large) return createPortal(map, document.body)
  return map
}
