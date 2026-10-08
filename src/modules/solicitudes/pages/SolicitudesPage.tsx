import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { ApiError } from '@/shared/lib/api'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import Toast from '@/shared/components/ui/Toast'

import {
  ActionButton,
  ErrorBanner,
  FilterGroup,
  PageHeader,
  RowActions,
  SearchInput,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TablePagination,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { StatusPill } from '@/shared/components/ResourceBoard'
import { filterSelectClass, usePagination } from '@/shared/lib/table'
import {
  DeliverIcon,
  EyeIcon,
  InventoryIcon,
  ReturnIcon,
} from '@/shared/components/icons/AppIcons'

import { useAuth } from '@/modules/auth/context/auth'
import { useNotifications } from '@/modules/notificaciones/context/notifications'

import {
  getElementos,
  getFacturas,
  getObras,
  getSolicitudes,
  createFactura,
  entregarFactura,
  entregarSolicitud,
  devolverSolicitud,
  type DevolverSolicitudPayload,
  type EstadoDevolucion,
} from '@/modules/solicitudes/data/solicitudes'
import {
  formatDate,
  formatDay,
  inputClass,
  personName,
  porEntregar,
  requestLabel,
  requestTone,
  rutaEntregar,
  saldria,
  tieneAfuera,
} from '@/modules/solicitudes/lib/presentacion'

import type {
  CrearFacturaPayload,
  FacturaApi,
  FacturaEstado,
  FacturaFilaApi,
  FacturaTipo,
  ObraApi,
  SolicitudItemApi,
  SolicitudKind,
} from '@/modules/solicitudes/types'

import type {
  ElementoApi,
  SolicitudPendienteApi,
} from '@/modules/inventario/types/elemento'

import FacturaDetail from '@/modules/solicitudes/components/FacturaDetail'
import FacturaModal from '@/modules/solicitudes/components/FacturaModal'
import FacturasBodega from '@/modules/solicitudes/components/FacturasBodega'
import CampoPlazo from '@/modules/solicitudes/components/CampoPlazo'
import { plazoInicial } from '@/modules/solicitudes/lib/presentacion'
import StockPendienteBanner from '@/modules/solicitudes/components/StockPendienteBanner'
import BarraVista from '@/modules/solicitudes/components/BarraVista'

/*
 * "Por entregar" junta las que no tienen nada entregado y las que quedaron
 * en entrega parcial: a las dos les falta algo por salir de bodega.
 */
type DeliveryFilter =
  | 'por_entregar'
  | 'pendiente'
  | 'parcial'
  | 'entregado'
  | 'devuelto'
  | 'todas'

/*
 * Bodega ve pedidos completos: el filtro va por el estado del pedido. Material
 * entregado completo queda `cerrado`; equipo entregado con unidades afuera
 * queda `entregado` y pasa a `cerrado` cuando vuelve todo.
 */
function estadosFactura(filter: DeliveryFilter, kind: SolicitudKind): FacturaEstado[] | undefined {
  if (filter === 'por_entregar') return ['pendiente', 'parcial']
  if (filter === 'pendiente') return ['pendiente']
  if (filter === 'parcial') return ['parcial']
  if (filter === 'entregado') return kind === 'equipo' ? ['entregado'] : ['entregado', 'cerrado']
  if (filter === 'devuelto') return ['cerrado']
  return undefined
}

const TIPO_FACTURA: Record<SolicitudKind, FacturaTipo> = {
  equipo: 'devolutivo',
  material: 'consumo',
}

/* Una fila del pedido con los datos del encabezado: lo que usan los modales de entregar y devolver. */
function filaComoItem(factura: FacturaApi, fila: FacturaFilaApi): SolicitudItemApi {
  return {
    id: fila.id,
    codigoSolicitud: factura.codigoSolicitud,
    idObra: factura.idObra,
    idElemento: fila.idElemento,
    idUsuario: factura.idUsuario,
    idUsuarioEntrega: fila.usuarioEntrega?.id ?? null,
    cantidad: fila.cantidad,
    cantidadEntregada: fila.cantidadEntregada,
    cantidadPendiente: fila.cantidadPendiente,
    cantidadDevuelta: fila.cantidadDevuelta ?? null,
    cantidadAfuera: fila.cantidadAfuera ?? null,
    ficha: factura.ficha,
    estado: fila.estado,
    estadoElemento: fila.estadoElemento,
    fecha: factura.fecha ?? '',
    fechaEntrega: fila.fechaEntrega,
    fechaDevolucion: fila.fechaDevolucion,
    fechaInicio: fila.fechaInicio ?? null,
    fechaDevolucionPropuesta: fila.fechaDevolucionPropuesta ?? null,
    fechaDevolucionLimite: fila.fechaDevolucionLimite ?? null,
    plazo: fila.plazo ?? null,
    observacion: fila.observacion,
    obra: factura.obra,
    elemento: fila.elemento,
    usuario: factura.usuario,
    usuarioEntrega: fila.usuarioEntrega,
  }
}

function textoFactura(factura: FacturaApi) {
  return [
    factura.codigoSolicitud,
    factura.ficha ?? '',
    factura.obra?.nombre ?? '',
    personName(factura.usuario),
    ...factura.detalle.map((fila) => `${fila.elemento?.nombre ?? ''} ${fila.elemento?.codigo ?? ''}`),
  ]
    .join(' ')
    .toLowerCase()
}

const DELIVERY_EMPTY: Record<DeliveryFilter, string> = {
  por_entregar: 'No hay solicitudes pendientes ni parciales para entregar.',
  pendiente: 'No hay solicitudes sin entregar.',
  parcial: 'No hay solicitudes con entrega parcial.',
  entregado: 'Todavía no hay solicitudes entregadas.',
  devuelto: 'Todavía no hay equipos devueltos.',
  todas: 'Todavía no hay solicitudes.',
}

const KIND_LABEL: Record<SolicitudKind, string> = {
  equipo: 'Equipo devolutivo',
  material: 'Material de consumo',
}

const KIND_DESCRIPTION: Record<SolicitudKind, string> = {
  equipo:
    'Herramientas y equipos que se prestan para la obra y después se devuelven.',
  material:
    'Materiales que se gastan en la obra, como pintura, cemento o lija.',
}

const RETURN_STATUS_OPTIONS = [
  { value: 'bueno', label: 'Bueno' },
  { value: 'danado', label: 'Dañado' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'en_reparacion', label: 'En reparación' },
] as const

const RETURN_STATUS_LABEL = Object.fromEntries(
  RETURN_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<EstadoDevolucion, string>

function allows(
  userPermissions: string[] | undefined,
  code: string,
  isAdmin: boolean,
) {
  if (isAdmin) return false
  return userPermissions?.includes(code) === true
}

export default function SolicitudesPage() {
  const { tipo } = useParams()
  const { search } = useLocation()

  if (tipo !== 'equipo' && tipo !== 'material') {
    return <Navigate to="/inventario/solicitudes" replace />
  }

  // `?vista=entregar&buscar=...` llega de un aviso o de Elementos: se vuelve a montar con ese filtro.
  return <SolicitudKindPage key={`${tipo}${search}`} kind={tipo} />
}

function SolicitudKindPage({ kind }: { kind: SolicitudKind }) {
  const { user, isAdmin } = useAuth()
  const { lastArrival } = useNotifications()
  const [searchParams] = useSearchParams()
  const vistaPedida = searchParams.get('vista')
  const navigate = useNavigate()

  const permissions = user?.permissions

  const canCreateEquipo = allows(permissions, 'solicitud_equipo.crear', isAdmin)
  const canDeliverEquipo = allows(permissions, 'solicitud_equipo.entregar', isAdmin)
  const canReturnEquipo = allows(permissions, 'solicitud_equipo.devolver', isAdmin)
  const canCreateMaterial = allows(permissions, 'solicitud_material.crear', isAdmin)
  const canDeliverMaterial = allows(permissions, 'solicitud_material.entregar', isAdmin)

  const canCreateCurrent = kind === 'equipo' ? canCreateEquipo : canCreateMaterial
  const canDeliverCurrent = kind === 'equipo' ? canDeliverEquipo : canDeliverMaterial
  const canReturnCurrent = kind === 'equipo' && canReturnEquipo

  const [view, setView] = useState<'solicitar' | 'entregar' | 'devolver'>(() => {
    if (vistaPedida === 'entregar' && canDeliverCurrent) return 'entregar'
    if (vistaPedida === 'devolver' && canReturnCurrent) return 'devolver'
    return canCreateCurrent ? 'solicitar' : 'entregar'
  })

  const [obras, setObras] = useState<ObraApi[]>([])
  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudItemApi[]>([])
  // Entregar y Devolver: un pedido por fila, con sus elementos adentro.
  const [facturas, setFacturas] = useState<FacturaApi[]>([])
  const [facturaDetalle, setFacturaDetalle] = useState<FacturaApi | null>(null)
  const [entregaTodo, setEntregaTodo] = useState<string | null>(null)

  const [search, setSearchValue] = useState(() => searchParams.get('buscar') ?? '')
  const [page, setPage] = useState(1)
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('por_entregar')
  const [detail, setDetail] = useState<SolicitudItemApi | null>(null)

  const setSearch = (value: string) => {
    setSearchValue(value)
    setPage(1)
  }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [stockPendiente, setStockPendiente] = useState<{
    titulo: string
    codigo: string
    filas: SolicitudPendienteApi[]
  } | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [deliveryId, setDeliveryId] = useState<number | null>(null)
  const [returnId, setReturnId] = useState<number | null>(null)

  // Si cambian el filtro antes de que responda la carga anterior, gana la última.
  const lastLoad = useRef(0)

  /*
   * Carga las obras activas y los elementos activos.
   *
   * Esto se utiliza para que el instructor pueda crear
   * una solicitud.
   */
  const loadCreateData = useCallback(async () => {
    const ticket = ++lastLoad.current
    setLoading(true)
    setError('')

    try {
      const canCreateCurrent = kind === 'equipo' ? canCreateEquipo : canCreateMaterial
      const [obraRows, elementoRows, solicitudRows] = await Promise.all([
        getObras(),
        getElementos(),
        canCreateCurrent ? getSolicitudes(kind) : Promise.resolve([]),
      ])

      if (ticket !== lastLoad.current) return

      setObras(
        obraRows.filter((obra) => obra.estado),
      )

      setElementos(
        elementoRows.filter((elemento) => elemento.estado),
      )

      setSolicitudes(solicitudRows)
    } catch (cause) {
      if (ticket !== lastLoad.current) return
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudieron cargar obras, elementos y solicitudes.',
      )
    } finally {
      if (ticket === lastLoad.current) setLoading(false)
    }
  }, [canCreateEquipo, canCreateMaterial, kind])

  /*
   * Carga las solicitudes pendientes para bodega.
   */
  const loadPending = useCallback(async () => {
    const ticket = ++lastLoad.current
    setLoading(true)
    setError('')

    try {
      const canDeliverCurrent =
        kind === 'equipo'
          ? canDeliverEquipo
          : canDeliverMaterial

      if (!canDeliverCurrent) {
        setFacturas([])
        return
      }

      // El filtro de estado se aplica en pantalla sobre el estado del pedido.
      const rows = await getFacturas()

      if (ticket !== lastLoad.current) return
      setFacturas(rows.filter((row) => row.tipo === TIPO_FACTURA[kind]))
    } catch (cause) {
      if (ticket !== lastLoad.current) return
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudieron cargar las solicitudes.',
      )
    } finally {
      if (ticket === lastLoad.current) setLoading(false)
    }
  }, [
    canDeliverEquipo,
    canDeliverMaterial,
    kind,
  ])

  /*
   * Carga el equipo que sigue afuera, esté la fila entregada o en entrega
   * parcial: todo lo que bodega todavía puede recibir de vuelta.
   */
  const loadReturnable = useCallback(async () => {
    const ticket = ++lastLoad.current
    setLoading(true)
    setError('')

    try {
      if (!canReturnCurrent) {
        setFacturas([])
        return
      }

      const rows = await getFacturas()

      if (ticket !== lastLoad.current) return
      setFacturas(
        rows.filter((row) => row.tipo === 'devolutivo' && row.totales.cantidadAfuera > 0),
      )
    } catch (cause) {
      if (ticket !== lastLoad.current) return
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudieron cargar los equipos pendientes de devolución.',
      )
    } finally {
      if (ticket === lastLoad.current) setLoading(false)
    }
  }, [canReturnCurrent])

  /*
   * Cuando cambia Solicitar/Entregar o Equipo/Material,
   * cargamos la información correspondiente.
   */
  useEffect(() => {
    if (view === 'solicitar') {
      if (
        kind === 'equipo'
          ? canCreateEquipo
          : canCreateMaterial
      ) {
        void loadCreateData()
      } else {
        setLoading(false)
      }

      return
    }

    if (view === 'devolver') {
      if (canReturnCurrent) {
        void loadReturnable()
      } else {
        setLoading(false)
      }

      return
    }

    if (
      kind === 'equipo'
        ? canDeliverEquipo
        : canDeliverMaterial
    ) {
      void loadPending()
    } else {
      setLoading(false)
    }
  }, [
    view,
    kind,
    canCreateEquipo,
    canCreateMaterial,
    canDeliverEquipo,
    canDeliverMaterial,
    canReturnCurrent,
    loadCreateData,
    loadPending,
    loadReturnable,
  ])

  useEffect(() => {
    if (lastArrival?.recurso !== `solicitud_${kind}`) return
    if (view === 'solicitar' && canCreateCurrent) void loadCreateData()
    else if (view === 'entregar' && canDeliverCurrent) void loadPending()
    else if (view === 'devolver' && canReturnCurrent) void loadReturnable()
    // Solo reacciona a un aviso nuevo, no a cambios de vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastArrival])

  /*
   * Filtra las solicitudes pendientes.
   */
  const filteredRequests = useMemo(() => {
    const needle = search.trim().toLowerCase()

    if (!needle) {
      return solicitudes
    }

    return solicitudes.filter((row) =>
      `
        ${row.codigoSolicitud}
        ${row.elemento?.nombre ?? ''}
        ${row.elemento?.codigo ?? ''}
        ${row.obra?.nombre ?? ''}
        ${row.ficha ?? ''}
        ${personName(row.usuario)}
      `
        .toLowerCase()
        .includes(needle),
    )
  }, [search, solicitudes])

  const {
    pageRows,
    totalPages,
    currentPage,
    from,
    to,
    total,
  } = usePagination(filteredRequests, page)

  const facturasVisibles = useMemo(() => {
    const estados = view === 'entregar' ? estadosFactura(deliveryFilter, kind) : undefined
    const needle = search.trim().toLowerCase()

    return facturas.filter(
      (row) =>
        (!estados || estados.includes(row.estado)) &&
        (!needle || textoFactura(row).includes(needle)),
    )
  }, [deliveryFilter, facturas, kind, search, view])

  const facturaPage = usePagination(facturasVisibles, page)

  const filasFactura = useMemo(
    () => facturas.flatMap((factura) => factura.detalle.map((fila) => filaComoItem(factura, fila))),
    [facturas],
  )

  const buscarFila = (id: number | null) =>
    id === null
      ? null
      : filasFactura.find((row) => row.id === id) ??
        solicitudes.find((row) => row.id === id) ??
        null

  const deliveryRow = buscarFila(deliveryId)
  const returnRow = buscarFila(returnId)

  // Plazo que bodega confirma al entregar equipo: el que ya tenía o el propuesto.
  const [plazoEditado, setPlazoEditado] = useState<{ id: number | null; valor: string }>({
    id: null,
    valor: '',
  })
  const plazoEntrega =
    plazoEditado.id === deliveryId
      ? plazoEditado.valor
      : plazoInicial(deliveryRow?.fechaDevolucionLimite, deliveryRow?.fechaDevolucionPropuesta)
  const [plazoIntentado, setPlazoIntentado] = useState(false)

  const entregaTodoFactura =
    entregaTodo === null
      ? null
      : facturas.find((row) => row.codigoSolicitud === entregaTodo) ?? null

  /*
   * Abre el formulario.
   */
  const openCreate = () => {
    setError('')
    setModalOpen(true)
  }

  /*
   * Registra una solicitud con uno o varios elementos. Aquí NO se descuenta
   * stock: baja cuando bodega entrega. El error lo muestra el formulario.
   */
  const submit = async (
    payload: Omit<CrearFacturaPayload, 'codigoSolicitud'>,
  ) => {
    const factura = await createFactura({
      ...payload,
      codigoSolicitud: `SOL-${Date.now()}`,
    })

    setModalOpen(false)
    setToast(
      `Solicitud ${factura.codigoSolicitud} registrada con ${factura.totales.lineas} ${
        factura.totales.lineas === 1 ? 'elemento' : 'elementos'
      }. Quedó pendiente de entrega.`,
    )

    await loadCreateData()
  }

  /*
   * Entrega una solicitud pendiente o lo que falta de una parcial.
   *
   * El backend es quien descuenta el stock.
   */
  const deliver = async () => {
    if (deliveryId === null) {
      return
    }

    if (kind === 'equipo' && !plazoEntrega) {
      setPlazoIntentado(true)
      return
    }

    setSaving(true)
    setError('')

    try {
      const antes = deliveryRow
      const actualizada = await entregarSolicitud(
        kind,
        deliveryId,
        kind === 'equipo' ? { fechaDevolucionLimite: plazoEntrega } : {},
      )
      setPlazoIntentado(false)

      setDeliveryId(null)

      setToast(deliveryMessage(kind, antes, actualizada))

      await (view === 'devolver' ? loadReturnable() : loadPending())
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudo entregar la solicitud.',
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * "Entregar todo lo disponible" del pedido: el backend saca lo que haya de
   * cada elemento pendiente y avisa al instructor una sola vez.
   */
  const deliverAll = async (fechaDevolucionLimite?: string) => {
    if (!entregaTodoFactura) return

    setSaving(true)
    setError('')

    try {
      const antes = entregaTodoFactura
      const despues = await entregarFactura(
        antes.codigoSolicitud,
        fechaDevolucionLimite ? { fechaDevolucionLimite } : {},
      )

      setEntregaTodo(null)
      setToast(entregaTodoMessage(antes, despues))

      await loadPending()
    } catch (cause) {
      setEntregaTodo(null)
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudo entregar la solicitud.',
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * Registra la devolución, completa o parcial, del equipo que está afuera.
   *
   * Si vuelve en buen estado, el backend lo suma al stock.
   */
  const devolver = async (
    detalle: DevolverSolicitudPayload['detalle'],
    observacion: string,
  ) => {
    if (returnId === null) return

    setSaving(true)
    setError('')
    setStockPendiente(null)

    try {
      const actualizada = await devolverSolicitud(returnId, {
        detalle,
        ...(observacion.trim()
          ? { observacion: observacion.trim() }
          : {}),
      })
      const pendientes = actualizada.solicitudesPendientes ?? []

      setReturnId(null)

      // Lo que volvió bueno puede servir solicitudes que esperan ese elemento.
      if (pendientes.length) {
        setStockPendiente({
          titulo: `${returnMessage(detalle, actualizada)} Las unidades en buen estado ya están en bodega y hay solicitudes pendientes de ${
            actualizada.elemento?.nombre ?? 'ese elemento'
          }.`,
          codigo: actualizada.elemento?.codigo ?? '',
          filas: pendientes,
        })
      } else {
        setToast(returnMessage(detalle, actualizada))
      }

      await (view === 'devolver' ? loadReturnable() : loadPending())
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudo registrar la devolución.',
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * "Ir a entregar" del aviso de devolución: si las pendientes son de este
   * tipo, cambia a Entregar filtrado por el elemento sin salir de la página.
   */
  const irAEntregar = () => {
    if (!stockPendiente) return

    const { codigo, filas } = stockPendiente
    setStockPendiente(null)

    if (canDeliverCurrent && filas.every((fila) => fila.tipo === kind)) {
      setView('entregar')
      setSearch(codigo)
      setDeliveryFilter('por_entregar')
      setError('')
      return
    }

    navigate(rutaEntregar(codigo, filas))
  }

  const availableViews = [
    ...(canCreateCurrent
      ? [{ id: 'solicitar' as const, label: 'Solicitar' }]
      : []),
    ...(canDeliverCurrent
      ? [{ id: 'entregar' as const, label: 'Entregar' }]
      : []),
    ...(canReturnCurrent
      ? [{ id: 'devolver' as const, label: 'Devolver' }]
      : []),
  ]

  return (
    <AppLayout title={KIND_LABEL[kind]}>
      <PageHeader
        icon={<InventoryIcon />}
        title={KIND_LABEL[kind]}
        description={
          view === 'solicitar'
            ? KIND_DESCRIPTION[kind]
            : view === 'devolver'
              ? 'Recibe el equipo que vuelve a bodega, todo o una parte de lo que está afuera, y registra en qué estado llegó.'
              : 'Cada solicitud llega completa, con todos sus elementos. Ábrela para entregar elemento por elemento o entrega de una vez todo lo disponible.'
        }
        action={
          view === 'solicitar' &&
          canCreateCurrent ? (
            <Button
              onClick={openCreate}
              disabled={loading}
            >
              Nueva solicitud
            </Button>
          ) : null
        }
      />

      {error ? (
        <ErrorBanner
          message={error}
          onClose={() => setError('')}
        />
      ) : null}

      {stockPendiente ? (
        <StockPendienteBanner
          titulo={stockPendiente.titulo}
          filas={stockPendiente.filas}
          onEntregar={irAEntregar}
          onClose={() => setStockPendiente(null)}
        />
      ) : null}

      <BarraVista
        pestanas={availableViews}
        activa={view}
        onCambiar={(id) => {
          setView(id)
          setSearch('')
          setError('')
        }}
      >
        {view !== 'solicitar' || canCreateCurrent ? (
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código, persona, obra o elemento..."
          />
        ) : null}

        {view === 'entregar' && canDeliverCurrent ? (
          <FilterGroup label="Estado">
            <select
              value={deliveryFilter}
              onChange={(event) => {
                setDeliveryFilter(event.target.value as DeliveryFilter)
                setPage(1)
              }}
              className={`${filterSelectClass} lg:w-52`}
            >
              <option value="por_entregar">Por entregar</option>
              <option value="pendiente">Sin entregar</option>
              <option value="parcial">Entrega parcial</option>
              <option value="entregado">Entregadas</option>
              {kind === 'equipo' ? (
                <option value="devuelto">Devueltas</option>
              ) : null}
              <option value="todas">Todas</option>
            </select>
          </FilterGroup>
        ) : null}
      </BarraVista>

      {/*
       * VISTA PARA SOLICITAR
       */}
      {view === 'solicitar' ? (
        <>
          <section className="rounded-[26px] border border-glass-line bg-glass-strong p-7 shadow-surface backdrop-blur-glass">
            {loading ? (
              <TableLoading label="Cargando obras y elementos disponibles..." />
            ) : canCreateCurrent ? (
              <div className="grid gap-5 md:grid-cols-3">
                <InfoCard
                  title="Obras activas"
                  value={String(obras.length)}
                />

                <InfoCard
                  title="Pendientes de entrega"
                  value={String(
                    solicitudes.filter((row) => porEntregar(row.estado)).length,
                  )}
                />

                <InfoCard
                  title={kind === 'equipo' ? 'Equipos por devolver' : 'Entregadas'}
                  value={String(
                    solicitudes.filter((row) =>
                      kind === 'equipo' ? tieneAfuera(row) : row.estado === 'entregado',
                    ).length,
                  )}
                />
              </div>
            ) : (
              <p className="text-sm text-sena-text-soft">
                No tienes permiso para crear este tipo de solicitud.
              </p>
            )}
          </section>

          {canCreateCurrent && !loading ? (
            <TableCard>
              <RequestsTable
                mode="mine"
                rows={pageRows}
                emptyLabel={
                  search.trim()
                    ? 'No se encontraron solicitudes.'
                    : `Todavía no has pedido ${KIND_LABEL[kind].toLowerCase()}.`
                }
                onView={setDetail}
              />
              <TablePagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                from={from}
                to={to}
                total={total}
                noun="solicitudes"
              />
            </TableCard>
          ) : null}
        </>
      ) : view === 'entregar' ? (
        /*
         * VISTA PARA ENTREGAR
         */
        <TableCard>
          {loading ? (
            <TableLoading label="Cargando solicitudes..." />
          ) : (
            <>
              <FacturasBodega
                mode="deliver"
                facturas={facturaPage.pageRows}
                abrirTodas={search.trim() !== ''}
                emptyLabel={
                  search.trim()
                    ? 'No se encontraron solicitudes.'
                    : DELIVERY_EMPTY[deliveryFilter]
                }
                saving={saving}
                onView={setFacturaDetalle}
                onDeliverLine={(_, fila) => setDeliveryId(fila.id)}
                onDeliverAll={(factura) => setEntregaTodo(factura.codigoSolicitud)}
                onReturnLine={
                  canReturnCurrent ? (_, fila) => setReturnId(fila.id) : undefined
                }
              />
              <TablePagination
                page={facturaPage.currentPage}
                totalPages={facturaPage.totalPages}
                onPageChange={setPage}
                from={facturaPage.from}
                to={facturaPage.to}
                total={facturaPage.total}
                noun="solicitudes"
              />
            </>
          )}
        </TableCard>
      ) : (
        /*
         * VISTA PARA DEVOLVER
         */
        <TableCard>
          {loading ? (
            <TableLoading label="Cargando equipos pendientes de devolución..." />
          ) : (
            <>
              <FacturasBodega
                mode="return"
                facturas={facturaPage.pageRows}
                abrirTodas={search.trim() !== ''}
                emptyLabel={
                  search.trim()
                    ? 'No se encontraron solicitudes.'
                    : 'No hay equipos pendientes de devolución.'
                }
                saving={saving}
                onView={setFacturaDetalle}
                onReturnLine={(_, fila) => setReturnId(fila.id)}
              />
              <TablePagination
                page={facturaPage.currentPage}
                totalPages={facturaPage.totalPages}
                onPageChange={setPage}
                from={facturaPage.from}
                to={facturaPage.to}
                total={facturaPage.total}
                noun="solicitudes"
              />
            </>
          )}
        </TableCard>
      )}

      {modalOpen ? (
        <FacturaModal
          obras={obras}
          elementos={elementos}
          tipos={[kind === 'equipo' ? 'devolutivo' : 'consumo']}
          onClose={() => setModalOpen(false)}
          onSubmit={submit}
        />
      ) : null}

      {/*
       * MODAL PARA CONFIRMAR ENTREGA
       */}
      {deliveryId !== null ? (
        <Modal
          title={
            deliveryRow?.estado === 'parcial'
              ? 'Entregar lo pendiente'
              : `Entregar ${KIND_LABEL[kind].toLowerCase()}`
          }
          description="Confirma la entrega. El backend descontará la cantidad del stock en ese momento."
          onClose={() => setDeliveryId(null)}
        >
          <div className="space-y-5">
            {deliveryRow ? (
              <p className="rounded-2xl bg-sena-soft px-4 py-3 text-sm leading-6 text-sena-dark">
                Vas a entregar{' '}
                <strong>
                  {deliveryRow.cantidadPendiente} de{' '}
                  {deliveryRow.elemento?.nombre ?? 'este elemento'}
                </strong>{' '}
                a {personName(deliveryRow.usuario)}
                {deliveryRow.obra
                  ? ` para ${deliveryRow.obra.nombre}`
                  : ''}
                .
                {deliveryRow.estado === 'parcial' ? (
                  <>
                    {' '}
                    Ya se entregaron {deliveryRow.cantidadEntregada} de{' '}
                    {deliveryRow.cantidad}; esta entrega actualiza la
                    solicitud {deliveryRow.codigoSolicitud}.
                  </>
                ) : null}
              </p>
            ) : null}

            {kind === 'equipo' ? (
              <CampoPlazo
                id="entrega-plazo"
                value={plazoEntrega}
                onChange={(valor) => setPlazoEditado({ id: deliveryId, valor })}
                propuesta={deliveryRow?.fechaDevolucionPropuesta}
                invalido={plazoIntentado && !plazoEntrega}
              />
            ) : null}

            <p className="text-sm leading-6 text-sena-strong">
              Sale lo que haya en el estante hasta completar lo
              pendiente. Si no alcanza, la solicitud queda en{' '}
              <strong>entrega parcial</strong> y el resto se
              entrega después. Si no hay existencia, el backend
              rechazará la entrega y el stock no se modificará.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeliveryId(null)
                  setPlazoIntentado(false)
                }}
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                size="sm"
                onClick={() => void deliver()}
                disabled={saving}
              >
                {saving
                  ? 'Entregando...'
                  : 'Confirmar entrega'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {entregaTodoFactura ? (
        <EntregaTodoModal
          factura={entregaTodoFactura}
          saving={saving}
          onClose={() => setEntregaTodo(null)}
          onConfirm={(fecha) => void deliverAll(fecha)}
        />
      ) : null}

      {facturaDetalle ? (
        <FacturaDetail factura={facturaDetalle} onClose={() => setFacturaDetalle(null)} />
      ) : null}

      {detail ? (
        <SolicitudDetail
          kind={kind}
          row={detail}
          canDeliver={
            view === 'entregar' &&
            canDeliverCurrent &&
            porEntregar(detail.estado)
          }
          onDeliver={() => {
            setDeliveryId(detail.id)
            setDetail(null)
          }}
          canReturn={canReturnCurrent && tieneAfuera(detail)}
          onReturn={() => {
            setReturnId(detail.id)
            setDetail(null)
          }}
          onClose={() => setDetail(null)}
        />
      ) : null}

      {returnId !== null ? (
        <DevolucionModal
          row={returnRow}
          saving={saving}
          onClose={() => setReturnId(null)}
          onSubmit={devolver}
        />
      ) : null}

      {toast ? (
        <Toast
          message={toast}
          onClose={() => setToast('')}
        />
      ) : null}
    </AppLayout>
  )
}

/*
 * Confirmación de "Entregar todo lo disponible": qué sale de cada elemento con
 * la existencia de ahora y qué queda pendiente.
 */
function EntregaTodoModal({
  factura,
  saving,
  onClose,
  onConfirm,
}: {
  factura: FacturaApi
  saving: boolean
  onClose: () => void
  onConfirm: (fechaDevolucionLimite?: string) => void
}) {
  const filas = factura.detalle.filter((fila) => porEntregar(fila.estado))
  const total = filas.reduce((suma, fila) => suma + saldria(fila), 0)
  const equipo = factura.tipo === 'devolutivo'
  const [plazo, setPlazo] = useState(() =>
    plazoInicial(factura.fechaDevolucionLimite, factura.fechaDevolucionPropuesta),
  )
  const [intentado, setIntentado] = useState(false)

  return (
    <Modal
      title="Entregar todo lo disponible"
      description={`Solicitud ${factura.codigoSolicitud} de ${personName(factura.usuario)}${
        factura.obra ? ` para ${factura.obra.nombre}` : ''
      }.`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <ul className="divide-y divide-sena-hairline overflow-hidden rounded-2xl border border-sena-line bg-white/70">
          {filas.map((fila) => {
            const sale = saldria(fila)
            const queda = fila.cantidadPendiente - sale

            return (
              <li
                key={`${fila.tipo}-${fila.id}`}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-sena-text">
                    {fila.elemento?.nombre ?? '—'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-sena-text-soft">
                    {fila.elemento?.codigo ?? '—'}
                  </p>
                </div>
                <p
                  className={
                    sale > 0
                      ? 'shrink-0 text-right text-sm font-semibold text-sena-strong tabular-nums'
                      : 'shrink-0 text-right text-sm font-semibold text-sena-warn-text tabular-nums'
                  }
                >
                  {sale > 0 ? `Salen ${sale} de ${fila.cantidadPendiente}` : 'Sin existencia'}
                  {queda > 0 ? (
                    <span className="block text-xs font-normal text-sena-text-soft">
                      {queda} {queda === 1 ? 'queda pendiente' : 'quedan pendientes'}
                    </span>
                  ) : null}
                </p>
              </li>
            )
          })}
        </ul>

        {equipo ? (
          <CampoPlazo
            id="entrega-todo-plazo"
            value={plazo}
            onChange={setPlazo}
            propuesta={factura.fechaDevolucionPropuesta}
            invalido={intentado && !plazo}
          />
        ) : null}

        <p className="text-sm leading-6 text-sena-strong">
          El backend descuenta del stock lo que salga. Si la existencia cambió,
          sale lo que haya en ese momento y el resto queda pendiente. El
          instructor recibe un solo aviso con todo lo entregado.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (equipo && !plazo) {
                setIntentado(true)
                return
              }
              onConfirm(equipo ? plazo : undefined)
            }}
            disabled={saving || total <= 0}
          >
            {saving ? 'Entregando...' : `Entregar ${total} ${total === 1 ? 'unidad' : 'unidades'}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* Toast después de entregar todo lo disponible de un pedido. */
function entregaTodoMessage(antes: FacturaApi, despues: FacturaApi) {
  const salieron = despues.totales.cantidadEntregada - antes.totales.cantidadEntregada
  const elementos = despues.detalle.filter((fila) => {
    const previa = antes.detalle.find((row) => row.tipo === fila.tipo && row.id === fila.id)
    return previa !== undefined && fila.cantidadEntregada > previa.cantidadEntregada
  }).length
  const quedan = despues.totales.cantidadPendiente

  return `Solicitud ${despues.codigoSolicitud}: ${salieron === 1 ? 'se entregó' : 'se entregaron'} ${salieron} ${
    salieron === 1 ? 'unidad' : 'unidades'
  } de ${elementos} ${elementos === 1 ? 'elemento' : 'elementos'}.${
    quedan > 0 ? ` ${quedan === 1 ? 'Queda' : 'Quedan'} ${quedan} pendientes.` : ' Quedó completa.'
  } El stock se actualizó.`
}

type CantidadesDevolucion = Record<EstadoDevolucion, string>

/*
 * Modal para registrar la devolución de un equipo. Bodega puede recibir todo
 * lo que está afuera o solo una parte, repartido por el estado en que volvió.
 */
function DevolucionModal({
  row,
  saving,
  onClose,
  onSubmit,
}: {
  row: SolicitudItemApi | null
  saving: boolean
  onClose: () => void
  onSubmit: (
    detalle: DevolverSolicitudPayload['detalle'],
    observacion: string,
  ) => Promise<void>
}) {
  const afuera = row?.cantidadAfuera ?? 0
  const [cantidades, setCantidades] = useState<CantidadesDevolucion>({
    bueno: afuera > 0 ? String(afuera) : '',
    danado: '',
    perdido: '',
    en_reparacion: '',
  })
  const [observacion, setObservacion] = useState('')
  const [localError, setLocalError] = useState('')

  const valores = RETURN_STATUS_OPTIONS.map((option) => ({
    estadoElemento: option.value,
    cantidad: Number(cantidades[option.value] || 0),
  }))
  const total = valores.reduce(
    (suma, linea) =>
      suma + (Number.isFinite(linea.cantidad) ? linea.cantidad : 0),
    0,
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError('')

    if (
      valores.some(
        (linea) => !Number.isInteger(linea.cantidad) || linea.cantidad < 0,
      )
    ) {
      setLocalError('Las cantidades deben ser números enteros, sin negativos.')
      return
    }

    if (total <= 0) {
      setLocalError('Indica cuántas unidades vuelven a bodega.')
      return
    }

    if (total > afuera) {
      setLocalError(`Solo hay ${afuera} afuera para recibir.`)
      return
    }

    await onSubmit(
      valores.filter((linea) => linea.cantidad > 0),
      observacion,
    )
  }

  return (
    <Modal
      title="Registrar devolución"
      description="Revisa el equipo que llega a bodega, indica cuántas unidades vuelven en cada estado y registra cualquier novedad."
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {localError ? (
          <ErrorBanner
            message={localError}
            onClose={() => setLocalError('')}
          />
        ) : null}

        {row ? (
          <p className="rounded-2xl bg-sena-soft px-4 py-3 text-sm leading-6 text-sena-dark">
            {personName(row.usuario)} tiene afuera{' '}
            <strong>
              {afuera} de {row.elemento?.nombre ?? 'este elemento'}
            </strong>
            {row.obra ? ` para ${row.obra.nombre}` : ''}.
            {row.cantidadDevuelta
              ? ` Ya devolvió ${row.cantidadDevuelta}.`
              : ''}
            {row.cantidadPendiente > 0
              ? ` Faltan ${row.cantidadPendiente} por entregar.`
              : ''}
          </p>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="mb-2 block text-sm font-semibold text-sena-strong">
            Cantidad por estado
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            {RETURN_STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                htmlFor={`devolucion-${option.value}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-sena-line bg-white/65 px-4 py-2"
              >
                <span className="text-sm font-semibold text-sena-text">
                  {option.label}
                </span>
                <input
                  id={`devolucion-${option.value}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={afuera}
                  step={1}
                  value={cantidades[option.value]}
                  onChange={(event) =>
                    setCantidades((actual) => ({
                      ...actual,
                      [option.value]: event.target.value,
                    }))
                  }
                  placeholder="0"
                  className={`${inputClass} w-24 text-right tabular-nums`}
                  disabled={saving}
                />
              </label>
            ))}
          </div>

          <p className="text-sm text-sena-text-soft tabular-nums">
            Vas a recibir <strong>{total}</strong> de {afuera}
            {total > 0 && total < afuera
              ? `; quedarán ${afuera - total} afuera.`
              : '.'}
          </p>
        </fieldset>

        <div>
          <label
            htmlFor="observacion-devolucion"
            className="mb-2 block text-sm font-semibold text-sena-strong"
          >
            Novedad / observación
          </label>

          <textarea
            id="observacion-devolucion"
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
            rows={4}
            placeholder="Describe cualquier novedad del elemento..."
            className={`${inputClass} w-full resize-none`}
            disabled={saving}
          />
        </div>

        <p className="text-sm leading-6 text-sena-text-soft">
          Lo que vuelve en buen estado el backend lo reincorpora al stock. Los
          demás estados no aumentan el stock disponible.
        </p>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Registrando...' : 'Registrar devolución'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/*
 * Mensaje del toast después de recibir equipo: cuánto volvió, en qué estado,
 * cuánto sigue afuera y si todavía falta entregar algo.
 */
function returnMessage(
  detalle: DevolverSolicitudPayload['detalle'],
  despues: SolicitudItemApi,
) {
  const total = detalle.reduce((suma, linea) => suma + linea.cantidad, 0)
  const partes = detalle
    .map(
      (linea) =>
        `${linea.cantidad} ${RETURN_STATUS_LABEL[linea.estadoElemento].toLowerCase()}`,
    )
    .join(', ')
  const afuera = despues.cantidadAfuera ?? 0
  const resto =
    afuera > 0
      ? ` ${afuera === 1 ? 'Queda' : 'Quedan'} ${afuera} afuera.`
      : ' Ya no queda equipo afuera.'
  const porEntregar =
    despues.cantidadPendiente > 0
      ? ` Faltan ${despues.cantidadPendiente} por entregar.`
      : ''

  return `Devolución registrada: volvieron ${total} de ${
    despues.elemento?.nombre ?? 'el elemento'
  } (${partes}).${resto}${porEntregar}`
}

/*
 * Tabla de solicitudes: pocas columnas y el detalle completo en el ojo.
 * "mine" es lo que pidió el instructor; "deliver" es la vista de bodega;
 * "return" es lo que bodega puede recibir de vuelta.
 */
function RequestsTable({
  mode,
  rows,
  emptyLabel,
  saving = false,
  onView,
  onDeliver,
  onReturn,
}: {
  mode: 'mine' | 'deliver' | 'return'
  rows: SolicitudItemApi[]
  emptyLabel: string
  saving?: boolean
  onView: (row: SolicitudItemApi) => void
  onDeliver?: (row: SolicitudItemApi) => void
  onReturn?: (row: SolicitudItemApi) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead>
          <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
            <TableHeader width="w-[30%]">Elemento</TableHeader>
            <TableHeader width="w-[27%]">
              {mode === 'mine' ? 'Obra' : 'Solicitante'}
            </TableHeader>
            <TableHeader align="center" width="w-[12%]">
              Cantidad
            </TableHeader>
            <TableHeader align="center" width={tableColumns.status}>
              Estado
            </TableHeader>
            <TableHeader align="center" width={tableColumns.actions}>
              Acciones
            </TableHeader>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={5}>{emptyLabel}</TableEmpty>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <td className="px-5 py-4">
                  <p className="truncate font-semibold text-sena-text">
                    {row.elemento?.nombre ?? '—'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-sena-text/45">
                    {row.elemento?.codigo ?? '—'}
                  </p>
                </td>

                <td className="px-5 py-4">
                  {mode === 'mine' ? (
                    <p className="truncate text-sena-text">
                      {row.obra?.nombre ?? '—'}
                    </p>
                  ) : (
                    <>
                      <p className="truncate text-sena-text">
                        {personName(row.usuario)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-sena-text/45">
                        {row.obra ? `para ${row.obra.nombre}` : '—'}
                      </p>
                    </>
                  )}
                </td>

                <td className="px-5 py-4 text-center tabular-nums">
                  <p className="font-semibold text-sena-text">
                    {row.cantidad}
                  </p>
                  {mode === 'return' ? (
                    <p className="mt-0.5 text-[11px] text-sena-text/45">
                      {row.cantidadAfuera ?? 0} afuera
                      {row.cantidadDevuelta
                        ? ` · ${row.cantidadDevuelta} devueltos`
                        : ''}
                      {row.cantidadPendiente > 0
                        ? ` · ${row.cantidadPendiente} por entregar`
                        : ''}
                    </p>
                  ) : row.estado === 'parcial' ? (
                    <p className="mt-0.5 text-[11px] text-sena-text/45">
                      {row.cantidadEntregada} entregados ·{' '}
                      {row.cantidadPendiente} pendientes
                    </p>
                  ) : null}
                </td>

                <td className="px-5 py-4 text-center">
                  <StatusPill tone={requestTone(row.estado)}>
                    {requestLabel(row.estado)}
                  </StatusPill>
                  <p className="mt-1 text-[11px] text-sena-text/45">
                    {formatDay(
                      row.estado === 'pendiente'
                        ? row.fecha
                        : row.fechaDevolucion ?? row.fechaEntrega,
                    )}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <RowActions>
                    <ActionButton
                      title="Ver solicitud"
                      onClick={() => onView(row)}
                    >
                      <EyeIcon className="size-[18px]" />
                    </ActionButton>

                    {mode === 'deliver' &&
                    onDeliver &&
                    porEntregar(row.estado) ? (
                      <ActionButton
                        title={
                          row.estado === 'parcial'
                            ? 'Entregar lo pendiente'
                            : 'Entregar'
                        }
                        disabled={saving}
                        onClick={() => onDeliver(row)}
                      >
                        <DeliverIcon className="size-[18px]" />
                      </ActionButton>
                    ) : null}

                    {onReturn && tieneAfuera(row) ? (
                      <ActionButton
                        title="Devolver"
                        disabled={saving}
                        onClick={() => onReturn(row)}
                      >
                        <ReturnIcon className="size-[18px]" />
                      </ActionButton>
                    ) : null}
                  </RowActions>
                </td>
              </TableRow>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function unidades(cantidad: number, palabra: string) {
  return `${cantidad} ${palabra}${cantidad === 1 ? '' : 's'}`
}

/*
 * Mensaje del toast después de entregar. Si la fila ya era parcial, deja
 * claro que la solicitud se actualizó con lo que faltaba.
 */
function deliveryMessage(
  kind: SolicitudKind,
  antes: SolicitudItemApi | null,
  despues: SolicitudItemApi,
) {
  const elemento = despues.elemento?.nombre ?? 'el elemento'
  const quedan =
    despues.cantidadPendiente > 0
      ? ` ${despues.cantidadPendiente === 1 ? 'Queda' : 'Quedan'} ${unidades(despues.cantidadPendiente, 'pendiente')}.`
      : ''

  if (antes && antes.cantidadEntregada > 0) {
    const salio = despues.cantidadEntregada - antes.cantidadEntregada

    return `Solicitud ${despues.codigoSolicitud} actualizada: ${
      salio === 1 ? 'se entregó' : 'se entregaron'
    } ${unidades(salio, 'pendiente')} de ${elemento}.${quedan || ' Quedó completa.'}`
  }

  if (despues.cantidadPendiente > 0) {
    return `Se entregaron ${despues.cantidadEntregada} de ${despues.cantidad} de ${elemento}.${quedan} El stock se actualizó.`
  }

  return `${KIND_LABEL[kind]} entregado correctamente. El stock se actualizó.`
}

const ESTADO_ELEMENTO_LABEL: Record<
  NonNullable<SolicitudItemApi['estadoElemento']>,
  string
> = {
  bueno: 'Bueno',
  danado: 'Dañado',
  perdido: 'Perdido',
  en_reparacion: 'En reparación',
}

/*
 * Detalle completo de una solicitud.
 */
function SolicitudDetail({
  kind,
  row,
  canDeliver,
  onDeliver,
  canReturn,
  onReturn,
  onClose,
}: {
  kind: SolicitudKind
  row: SolicitudItemApi
  canDeliver: boolean
  onDeliver: () => void
  canReturn: boolean
  onReturn: () => void
  onClose: () => void
}) {
  const devuelto = row.estado === 'devuelto'

  return (
    <Modal
      title={`Solicitud ${row.codigoSolicitud}`}
      description={KIND_LABEL[kind]}
      onClose={onClose}
      wide
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-bold text-sena-text">
              {row.elemento?.nombre ?? '—'}
            </p>
            <p className="mt-0.5 text-sm text-sena-text-soft">
              {row.elemento?.codigo ?? '—'}
            </p>
          </div>

          <StatusPill tone={requestTone(row.estado)}>
            {requestLabel(row.estado)}
          </StatusPill>
        </div>

        <dl className="grid gap-x-6 gap-y-4 rounded-2xl border border-sena-line bg-white/65 px-5 py-4 sm:grid-cols-2">
          <DetailField term="Cantidad" value={String(row.cantidad)} />
          <DetailField
            term="Entregado"
            value={`${row.cantidadEntregada} de ${row.cantidad}${
              row.cantidadPendiente > 0
                ? ` · ${row.cantidadPendiente} pendientes`
                : ''
            }`}
          />
          <DetailField term="Ficha" value={row.ficha || '—'} />
          <DetailField
            term="Obra"
            value={
              row.obra
                ? `${row.obra.nombre}${row.obra.lugar ? ` — ${row.obra.lugar}` : ''}`
                : '—'
            }
          />
          <DetailField term="Solicitante" value={personName(row.usuario)} />
          <DetailField term="Fecha de solicitud" value={formatDate(row.fecha)} />
          <DetailField
            term="Fecha de entrega"
            value={formatDate(row.fechaEntrega)}
          />
          <DetailField
            term="Entregó"
            value={row.usuarioEntrega ? personName(row.usuarioEntrega) : '—'}
          />
          {kind === 'equipo' ? (
            <DetailField
              term="Afuera / devuelto"
              value={`${row.cantidadAfuera ?? 0} afuera · ${row.cantidadDevuelta ?? 0} devueltos`}
            />
          ) : null}
          {kind === 'equipo' ? (
            <DetailField
              term={devuelto ? 'Fecha de devolución' : 'Última devolución'}
              value={
                row.fechaDevolucion
                  ? formatDate(row.fechaDevolucion)
                  : 'Todavía no se devuelve'
              }
            />
          ) : null}
          {row.estadoElemento ? (
            <DetailField
              term="Cómo volvió"
              value={ESTADO_ELEMENTO_LABEL[row.estadoElemento]}
            />
          ) : null}
          <div className="sm:col-span-2">
            <DetailField
              term="Observación"
              value={row.observacion || '—'}
            />
          </div>
        </dl>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          {canDeliver ? (
            <Button size="sm" onClick={onDeliver}>
              {row.estado === 'parcial' ? 'Entregar lo pendiente' : 'Entregar'}
            </Button>
          ) : null}

          {canReturn ? (
            <Button size="sm" onClick={onReturn}>
              Devolver
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}

function DetailField({ term, value }: { term: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-sena-text-soft">{term}</dt>
      <dd className="mt-0.5 text-sm font-semibold break-words text-sena-text">
        {value}
      </dd>
    </div>
  )
}

/*
 * Tarjeta informativa
 */
function InfoCard({
  title,
  value,
  compact = false,
}: {
  title: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="rounded-2xl border border-sena-line bg-white/65 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-sena-strong">
        {title}
      </p>

      <p
        className={
          compact
            ? 'mt-2 text-lg font-bold text-sena-text'
            : 'mt-2 text-2xl font-bold text-sena-text'
        }
      >
        {value}
      </p>
    </div>
  )
}
