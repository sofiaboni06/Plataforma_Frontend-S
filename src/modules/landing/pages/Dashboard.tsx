import { useState } from 'react'
import ColombiaMap from '@/modules/landing/components/ColombiaMap'
import Header from '@/modules/landing/components/Header'
import SiteFooter from '@/modules/landing/components/SiteFooter'
import '@/modules/landing/styles/landing.css'

const benefits = [
  {
    number: '01',
    title: 'Gestión centralizada',
    description: 'Accede desde un mismo entorno a las herramientas administrativas de SIGMA.',
    icon: 'central',
  },
  {
    number: '02',
    title: 'Información organizada',
    description: 'Consulta y administra la información de forma clara y estructurada.',
    icon: 'data',
  },
  {
    number: '03',
    title: 'Optimización de procesos',
    description: 'Facilita las tareas institucionales mediante módulos especializados.',
    icon: 'speed',
  },
] as const

const modules = [
  {
    number: '01',
    title: 'Inventario de bodega de construcción',
    description: 'Administración y seguimiento de materiales, existencias y movimientos de inventario.',
    detail: 'Control de inventario',
    icon: 'inventory',
  },
  {
    number: '02',
    title: 'Materiales de formación',
    description: 'Organización y gestión de los materiales utilizados en los procesos de formación.',
    detail: 'Gestión de materiales',
    icon: 'materials',
  },
] as const

const audiences = [
  { title: 'Instructores', description: 'Consulta y gestión de recursos para los procesos formativos.', icon: 'instructor' },
  { title: 'Personal administrativo', description: 'Organización y seguimiento de actividades administrativas.', icon: 'admin' },
  { title: 'Coordinación académica', description: 'Información organizada para apoyar la gestión académica.', icon: 'coordination' },
] as const

const presence = [
  { title: 'Presencia nacional', text: 'El SENA cuenta con presencia en las diferentes regiones del país.', icon: 'pin' },
  { title: 'Regionales y centros', text: 'Una red institucional que conecta formación y servicios.', icon: 'building' },
  { title: 'Cobertura territorial', text: 'Consulta las regionales y centros disponibles en el mapa.', icon: 'network' },
]

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState<'inventory' | 'materials'>('inventory')
  const selectedModule = modules.find((item) => item.icon === activeModule) ?? modules[0]

  return (
    <main className="sigma-page min-h-screen overflow-x-clip">
      <Header />

      <section id="inicio" className={`sigma-hero sigma-hero-${activeModule} scroll-mt-24`}>
        <div className="sigma-hero-orbit sigma-hero-orbit-one" />
        <div className="sigma-hero-orbit sigma-hero-orbit-two" />
        <div className="sigma-container sigma-hero-content">
          <div className="sigma-hero-copy">
            <span className="sigma-kicker sigma-kicker-light">Sistema integral para la gestión</span>
            <h1>SIGMA</h1>
            <h2>Una plataforma, múltiples soluciones para la gestión institucional.</h2>
            <p className="sigma-hero-definition">Sistema Integral para la Gestión de Módulos Administrativos.</p>
            <p className="sigma-hero-description">
              Una plataforma que centraliza procesos administrativos y facilita la gestión de información mediante herramientas digitales.
            </p>
            <div className="sigma-actions">
              <a className="sigma-button sigma-button-bright" href="#sigma">Conocer SIGMA <ArrowIcon /></a>
              <a className="sigma-button sigma-button-outline" href="/login">Acceder a la plataforma</a>
            </div>
          </div>

          <div className="sigma-hero-visual" aria-label="Vista ilustrativa de la plataforma SIGMA">
            <div className="sigma-device-glow" />
            <div className="sigma-device">
              <div className="sigma-device-top"><span /><span /><span /><small>sigma · gestión institucional</small></div>
              <div className="sigma-device-body">
                <div className="sigma-device-brand"><img src="/img/logo-sigma.png" alt="" /><strong>SIGMA</strong></div>
                <p className="sigma-device-active-title">{selectedModule.title}</p>
                <p className="sigma-device-active-description">{selectedModule.description}</p>
                <div className="sigma-device-widgets">
                  <button type="button" className={activeModule === 'inventory' ? 'is-active' : ''} onClick={() => setActiveModule('inventory')}><i /> Inventario</button>
                  <button type="button" className={activeModule === 'materials' ? 'is-active' : ''} onClick={() => setActiveModule('materials')}><i /> Materiales</button>
                </div>
                <div className="sigma-device-chart"><b /><b /><b /><b /><b /><b /><b /></div>
              </div>
            </div>
            <div className="sigma-floating-tag"><span className="sigma-status-dot" /> Vista previa interactiva</div>
          </div>
        </div>
        <a href="#beneficios" className="sigma-scroll-cue" aria-label="Desplazarse a beneficios"><span /></a>
      </section>

      <section id="beneficios" className="sigma-benefits sigma-section scroll-mt-24">
        <div className="sigma-container">
          <div className="sigma-section-heading sigma-center">
            <span className="sigma-heading-line" />
            <p className="sigma-eyebrow">Una experiencia integrada</p>
            <h2>¿Qué ofrece SIGMA?</h2>
            <p>Descubre los beneficios de una plataforma diseñada para facilitar la gestión institucional.</p>
          </div>
          <div className="sigma-benefit-grid">
            {benefits.map((item) => (
              <article className="sigma-benefit-card" key={item.number}>
                <span className="sigma-icon-circle"><FeatureIcon name={item.icon} /></span>
                <div><span className="sigma-card-number">{item.number}</span><h3>{item.title}</h3><p>{item.description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="modulos" className="sigma-modules sigma-section scroll-mt-24">
        <div className="sigma-container">
          <div className="sigma-modules-layout">
            <div className="sigma-module-main">
              <div className="sigma-section-heading">
                <span className="sigma-heading-line" />
                <p className="sigma-eyebrow">Herramientas de SIGMA</p>
                <h2>Módulos disponibles</h2>
                <p>Conoce las soluciones que hacen parte de la plataforma y apoyan diferentes procesos institucionales.</p>
              </div>
              <div className="sigma-module-grid">
                {modules.map((module) => (
                  <article className={`sigma-module-card ${activeModule === module.icon ? 'is-selected' : ''}`} key={module.number}>
                    <button
                      type="button"
                      className="sigma-module-preview-button"
                      aria-pressed={activeModule === module.icon}
                      onClick={() => { setActiveModule(module.icon); document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                    >
                      <span className={`sigma-module-art sigma-module-art-${module.icon}`}>
                        <span className="sigma-module-number">{module.number}</span>
                        <ModuleIllustration name={module.icon} />
                        <span className="sigma-art-caption">{module.detail}</span>
                      </span>
                      <span className="sigma-module-copy">
                        <span className="sigma-module-label">MÓDULO SIGMA</span>
                        <strong className="sigma-module-title">{module.title}</strong>
                        <span className="sigma-module-description">{module.description}</span>
                        <span className="sigma-module-link">Ver vista previa <ArrowIcon /></span>
                      </span>
                    </button>
                    <a href="/login" className="sigma-module-real-access">Acceder a la plataforma <ArrowIcon /></a>
                  </article>
                ))}
              </div>
            </div>

            <aside className="sigma-map-promo">
              <div className="sigma-map-promo-pattern" />
              <div className="sigma-map-mini" aria-hidden="true"><img src="/img/mapa-colombia.svg" alt="" /></div>
              <div className="sigma-map-promo-copy">
                <span className="sigma-eyebrow">Presencia institucional</span>
                <h3>Cobertura en Colombia</h3>
                <p>Conoce la presencia del SENA en las regiones del país a través de su mapa interactivo.</p>
                <a href="#cobertura" className="sigma-map-link">Explorar mapa <ArrowIcon /></a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="sigma-audience sigma-section scroll-mt-24">
        <div className="sigma-container">
          <div className="sigma-section-heading sigma-center">
            <span className="sigma-heading-line" />
            <p className="sigma-eyebrow">Pensada para apoyar tu trabajo</p>
            <h2>¿A quién está dirigida?</h2>
            <p>SIGMA facilita el acceso a herramientas según las necesidades de los equipos institucionales.</p>
          </div>
          <div className="sigma-audience-grid">
            {audiences.map((item) => (
              <article className="sigma-audience-card" key={item.title}>
                <span className="sigma-audience-icon"><AudienceIcon name={item.icon} /></span>
                <div><h3>{item.title}</h3><p>{item.description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cobertura" className="sigma-coverage sigma-section scroll-mt-24">
        <div className="sigma-container">
          <div className="sigma-coverage-heading">
            <div><span className="sigma-heading-line" /><p className="sigma-eyebrow">Presencia institucional</p><h2>El SENA en Colombia</h2></div>
            <p>Una institución con presencia en todo el territorio nacional, comprometida con la formación profesional integral y el desarrollo social y productivo del país.</p>
          </div>
          <div className="sigma-coverage-panel">
            <div className="sigma-coverage-intro">
              <span className="sigma-coverage-mark"><img src="/img/logo-sena.svg" alt="Logo SENA" /></span>
              <h3>Conectando oportunidades en cada región</h3>
              <p>Explora el mapa para conocer las regionales, ciudades y centros de formación del SENA.</p>
              <a href="https://www.sena.edu.co/" target="_blank" rel="noreferrer">Conocer el SENA <ArrowIcon /></a>
            </div>
            <div className="sigma-coverage-map"><ColombiaMap className="w-full max-w-full" /></div>
            <div className="sigma-coverage-facts">
              {presence.map((item) => <div className="sigma-presence-item" key={item.title}><span><PresenceIcon name={item.icon} /></span><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}
              <div className="sigma-coverage-note"><strong>Explora el mapa</strong><span>Selecciona una región para consultar sus datos.</span></div>
            </div>
          </div>
        </div>
      </section>


<section
  id="mision-vision"
  className="sigma-mission-vision sigma-section scroll-mt-24"
>
  <div className="sigma-container">
    <div className="sigma-section-heading sigma-center">
      <span className="sigma-heading-line" />
      <p className="sigma-eyebrow">Nuestra identidad</p>
      <h2>Misión y visión</h2>
      <p>
        Trabajamos para ofrecer herramientas digitales que faciliten
        la gestión institucional y contribuyan a la transformación
        de los procesos administrativos.
      </p>
    </div>

    <div className="sigma-mv-grid">
      <article className="sigma-mv-card sigma-mv-mission">
        <div className="sigma-mv-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.5" />
          </svg>
        </div>

        <span className="sigma-mv-label">NUESTRO PROPÓSITO</span>
        <h3>Nuestra misión</h3>
        <p>
          Centralizar y facilitar los procesos administrativos
          mediante una plataforma digital que permita organizar,
          consultar y gestionar la información de manera clara,
          segura y eficiente, a través de módulos especializados
          que apoyen las actividades institucionales.
        </p>

        <span className="sigma-mv-decoration">01</span>
      </article>

      <article className="sigma-mv-card sigma-mv-vision">
        <div className="sigma-mv-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>

        <span className="sigma-mv-label">HACIA DÓNDE VAMOS</span>
        <h3>Nuestra visión</h3>
        <p>
          Consolidar a SIGMA como una plataforma digital de
          referencia para la gestión institucional, reconocida
          por su facilidad de uso, organización y capacidad de
          integrar nuevas soluciones tecnológicas que respondan
          a las necesidades de los diferentes procesos.
        </p>

        <span className="sigma-mv-decoration">02</span>
      </article>
    </div>

    <div className="sigma-mv-footer">
      <span className="sigma-mv-footer-icon">✦</span>
      <p>
        SIGMA: tecnología que conecta procesos, organiza información
        y facilita la gestión institucional.
      </p>
    </div>
  </div>
</section>


      <section id="sigma" className="sigma-about sigma-section scroll-mt-24">
        <div className="sigma-container sigma-about-inner">
          <div className="sigma-about-brand"><img src="/img/logo-sigma.png" alt="SIGMA" /><span>SIGMA</span><small>Gestión institucional</small></div>
          <div className="sigma-about-copy"><span className="sigma-eyebrow">Conoce nuestra plataforma</span><h2>La gestión institucional, en un solo lugar.</h2><p>SIGMA integra módulos administrativos en un entorno digital que facilita la consulta, organización y gestión de información. Su estructura modular permite concentrar herramientas específicas y acompañar las necesidades de los procesos institucionales.</p></div>
          <div className="sigma-about-points"><span><FeatureIcon name="central" /> Gestión centralizada</span><span><FeatureIcon name="data" /> Información organizada</span><span><FeatureIcon name="speed" /> Procesos más ágiles</span></div>
        </div>
      </section>

      <section className="sigma-cta">
        <div className="sigma-container sigma-cta-inner"><div><span className="sigma-eyebrow sigma-eyebrow-light">Plataforma SIGMA</span><h2>Las herramientas que necesitas, en un solo lugar.</h2><p>Ingresa a la plataforma y conoce los módulos disponibles.</p></div><a href="/login" className="sigma-button sigma-button-white">Acceder a SIGMA <ArrowIcon /></a></div>
      </section>

      <SiteFooter />
    </main>
  )
}

function ArrowIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg> }

function FeatureIcon({ name }: { name: string }) {
  if (name === 'central') return <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  if (name === 'data') return <svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10"/><circle cx="18" cy="19" r="2"/></svg>
  return <svg viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z"/></svg>
}

function ModuleIllustration({ name }: { name: string }) {
  if (name === 'inventory') return <svg viewBox="0 0 220 160" aria-hidden="true"><path d="m35 54 73-38 76 38-74 39-75-39Z"/><path d="M35 54v66l75 34v-61L35 54Zm149 0v66l-74 34V93l74-39Z"/><path d="m72 35 75 39m-39 19v61M58 77l75 39m-61-51 75 39"/><path d="M89 18v-9h40v18"/><path d="M102 12h15"/></svg>
  return <svg viewBox="0 0 220 160" aria-hidden="true"><path d="M48 35h105a12 12 0 0 1 12 12v91H60a12 12 0 0 1-12-12V35Z"/><path d="M60 35v91a12 12 0 0 0 12 12h93V47a12 12 0 0 0-12-12H60Z"/><path d="M78 62h65M78 82h65M78 102h45"/><path d="M36 24h105a12 12 0 0 1 12 12v7H48v94"/></svg>
}

function AudienceIcon({ name }: { name: string }) {
  if (name === 'instructor') return <svg viewBox="0 0 24 24"><path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5m4-2v7"/></svg>
  if (name === 'admin') return <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6m0-5c3.5-.5 5.5 1.5 6 5"/></svg>
  return <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>
}

function PresenceIcon({ name }: { name: string }) {
  if (name === 'pin') return <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
  if (name === 'building') return <svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16M2 21h20M8 8h2m4 0h2M8 12h2m4 0h2m-6 9v-5h4v5"/></svg>
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m10.5 7-4 8.5m7-8.5 4 8.5M7.5 18h9"/></svg>
}
