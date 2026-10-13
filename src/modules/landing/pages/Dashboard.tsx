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

const offers = [
  {
    title: 'Formación Técnica',
    text: 'Adquiere habilidades prácticas para el mundo laboral.',
    icon: 'wrench' as const,
  },
  {
    title: 'Formación Tecnológica',
    text: 'Profundiza tus conocimientos y potencia tu futuro.',
    icon: 'monitor' as const,
  },
  {
    title: 'Cursos cortos',
    text: 'Aprende rápido, desarrolla tus habilidades.',
    icon: 'clock' as const,
  },
  {
    title: 'Formación complementaria',
    text: 'Fortalece tus competencias personales y profesionales.',
    icon: 'users' as const,
  },
]

const news = [
  {
    title: 'El SENA impulsa el talento joven con formación en tecnología.',
    image: '/img/noticia-tecnologia.jpg',
  },
  {
    title: 'Tecnologías emergentes para un mejor futuro laboral.',
    image: '/img/noticia-vr.jpg',
  },
  {
    title: 'El SENA fortalece el emprendimiento en las regiones.',
    image: '/img/noticia-emprendimiento.jpg',
  },
]

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
      <OpportunitySearch />
      <News />
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
  return (
    <section id="oferta" className="scroll-mt-8 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <h2 className="lp-h2 lp-h2-center text-[27px] lg:text-[32px]">
          Conoce nuestra oferta de formación
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {offers.map((offer) => (
            <article key={offer.title} className="lp-card flex flex-col px-6 py-7">
              <span className="lp-icon-tile">
                <Glyph name={offer.icon} />
              </span>
              <h3 className="mt-5 text-[18px] font-bold text-[#0a4030]">{offer.title}</h3>
              <p className="mt-2 mb-6 min-h-12 text-[14px] leading-6 text-[#5b7368]">{offer.text}</p>
              <a href="#buscar" className="lp-btn lp-btn-primary lp-btn-block mt-auto">
                Consultar programas
                <ArrowGlyph />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function OpportunitySearch() {
  return (
    <section id="buscar" className="scroll-mt-8 mx-auto max-w-7xl px-5 pb-16 lg:px-10">
      <h2 className="lp-h2 text-[27px] lg:text-[32px]">Encuentra oportunidades para ti</h2>
      <form
        className="lp-searchbar mt-8 grid gap-3 p-4 md:grid-cols-[1.5fr_repeat(3,0.85fr)_auto] md:items-center"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="flex items-center gap-3 rounded-xl bg-white px-3 ring-1 ring-[#d6eae0] transition focus-within:ring-2 focus-within:ring-[#0bb35f]/35">
          <SearchGlyph />
          <input
            type="search"
            placeholder="¿Qué quieres aprender?"
            className="h-12 w-full bg-transparent text-[14px] text-[#0a4030] outline-none placeholder:text-[#8a9a94]"
          />
        </label>
        <SelectField label="Programa" options={['Programa', 'Técnico', 'Tecnólogo', 'Curso corto']} />
        <SelectField label="Modalidad" options={['Modalidad', 'Presencial', 'Virtual', 'Combinada']} />
        <SelectField
          label="Ciudad o región"
          options={['Ciudad o región', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla']}
        />
        <button type="submit" className="lp-btn lp-btn-primary">
          Buscar oferta
          <ArrowGlyph />
        </button>
      </form>
    </section>
  )
}

function News() {
  return (
    <section id="noticias" className="scroll-mt-8 mx-auto max-w-7xl px-5 pb-16 lg:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="lp-h2 text-[27px] lg:text-[32px]">Noticias y actualidad</h2>
        <a href="#noticias" className="lp-section-link mt-2">
          Ver todas las noticias
          <ArrowGlyph />
        </a>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {news.map((item) => (
          <article key={item.title} className="lp-card overflow-hidden">
            <div className="relative">
              <img src={item.image} alt="" className="h-45 w-full object-cover" />
              <p className="lp-badge">Educación</p>
            </div>
            <div className="px-5 py-5">
              <h3 className="mt-0 text-[16px] font-bold leading-6 text-[#0a4030]">{item.title}</h3>
              <a href="#noticias" className="lp-section-link mt-3">
                Leer más
                <ArrowGlyph />
              </a>
            </div>
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

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select defaultValue={options[0]} className="lp-field">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function SearchGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-[#0a9e55]">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
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