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
          <Button type="button" onClick={() => void handleGenerar()} disabled={!vigencia || rows.length === 0}>
            Generar proceso
          </Button>
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
                  <TableHeader>UNSPSC</TableHeader>
                  <TableHeader>Producto</TableHeader>
                  <TableHeader>Programa</TableHeader>
                  <TableHeader>Cantidad aprobada</TableHeader>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <TableEmpty colSpan={4}>No hay ítems aprobados en esa vigencia.</TableEmpty>
                ) : (
                  rows.map((row) => (
                    <TableRow key={`${row.codigoUnspsc}-${row.codigoPrograma}-${row.producto}`}>
                      <td className="font-semibold">{row.codigoUnspsc}</td>
                      <td>{row.producto}</td>
                      <td>
                        {row.codigoPrograma} {row.nombrePrograma}
                      </td>
                      <td>{row.cantidadAprobada}</td>
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
