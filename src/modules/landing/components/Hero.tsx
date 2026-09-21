export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-[520px] overflow-hidden bg-cover bg-center bg-no-repeat lg:min-h-[560px]"
      style={{ backgroundImage: "url('/img/imageninicio.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#05331f] via-[#05331f]/72 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[1280px] items-center px-5 py-14 lg:min-h-[560px] lg:px-10">
        <div className="max-w-[560px]">
          <h1 className="text-[40px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[52px] lg:text-[58px]">
            El SENA
            <br />
            forma personas,
            <br />
            <span className="text-[#5FE36A]">transforma vidas</span>
          </h1>

          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.5] text-white/95 sm:text-[19px]">
            Somos una entidad del Estado que ofrece formación profesional
            gratuita y de calidad para el trabajo, la formación y el desarrollo
            del país.
          </p>

          <a
            href="#oferta"
            className="mt-7 inline-flex h-[52px] items-center rounded-full bg-[#f7931e] px-7 text-[17px] font-bold text-white shadow-md transition hover:brightness-105"
          >
            Conoce nuestra oferta
            <span className="ml-3 text-[22px] leading-none">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
