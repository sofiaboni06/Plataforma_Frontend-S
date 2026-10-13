export default function Hero() {
  return (
    <section
      id="inicio"
      className="lp-hero relative flex min-h-150 items-center overflow-hidden bg-cover bg-center bg-no-repeat lg:min-h-160"
      style={{ backgroundImage: "url('/img/imageninicio.jpg')" }}
    >
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