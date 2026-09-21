import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from '../icons/AppIcons'
import { cn } from '../../lib/cn'

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
        className="fixed inset-0 bg-sena-forest/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          'relative z-10 flex w-full max-h-[min(92vh,880px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,20,10,0.25)]',
          wide ? 'max-w-3xl' : 'max-w-2xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <div>
            <h2 id="dialog-title" className="text-lg font-semibold text-sena-text">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-sena-text/55">{description}</p> : null}
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-sena-text/50 hover:bg-sena-muted hover:text-sena-text"
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
