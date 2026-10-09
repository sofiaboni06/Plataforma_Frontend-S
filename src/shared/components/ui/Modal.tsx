import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from '@/shared/components/icons/AppIcons'
import { cn } from '@/shared/lib/cn'

type ModalProps = {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
  /** Más aire en el encabezado y el cuerpo, para formularios largos. */
  spacious?: boolean
}

export default function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
  spacious = false,
}: ModalProps) {
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
          'relative z-10 flex w-full max-h-[min(92vh,880px)] flex-col overflow-hidden rounded-[26px] border border-glass-line bg-glass-strong shadow-modal backdrop-blur-glass',
          wide ? 'max-w-3xl' : 'max-w-2xl',
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-4 border-b border-sena-hairline bg-glass-strong px-6 text-sena-dark sm:px-8',
            spacious ? 'py-5 sm:py-6' : 'py-4',
          )}
        >
          <div>
            <h2 id="dialog-title" className="text-lg font-bold text-sena-text">
              {title}
            </h2>
            {description ? (
              <p className={cn('text-sm leading-6 text-sena-strong', spacious ? 'mt-2 max-w-xl' : 'mt-1')}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-sena-dark/70 transition hover:bg-sena-veil hover:text-sena-dark"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div
          className={cn(
            'overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8',
            spacious ? 'pt-6 sm:pt-8' : 'mt-5',
          )}
        >
          {children}
        </div>
      </section>
    </div>
  )
}
