type CategoryIcon = 'training' | 'education' | 'innovation' | 'territory'

type CategoryCardProps = {
  title: string
  description: string
  icon: CategoryIcon
  last?: boolean
}

/*
 * Iconos de la banda institucional.
 * Todos comparten lienzo 24x24, `stroke-width` 1.8, `currentColor` y
 * terminaciones redondeadas, de modo que el grosor se vea uniforme.
 */
function CategoryIcon({ type }: { type: CategoryIcon }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    xmlns: 'http://www.w3.org/2000/svg',
  }

  // 1. Formación -> birrete (tablero, bacen y borla)
  if (type === 'training') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M2.2 8.6 12 4.1l9.8 4.5L12 13.1 2.2 8.6Z" />
        <path d="M6.4 10.6V15c0 1.9 2.5 3.2 5.6 3.2s5.6-1.3 5.6-3.2v-4.4" />
        <path d="M20.2 9.6V14" />
        <circle cx="20.2" cy="15.8" r="1.5" />
      </svg>
    )
  }

  // 2. Educación -> figura educativa (persona)
  if (type === 'education') {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="7.6" r="3.6" />
        <path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" />
      </svg>
    )
  }

  // 3. Innovación -> bombilla con base y destello
  if (type === 'innovation') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 2.6a6.4 6.4 0 0 0-3.8 11.5c.7.5 1.1 1.3 1.1 2.2v.5h5.4v-.5c0-.9.4-1.7 1.1-2.2A6.4 6.4 0 0 0 12 2.6Z" />
        <path d="M9.4 19.3h5.2" />
        <path d="M10.6 21.8h2.8" />
        <path d="M4.1 5.2 5.6 6.7M19.9 5.2 18.4 6.7M12 .9v1.6" />
      </svg>
    )
  }

  // 4. Presencia territorial -> institución (edificio con frontón y columnas)
  return (
    <svg {...common} aria-hidden="true">
      <path d="M12 2.8 21.4 8H2.6L12 2.8Z" />
      <path d="M4.3 10.6h15.4" />
      <path d="M6.6 10.9v7.4M10.2 10.9v7.4M13.8 10.9v7.4M17.4 10.9v7.4" />
      <path d="M3 20.9h18" />
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
    <article className={`lp-cat-item${last ? ' is-last' : ''}`}>
      <span className="lp-cat-tile">
        <CategoryIcon type={icon} />
      </span>

      <span className="flex min-w-0 flex-col">
        <strong className="lp-cat-title">{title}</strong>
        <span className="lp-cat-desc">{description}</span>
      </span>
    </article>
  )
}