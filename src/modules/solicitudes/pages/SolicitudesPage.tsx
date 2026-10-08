import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { ApiError } from '@/shared/lib/api'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import Toast from '@/shared/components/ui/Toast'

import {
  ActionButton,
  ErrorBanner,
  FilterCard,
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
  getObras,
  getSolicitudes,
  createFactura,
  entregarSolicitud,
  devolverSolicitud,
  type DevolverSolicitudPayload,
} from '@/modules/solicitudes/data/solicitudes'
import {
  formatDate,
  formatDay,
  inputClass,
  personName,
  requestLabel,
  requestTone,
} from '@/modules/solicitudes/lib/presentacion'

import type {
  CrearFacturaPayload,
  ObraApi,
  SolicitudItemApi,
  SolicitudKind,
} from '@/modules/solicitudes/types'

import type { ElementoApi } from '@/modules/inventario/types/elemento'

import FacturaModal from '@/modules/solicitudes/components/FacturaModal'

type DeliveryFilter = 'pendiente' | 'entregado' | 'devuelto' | 'todas'

const DELIVERY_EMPTY: Record<DeliveryFilter, string> = {
  pendiente: 'No hay solicitudes pendientes para entregar.',
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

  if (tipo !== 'equipo' && tipo !== 'material') {
    return <Navigate to="/inventario/solicitudes" replace />
  }

  return <SolicitudKindPage kind={tipo} />
}

function SolicitudKindPage({ kind }: { kind: SolicitudKind }) {
  const { user, isAdmin } = useAuth()
  const { lastArrival } = useNotifications()

  const permissions = user?.permissions

  const canCreateEquipo = allows(permissions, 'solicitud_equipo.crear', isAdmin)
  const canDeliverEquipo = allows(permissions, 'solicitud_equipo.entregar', isAdmin)
  const canReturnEquipo = allows(permissions, 'solicitud_equipo.devolver', isAdmin)
  const canCreateMaterial = allows(permissions, 'solicitud_material.crear', isAdmin)
  const canDeliverMaterial = allows(permissions, 'solicitud_material.entregar', isAdmin)

  const canCreateCurrent = kind === 'equipo' ? canCreateEquipo : canCreateMaterial
  const canDeliverCurrent = kind === 'equipo' ? canDeliverEquipo : canDeliverMaterial
  const canReturnCurrent = kind === 'equipo' && canReturnEquipo

  const [view, setView] = useState<'solicitar' | 'entregar' | 'devolver'>(
    canCreateCurrent ? 'solicitar' : 'entregar',
  )

  const [obras, setObras] = useState<ObraApi[]>([])
  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudItemApi[]>([])

  const [search, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('pendiente')
  const [detail, setDetail] = useState<SolicitudItemApi | null>(null)

  const setSearch = (value: string) => {
    setSearchValue(value)
    setPage(1)
  }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

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
        setSolicitudes([])
        return
      }

      const rows = await getSolicitudes(
        kind,
        deliveryFilter === 'todas' ? undefined : deliveryFilter,
      )

      if (ticket !== lastLoad.current) return
      setSolicitudes(rows)
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
    deliveryFilter,
    kind,
  ])

  /*
   * Carga los equipos entregados que bodega todavía no ha recibido de vuelta.
   */
  const loadReturnable = useCallback(async () => {
    const ticket = ++lastLoad.current
    setLoading(true)
    setError('')

    try {
      if (!canReturnCurrent) {
        setSolicitudes([])
        return
      }

      const rows = await getSolicitudes('equipo', 'entregado')

      if (ticket !== lastLoad.current) return
      setSolicitudes(rows)
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

  const deliveryRow =
    deliveryId === null
      ? null
      : solicitudes.find((row) => row.id === deliveryId) ?? null

  const returnRow =
    returnId === null
      ? null
      : solicitudes.find((row) => row.id === returnId) ?? null

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
   * Entrega una solicitud pendiente.
   *
   * El backend es quien descuenta el stock.
   */
  const deliver = async () => {
    if (deliveryId === null) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await entregarSolicitud(
        kind,
        deliveryId,
      )

      setDeliveryId(null)

      setToast(
        `${KIND_LABEL[kind]} entregado correctamente. El stock se actualizó.`,
      )

      await loadPending()
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
   * Registra la devolución de un equipo entregado.
   *
   * Si vuelve en buen estado, el backend lo suma al stock.
   */
  const devolver = async (
    estadoElemento: DevolverSolicitudPayload['estadoElemento'],
    observacion: string,
  ) => {
    if (returnId === null) return

    setSaving(true)
    setError('')

    try {
      await devolverSolicitud(returnId, {
        estadoElemento,
        ...(observacion.trim()
          ? { observacion: observacion.trim() }
          : {}),
      })

      setReturnId(null)
      setToast('Devolución registrada correctamente.')

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
              ? 'Recibe los equipos que vuelven a bodega y registra en qué estado llegaron.'
              : `Entrega las solicitudes pendientes de ${KIND_LABEL[kind].toLowerCase()}.`
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

      {availableViews.length > 1 ? (
        <FilterCard>
          <div className="flex flex-wrap gap-2">
            {availableViews.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setView(id)
                  setSearch('')
                  setError('')
                }}
                className={
                  id === view
                    ? 'h-13 rounded-2xl bg-sena px-5 text-sm font-semibold text-white shadow-brand'
                    : 'h-13 rounded-2xl border border-sena-line bg-glass-strong px-5 text-sm font-semibold text-sena-dark'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </FilterCard>
      ) : null}

      <FilterCard>
        <Link
          to="/inventario/solicitudes"
          className="inline-flex w-fit text-sm font-semibold text-sena-strong"
        >
          ← Solicitudes
        </Link>

        {view !== 'solicitar' || canCreateCurrent ? (
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar solicitud..."
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
              className={`${filterSelectClass} lg:w-44`}
            >
              <option value="pendiente">Pendientes</option>
              <option value="entregado">Entregadas</option>
              {kind === 'equipo' ? (
                <option value="devuelto">Devueltas</option>
              ) : null}
              <option value="todas">Todas</option>
            </select>
          </FilterGroup>
        ) : null}
      </FilterCard>

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
                    solicitudes.filter((row) => row.estado === 'pendiente').length,
                  )}
                />

                <InfoCard
                  title={kind === 'equipo' ? 'Equipos por devolver' : 'Entregadas'}
                  value={String(
                    solicitudes.filter((row) => row.estado === 'entregado').length,
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
              <RequestsTable
                mode="deliver"
                rows={pageRows}
                emptyLabel={
                  search.trim()
                    ? 'No se encontraron solicitudes.'
                    : DELIVERY_EMPTY[deliveryFilter]
                }
                saving={saving}
                onView={setDetail}
                onDeliver={(row) => setDeliveryId(row.id)}
                onReturn={
                  canReturnCurrent ? (row) => setReturnId(row.id) : undefined
                }
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
              <RequestsTable
                mode="deliver"
                rows={pageRows}
                emptyLabel={
                  search.trim()
                    ? 'No se encontraron solicitudes.'
                    : 'No hay equipos pendientes de devolución.'
                }
                saving={saving}
                onView={setDetail}
                onReturn={(row) => setReturnId(row.id)}
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
          title={`Entregar ${KIND_LABEL[
            kind
          ].toLowerCase()}`}
          description="Confirma la entrega. El backend descontará la cantidad del stock en ese momento."
          onClose={() => setDeliveryId(null)}
        >
          <div className="space-y-5">
            {deliveryRow ? (
              <p className="rounded-2xl bg-sena-soft px-4 py-3 text-sm leading-6 text-sena-dark">
                Vas a entregar{' '}
                <strong>
                  {deliveryRow.cantidad} de{' '}
                  {deliveryRow.elemento?.nombre ?? 'este elemento'}
                </strong>{' '}
                a {personName(deliveryRow.usuario)}
                {deliveryRow.obra
                  ? ` para ${deliveryRow.obra.nombre}`
                  : ''}
                .
              </p>
            ) : null}

            <p className="text-sm leading-6 text-sena-strong">
              Esta acción cambiará la solicitud de{' '}
              <strong>pendiente</strong> a{' '}
              <strong>entregado</strong>. Si la cantidad
              ya no está disponible, el backend rechazará
              la entrega y el stock no se modificará.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDeliveryId(null)
                }
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

      {detail ? (
        <SolicitudDetail
          kind={kind}
          row={detail}
          canDeliver={
            view === 'entregar' &&
            canDeliverCurrent &&
            detail.estado === 'pendiente'
          }
          onDeliver={() => {
            setDeliveryId(detail.id)
            setDetail(null)
          }}
          canReturn={canReturnCurrent && detail.estado === 'entregado'}
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
 * Modal para registrar la devolución de un equipo.
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
    estadoElemento: (typeof RETURN_STATUS_OPTIONS)[number]['value'],
    observacion: string,
  ) => Promise<void>
}) {
  const [estadoElemento, setEstadoElemento] =
    useState<(typeof RETURN_STATUS_OPTIONS)[number]['value'] | ''>('')
  const [observacion, setObservacion] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError('')

    if (!estadoElemento) {
      setLocalError('Selecciona el estado del elemento.')
      return
    }

    await onSubmit(estadoElemento, observacion)
  }

  return (
    <Modal
      title="Registrar devolución"
      description="Revisa el equipo que llega a bodega, indica en qué estado volvió y registra cualquier novedad."
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
            Vas a recibir{' '}
            <strong>
              {row.cantidad} de {row.elemento?.nombre ?? 'este elemento'}
            </strong>{' '}
            que tenía {personName(row.usuario)}
            {row.obra ? ` para ${row.obra.nombre}` : ''}.
          </p>
        ) : null}

        <div>
          <label
            htmlFor="estado-elemento"
            className="mb-2 block text-sm font-semibold text-sena-strong"
          >
            Estado del elemento
          </label>

          <select
            id="estado-elemento"
            value={estadoElemento}
            onChange={(event) => {
              const value = event.target.value
              const option = RETURN_STATUS_OPTIONS.find(
                (item) => item.value === value,
              )
              if (value === '') setEstadoElemento('')
              else if (option) setEstadoElemento(option.value)
            }}
            className={`${inputClass} w-full`}
            disabled={saving}
          >
            <option value="">Selecciona un estado</option>
            {RETURN_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

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
          Si el elemento se devuelve en buen estado, el backend lo reincorporará
          al stock. Los demás estados no aumentan el stock disponible.
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
 * Tabla de solicitudes: pocas columnas y el detalle completo en el ojo.
 * "mine" es lo que pidió el instructor; "deliver" es la vista de bodega.
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
  mode: 'mine' | 'deliver'
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

                <td className="px-5 py-4 text-center font-semibold tabular-nums text-sena-text">
                  {row.cantidad}
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
                    row.estado === 'pendiente' ? (
                      <ActionButton
                        title="Entregar"
                        disabled={saving}
                        onClick={() => onDeliver(row)}
                      >
                        <DeliverIcon className="size-[18px]" />
                      </ActionButton>
                    ) : null}

                    {onReturn && row.estado === 'entregado' ? (
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
              term={devuelto ? 'Fecha de devolución' : 'Devolución'}
              value={
                devuelto
                  ? formatDate(row.fechaDevolucion ?? null)
                  : 'Todavía no se devuelve'
              }
            />
          ) : null}
          {devuelto && row.estadoElemento ? (
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
              Entregar
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
