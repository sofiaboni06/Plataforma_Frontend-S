import { useState } from 'react'
import { createPortal } from 'react-dom'
import Modal from '@/shared/components/ui/Modal'
import { CAMPOS_DISPONIBLES, descargarArchivo, nombreArchivoReporte, type CampoReporte, type ReporteFormato } from '../lib/export'

type FieldSelectorProps = {
  onExport: (formato: ReporteFormato, campos: CampoReporte[]) => Promise<Blob>
  nombreReporte: string
  disabled?: boolean
}

export default function FieldSelector({ onExport, nombreReporte, disabled = false }: FieldSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<CampoReporte[]>([])
  const [exporting, setExporting] = useState<ReporteFormato | null>(null)

  const grupos = Object.entries(
    Object.entries(CAMPOS_DISPONIBLES).reduce((acc, [campo, info]) => {
      if (!acc[info.grupo]) acc[info.grupo] = []
      acc[info.grupo].push({ campo: campo as CampoReporte, ...info })
      return acc
    }, {} as Record<string, Array<{ campo: CampoReporte; label: string; grupo: string }>>)
  )

  const toggleField = (campo: CampoReporte) => {
    if (selectedFields.includes(campo)) {
      setSelectedFields(selectedFields.filter((f) => f !== campo))
    } else {
      setSelectedFields([...selectedFields, campo])
    }
  }

  const toggleAll = () => {
    if (selectedFields.length === Object.keys(CAMPOS_DISPONIBLES).length) {
      setSelectedFields([])
    } else {
      setSelectedFields(Object.keys(CAMPOS_DISPONIBLES) as CampoReporte[])
    }
  }

  const selectBasic = () => {
    const basicFields: CampoReporte[] = ['codigo', 'nombre', 'cantidad', 'cantidadMinima', 'estado', 'valorUnitario']
    setSelectedFields(basicFields)
  }

  const handleExport = (_formato: ReporteFormato) => {
    if (exporting) return

    setIsOpen(true)
  }

  const handleConfirmExport = async (formato: ReporteFormato) => {
    if (selectedFields.length === 0) {
      alert('Por favor seleccione al menos un campo')
      return
    }

    setExporting(formato)
    try {
      const blob = await onExport(formato, selectedFields)
      const nombre = nombreArchivoReporte(nombreReporte, formato)
      descargarArchivo(blob, nombre)
      setIsOpen(false)
    } catch {
      alert('No se pudo generar el reporte. Intente nuevamente.')
    } finally {
      setExporting(null)
    }
  }

  const closeSelector = () => {
    if (exporting) return
    setIsOpen(false)
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleExport('excel')}
          disabled={disabled || exporting !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-sena/25 bg-white px-3 py-2 text-xs font-semibold text-sena-dark transition hover:bg-sena/5 disabled:cursor-not-allowed disabled:opacity-50"
          title="Exportar a Excel"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M10 13l-2 2 2 2" />
            <path d="M14 13l2 2-2 2" />
          </svg>
          {exporting === 'excel' ? 'Generando...' : 'Excel'}
        </button>
        <button
          type="button"
          onClick={() => handleExport('pdf')}
          disabled={disabled || exporting !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-sena/25 bg-white px-3 py-2 text-xs font-semibold text-sena-dark transition hover:bg-sena/5 disabled:cursor-not-allowed disabled:opacity-50"
          title="Exportar a PDF"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 15h6" />
            <path d="M9 11h6" />
            <path d="M9 19h3" />
          </svg>
          {exporting === 'pdf' ? 'Generando...' : 'PDF'}
        </button>
      </div>

      {isOpen &&
        createPortal(
            <Modal
              title="Seleccionar campos del reporte"
              description="Marca las columnas que quieres incluir. Si no eliges ninguna, no se genera el archivo."
              onClose={closeSelector}
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="flex-1 rounded-lg border border-sena-line px-2 py-1.5 text-xs font-medium text-sena-text transition hover:border-sena hover:text-sena-strong"
                  >
                    {selectedFields.length === Object.keys(CAMPOS_DISPONIBLES).length
                      ? 'Deseleccionar todo'
                      : 'Seleccionar todo'}
                  </button>
                  <button
                    type="button"
                    onClick={selectBasic}
                    className="flex-1 rounded-lg border border-sena-line px-2 py-1.5 text-xs font-medium text-sena-text transition hover:border-sena hover:text-sena-strong"
                  >
                    Básico
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto pr-1">
                  {grupos.map(([grupo, campos]) => (
                    <div key={grupo} className="mb-4 last:mb-0">
                      <h4 className="mb-2 text-xs font-semibold text-sena-strong">{grupo}</h4>
                      <div className="space-y-1">
                        {campos.map(({ campo, label }) => (
                          <label
                            key={campo}
                            className="flex items-center gap-2 text-sm text-sena-text hover:text-sena-strong"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(campo)}
                              onChange={() => toggleField(campo)}
                              className="size-4 rounded border-sena-line text-sena focus:ring-sena focus:ring-offset-0"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 border-t border-sena-line-soft pt-4">
                  <button
                    type="button"
                    onClick={closeSelector}
                    className="flex-1 rounded-lg border border-sena-line px-4 py-2 text-xs font-semibold text-sena-text transition hover:border-sena hover:text-sena-strong"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmExport('excel')}
                    disabled={exporting !== null || selectedFields.length === 0}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {exporting === 'excel' ? 'Generando...' : 'Excel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmExport('pdf')}
                    disabled={exporting !== null || selectedFields.length === 0}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {exporting === 'pdf' ? 'Generando...' : 'PDF'}
                  </button>
                </div>
              </div>
            </Modal>,
            document.body,
          )}
    </>
  )
}
