import { useEffect, useState } from 'react'

const SLIDES = [
  '/img/imageninicio.jpg',
  '/img/fondo-vistas.jpg',
  '/img/cta-futuro.jpg',
  '/img/programa-tecnologia.jpg',
  '/img/noticia-tecnologia.jpg',
]

export default function Hero() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || paused) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [paused])

  return (
    <section
      id="inicio"
      className="lp-hero relative flex min-h-150 items-center overflow-hidden lg:min-h-160"
      aria-roledescription="carrusel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((src, slide) => (
        <div
          key={src}
          className={`lp-hero-slide${slide === index ? ' is-active' : ''}`}
          style={{ backgroundImage: `url('${src}')` }}
          aria-hidden={slide !== index}
        />
      ))}
      <div className="lp-hero-scrim" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-10 lg:px-10">
        <div className="max-w-140">
          <p className="lp-eyebrow">SENA</p>

          <h1 className="lp-hero-title mt-3 text-[38px] sm:text-[50px] lg:text-[56px]">
            El SENA
            <br />
            forma personas,
            <br />
            <span className="lp-hero-accent">transforma vidas</span>
          </h1>

          <p className="lp-hero-text mt-5 max-w-130 text-[17px] leading-normal sm:text-[19px]">
            Somos una entidad del Estado que ofrece formación profesional
            gratuita y de calidad para el trabajo, la formación y el desarrollo
            del país.
          </p>

          <a href="#oferta" className="lp-btn lp-btn-primary mt-7">
            Conoce nuestra oferta
            <ArrowGlyph />
          </a>
        </div>
      </div>

      <div className="lp-hero-dots" role="tablist" aria-label="Imágenes del SENA">
        {SLIDES.map((src, slide) => (
          <button
            key={src}
            type="button"
            role="tab"
            className={`lp-hero-dot${slide === index ? ' is-active' : ''}`}
            aria-label={`Imagen ${slide + 1}`}
            aria-selected={slide === index}
            onClick={() => setIndex(slide)}
          />
        ))}
      </div>
    </section>
  )
}

function ArrowGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
