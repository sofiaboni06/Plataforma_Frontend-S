import { useEffect, useMemo, useState } from 'react'
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

function pesos(valor: number | null) {
  if (valor == null) return '—'
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

export default function ComprasFormacionPage() {
  const [vigencias, setVigencias] = useState<VigenciaApi[]>([])
  const [vigencia, setVigencia] = useState('')
  const [rows, setRows] = useState<ConsolidadoCompra[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

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
    setError(null)
    try {
      setRows(await getConsolidadoCompras(Number(anio)))
    } catch (caught) {
      setRows([])
      setError(caught instanceof ApiError ? caught.message : 'No se pudo armar el consolidado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(vigencia)
  }, [vigencia])

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return rows
    return rows.filter((row) =>
      [
        row.solicitudId,
        row.numeroFicha,
        row.instructor,
        row.coordinador,
        row.codigoPrograma,
        row.nombrePrograma,
        row.codigoUnspsc,
        row.producto,
        row.lote,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(texto),
    )
  }, [rows, busqueda])

  const grupos = useMemo(() => {
    const mapa = new Map<number, ConsolidadoCompra[]>()
    for (const row of filtradas) {
      const lista = mapa.get(row.solicitudId) ?? []
      lista.push(row)
      mapa.set(row.solicitudId, lista)
    }
    return [...mapa.entries()]
  }, [filtradas])

  const resumen = useMemo(() => {
    const solicitudes = new Set(rows.map((row) => row.solicitudId)).size
    const valor = rows.reduce((suma, row) => suma + (row.valorAprobado ?? 0), 0)
    const unidades = rows.reduce((suma, row) => suma + (row.cantidadAprobada ?? 0), 0)
    return { solicitudes, lineas: rows.length, valor, unidades }
  }, [rows])

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
      setMessage(`Pedido ${proceso.codigoProceso} juntado.`)
      await load(vigencia)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo juntar el pedido.')
    }
  }

  return (
    <AppLayout title="Consolidado de compras">
      <PageHeader
        icon={<ProgramIcon />}
        title="Consolidado de compras"
        description="Junta en una sola lista lo que el coordinador ya aprobó en esta vigencia."
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
              Juntar pedido aprobado
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

      <section aria-label="Resumen del consolidado" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-sena-hairline bg-white px-5 py-4">
          <p className="text-xs font-medium text-sena-text-soft">Solicitudes aprobadas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-sena-text">{resumen.solicitudes}</p>
        </article>
        <article className="rounded-2xl border border-sena-hairline bg-white px-5 py-4">
          <p className="text-xs font-medium text-sena-text-soft">Ítems a comprar</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-sena-text">
            {resumen.lineas}
            <span className="ml-2 text-sm font-medium text-sena-text-soft">{resumen.unidades} und.</span>
          </p>
        </article>
        <article className="rounded-2xl border border-sena-hairline bg-white px-5 py-4">
          <p className="text-xs font-medium text-sena-text-soft">Valor aprobado {vigencia || ''}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-sena-ok-text">{pesos(resumen.valor)}</p>
        </article>
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-sena-strong">
          Vigencia
          <select
            className="form-field form-select mt-1 w-full sm:w-44"
            value={vigencia}
            onChange={(event) => setVigencia(event.target.value)}
          >
            <option value="">Seleccionar</option>
            {vigencias.map((item) => (
              <option key={item.anio} value={item.anio}>
                {item.anio}
                {item.activa ? ' (activa)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 flex-1 text-sm font-medium text-sena-strong">
          Buscar
          <input
            className="form-field mt-1 w-full"
            placeholder="Ficha, programa, producto o UNSPSC"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <TableCard>
          <TableLoading label="Consolidando solicitudes aprobadas…" />
        </TableCard>
      ) : grupos.length === 0 ? (
        <TableCard>
          <table className={tableClass}>
            <tbody>
              <TableEmpty colSpan={1}>
                {rows.length === 0
                  ? 'No hay ítems aprobados en esa vigencia.'
                  : 'Ningún ítem coincide con la búsqueda.'}
              </TableEmpty>
            </tbody>
          </table>
        </TableCard>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.map(([solicitudId, items]) => {
            const cabeza = items[0]
            const total = items.reduce((suma, item) => suma + (item.valorAprobado ?? 0), 0)
            return (
              <TableCard key={solicitudId}>
                <header className="flex flex-col gap-3 border-b border-sena-hairline px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-sena-text-soft">
                      Solicitud {solicitudId}
                      <span className="ml-2 normal-case tracking-normal">{cabeza.estadoSolicitud}</span>
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-sena-text">
                      Ficha {cabeza.numeroFicha}
                      <span className="font-normal text-sena-strong">
                        {' '}
                        · {cabeza.codigoPrograma} {cabeza.nombrePrograma}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-sena-text-soft">
                      Instructor {cabeza.instructor}
                      {cabeza.coordinador ? ` · Coordinador ${cabeza.coordinador}` : ''}
                      {cabeza.red ? ` · ${cabeza.red}` : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block text-xs text-sena-text-soft">{items.length} ítems</span>
                    <span className="text-lg font-bold tabular-nums text-sena-text">{pesos(total)}</span>
                  </p>
                </header>
                <div className="overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr className="border-b border-sena-hairline bg-sena-soft/85">
                        <TableHeader>Producto</TableHeader>
                        <TableHeader>Lote</TableHeader>
                        <TableHeader>Unidad</TableHeader>
                        <TableHeader>Aprobó</TableHeader>
                        <TableHeader>Valor unitario</TableHeader>
                        <TableHeader>Valor aprobado</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, index) => (
                        <TableRow key={`${row.solicitudId}-${row.codigoUnspsc}-${index}`}>
                          <td>
                            <p className="font-semibold text-sena-text">{row.producto}</p>
                            <p className="text-xs text-sena-text-soft">
                              {row.codigoUnspsc}
                              {row.caracter ? ` · ${row.caracter}` : ''}
                            </p>
                            {row.descripcionTecnica ? (
                              <p className="mt-0.5 max-w-md text-xs text-sena-strong">{row.descripcionTecnica}</p>
                            ) : null}
                          </td>
                          <td>{row.lote ?? '—'}</td>
                          <td>{row.unidadMedida ?? '—'}</td>
                          <td className="tabular-nums">
                            {row.cantidadAprobada}
                            <span className="block text-xs text-sena-text-soft">pidió {row.cantidadSolicitada}</span>
                          </td>
                          <td className="tabular-nums">{pesos(row.valorUnitario)}</td>
                          <td className="font-semibold tabular-nums">{pesos(row.valorAprobado)}</td>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TableCard>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
