import type { ReactNode } from 'react'
import Button from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

type Tone = 'success' | 'question' | 'info'

const TONES: Record<
  Tone,
  { wrap: string; Icon: (props: { className?: string }) => ReactNode }
> = {
  success: { wrap: 'bg-sena-active-soft text-sena-ok-text ring-sena-ok-line', Icon: CheckIcon },
  question: { wrap: 'bg-sena-warn-soft text-sena-warn-text ring-sena-warn-line', Icon: QuestionIcon },
  info: { wrap: 'bg-sena-veil text-sena-dark ring-sena-line', Icon: InfoIcon },
}

export default function SweetAlert({
  tone = 'success',
  title,
  children,
  confirmLabel = 'Entendido',
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  tone?: Tone
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}) {
  const { wrap, Icon } = TONES[tone]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-sena-forest/55 px-4 backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-[26px] border border-glass-line bg-glass-strong px-6 py-7 text-center shadow-modal backdrop-blur-glass">
        <div className={cn('mx-auto grid size-14 place-items-center rounded-full ring-1', wrap)}>
          <Icon className="size-7" />
        </div>

        <h2 className="mt-4 text-lg font-bold text-sena-dark">{title}</h2>
        <div className="mt-2 text-sm leading-6 text-sena-strong">{children}</div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              {cancelLabel ?? 'Cancelar'}
            </Button>
          ) : null}
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
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

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" />
      <path d="M12 17.5h.01" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 10.5v6" />
      <path d="M12 7.5h.01" />
    </svg>
  )
}
