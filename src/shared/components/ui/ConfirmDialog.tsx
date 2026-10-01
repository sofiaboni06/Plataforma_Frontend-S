import type { ReactNode } from 'react'
import Button from '@/shared/components/ui/Button'
import { TrashIcon } from '@/shared/components/icons/AppIcons'

export default function ConfirmDialog({
  title,
  subtitle,
  children,
  confirmLabel,
  pendingLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  title: string
  subtitle: string
  children: ReactNode
  confirmLabel: string
  pendingLabel: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sena-forest/55 px-4 backdrop-blur-[6px]"
      onClick={() => {
        if (!pending) onCancel()
      }}
    >
      <div
        className="w-full max-w-md rounded-[26px] border border-glass-line bg-glass-strong p-6 shadow-modal backdrop-blur-glass"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-sena-danger-soft text-sena-danger-text ring-1 ring-sena-danger-line">
            <TrashIcon className="size-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-sena-dark">{title}</h2>
            <p className="mt-1 text-sm text-sena-text-soft">{subtitle}</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-sena-strong">{children}</p>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="bg-sena-danger-text hover:bg-[#9A1C12]"
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
