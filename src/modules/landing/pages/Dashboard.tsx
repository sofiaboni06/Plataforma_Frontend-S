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
import SiteFooter from '@/modules/landing/components/SiteFooter'
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

const missionImages = [
  '/img/mision-1.jpg', // Reemplaza con tus rutas reales
  '/img/mision-2.jpg',
  '/img/mision-3.png',
];
const visionImages = [
  '/img/vision-1.jpg', // Reemplaza con tus rutas reales
  '/img/vision-2.png',
  '/img/vision-3.jpg',
];
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
    id: 'Mision',
    title: 'Misión',
    text: 'Centralizar y optimizar los procesos administrativos mediante una plataforma modular que facilite la gestión de la información y mejore la eficiencia institucional.',
    icon: 'target' as const,
    images: missionImages,
    gallery: true,
    backTitle: 'Nuestro propósito',
    back: [
      {
        icon: 'layers' as const,
        label: 'Integrar diferentes módulos administrativos',
      },
      {
        icon: 'database' as const,
        label: 'Centralizar y organizar la información',
      },
      {
        icon: 'zap' as const,
        label: 'Optimizar los procesos institucionales',
      },
    ],
  },
  {
    id: 'Vision',
    title: 'Visión',
    text: 'Ser una plataforma administrativa innovadora, segura y escalable, capaz de integrar nuevos módulos y responder a las necesidades futuras de la institución.',
    icon: 'eye' as const,
    images: visionImages,
    gallery: false,
    backTitle: 'Hacia dónde vamos',
    back: [
      {
        icon: 'trending-up' as const,
        label: 'Impulsar la mejora continua',
      },
      {
        icon: 'shield-check' as const,
        label: 'Fortalecer la seguridad de la información',
      },
      {
        icon: 'blocks' as const,
        label: 'Incorporar nuevos módulos administrativos',
      },
      {
        icon: 'lightbulb' as const,
        label: 'Promover la innovación tecnológica',
      },
    ],
  },
];


/* Número fijo de indicadores de posición del carrusel. */
const EXPLORE_DOT_COUNT = 3

const services = [
  { title: 'Formación', text: 'Accede a la oferta educativa del SENA.', icon: 'hat' as const },
  { title: 'Empleo', text: 'Conecta con nuevas oportunidades.', icon: 'briefcase' as const },
  { title: 'Emprendimiento', text: 'Convierte tus ideas en empresas.', icon: 'bulb' as const },
  { title: 'Certificación', text: 'Reconoce tus competencias.', icon: 'badge' as const },
  { title: 'Bienestar', text: 'Cuida tu salud física, mental y social.', icon: 'heart' as const },
]

function ImageCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div className="relative w-full h-48 sm:h-52 overflow-hidden group">
      {images.map((img, index) => (
        <img
          key={img}
          src={img}
          alt={`Foto ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {/* Degradado para que los puntos blancos se vean bien sobre fotos claras */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      
      {/* Indicadores */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setCurrentIndex(idx);
            }}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex ? 'bg-white w-4' : 'bg-white/60 w-1.5'
            }`}
            aria-label={`Ver imagen ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

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
          <ColombiaMap className="w-full max-w-full" />
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
  className="lp-card lp-flip-face lp-flip-front overflow-hidden bg-white/70"
>
  {/* 1. Imagen del carrusel arriba */}
  {card.images && <ImageCarousel images={card.images} />}

  {/* 2. Contenido de texto abajo */}
  <div className="px-6 py-6 flex flex-col relative bg-white/50 backdrop-blur-sm">
    {/* 3. Icono superpuesto */}
<span className="lp-icon-tile lp-explore-badge absolute -top-8 left-6 z-10">
  <Glyph name={card.icon} />
</span>
    
    {/* Espacio para que el título no choque con el icono */}
    <div className="pt-6">
      <h3 className="text-[20px] font-bold text-[#0a4030]">{card.title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-[#5b7368]">
        {card.text}
      </p>
    </div>

    <button
      type="button"
      onClick={() => setFlip(card.id, true)}
      aria-label={`Explorar ${card.title}`}
      className="lp-btn lp-btn-primary mt-6 w-fit px-6"
    >
      Explorar
      <ArrowGlyph />
    </button>
  </div>
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
 
 */
const simaCards = [
  { title: 'Panel central', icon: 'monitor' as const },
  { title: 'Módulos', icon: 'grid' as const },
  { title: 'Acceso seguro', icon: 'shield' as const },
]

function Sima() {
  return (
    <section id="sima" className="scroll-mt-8 mx-auto max-w-7xl px-5 pb-16 lg:px-10">
      <h2 className="lp-h2 text-[27px] lg:text-[32px]">SIGMA</h2>
      <p className="mt-3 text-[18px] font-bold text-[#0a4030]">
        SISTEMA INTEGRAL PARA LA GESTIÓN DE MÓDULOS
        <br />
        ADMINISTRATIVOS
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
  | 'target'
  | 'eye'
  | 'layers'
  | 'database'
  | 'zap'
  | 'trending-up'
  | 'shield-check'
  | 'blocks'
  | 'lightbulb'
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

  if (name === 'target') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    )
  }
  if (name === 'eye') {
    return (
      <svg {...common}>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'layers') {
    return (
      <svg {...common}>
        <path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'database') {
    return (
      <svg {...common}>
        <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'zap') {
    return (
      <svg {...common}>
        <path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'trending-up') {
    return (
      <svg {...common}>
        <path d="M3 17 9 11l4 4 8-8M15 7h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'blocks') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'lightbulb') {
    return (
      <svg {...common}>
        <path d="M9 18h6M10 21h4M8.5 14.5a6 6 0 1 1 7 0c-.8.6-1.2 1.3-1.2 2.5h-3.6c0-1.2-.4-1.9-1.2-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
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
  if (name === 'shield' || name === 'shield-check') {
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