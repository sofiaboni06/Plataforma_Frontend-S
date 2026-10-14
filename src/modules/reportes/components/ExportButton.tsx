import { useState } from 'react'
import { descargarArchivo, nombreArchivoReporte, type ReporteFormato } from '../lib/export'

function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 13l-2 2 2 2" />
      <path d="M14 13l2 2-2 2" />
    </svg>
  )
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15h6" />
      <path d="M9 11h6" />
      <path d="M9 19h3" />
    </svg>
  )
}

type ExportButtonProps = {
  onExport: (formato: ReporteFormato) => Promise<Blob>
  nombreReporte: string
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export default function ExportButton({
  onExport,
  nombreReporte,
  disabled = false,
  variant = 'secondary',
}: ExportButtonProps) {
  const [exportando, setExportando] = useState<ReporteFormato | null>(null)

  const handleExport = async (formato: ReporteFormato) => {
    if (exportando) return
    
    setExportando(formato)
    try {
      const blob = await onExport(formato)
      const nombre = nombreArchivoReporte(nombreReporte, formato)
      descargarArchivo(blob, nombre)
    } catch (error) {
      console.error('Error al exportar:', error)
      alert('No se pudo generar el reporte. Intente nuevamente.')
    } finally {
      setExportando(null)
    }
  }

  const baseClasses = variant === 'primary'
    ? 'bg-sena text-white hover:bg-sena-dark'
    : 'border border-sena/25 bg-white text-sena-dark hover:bg-sena/5'

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleExport('excel')}
        disabled={disabled || exportando !== null}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${baseClasses}`}
        title="Exportar a Excel"
      >
        <ExcelIcon className="size-4" />
        {exportando === 'excel' ? 'Generando...' : 'Excel'}
      </button>
      <button
        type="button"
        onClick={() => handleExport('pdf')}
        disabled={disabled || exportando !== null}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${baseClasses}`}
        title="Exportar a PDF"
      >
        <PdfIcon className="size-4" />
        {exportando === 'pdf' ? 'Generando...' : 'PDF'}
      </button>
    </div>
  )
}
