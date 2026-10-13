type ProgramCardProps = {
  image: string
  title: string
  description: string
  branded?: boolean
}

export default function ProgramCard({
  image,
  title,
  description,
  branded = false,
}: ProgramCardProps) {
  return (
    <article className="lp-card group overflow-hidden">
      <div className="relative">
        <img src={image} alt={title} className="h-[148px] w-full object-cover" />
        {branded ? (
          <img
            src="/img/logo-sena.svg"
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-auto -translate-x-1/2 -translate-y-1/2 drop-shadow"
          />
        ) : null}
      </div>

      <div className="flex min-h-[104px] items-center justify-between gap-3 px-4 py-4">
        <div>
          <h3 className="text-[17px] font-bold leading-[1.2] text-[#0a4030]">{title}</h3>
          <p className="mt-1 text-[14px] leading-[1.3] text-[#5b7368]">{description}</p>
        </div>

        <a href="#oferta" aria-label={`Ver programa ${title}`} className="lp-arrow-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </article>
  )
}