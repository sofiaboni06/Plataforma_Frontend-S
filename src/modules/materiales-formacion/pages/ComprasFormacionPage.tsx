import { useEffect, useState } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import {
  ErrorBanner,
  PageHeader,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TableRow,
  tableClass,
} from '@/shared/components/DataTable'
import { ProgramIcon } from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import {
  descargarConsolidado,
  generarProcesoCompra,
  getConsolidadoCompras,
  type ConsolidadoCompra,
} from '@/modules/materiales-formacion/data/solicitudPrograma'
import type { VigenciaApi } from '@/modules/vigencias/types/vigencia'

export default function ComprasFormacionPage() {
  const [vigencias, setVigencias] = useState<VigenciaApi[]>([])
  const [vigencia, setVigencia] = useState('')
  const [rows, setRows] = useState<ConsolidadoCompra[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Consolidado de compras | SENA'
    void api<VigenciaApi[]>('/vigencias')
      .then((list) => {
        setVigencias(list)
        const activa = list.find((item) => item.activa)
        if (activa) setVigencia(String(activa.anio))
      })
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar las vigencias.')
      })
  }, [])

  const load = async (anio: string) => {
    if (!anio) return
    setLoading(true)
    try {
      setRows(await getConsolidadoCompras(Number(anio)))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo armar el consolidado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(vigencia)
  }, [vigencia])

  const handleDescarga = async (formato: 'pdf' | 'excel') => {
    if (!vigencia) return
    try {
      await descargarConsolidado(Number(vigencia), formato)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo descargar el consolidado.')
    }
  }

  const handleGenerar = async () => {
    if (!vigencia) return
    try {
      const proceso = await generarProcesoCompra({
        vigencia: Number(vigencia),
        codigoProceso: `PC-${vigencia}-${Date.now()}`,
        descripcion: 'Unificación de solicitudes aprobadas',
      })
      setMessage(`Proceso ${proceso.codigoProceso} generado.`)
      await load(vigencia)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo generar el proceso.')
    }
  }

  return (
    <AppLayout title="Consolidado de compras">
      <PageHeader
        icon={<ProgramIcon />}
        title="Consolidado de compras"
        description="Compras unifica lo que el coordinador ya aprobó en la vigencia y genera el proceso."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleDescarga('excel')}
              disabled={!vigencia || rows.length === 0}
            >
              Descargar Excel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleDescarga('pdf')}
              disabled={!vigencia || rows.length === 0}
            >
              Descargar PDF
            </Button>
            <Button type="button" onClick={() => void handleGenerar()} disabled={!vigencia || rows.length === 0}>
              Generar proceso
            </Button>
          </div>
        }
      />
      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
      {message ? (
        <p className="mb-4 rounded-2xl border border-sena-ok-line bg-sena-active-soft px-5 py-3.5 text-sm text-sena-ok-text">
          {message}
        </p>
      ) : null}

      <select
        className="form-field form-select mb-4 w-48"
        value={vigencia}
        onChange={(event) => setVigencia(event.target.value)}
      >
        <option value="">Vigencia</option>
        {vigencias.map((item) => (
          <option key={item.anio} value={item.anio}>
            {item.anio}
            {item.activa ? ' (activa)' : ''}
          </option>
        ))}
      </select>

      <TableCard>
        {loading ? (
          <TableLoading label="Consolidando solicitudes aprobadas…" />
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr className="border-b border-sena-hairline bg-sena-soft/85">
                  <TableHeader>Solicitud</TableHeader>
                  <TableHeader>Estado</TableHeader>
                  <TableHeader>Ficha</TableHeader>
                  <TableHeader>Instructor</TableHeader>
                  <TableHeader>Coordinador</TableHeader>
                  <TableHeader>Programa</TableHeader>
                  <TableHeader>Red</TableHeader>
                  <TableHeader>Línea</TableHeader>
                  <TableHeader>Lote</TableHeader>
                  <TableHeader>UNSPSC</TableHeader>
                  <TableHeader>Producto</TableHeader>
                  <TableHeader>Descripción</TableHeader>
                  <TableHeader>Unidad</TableHeader>
                  <TableHeader>Carácter</TableHeader>
                  <TableHeader>Base</TableHeader>
                  <TableHeader>Pidió</TableHeader>
                  <TableHeader>Aprobó</TableHeader>
                  <TableHeader>Valor unitario</TableHeader>
                  <TableHeader>Valor pedido</TableHeader>
                  <TableHeader>Valor aprobado</TableHeader>
                  <TableHeader>Línea pedido</TableHeader>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <TableEmpty colSpan={21}>No hay ítems aprobados en esa vigencia.</TableEmpty>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={`${row.solicitudId}-${row.codigoUnspsc}-${index}`}>
                      <td className="font-semibold">{row.solicitudId}</td>
                      <td>{row.estadoSolicitud}</td>
                      <td>{row.numeroFicha}</td>
                      <td>{row.instructor}</td>
                      <td>{row.coordinador ?? '—'}</td>
                      <td>
                        {row.codigoPrograma} {row.nombrePrograma}
                      </td>
                      <td>{row.red ?? '—'}</td>
                      <td>{row.linea ?? '—'}</td>
                      <td>{row.lote ?? '—'}</td>
                      <td>{row.codigoUnspsc}</td>
                      <td>{row.producto}</td>
                      <td>{row.descripcionTecnica ?? '—'}</td>
                      <td>{row.unidadMedida ?? '—'}</td>
                      <td>{row.caracter ?? '—'}</td>
                      <td>{row.cantidadBase}</td>
                      <td>{row.cantidadSolicitada}</td>
                      <td>{row.cantidadAprobada}</td>
                      <td>{row.valorUnitario ?? '—'}</td>
                      <td>{row.valorPedido ?? '—'}</td>
                      <td>{row.valorAprobado ?? '—'}</td>
                      <td>{row.estadoLinea}</td>
                    </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </AppLayout>
  )
}
