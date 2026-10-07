import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
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
  createSolicitud,
  entregarSolicitud,
  devolverSolicitud,
  type DevolverSolicitudPayload,
} from '@/modules/solicitudes/data/solicitudes'

import type {
  CrearSolicitudPayload,
  ObraApi,
  SolicitudItemApi,
  SolicitudKind,
} from '@/modules/solicitudes/types'

import type { ElementoApi } from '@/modules/inventario/types/elemento'

import ElementoCombobox from '@/modules/solicitudes/components/ElementoCombobox'

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
    'Herramientas, maquinaria y equipos de carácter devolutivo.',
  material:
    'Materiales de consumo que se descuentan cuando bodega los entrega.',
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

function personName(
  person?: { nombres: string; apellidos: string } | null,
) {
  const name = `${person?.nombres ?? ''} ${person?.apellidos ?? ''}`.trim()
  return name || '—'
}

function requestTone(estado: SolicitudItemApi['estado']) {
  if (estado === 'entregado') return 'ok' as const
  if (estado === 'devuelto') return 'danger' as const
  return 'warn' as const
}

function requestLabel(estado: SolicitudItemApi['estado']) {
  if (estado === 'entregado') return 'Entregado'
  if (estado === 'devuelto') return 'Devuelto'
  return 'Pendiente'
}

function availableOf(elemento: ElementoApi) {
  const value = Number(
    (elemento as ElementoApi & { disponible?: number }).disponible ??
      elemento.cantidad,
  )

  return Number.isFinite(value) ? value : 0
}

function buildCode(kind: SolicitudKind) {
  const prefix = kind === 'equipo' ? 'EQ' : 'MAT'
  return `${prefix}-${Date.now()}`
}

function formatDate(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDay(value: string | null | undefined) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
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
   * Para Equipo:
   * clasificación = devolutivo
   *
   * Para Material:
   * clasificación = consumo
   */
  const visibleElements = useMemo(() => {
    const character =
      kind === 'equipo'
        ? 'devolutivo'
        : 'consumo'

    return elementos
      .filter((elemento) => {
        const classification = elemento.clasificacion as
          | {
              id: number
              nombre: string
              caracter?: string | null
            }
          | null

        return classification?.caracter === character
      })
      .sort((left, right) =>
        left.nombre.localeCompare(
          right.nombre,
          'es',
        ),
      )
  }, [elementos, kind])

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
   * Registra una nueva solicitud.
   *
   * IMPORTANTE:
   * aquí NO se descuenta stock.
   */
  const submit = async (
    payload: Omit<
      CrearSolicitudPayload,
      'codigoSolicitud'
    >,
  ) => {
    setSaving(true)
    setError('')

    try {
      await createSolicitud(kind, {
        ...payload,
        codigoSolicitud: buildCode(kind),
      })

      setModalOpen(false)

      setToast(
        `${KIND_LABEL[kind]} solicitado correctamente. Quedó pendiente de entrega.`,
      )

      /*
       * El stock NO baja al solicitar.
       * Solo baja cuando bodega entrega.
       */
      await loadCreateData()
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudo registrar la solicitud.',
      )
    } finally {
      setSaving(false)
    }
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
            ? `${KIND_DESCRIPTION[kind]} La cantidad no baja hasta que bodega entregue.`
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
                  title={
                    kind === 'equipo'
                      ? 'Equipos disponibles'
                      : 'Materiales disponibles'
                  }
                  value={String(
                    visibleElements.length,
                  )}
                />

                <InfoCard
                  title="Regla de stock"
                  value="Solo baja al entregar"
                  compact
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
        <SolicitudModal
          kind={kind}
          obras={obras}
          elementos={visibleElements}
          saving={saving}
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

/*
 * Modal para crear una solicitud.
 */
function SolicitudModal({
  kind,
  obras,
  elementos,
  saving,
  onClose,
  onSubmit,
}: {
  kind: SolicitudKind
  obras: ObraApi[]
  elementos: ElementoApi[]
  saving: boolean
  onClose: () => void
  onSubmit: (
    payload: Omit<
      CrearSolicitudPayload,
      'codigoSolicitud'
    >,
  ) => Promise<void>
}) {
  const [idObra, setIdObra] = useState('')
  const [idElemento, setIdElemento] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [ficha, setFicha] = useState('')
  const [observacion, setObservacion] =
    useState('')

  const [localError, setLocalError] =
    useState('')

  const selectedElement =
    elementos.find(
      (item) =>
        String(item.id) === idElemento,
    ) ?? null

  const available = selectedElement
    ? availableOf(selectedElement)
    : 0

  const overLimit =
    selectedElement !== null &&
    Number(cantidad) > available

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setLocalError('')

    const obraId = Number(idObra)
    const elementId = Number(idElemento)
    const quantity = Number(cantidad)

    if (!obraId || !elementId) {
      setLocalError(
        'Selecciona la obra y el elemento.',
      )
      return
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setLocalError(
        'La cantidad debe ser un número entero mayor que cero.',
      )
      return
    }

    if (quantity > available) {
      setLocalError(
        `No puedes pedir ${quantity}. Solo hay ${available} disponibles. La solicitud no se guardará.`,
      )
      return
    }

    await onSubmit({
      idObra: obraId,
      idElemento: elementId,
      cantidad: quantity,

      ...(ficha.trim()
        ? {
            ficha: ficha.trim(),
          }
        : {}),

      ...(observacion.trim()
        ? {
            observacion:
              observacion.trim(),
          }
        : {}),
    })
  }

  return (
    <Modal
      title={`Solicitar ${KIND_LABEL[
        kind
      ].toLowerCase()}`}
      description={KIND_DESCRIPTION[kind]}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {localError ? (
          <ErrorBanner
            message={localError}
            onClose={() =>
              setLocalError('')
            }
          />
        ) : null}

        <div className="grid gap-5">
          <Field
            label="Obra"
            required
          >
            <select
              value={idObra}
              onChange={(event) =>
                setIdObra(
                  event.target.value,
                )
              }
              className={inputClass}
              required
            >
              <option value="">
                Selecciona una obra
              </option>

              {obras.map((obra) => (
                <option
                  key={obra.id}
                  value={obra.id}
                >
                  {obra.nombre}
                  {obra.lugar
                    ? ` — ${obra.lugar}`
                    : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={
              kind === 'equipo'
                ? 'Equipo / herramienta'
                : 'Material'
            }
            required
          >
            <ElementoCombobox
              elementos={elementos}
              value={selectedElement}
              onChange={(elemento) =>
                setIdElemento(elemento ? String(elemento.id) : '')
              }
              availableOf={availableOf}
              label={kind === 'equipo' ? 'Equipo / herramienta' : 'Material'}
              placeholder={
                kind === 'equipo'
                  ? 'Escribe el nombre o código, ej. extintor'
                  : 'Escribe el nombre o código, ej. cemento'
              }
              inputClassName={inputClass}
            />
          </Field>
        </div>

        {selectedElement ? (
          <Availability
            elemento={selectedElement}
            available={available}
          />
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Cantidad"
            required
          >
            <input
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={(event) =>
                setCantidad(
                  event.target.value,
                )
              }
              aria-invalid={overLimit}
              aria-describedby="cantidad-ayuda"
              className={
                overLimit
                  ? inputErrorClass
                  : inputClass
              }
              required
            />

            <span
              id="cantidad-ayuda"
              className={
                overLimit
                  ? 'mt-2 block text-xs font-semibold text-sena-danger-text'
                  : 'mt-2 block text-xs text-sena-text-soft'
              }
            >
              {!selectedElement
                ? 'Primero elige el elemento.'
                : overLimit
                  ? `Solo hay ${available} disponibles. Baja la cantidad.`
                  : `Puedes pedir hasta ${available}.`}
            </span>
          </Field>

          <Field
            label="Ficha"
            hint="Opcional"
          >
            <input
              value={ficha}
              onChange={(event) =>
                setFicha(
                  event.target.value,
                )
              }
              maxLength={50}
              placeholder="Ej. 2876543"
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Observación"
          hint="Opcional"
        >
          <textarea
            value={observacion}
            onChange={(event) =>
              setObservacion(
                event.target.value,
              )
            }
            rows={3}
            placeholder="Indica para qué se necesita el elemento..."
            className={`${inputClass} min-h-24 resize-y py-3`}
          />
        </Field>

        <div className="rounded-2xl bg-sena-soft px-4 py-3 text-sm leading-6 text-sena-dark">
          <strong>Importante:</strong>{' '}
          solicitar no descuenta el inventario.
          La cantidad se mantiene igual hasta
          que bodega confirme la entrega.
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={
              saving ||
              overLimit ||
              obras.length === 0 ||
              elementos.length === 0
            }
          >
            {saving
              ? 'Guardando...'
              : 'Registrar solicitud'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/*
 * Disponibilidad del elemento elegido.
 * Lo reservado son pedidos pendientes que todavía no salen de bodega.
 */
function Availability({
  elemento,
  available,
}: {
  elemento: ElementoApi
  available: number
}) {
  const enBodega = Number(elemento.cantidad) || 0
  const reservado = Math.max(0, enBodega - available)
  const minimo = elemento.cantidadMinima
  const unidad =
    elemento.unidadMedida?.abreviatura ??
    elemento.unidadMedida?.nombre ??
    ''

  const tone =
    available <= 0
      ? 'danger'
      : minimo !== undefined && enBodega <= minimo
        ? 'warn'
        : 'ok'

  const label =
    tone === 'danger'
      ? 'Sin disponibilidad'
      : tone === 'warn'
        ? 'Por agotarse'
        : 'Con stock'

  return (
    <section
      aria-label="Disponibilidad del elemento"
      className="rounded-2xl border border-sena-line bg-white/65 px-5 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-sena-strong">
            Disponible para pedir
          </p>

          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-sena-text">
              {available}
            </span>

            {unidad ? (
              <span className="text-sm text-sena-text-soft">
                {unidad}
              </span>
            ) : null}
          </p>
        </div>

        <StatusPill tone={tone}>{label}</StatusPill>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-sena-hairline pt-4 sm:grid-cols-4">
        <AvailabilityFact
          term="En bodega"
          value={String(enBodega)}
        />
        <AvailabilityFact
          term="Reservado"
          value={String(reservado)}
        />
        <AvailabilityFact
          term="Mínimo"
          value={
            minimo !== undefined
              ? String(minimo)
              : '—'
          }
        />
        <AvailabilityFact
          term="Stand"
          value={elemento.stand?.nombre ?? '—'}
        />
      </dl>
    </section>
  )
}

function AvailabilityFact({
  term,
  value,
}: {
  term: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-sena-text-soft">
        {term}
      </dt>

      <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-sena-text">
        {value}
      </dd>
    </div>
  )
}

/*
 * Campo reutilizable del formulario.
 */
function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-sena-text">
        {label}

        {required ? (
          <span className="text-sena">
            *
          </span>
        ) : null}

        {hint ? (
          <span className="text-xs font-normal text-sena-text-soft">
            {hint}
          </span>
        ) : null}
      </span>

      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-2xl border border-sena-line bg-white/80 px-4 py-3 text-sm text-sena-text outline-none transition focus:border-sena focus:bg-white focus:ring-4 focus:ring-sena/10'

const inputErrorClass =
  'w-full rounded-2xl border border-sena-danger-line bg-sena-danger-soft/40 px-4 py-3 text-sm text-sena-text outline-none transition focus:border-sena-danger-text focus:bg-white focus:ring-4 focus:ring-sena-danger-text/10'