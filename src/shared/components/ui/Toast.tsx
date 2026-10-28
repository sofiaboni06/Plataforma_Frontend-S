import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function Toast({
  message,
  onClose,
  variant = 'light',
}: {
  message: string
  onClose: () => void
  variant?: 'light' | 'green'
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4000)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  const green = variant === 'green'

  return (
    <div
      role="status"
      className="pointer-events-none fixed right-4 top-4 z-[70] md:right-8 md:top-5"
    >
      <div
        className={
          green
            ? 'pointer-events-auto flex items-center gap-3 rounded-2xl bg-[#0b8a4b] py-3 pl-3 pr-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(4,80,40,0.35)]'
            : 'pointer-events-auto flex items-center gap-2.5 rounded-full bg-white py-2 pl-2 pr-4 text-sm font-medium text-sena-text shadow-[0_8px_24px_rgba(15,23,12,0.12)] ring-1 ring-black/5'
        }
      >
        <span
          className={
            green
              ? 'grid size-8 shrink-0 place-items-center rounded-full bg-white/20'
              : 'grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-500'
          }
        >
          <CheckIcon className="size-4" />
        </span>
        <p>{message}</p>
      </div>
    </div>
  )
}

const NOTICE_KEY = 'sigma-notice'

export function leaveNotice(message: string) {
  sessionStorage.setItem(NOTICE_KEY, message)
}

export function FlashNotice() {
  const location = useLocation()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const fromRoute = (location.state as { notice?: string } | null)?.notice
    const saved = fromRoute || sessionStorage.getItem(NOTICE_KEY)
    if (!saved) return
    sessionStorage.removeItem(NOTICE_KEY)
    setMessage(saved)
  }, [location.pathname, location.state])

  if (!message) return null

  return <Toast message={message} variant="light" onClose={() => setMessage(null)} />
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
