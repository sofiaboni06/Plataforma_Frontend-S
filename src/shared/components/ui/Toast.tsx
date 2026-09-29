import { useEffect } from 'react'

export default function Toast({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4000)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  return (
    <div
      role="status"
      className="pointer-events-none fixed right-4 top-4 z-[70] md:right-8 md:top-5"
    >
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-white py-2 pl-2 pr-4 text-sm font-medium text-sena-text shadow-[0_8px_24px_rgba(15,23,12,0.12)] ring-1 ring-black/5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckIcon className="size-4" />
        </span>
        <p>{message}</p>
      </div>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}
