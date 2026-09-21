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
    <article className="overflow-hidden rounded-[14px] border border-[#d9e1dd] bg-white shadow-[0_2px_10px_rgba(10,34,28,0.06)]">
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
          <h3 className="text-[18px] font-bold leading-[1.15] text-[#173e4e]">{title}</h3>
          <p className="mt-1 text-[15px] leading-[1.25] text-[#5d7380]">{description}</p>
        </div>

        <a
          href="#oferta"
          aria-label={`Ver programa ${title}`}
          className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#11895c] text-[22px] leading-none text-white transition hover:brightness-105"
        >
          +
        </a>
      </div>
    </article>
  )
}
