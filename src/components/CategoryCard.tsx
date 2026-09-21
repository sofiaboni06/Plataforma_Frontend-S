type CategoryIcon = 'training' | 'education' | 'innovation' | 'territory'

type CategoryCardProps = {
  title: string
  description: string
  icon: CategoryIcon
  last?: boolean
}

function CategoryIcon({ type }: { type: CategoryIcon }) {
  const common = {
    width: 30,
    height: 30,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  if (type === 'training') {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M12 20s-7-4.4-7-10.2A4.4 4.4 0 0 1 12 6.2 4.4 4.4 0 0 1 19 9.8C19 15.6 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 12h3.2l1.4-2.6 2 5.2 1.4-2.6H19"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (type === 'education') {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M5 19.2c1.2-3.4 3.6-5 7-5s5.8 1.6 7 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'innovation') {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M9 18h6M10 21h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8.4 10.6c0-2.2 1.6-4.1 3.6-4.1s3.6 1.9 3.6 4.1c0 1.6-.7 2.6-1.7 3.5-.6.5-.9 1.1-.9 1.9h-2c0-.8-.3-1.4-.9-1.9-1-1-1.7-1.9-1.7-3.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M12 2.8v1.6M4.9 5.6l1.2 1.2M2.8 12h1.6M19.6 12h1.6M17.9 6.8l1.2-1.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg {...common} aria-hidden="true">
      <path
        d="M3 20V10h6V4h6v6h6v10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 13h.8M6 16h.8M11.6 8h.8M11.6 13h.8M11.6 16h.8M17.2 13h.8M17.2 16h.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function CategoryCard({
  title,
  description,
  icon,
  last = false,
}: CategoryCardProps) {
  return (
    <article
      className={[
        'flex min-h-[108px] items-center gap-4 px-6 py-5',
        !last ? 'border-b border-[#e4eee8] md:border-b-0 md:border-r' : '',
      ].join(' ')}
    >
      <div className="grid size-[62px] shrink-0 place-items-center rounded-full bg-[#eef8f1] text-[#0b925f]">
        <CategoryIcon type={icon} />
      </div>

      <div className="flex flex-col">
        <strong className="text-[16px] leading-[1.25] font-bold text-[#173e4e]">{title}</strong>
        <span className="text-[16px] leading-[1.25] text-[#173e4e]">{description}</span>
      </div>
    </article>
  )
}
