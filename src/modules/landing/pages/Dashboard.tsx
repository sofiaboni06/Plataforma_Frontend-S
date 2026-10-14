import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import CategoryCard from '@/modules/landing/components/CategoryCard'
import ColombiaMap from '@/modules/landing/components/ColombiaMap'
import Header from '@/modules/landing/components/Header'
import Hero from '@/modules/landing/components/Hero'
import ProgramCard from '@/modules/landing/components/ProgramCard'
import '@/modules/landing/styles/landing.css'

const categories = [
  { title: 'Formación', description: 'Técnica y Tecnológica', icon: 'training' },
  { title: 'Educación', description: 'para el Trabajo', icon: 'education' },
  { title: 'Innovación', description: 'y Emprendimiento', icon: 'innovation' },
  { title: 'Presencia en', description: 'todo el territorio', icon: 'territory' },
] as const

const programs = [
  { title: 'Café', description: 'Formación técnica', image: '/img/programa-cafe.jpg', branded: false },
  { title: 'Chocolate', description: 'y afines', image: '/img/programa-chocolate.jpg', branded: false },
  {
    title: 'Gestión Ambiental',
    description: 'y Sostenibilidad',
    image: '/img/programa-ambiental.jpg',
    branded: false,
  },
  {
    title: 'Tecnologías de la',
    description: 'Información',
    image: '/img/programa-tecnologia.jpg',
    branded: true,
  },
]

const presence = [
  {
    title: 'Presencia nacional',
    text: 'En todo el territorio colombiano.',
    icon: 'pin' as const,
  },
  {
    title: 'Centros de formación',
    text: 'Para aprender y crecer.',
    icon: 'building' as const,
  },
  {
    title: 'Oferta educativa',
    text: 'En diferentes áreas del conocimiento.',
    icon: 'hat' as const,
  },
  {
    title: 'Regionales',
    text: 'En cada zona del país.',
    icon: 'people' as const,
  },
]

/**
 * Tarjetas de la sección "Explora y conéctate".
 *
 * La información adicional vive en la cara posterior de cada tarjeta
 * (efecto flip 3D): no hay navegación ni rutas nuevas. Todo el contenido
 * posterior es descriptivo o demostrativo; no existen datos reales de
 * proyectos, cursos, publicaciones, eventos ni usuarios en el backend.
 */
const exploreCards = [
  {
    id: 'proyectos',
    title: 'Proyectos de aprendices',
    text: 'Descubre proyectos innovadores creados por aprendices e instructores de todo el país.',
    icon: 'bulb' as const,
    gallery: true,
    backTitle: 'Lo que encontrarás',
    back: [
      { icon: 'badge' as const, label: 'Nombre del proyecto y programa asociado' },
      { icon: 'wrench' as const, label: 'Descripción del problema que resuelve' },
      { icon: 'monitor' as const, label: 'Tecnologías utilizadas' },
    ],
  },
  {
    id: 'comunidad',
    title: 'Comunidad SENA',
    text: 'Conecta, colabora y comparte con otros aprendices.',
    icon: 'users' as const,
    gallery: false,
    backTitle: 'Lo que encontrarás',
    back: [
      { icon: 'users' as const, label: 'Grupos por programa y especialidad' },
      { icon: 'people' as const, label: 'Publicaciones y preguntas' },
      { icon: 'pin' as const, label: 'Encuentra compañeros de estudio' },
      { icon: 'briefcase' as const, label: 'Equipos para proyectos colaborativos' },
    ],
  },
  {
    id: 'academyex',
    title: 'AcademyEX',
    text: 'Cursos, rutas y contenidos digitales para potenciar tus habilidades.',
    icon: 'monitor' as const,
    gallery: false,
    backTitle: 'Lo que encontrarás',
    back: [
      { icon: 'hat' as const, label: 'Cursos disponibles' },
      { icon: 'pin' as const, label: 'Rutas de aprendizaje' },
      { icon: 'monitor' as const, label: 'Contenidos digitales' },
      { icon: 'bulb' as const, label: 'Cómo acceder a los recursos formativos' },
    ],
  },
  {
    id: 'agenda',
    title: 'Mi agenda SENA',
    text: 'Todas tus actividades, entregas, evaluaciones y eventos en un solo lugar.',
    icon: 'clock' as const,
    gallery: false,
    backTitle: 'Lo que encontrarás',
    back: [
      { icon: 'clock' as const, label: 'Calendario semanal y mensual' },
      { icon: 'briefcase' as const, label: 'Actividades y entregas' },
      { icon: 'badge' as const, label: 'Evaluaciones y tutorías' },
      { icon: 'pin' as const, label: 'Eventos del centro de formación' },
      { icon: 'heart' as const, label: 'Recordatorios personales' },
    ],
  },
  {
    id: 'perfil',
    title: 'Mi perfil de competencias',
    text: 'Construye tu portafolio y muestra tus habilidades y proyectos.',
    icon: 'badge' as const,
    gallery: false,
    backTitle: 'Lo que encontrarás',
    back: [
      { icon: 'wrench' as const, label: 'Habilidades técnicas y personales' },
      { icon: 'briefcase' as const, label: 'Portafolio de proyectos' },
      { icon: 'monitor' as const, label: 'Herramientas y tecnologías que dominas' },
      { icon: 'heart' as const, label: 'Competencias por fortalecer' },
    ],
  },
  {
    id: 'ayuda',
    title: 'Centro de ayuda inteligente',
    text: 'Resuelve tus dudas, consulta guías y recibe orientación personalizada.',
    icon: 'heart' as const,
    gallery: false,
    backTitle: 'Lo que encontrarás',
    back: [
      { icon: 'monitor' as const, label: 'Buscador de preguntas frecuentes' },
      { icon: 'hat' as const, label: 'Guías paso a paso' },
      { icon: 'building' as const, label: 'Orientación sobre trámites' },
      { icon: 'people' as const, label: 'Canales oficiales de atención' },
    ],
  },
]

/* Número fijo de indicadores de posición del carrusel. */
const EXPLORE_DOT_COUNT = 3

const services = [
  { title: 'Formación', text: 'Accede a la oferta educativa del SENA.', icon: 'hat' as const },
  { title: 'Empleo', text: 'Conecta con nuevas oportunidades.', icon: 'briefcase' as const },
  { title: 'Emprendimiento', text: 'Convierte tus ideas en empresas.', icon: 'bulb' as const },
  { title: 'Certificación', text: 'Reconoce tus competencias.', icon: 'badge' as const },
  { title: 'Bienestar', text: 'Cuida tu salud física, mental y social.', icon: 'heart' as const },
]

const footerColumns = [
  {
    title: 'Institucional',
    links: ['Quiénes somos', 'Misión y visión', 'Transparencia'],
  },
  {
    title: 'Atención al ciudadano',
    links: ['PQRS', 'Trámites y servicios', 'Canales de atención'],
  },
  {
    title: 'Transparencia',
    links: ['Datos abiertos', 'Contratación', 'Rendición de cuentas'],
  },
  {
    title: 'Operación',
    links: ['Sede principal', 'Línea de atención', 'Correo institucional'],
  },
]

export default function Dashboard() {
  return (
    <main className="lp-root min-h-screen overflow-x-clip font-sans">
      <Header />
      <Hero />
      <Categories />
      <Programs />
      <Colombia />
      <FormationOffer />
      <Sima />
      <Services />
      <FutureBanner />
      <SiteFooter />
    </main>
  )
}

function Categories() {
  return (
    <section className="lp-cats relative z-20 mx-auto -mt-12 max-w-7xl px-5 lg:px-10">
      <div className="lp-card lp-cat-band grid overflow-hidden rounded-[26px] md:grid-cols-4">
        {categories.map((category, index) => (
          <CategoryCard
            key={category.title}
            title={category.title}
            description={category.description}
            icon={category.icon}
            last={index === categories.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

function Programs() {
  return (
    <section id="programas" className="mx-auto max-w-7xl px-5 pb-16 pt-16 lg:px-10 lg:pt-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="lp-h2 text-[27px] lg:text-[32px]">Nuestros programas destacados</h2>
        <a href="#programas" className="lp-section-link mt-2">
          Ver todos los programas
          <ArrowGlyph />
        </a>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {programs.map((program) => (
          <ProgramCard
            key={program.title}
            title={program.title}
            description={program.description}
            image={program.image}
            branded={program.branded}
          />
        ))}
      </div>
    </section>
  )
}

function Colombia() {
  return (
    <section id="sedes" className="scroll-mt-8 mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr_1fr]">
        <div>
          <h2 className="lp-h2 text-[27px] lg:text-[32px]">El SENA en Colombia</h2>
          <p className="mt-6 max-w-90 text-[16px] leading-7 text-[#5b7368]">
            Estamos presentes en todo el territorio nacional, llevando formación de calidad
            a cada región del país y contribuyendo al desarrollo de las comunidades.
          </p>
          <a href="#contacto" className="lp-btn lp-btn-ghost mt-6">
            Conoce más sobre el SENA
            <ArrowGlyph />
          </a>
        </div>

        {/* Contenedor del mapa. No se aplica ningún estilo a `ColombiaMap`
            ni a sus elementos internos: solo se decora la caja que lo envuelve. */}
        <div className="lp-map-card">
          <ColombiaMap className="h-80 w-auto max-w-full lg:h-90" />
        </div>

        <ul className="space-y-4">
          {presence.map((item) => (
            <li key={item.title} className="lp-mini-card">
              <span className="lp-icon-tile size-11 rounded-full">
                <Glyph name={item.icon} />
              </span>
              <div>
                <p className="text-[15px] font-bold text-[#0a4030]">{item.title}</p>
                <p className="mt-0.5 text-[13px] leading-5 text-[#5b7368]">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function FormationOffer() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const resumeTimer = useRef<number | null>(null)
  const userPaused = useRef(false)
  const [position, setPosition] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const [reduceMotion, setReduceMotion] = useState(false)

  const maxPosition = Math.max(0, exploreCards.length - visibleCount)
  /* Posición segura derivada durante el render (evita setState en efecto). */
  const safePosition = Math.min(position, maxPosition)

  const scrollToPosition = useCallback(
    (target: number, smooth = true) => {
      const clamped = Math.min(Math.max(target, 0), maxPosition)
      setPosition(clamped)
      const viewport = viewportRef.current
      const slide = viewport?.children.item(clamped) as HTMLElement | null
      if (viewport && slide) {
        viewport.scrollTo({
          left: slide.offsetLeft,
          behavior: smooth && !reduceMotion ? 'smooth' : 'auto',
        })
      }
    },
    [maxPosition, reduceMotion],
  )

  const goTo = useCallback(
    (target: number) => {
      const wrapped = target < 0 ? maxPosition : target > maxPosition ? 0 : target
      scrollToPosition(wrapped)
    },
    [maxPosition, scrollToPosition],
  )

  /* Sincroniza el indicador cuando el usuario desplaza manualmente. */
  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    let nearest = 0
    let best = Number.POSITIVE_INFINITY
    for (let index = 0; index < viewport.children.length; index += 1) {
      const slide = viewport.children.item(index) as HTMLElement | null
      if (!slide) continue
      const distance = Math.abs(slide.offsetLeft - viewport.scrollLeft)
      if (distance < best) {
        best = distance
        nearest = Math.min(index, maxPosition)
      }
    }
    setPosition((previous) => (previous === nearest ? previous : nearest))
  }, [maxPosition])

  /* Pausa el avance automático mientras el usuario interactúa o enfoca. */
  const pauseAutoplay = useCallback(() => {
    userPaused.current = true
    if (resumeTimer.current !== null) {
      window.clearTimeout(resumeTimer.current)
      resumeTimer.current = null
    }
  }, [])

  /* Reanuda tras un periodo de inactividad razonable (4 s). */
  const scheduleResume = useCallback(() => {
    if (resumeTimer.current !== null) {
      window.clearTimeout(resumeTimer.current)
    }
    resumeTimer.current = window.setTimeout(() => {
      userPaused.current = false
      resumeTimer.current = null
    }, 4000)
  }, [])

  /* Giro independiente por tarjeta: abrir una no afecta a las demás. */
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const flippedCount = exploreCards.reduce(
    (count, card) => count + (flipped[card.id] ? 1 : 0),
    0,
  )

  const setFlip = useCallback(
    (id: string, value: boolean) => {
      setFlipped((previous) => (previous[id] === value ? previous : { ...previous, [id]: value }))
      /* Al voltear se pausa el carrusel para leer; al volver se reanuda
         tras inactividad. El intervalo además ignora tarjetas volteadas. */
      if (value) {
        pauseAutoplay()
      } else {
        scheduleResume()
      }
    },
    [pauseAutoplay, scheduleResume],
  )

  /* Tres indicadores fijos: mapeo proporcional entre puntos y posiciones. */
  const dotToPosition = useCallback(
    (dot: number) => Math.round((dot * maxPosition) / (EXPLORE_DOT_COUNT - 1)),
    [maxPosition],
  )
  const activeDot =
    maxPosition === 0
      ? 0
      : Math.min(
          EXPLORE_DOT_COUNT - 1,
          Math.max(0, Math.round((safePosition * (EXPLORE_DOT_COUNT - 1)) / maxPosition)),
        )

  /* Arrastre con el ratón (el táctil usa el desplazamiento nativo).
     Solo se activa con el botón izquierdo y tras superar un umbral,
     para no interferir con clics ni con la selección de texto. */
  const dragState = useRef<{ startX: number; startLeft: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      const viewport = viewportRef.current
      if (!viewport) return
      dragState.current = { startX: event.clientX, startLeft: viewport.scrollLeft, moved: false }
      pauseAutoplay()
    },
    [pauseAutoplay],
  )

  const handleDragMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current
    const viewport = viewportRef.current
    if (!drag || !viewport) return
    const delta = event.clientX - drag.startX
    if (!drag.moved && Math.abs(delta) > 6) {
      drag.moved = true
      viewport.classList.add('is-dragging')
      try {
        viewport.setPointerCapture(event.pointerId)
      } catch {
        /* La captura de puntero puede no estar disponible: el arrastre sigue funcionando. */
      }
    }
    if (drag.moved) {
      viewport.scrollLeft = drag.startLeft - delta
    }
  }, [])

  const endDrag = useCallback(() => {
    const drag = dragState.current
    dragState.current = null
    if (!drag) return
    viewportRef.current?.classList.remove('is-dragging')
    /* Un arrastre real no debe activar «Explorar»: se suprime ese clic. */
    if (drag.moved) {
      suppressClick.current = true
    }
    scheduleResume()
  }, [scheduleResume])

  const handleClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false
      event.preventDefault()
      event.stopPropagation()
    }
  }, [])

  /* Visible count + preferencia de movimiento reducido. */
  useEffect(() => {
    const computeVisible = () => {
      const width = window.innerWidth
      setVisibleCount(width < 640 ? 1 : width < 1024 ? 2 : 3)
    }
    computeVisible()
    window.addEventListener('resize', computeVisible)

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setReduceMotion(media.matches)
    syncMotion()
    media.addEventListener('change', syncMotion)

    return () => {
      window.removeEventListener('resize', computeVisible)
      media.removeEventListener('change', syncMotion)
    }
  }, [])

  /* Avance automático lento; se limpia al desmontar. No avanza mientras
     alguna tarjeta esté volteada para no ocultar su información. */
  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      if (userPaused.current || document.hidden || flippedCount > 0) return
      goTo(safePosition + 1)
    }, 5000)
    return () => window.clearInterval(id)
  }, [goTo, safePosition, reduceMotion, flippedCount])

  /* Limpia el temporizador de reanudación al desmontar. */
  useEffect(
    () => () => {
      if (resumeTimer.current !== null) {
        window.clearTimeout(resumeTimer.current)
      }
    },
    [],
  )

  return (
    <section id="oferta" aria-labelledby="explora-titulo" className="scroll-mt-8 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <h2 id="explora-titulo" className="lp-h2 lp-h2-center text-[27px] lg:text-[32px]">
          Explora y conéctate
        </h2>

        <div
          ref={viewportRef}
          onScroll={handleScroll}
          onPointerEnter={pauseAutoplay}
          onPointerLeave={scheduleResume}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onTouchStart={pauseAutoplay}
          onTouchEnd={scheduleResume}
          onClickCapture={handleClickCapture}
          onFocusCapture={pauseAutoplay}
          onBlurCapture={scheduleResume}
          role="region"
          aria-roledescription="carrusel"
          aria-label="Explora y conéctate"
          className="lp-explore-viewport mt-10"
        >
          {exploreCards.map((card, index) => {
            const isFlipped = flipped[card.id] === true
            return (
              <div
                key={card.id}
                role="group"
                aria-roledescription="diapositiva"
                aria-label={`${index + 1} de ${exploreCards.length}: ${card.title}`}
                className="lp-explore-slide"
              >
                <div className={`lp-flip-inner${isFlipped ? ' is-flipped' : ''}`}>
                  <article
                    aria-hidden={isFlipped}
                    inert={isFlipped}
                    className="lp-card lp-flip-face lp-flip-front flex flex-col px-6 py-7"
                  >
                    <span className="lp-icon-tile">
                      <Glyph name={card.icon} />
                    </span>
                    <h3 className="mt-5 text-[18px] font-bold text-[#0a4030]">{card.title}</h3>
                    <p className="mt-2 mb-6 min-h-12 text-[14px] leading-6 text-[#5b7368]">
                      {card.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFlip(card.id, true)}
                      aria-label={`Explorar ${card.title}`}
                      className="lp-btn lp-btn-primary lp-btn-block mt-auto"
                    >
                      Explorar
                      <ArrowGlyph />
                    </button>
                  </article>
                  <article
                    aria-hidden={!isFlipped}
                    inert={!isFlipped}
                    aria-label={`${card.title}: ${card.backTitle}`}
                    className="lp-card lp-flip-face lp-flip-back flex flex-col px-6 py-7"
                  >
                    <div className="flex items-center gap-3">
                      <span className="lp-icon-tile lp-explore-tile">
                        <Glyph name={card.icon} />
                      </span>
                      <p className="lp-explore-back-title">{card.backTitle}</p>
                    </div>
                    <p className="lp-explore-demo">Contenido demostrativo</p>
                    {card.gallery ? (
                      <div className="lp-explore-gallery" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                    <ul className="lp-explore-back-list">
                      {card.back.map((item) => (
                        <li key={item.label} className="lp-explore-back-item">
                          <Glyph name={item.icon} />
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setFlip(card.id, false)}
                      aria-label={`Volver a ${card.title}`}
                      className="lp-btn lp-btn-ghost lp-btn-block mt-auto"
                    >
                      Volver
                      <span className="inline-flex rotate-180">
                        <ArrowGlyph />
                      </span>
                    </button>
                  </article>
                </div>
              </div>
            )
          })}
        </div>

        {maxPosition > 0 ? (
          <div className="lp-explore-controls mt-8">
            <div role="tablist" aria-label="Posición del carrusel" className="lp-explore-dots">
              {Array.from({ length: EXPLORE_DOT_COUNT }).map((_, dot) => (
                <button
                  key={`explore-dot-${dot}`}
                  type="button"
                  role="tab"
                  onClick={() => goTo(dotToPosition(dot))}
                  aria-label={`Ir a la posición ${dot + 1} de ${EXPLORE_DOT_COUNT}`}
                  aria-selected={dot === activeDot}
                  className={`lp-explore-dot${dot === activeDot ? ' is-active' : ''}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/**
 * SIMA — Sistema Integral de Módulos Administrativos.
 * Ocupa el lugar de las anteriores secciones de búsqueda y noticias.
 * Las tarjetas son visuales: no existen destinos SIMA implementados y no se
 * les atribuyen acciones ni rutas inexistentes.
 */
const simaCards = [
  { title: 'Panel central', icon: 'monitor' as const },
  { title: 'Módulos', icon: 'grid' as const },
  { title: 'Acceso seguro', icon: 'shield' as const },
]

function Sima() {
  return (
    <section id="sima" className="scroll-mt-8 mx-auto max-w-7xl px-5 pb-16 lg:px-10">
      <h2 className="lp-h2 text-[27px] lg:text-[32px]">SIMA</h2>
      <p className="mt-3 text-[18px] font-bold text-[#0a4030]">
        Sistema Integral de Módulos Administrativos
      </p>
      <p className="mt-3 max-w-170 text-[16px] leading-7 text-[#5b7368]">
        Una plataforma, múltiples soluciones.
      </p>
      <p className="mt-1 max-w-170 text-[16px] leading-7 text-[#5b7368]">
        Centraliza la gestión administrativa, facilita el acceso a los módulos
        institucionales y optimiza los procesos de la comunidad SENA.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {simaCards.map((card) => (
          <article key={card.title} className="lp-card px-6 py-8 text-center">
            <span className="lp-icon-tile mx-auto">
              <Glyph name={card.icon} />
            </span>
            <h3 className="mt-4 text-[17px] font-bold text-[#0a4030]">{card.title}</h3>
          </article>
        ))}
      </div>
    </section>
  )
}

function Services() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-10">
      <h2 className="lp-h2 text-[27px] lg:text-[32px]">Servicios para la ciudadanía</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {services.map((service) => (
          <article key={service.title} className="lp-card px-5 py-6 text-center">
            <span className="lp-icon-tile mx-auto rounded-full">
              <Glyph name={service.icon} />
            </span>
            <h3 className="mt-4 text-[15px] font-bold text-[#0a4030]">{service.title}</h3>
            <p className="mt-1 text-[13px] leading-5 text-[#5b7368]">{service.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function FutureBanner() {
  return (
    <section className="relative overflow-hidden">
      <img
        src="/img/cta-futuro.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="lp-cta-scrim" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
        <p className="lp-eyebrow">SENA</p>
        <h2 className="mt-3 max-w-130 text-[30px] font-extrabold leading-tight text-white lg:text-[40px]">
          Construye tu futuro con el SENA
        </h2>
        <p className="mt-3 max-w-130 text-[16px] leading-7 text-white/90">
          Únete a nuestra misión. Formación gratuita y de calidad para que llegues más lejos.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#oferta" className="lp-btn lp-btn-primary">
            Explorar oferta de formación
            <ArrowGlyph />
          </a>
          <a href="#sedes" className="lp-btn lp-btn-outline-dark">
            Conocer el SENA
          </a>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer id="contacto" className="lp-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.05fr_repeat(5,1fr)] lg:px-10">
        <div>
          <img src="/img/logo-sena.svg" alt="SENA" className="h-14 w-auto object-contain" />
          <p className="mt-4 max-w-55 text-[13px] leading-5">
            Servicio Nacional de Aprendizaje. Formación gratuita y de calidad para quien la necesita.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="text-[14px] font-bold text-white">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#contacto" className="text-[13px] transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-[14px] font-bold text-white">Síguenos en</p>
          <div className="mt-3 flex gap-2">
            <a href="#contacto" className="lp-social" aria-label="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z" />
              </svg>
            </a>
            <a href="#contacto" className="lp-social" aria-label="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
              </svg>
            </a>
            <a href="#contacto" className="lp-social" aria-label="X">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.8 3H20l-6.2 7.1L21 21h-5.5l-4.3-6.3L6.2 21H4l6.7-7.6L3 3h5.6l3.9 5.8L17.8 3Zm-1 16.2h1.5L7.3 4.7H5.7l11.1 14.5Z" />
              </svg>
            </a>
            <a href="#contacto" className="lp-social" aria-label="YouTube">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM10 15.2V9.2l5.2 3-5.2 3Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-[12px] text-white/70 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© 2025 Servicio Nacional de Aprendizaje - SENA. Todos los derechos reservados.</p>
          <p>El SENA es un establecimiento público del orden nacional, adscrito al Ministerio del Trabajo.</p>
        </div>
      </div>
    </footer>
  )
}

function ArrowGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type GlyphName =
  | 'pin'
  | 'building'
  | 'hat'
  | 'people'
  | 'wrench'
  | 'monitor'
  | 'clock'
  | 'users'
  | 'briefcase'
  | 'bulb'
  | 'badge'
  | 'heart'
  | 'grid'
  | 'shield'

function Glyph({ name }: { name: GlyphName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true as const,
  }

  if (name === 'pin') {
    return (
      <svg {...common}>
        <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'building') {
    return (
      <svg {...common}>
        <path d="M4 20V8l8-4 8 4v12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'hat') {
    return (
      <svg {...common}>
        <path d="M3 10 12 5l9 5-9 5-9-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 12.5v4.2c2 1.4 8 1.4 10 0v-4.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'people' || name === 'users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="9" r="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.5 18c.8-2.8 2.6-4.2 4.8-4.2 2.2 0 4 1.4 4.8 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M14 14.2c1.8 0 3.3 1 4 3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'wrench') {
    return (
      <svg {...common}>
        <path d="M14.5 6.5a4 4 0 0 1 3 3L11 16l-3-3 6.5-6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 13 5 20l7-3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'monitor') {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'briefcase') {
    return (
      <svg {...common}>
        <rect x="3.5" y="8" width="17" height="11" rx="1.8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'bulb') {
    return (
      <svg {...common}>
        <path d="M9 18h6M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.4 10.6c0-2.2 1.6-4.1 3.6-4.1s3.6 1.9 3.6 4.1c0 1.6-.7 2.6-1.7 3.5-.6.5-.9 1.1-.9 1.9h-2c0-.8-.3-1.4-.9-1.9-1-1-1.7-1.9-1.7-3.5Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'badge') {
    return (
      <svg {...common}>
        <circle cx="12" cy="10" r="5.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="m8.5 14.5-1.5 6 5-2.2 5 2.2-1.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'grid') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'shield') {
    return (
      <svg {...common}>
        <path
          d="M12 3.5 5.5 6v5.2c0 4.3 2.8 7.2 6.5 8.8 3.7-1.6 6.5-4.5 6.5-8.8V6L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="m9.4 11.6 1.9 1.9 3.4-3.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path
        d="M12 20s-7-4.6-7-10a4.4 4.4 0 0 1 7-3.4A4.4 4.4 0 0 1 19 10c0 5.4-7 10-7 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}