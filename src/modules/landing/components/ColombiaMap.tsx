/*
 * Mapa interactivo de presencia SENA.
 * El SVG de departamentos se inyecta para poder resaltar cada territorio
 * al pasar el cursor y mostrar la regional y su ciudad sede.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const [active, setActive] = useState<Sede | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [large, setLarge] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!large || !host) return
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
          const show = () => {
            host.querySelectorAll('.lp-dep.is-active').forEach((node) => node.classList.remove('is-active'))
            path.classList.add('is-active')
            const box = path.getBBox()
            const cx = ((box.x + box.width / 2) / 1024) * 100
            const cy = ((box.y + box.height / 2) / 1024) * 100
            const span = Math.max(box.width, box.height)
            const level = Math.min(2.15, Math.max(1.35, 340 / span))
            zoom.style.transformOrigin = `${cx}% ${cy}%`
            zoom.style.transform = `scale(${level})`
            setActive(sede)
            requestAnimationFrame(() => {
              const stage = stageRef.current?.getBoundingClientRect()
              const rect = path.getBoundingClientRect()
              if (!stage) return
              const baseX = rect.left + rect.width / 2 - stage.left
              const baseY = rect.top + rect.height / 2 - stage.top
              setPins(
                sede.centros.map((centro, index) => {
                  const [dx, dy] = PIN_SPREAD[index] ?? PIN_SPREAD[0]
                  return { nombre: centro.nombre, x: baseX + dx, y: baseY + dy }
                }),
              )
            })
          }
          path.addEventListener('pointerenter', show)
          path.addEventListener('focus', show)
        })
      })
      .catch(() => {
        /* El mapa queda vacío si el SVG no carga; el texto de la sección sigue visible. */
      })

    return () => {
      cancelled = true
      host.innerHTML = ''
    }
  }, [large])

  useEffect(() => {
    if (!large) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLarge(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [large])

  const close = () => {
    const zoom = zoomRef.current
    hostRef.current?.querySelectorAll('.lp-dep.is-active').forEach((node) => node.classList.remove('is-active'))
    if (zoom) zoom.style.transform = 'scale(1)'
    setPins([])
    setActive(null)
  }

  const map = (
    <div
      className={`lp-colombia${active ? ' is-open' : ''}${large ? ' is-large' : ''} ${className}`}
      onPointerLeave={large ? undefined : close}
    >
      <div className="lp-map-toolbar">
        <button type="button" className="lp-screen-btn" onClick={() => setLarge((value) => !value)}>
          {large ? 'Cerrar' : 'Pantalla grande'}
        </button>
      </div>
      <div ref={stageRef} className="lp-colombia-stage">
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
        {pins.map((pin, index) => (
          <span
            key={`${pin.nombre}-${index}`}
            className="lp-pin"
            style={{ left: pin.x, top: pin.y, animationDelay: `${index * 45}ms` }}
          >
            <PinIcon />
            <em>{pin.nombre}</em>
          </span>
        ))}
      </div>
      <div className={`lp-sede-card${active ? ' is-visible' : ''}`} aria-live="polite">
        {active ? (
          <>
            <p className="lp-sede-kicker">
              {active.ciudad} · {active.centros.length} {active.centros.length === 1 ? 'sede' : 'sedes'}
            </p>
            <p className="lp-sede-city">Regional {active.regional}</p>
            <ul className="lp-sede-list">
              {active.centros.map((centro) => (
                <li key={centro.nombre}>
                  <PinIcon />
                  <span>
                    {centro.nombre}
                    <small>{centro.lugar}</small>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="lp-sede-hint">Abre pantalla grande y pasa el cursor por una ciudad</p>
        )}
      </div>
    </div>
  )

  if (large) return createPortal(map, document.body)
  return map
}
