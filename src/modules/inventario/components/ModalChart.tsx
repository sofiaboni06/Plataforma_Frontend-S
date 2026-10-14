import { type ReactNode } from 'react'
import Modal from '@/shared/components/ui/Modal'

type ModalChartProps = {
  titulo: string
  descripcion?: string
  onClose: () => void
  children: ReactNode
}

export default function ModalChart({ titulo, descripcion, onClose, children }: ModalChartProps) {
  return (
    <Modal title={titulo} description={descripcion} onClose={onClose} chart>
      <div className="h-[calc(100vh-11rem)] w-full overflow-hidden">{children}</div>
    </Modal>
  )
}
