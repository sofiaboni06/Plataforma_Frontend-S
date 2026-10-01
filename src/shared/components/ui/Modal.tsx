import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from '@/shared/components/icons/AppIcons'
import { cn } from '@/shared/lib/cn'

type ModalProps = {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export default function Modal({ title, description, onClose, children, wide = false }: ModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center">
      <button
        type="button"
        className="fixed inset-0 bg-sena-forest/55 backdrop-blur-[6px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          'relative z-10 flex w-full max-h-[min(92vh,880px)] flex-col overflow-hidden rounded-[24px] border border-glass-line bg-white/85 shadow-[0_24px_70px_rgba(0,60,40,0.22)] backdrop-blur-[28px]',
          wide ? 'max-w-3xl' : 'max-w-2xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-sena-dark/92 px-6 py-4 text-white backdrop-blur-glass sm:px-8">
          <div>
            <h2 id="dialog-title" className="text-lg font-bold">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-white/75">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="mt-5 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">{children}</div>
      </section>
    </div>
  )
}
