import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { ErrorBanner, PageHeader } from '@/shared/components/DataTable'
import { AlertIcon, DeliverIcon, HomeIcon, ReportIcon, ReturnIcon } from '@/shared/components/icons/AppIcons'
import { ApiError } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'
import { getElementos } from '@/modules/inventario/data/elemento'
import { getFacturas } from '@/modules/solicitudes/data/solicitudes'
import ChartCard from '@/modules/inventario/components/ChartCard'
import AreaSolicitudesChart from '@/modules/inventario/components/AreaSolicitudesChart'
import {
  VENTANA_ROTACION_DIAS,
  VENTANA_SOLICITUDES_DIAS,
  consumoVsDevolutivo,
  devueltosPorEstado,
  entregasPorMes,
  esAdminBodega,
  masPedidos,
  masRapidos,
  prestamosPorPlazo,
  solicitudesVsEntregasPorDia,
  solicitudesPorEstado,
  stockBajo,
} from '@/modules/inventario/lib/tablero'
import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type { FacturaApi } from '@/modules/solicitudes/types'

const TOPS = [5, 10, 15]

function TopSelect({ value, onChange, id }: { value: number; onChange: (value: number) => void; id: string }) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        Cantidad de elementos
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-sena-line bg-white px-3 py-1.5 text-sm text-sena-text focus:border-sena focus:outline-none"
      >
        {TOPS.map((top) => (
          <option key={top} value={top}>
            Top {top}
          </option>
        ))}
      </select>
    </>
  )
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-8 w-1.5 rounded-full bg-sena" />
        <div>
        <h2 className="text-lg font-bold text-sena-text xl:text-xl">{titulo}</h2>
        <p className="text-sm text-sena-text-soft">{descripcion}</p>
        </div>
      </div>
      <div className="grid grid-flow-row-dense grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-12">{children}</div>
    </section>
  )
}

export default function TableroBodegaPage() {
  const { isAdmin, user } = useAuth()
  const permitido = esAdminBodega({ isAdmin, permissions: user?.permissions, role: user?.role })

  const [facturas, setFacturas] = useState<FacturaApi[]>([])
  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topPedidos, setTopPedidos] = useState(5)
  const [topRapidos, setTopRapidos] = useState(5)

  useEffect(() => {
    if (!permitido) return
    let cancelled = false
    Promise.allSettled([getFacturas(), getElementos()]).then(([solicitudes, stock]) => {
      if (cancelled) return
      if (solicitudes.status === 'fulfilled') setFacturas(solicitudes.value)
      if (stock.status === 'fulfilled') setElementos(stock.value)
      const fallo = [solicitudes, stock].find((result) => result.status === 'rejected')
      if (fallo && fallo.status === 'rejected') {
        setError(fallo.reason instanceof ApiError ? fallo.reason.message : 'No se pudieron cargar los datos del tablero.')
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [permitido])

  const datos = useMemo(
    () => ({
      devueltos: devueltosPorEstado(facturas),
      pedidos: masPedidos(facturas, topPedidos),
      rapidos: masRapidos(facturas, topRapidos),
      estados: solicitudesPorEstado(facturas),
      meses: entregasPorMes(facturas),
      porDia: solicitudesVsEntregasPorDia(facturas),
      caracter: consumoVsDevolutivo(elementos),
      plazos: prestamosPorPlazo(facturas),
      stock: stockBajo(elementos),
    }),
    [facturas, elementos, topPedidos, topRapidos],
  )

  const ACENTO = {
    verde: { barra: 'bg-sena', fondo: 'bg-sena-active-soft', texto: 'text-sena-ok-text' },
    naranja: { barra: 'bg-sena-orange', fondo: 'bg-sena-warn-soft', texto: 'text-sena-warn-text' },
    rojo: { barra: 'bg-sena-danger-text', fondo: 'bg-sena-danger-soft', texto: 'text-sena-danger-text' },
  }
  const kpis = [
    { label: 'Solicitudes', valor: facturas.length, ayuda: 'Registradas en tu bodega', Icono: ReportIcon, acento: ACENTO.verde },
    { label: 'Por atender', valor: (datos.estados[0]?.valor ?? 0) + (datos.estados[1]?.valor ?? 0), ayuda: 'Pendientes o parciales', Icono: DeliverIcon, acento: ACENTO.naranja },
    { label: 'Préstamos vencidos', valor: datos.plazos[0]?.valor ?? 0, ayuda: 'Unidades afuera con plazo vencido', Icono: ReturnIcon, acento: ACENTO.rojo },
    { label: 'Stock bajo', valor: datos.stock.criticos.length, ayuda: 'Agotados o por agotarse', Icono: AlertIcon, acento: ACENTO.naranja },
  ]

  if (!permitido) return <Navigate to="/inventario" replace />

  return (
    <AppLayout title="Tablero de bodega">
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-sena-text-soft">
        <HomeIcon className="size-4" />
        <Link to="/inventario" className="hover:text-sena-strong">
          Inventario
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-sena-strong">Tablero</span>
      </div>

      <PageHeader
        icon={<ReportIcon />}
        title="Tablero de bodega"
        description="Indicadores de tu bodega calculados con las solicitudes, préstamos y el stock que ya ves. Cambia el tipo de gráfica en cada tarjeta."
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      {loading ? (
        <div className="grid min-h-60 place-items-center text-sm text-sena-text-soft">Cargando tablero…</div>
      ) : (
        <div className="mt-6 w-full space-y-8">
          <section aria-label="Resumen" className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ label, valor, ayuda, Icono, acento }) => (
              <div
                key={label}
                className="relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-sena-line bg-white p-5 shadow-sm"
              >
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${acento.barra}`} />
                <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${acento.fondo} ${acento.texto}`}>
                  <Icono className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sena-text-soft">{label}</p>
                  <p className={`text-3xl leading-tight font-bold tabular-nums ${acento.texto}`}>{valor.toLocaleString('es-CO')}</p>
                  <p className="truncate text-xs text-sena-text-soft">{ayuda}</p>
                </div>
              </div>
            ))}
          </section>

          <Seccion titulo="Devoluciones, préstamos y solicitudes" descripcion="Cómo vuelve el equipo, qué sigue afuera y cómo van las solicitudes.">
            <ChartCard
              titulo="Elementos devueltos por estado"
              descripcion="Unidades de equipo devueltas según su novedad, y las que siguen afuera."
              datos={datos.devueltos}
              tipoInicial="dona"
              unidad="Unidades"
              className="xl:col-span-4"
            />
            <ChartCard
              titulo="Préstamos vencidos vs al día"
              descripcion="Unidades de equipo afuera según la fecha límite de devolución."
              datos={datos.plazos}
              tipoInicial="dona"
              unidad="Unidades afuera"
              className="xl:col-span-4"
            />
            <ChartCard
              titulo="Solicitudes por estado"
              descripcion="Cantidad de solicitudes según su estado actual."
              datos={datos.estados}
              tipoInicial="dona"
              unidad="Solicitudes"
              className="lg:col-span-2 xl:col-span-4"
            />
          </Seccion>

          <Seccion titulo="Pedidos y rotación" descripcion="Qué se pide más, qué sale más rápido y cuánto se entrega y se solicita en el tiempo.">
            <ChartCard
              titulo="Elementos más pedidos"
              descripcion="Unidades solicitadas por elemento (equipo y material)."
              datos={datos.pedidos}
              unidad="Unidades pedidas"
              className="xl:col-span-6"
              acciones={<TopSelect id="top-pedidos" value={topPedidos} onChange={setTopPedidos} />}
            />
            <ChartCard
              titulo="Elementos que más rápido se van"
              descripcion={`Unidades entregadas por día en los últimos ${VENTANA_ROTACION_DIAS} días.`}
              datos={datos.rapidos}
              unidad="Unidades por día"
              className="xl:col-span-6"
              acciones={<TopSelect id="top-rapidos" value={topRapidos} onChange={setTopRapidos} />}
            />
            <ChartCard
              titulo="Entregas por mes"
              descripcion="Unidades entregadas en los últimos 12 meses."
              datos={datos.meses}
              tipoInicial="lineas"
              unidad="Unidades entregadas"
              className="xl:col-span-6"
              altura="min-h-96"
            />
            <ChartCard
              titulo="Solicitudes vs entregas por día"
              descripcion={`Solicitudes creadas y unidades entregadas cada día en los últimos ${VENTANA_SOLICITUDES_DIAS} días.`}
              datos={[]}
              grafica={<AreaSolicitudesChart data={datos.porDia} />}
              className="xl:col-span-6"
            />
          </Seccion>

          <Seccion titulo="Inventario" descripcion="Tipo de elementos y stock que necesita reposición.">
            <ChartCard
              titulo="Consumo vs devolutivo"
              descripcion="Elementos según su tipo (o el de su clasificación si no lo tienen)."
              datos={datos.caracter}
              tipoInicial="dona"
              unidad="Elementos"
              className="xl:col-span-4"
            />
            <ChartCard
              titulo="Stock bajo"
              descripcion="Elementos con cantidad mínima definida."
              datos={datos.stock.resumen}
              tipoInicial="barras"
              unidad="Elementos"
              className="xl:col-span-8"
            >
              {datos.stock.criticos.length > 0 ? (
                <div className="mt-6 border-t border-sena-line-soft pt-4">
                  <p className="mb-2 text-sm font-semibold text-sena-text">Para reponer</p>
                  <ul className="max-h-48 divide-y divide-sena-line-soft overflow-y-auto text-sm">
                    {datos.stock.criticos.slice(0, 10).map((elemento) => (
                      <li key={elemento.id} className="flex items-center justify-between gap-4 py-2">
                        <Link to={`/inventario/elementos/${elemento.id}`} className="truncate text-sena-text hover:text-sena-strong">
                          {elemento.nombre}
                        </Link>
                        <span className={elemento.cantidad <= 0 ? 'shrink-0 font-semibold text-sena-danger-text' : 'shrink-0 font-semibold text-sena-warn-text'}>
                          {elemento.cantidad} / mín. {elemento.cantidadMinima}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </ChartCard>
          </Seccion>
        </div>
      )}
    </AppLayout>
  )
}
