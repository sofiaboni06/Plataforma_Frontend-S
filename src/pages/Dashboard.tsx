import CategoryCard from '../components/CategoryCard'
import ColombiaMap from '../components/ColombiaMap'
import Header from '../components/Header'
import Hero from '../components/Hero'
import ProgramCard from '../components/ProgramCard'

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
    <main className="min-h-screen overflow-x-hidden bg-white font-sans text-[#173e4e]">
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
    <section className="relative z-20 mx-auto -mt-10 max-w-[1180px] px-5 lg:px-8">
      <div className="grid overflow-hidden rounded-[22px] border border-[#dfe7e2] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.08)] md:grid-cols-4">
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
    <section className="mx-auto max-w-[1180px] px-5 pb-6 pt-10 lg:px-8">
      <h2 className="mb-6 text-[28px] font-bold tracking-tight text-[#0a4b43]">
        Nuestros programas destacados
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
    <section id="sedes" className="scroll-mt-8 mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr_1fr]">
        <div>
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0a4b43]">
            El SENA en Colombia
          </h2>
          <p className="mt-4 max-w-[360px] text-[16px] leading-7 text-[#5d6f68]">
            Estamos presentes en todo el territorio nacional, llevando formación de calidad
            a cada región del país y contribuyendo al desarrollo de las comunidades.
          </p>
          <a href="#contacto" className="mt-6 inline-flex items-center text-[15px] font-semibold text-[#0b925f]">
            Conoce más sobre el SENA
            <span className="ml-2">→</span>
          </a>
        </div>

        <div className="flex justify-center">
          <ColombiaMap className="h-[320px] w-auto max-w-full lg:h-[360px]" />
        </div>

        <ul className="space-y-5">
          {presence.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-[#eef8f1] text-[#0b925f]">
                <Glyph name={item.icon} />
              </span>
              <div>
                <p className="font-bold text-[#0a4b43]">{item.title}</p>
                <p className="text-[14px] leading-5 text-[#5d6f68]">{item.text}</p>
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
    <section id="oferta" className="scroll-mt-8 bg-[#f5f8f6] py-16">
      <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
        <h2 className="text-center text-[32px] font-bold tracking-tight text-[#0a4b43]">
          Conoce nuestra oferta de formación
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {offers.map((offer) => (
            <article
              key={offer.title}
              className="rounded-[18px] bg-white px-6 py-7 shadow-[0_4px_18px_rgba(10,34,28,0.06)]"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-[#eef8f1] text-[#0b925f]">
                <Glyph name={offer.icon} />
              </span>
              <h3 className="mt-5 text-[20px] font-bold text-[#0a4b43]">{offer.title}</h3>
              <p className="mt-2 min-h-[48px] text-[14px] leading-6 text-[#5d6f68]">{offer.text}</p>
              <a href="#buscar" className="mt-5 inline-flex items-center text-[14px] font-semibold text-[#0b925f]">
                Consultar programas
                <span className="ml-1">→</span>
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
    <section id="buscar" className="scroll-mt-8 mx-auto max-w-[1180px] px-5 py-16 lg:px-8">
      <h2 className="text-center text-[32px] font-bold tracking-tight text-[#0a4b43]">
        Encuentra oportunidades para ti
      </h2>
      <form
        className="mt-8 grid gap-3 rounded-[18px] border border-[#dce6e0] bg-[#f8fbf9] p-3 shadow-sm md:grid-cols-[1.4fr_repeat(3,0.9fr)_auto] md:items-center md:p-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
          <SearchGlyph />
          <input
            type="search"
            placeholder="¿Qué quieres aprender?"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8a9a94]"
          />
        </label>
        <SelectField label="Programa" options={['Programa', 'Técnico', 'Tecnólogo', 'Curso corto']} />
        <SelectField label="Modalidad" options={['Modalidad', 'Presencial', 'Virtual', 'Combinada']} />
        <SelectField
          label="Ciudad o región"
          options={['Ciudad o región', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla']}
        />
        <button
          type="submit"
          className="h-[48px] rounded-xl bg-[#0b925f] px-5 text-[14px] font-bold text-white transition hover:brightness-105"
        >
          Buscar oferta
        </button>
      </form>
    </section>
  )
}

function News() {
  return (
    <section id="noticias" className="scroll-mt-8 mx-auto max-w-[1180px] px-5 pb-16 lg:px-8">
      <h2 className="text-[32px] font-bold tracking-tight text-[#0a4b43]">Noticias y actualidad</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {news.map((item) => (
          <article
            key={item.title}
            className="overflow-hidden rounded-[16px] border border-[#e4eee8] bg-white shadow-[0_4px_16px_rgba(10,34,28,0.05)]"
          >
            <img src={item.image} alt="" className="h-[180px] w-full object-cover" />
            <div className="px-5 py-5">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0b925f]">Educación</p>
              <h3 className="mt-2 text-[17px] font-bold leading-6 text-[#0a4b43]">{item.title}</h3>
              <a href="#noticias" className="mt-4 inline-flex items-center text-[14px] font-semibold text-[#0b925f]">
                Leer más
                <span className="ml-1">→</span>
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
    <section className="mx-auto max-w-[1180px] px-5 pb-16 lg:px-8">
      <h2 className="text-[32px] font-bold tracking-tight text-[#0a4b43]">Servicios para la ciudadanía</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {services.map((service) => (
          <article
            key={service.title}
            className="rounded-[16px] border border-[#e4eee8] bg-white px-5 py-6 text-center shadow-[0_2px_10px_rgba(10,34,28,0.04)]"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#eef8f1] text-[#0b925f]">
              <Glyph name={service.icon} />
            </span>
            <h3 className="mt-4 text-[16px] font-bold text-[#0a4b43]">{service.title}</h3>
            <p className="mt-1 text-[13px] leading-5 text-[#5d6f68]">{service.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function FutureBanner() {
  return (
    <section className="relative overflow-hidden bg-[#123c2c]">
      <img
        src="/img/cta-futuro.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[#06281c]/72" />
      <div className="relative mx-auto max-w-[1180px] px-5 py-16 lg:px-8 lg:py-20">
        <h2 className="max-w-[520px] text-[34px] font-extrabold leading-tight text-white lg:text-[40px]">
          Construye tu futuro con el SENA
        </h2>
        <p className="mt-3 max-w-[520px] text-[16px] leading-7 text-white/90">
          Únete a nuestra misión. Formación gratuita y de calidad para que llegues más lejos.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#oferta"
            className="inline-flex h-[48px] items-center rounded-full bg-[#f7931e] px-6 text-[15px] font-bold text-white"
          >
            Explorar oferta de formación
            <span className="ml-2">→</span>
          </a>
          <a
            href="#sedes"
            className="inline-flex h-[48px] items-center rounded-full border border-white/80 px-6 text-[15px] font-semibold text-white"
          >
            Conocer el SENA
          </a>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer id="contacto" className="bg-[#013d2c] text-white">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.05fr_repeat(5,1fr)] lg:px-8">
        <div>
          <img src="/img/logo-sena.svg" alt="SENA" className="h-16 w-auto object-contain" />
          <p className="mt-4 max-w-[220px] text-[13px] leading-5 text-white/75">
            Servicio Nacional de Aprendizaje. Formación gratuita y de calidad para quien la necesita.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="text-[14px] font-bold">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#contacto" className="text-[13px] text-white/75 hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-[14px] font-bold">Síguenos en</p>
          <div className="mt-3 flex gap-2">
            <a href="#contacto" className="grid size-8 place-items-center rounded-full bg-white/10 text-white" aria-label="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.4C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z" />
              </svg>
            </a>
            <a href="#contacto" className="grid size-8 place-items-center rounded-full bg-white/10 text-white" aria-label="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
              </svg>
            </a>
            <a href="#contacto" className="grid size-8 place-items-center rounded-full bg-white/10 text-white" aria-label="X">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.8 3H20l-6.2 7.1L21 21h-5.5l-4.3-6.3L6.2 21H4l6.7-7.6L3 3h5.6l3.9 5.8L17.8 3Zm-1 16.2h1.5L7.3 4.7H5.7l11.1 14.5Z" />
              </svg>
            </a>
            <a href="#contacto" className="grid size-8 place-items-center rounded-full bg-white/10 text-white" aria-label="YouTube">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM10 15.2V9.2l5.2 3-5.2 3Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 py-4 text-[12px] text-white/70 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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
      <select
        defaultValue={options[0]}
        className="h-[48px] w-full rounded-xl bg-white px-4 text-[14px] text-[#173e4e] outline-none"
      >
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[#0b925f]">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
