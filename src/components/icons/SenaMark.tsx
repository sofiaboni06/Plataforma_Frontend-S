type SenaMarkProps = {
  className?: string
}

export default function SenaMark({ className = 'h-10 w-10' }: SenaMarkProps) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="16.5" cy="11" r="5.2" />
      <path d="M6.8 38.5c.4-8.4 4.6-14.2 9.7-14.2 5.2 0 9.3 5.8 9.7 14.2H6.8Z" />
      <circle cx="31.8" cy="9.5" r="6.1" />
      <path d="M19.4 38.5c.5-9.6 5.6-16.6 12.4-16.6 6.9 0 12 7 12.4 16.6H19.4Z" />
    </svg>
  )
}
