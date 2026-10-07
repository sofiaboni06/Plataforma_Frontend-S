import {
  useCallback,
  useEffect,
  useMemo,
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
  PageHeader,
  RowActions,
  SearchInput,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TableRow,
} from '@/shared/components/DataTable'
import { StatusPill } from '@/shared/components/ResourceBoard'
import {
  EyeIcon,
  InventoryIcon,
} from '@/shared/components/icons/AppIcons'

import { useAuth } from '@/modules/auth/context/auth'

import {
  getElementos,
  getObras,
  getSolicitudes,
  createSolicitud,
  entregarSolicitud,
  devolverSolicitud,
} from '@/modules/solicitudes/data/solicitudes'

import type {
  CrearSolicitudPayload,
  ObraApi,
  SolicitudItemApi,
  SolicitudKind,
} from '@/modules/solicitudes/types'

import type { ElementoApi } from '@/modules/inventario/types/elemento'

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
  if (isAdmin) return true
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

export default function SolicitudesPage() {
  const { tipo } = useParams()

  if (tipo !== 'equipo' && tipo !== 'material') {
    return <Navigate to="/inventario/solicitudes" replace />
  }

  return <SolicitudKindPage kind={tipo} />
}

function SolicitudKindPage({ kind }: { kind: SolicitudKind }) {
  const { user, isAdmin } = useAuth()

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
    isAdmin && canDeliverCurrent
      ? 'entregar'
      : canCreateCurrent
        ? 'solicitar'
        : canDeliverCurrent
          ? 'entregar'
          : canReturnCurrent
            ? 'devolver'
            : 'entregar',
  )

  const [obras, setObras] = useState<ObraApi[]>([])
  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudItemApi[]>([])

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [deliveryId, setDeliveryId] = useState<number | null>(null)
  const [returnId, setReturnId] = useState<number | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  /*
   * Carga las obras activas y los elementos activos.
   *
   * Esto se utiliza para que el instructor pueda crear
   * una solicitud.
   */
  const loadCreateData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const canCreateCurrent = kind === 'equipo' ? canCreateEquipo : canCreateMaterial
      const [obraRows, elementoRows, solicitudRows] = await Promise.all([
        getObras(),
        getElementos(),
        canCreateCurrent ? getSolicitudes(kind) : Promise.resolve([]),
      ])

      setObras(
        obraRows.filter((obra) => obra.estado),
      )

      setElementos(
        elementoRows.filter((elemento) => elemento.estado),
      )

      setSolicitudes(solicitudRows)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudieron cargar obras, elementos y solicitudes.',
      )
    } finally {
      setLoading(false)
    }
  }, [canCreateEquipo, canCreateMaterial, kind])

  /*
   * Carga las solicitudes pendientes para bodega.
   */
  const loadPending = useCallback(async () => {
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
        'pendiente',
      )

      setSolicitudes(rows)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudieron cargar las solicitudes pendientes.',
      )
    } finally {
      setLoading(false)
    }
  }, [
    canDeliverEquipo,
    canDeliverMaterial,
    kind,
  ])

  const loadReturnable = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      if (!canReturnEquipo) {
        setSolicitudes([])
        return
      }

      const rows = await getSolicitudes('equipo', 'entregado')
      setSolicitudes(rows)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No se pudieron cargar los equipos pendientes de devolución.',
      )
    } finally {
      setLoading(false)
    }
  }, [canReturnEquipo])

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

  const devolver = async (
    estadoElemento:
      | 'bueno'
      | 'danado'
      | 'perdido'
      | 'en_reparacion',
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

      const updated = await getSolicitudes(kind)
      setSolicitudes(updated)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible registrar la devolución.',
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
              ? 'Registra la devolución de los equipos entregados y su estado.'
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
              <div className="overflow-x-auto">
                  <table className="data-table w-full min-w-262.5 text-sm">
                    <thead>
                      <tr className="border-b border-sena-hairline bg-sena-soft/85">
                        <TableHeader>Solicitud</TableHeader>
                        <TableHeader>Elemento</TableHeader>
                        <TableHeader>Obra</TableHeader>
                        <TableHeader>Cantidad</TableHeader>
                        <TableHeader>Ficha</TableHeader>
                        <TableHeader>Estado</TableHeader>
                        <TableHeader>Fecha</TableHeader>
                        <TableHeader align="center">Acción</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.length === 0 ? (
                        <TableEmpty colSpan={8}>
                          Todavía no has pedido {KIND_LABEL[kind].toLowerCase()}.
                        </TableEmpty>
                      ) : (
                        filteredRequests.map((row) => (
                          <TableRow key={row.id}>
                            <td className="font-semibold">{row.codigoSolicitud}</td>
                            <td>
                              <div className="font-medium">{row.elemento?.nombre ?? '—'}</div>
                              <div className="text-xs text-sena-text-soft">{row.elemento?.codigo ?? '—'}</div>
                            </td>
                            <td>{row.obra?.nombre ?? '—'}</td>
                            <td>{row.cantidad}</td>
                            <td>{row.ficha || '—'}</td>
                            <td>
                              <StatusPill tone={requestTone(row.estado)}>
                                {requestLabel(row.estado)}
                              </StatusPill>
                            </td>
                            <td>{formatDate(row.fecha)}</td>
                            <td>
                              <div className="flex justify-center">
                                <RowActions>
                                  <ActionButton
                                    title="Ver solicitud"
                                    onClick={() => setDetailId(row.id)}
                                  >
                                    <EyeIcon className="size-[18px]" />
                                  </ActionButton>
                                  {kind === 'equipo' &&
                                  canReturnEquipo &&
                                  row.estado === 'entregado' ? (
                                    <ActionButton
                                      title="Devolver"
                                      onClick={() => setReturnId(row.id)}
                                      disabled={saving}
                                    >
                                      <span
                                        aria-hidden="true"
                                        className="text-xl leading-none"
                                      >
                                        ↔
                                      </span>
                                    </ActionButton>
                                  ) : null}
                                </RowActions>
                              </div>
                            </td>
                          </TableRow>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              <div className="border-t border-sena-hairline px-6 py-4 text-sm text-sena-strong">
                Mostrando {filteredRequests.length} solicitudes
              </div>
            </TableCard>
          ) : null}
        </>
      ) : view === 'entregar' ? (
        /*
         * VISTA PARA ENTREGAR
         */
        <TableCard>
          {loading ? (
            <TableLoading label="Cargando solicitudes pendientes..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-262.5 text-sm">
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader>
                      Solicitud
                    </TableHeader>

                    <TableHeader>
                      Elemento
                    </TableHeader>

                    <TableHeader>
                      Obra
                    </TableHeader>

                    <TableHeader>
                      Cantidad
                    </TableHeader>

                    <TableHeader>
                      Ficha
                    </TableHeader>

                    <TableHeader>
                      Solicitante
                    </TableHeader>

                    <TableHeader>
                      Estado
                    </TableHeader>

                    <TableHeader>
                      Fecha
                    </TableHeader>

                    <TableHeader align="center">
                      Acción
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.length === 0 ? (
                    <TableEmpty colSpan={9}>
                      No hay solicitudes pendientes para
                      entregar.
                    </TableEmpty>
                  ) : (
                    filteredRequests.map((row) => (
                      <TableRow key={row.id}>
                        <td className="font-semibold">
                          {row.codigoSolicitud}
                        </td>

                        <td>
                          <div className="font-medium">
                            {row.elemento?.nombre ??
                              '—'}
                          </div>

                          <div className="text-xs text-sena-text-soft">
                            {row.elemento?.codigo ??
                              '—'}
                          </div>
                        </td>

                        <td>
                          {row.obra?.nombre ?? '—'}
                        </td>

                        <td>{row.cantidad}</td>

                        <td>
                          {row.ficha || '—'}
                        </td>

                        <td>
                          {personName(row.usuario)}
                        </td>

                        <td>
                          <StatusPill tone={requestTone(row.estado)}>
                            {requestLabel(row.estado)}
                          </StatusPill>
                        </td>

                        <td>
                          {formatDate(row.fecha)}
                        </td>

                        <td>
                          <RowActions>
                            <ActionButton
                              title="Ver solicitud"
                              onClick={() => setDetailId(row.id)}
                            >
                              <EyeIcon className="size-5" />
                            </ActionButton>
                            <ActionButton
                              title="Entregar"
                              onClick={() => setDeliveryId(row.id)}
                              disabled={saving}
                            >
                              <span
                                aria-hidden="true"
                                className="text-xl leading-none"
                              >
                                ↔
                              </span>
                            </ActionButton>
                          </RowActions>
                        </td>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading ? (
            <div className="border-t border-sena-hairline px-6 py-4 text-sm text-sena-strong">
              Mostrando{' '}
              {filteredRequests.length}{' '}
              solicitudes pendientes
            </div>
          ) : null}
        </TableCard>
      ) : (
        <ReturnRequestsTable
          loading={loading}
          requests={filteredRequests}
          saving={saving}
          onView={(id) => setDetailId(id)}
          onReturn={(id) => {
            setReturnId(id)
          }}
        />
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

      {detailId !== null ? (
        <SolicitudDetalleModal
          solicitud={solicitudes.find((row) => row.id === detailId) ?? null}
          onClose={() => setDetailId(null)}
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

      {returnId !== null ? (
        <DevolucionModal
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

function SolicitudDetalleModal({
  solicitud,
  onClose,
}: {
  solicitud: SolicitudItemApi | null
  onClose: () => void
}) {
  if (!solicitud) return null

  return (
    <Modal
      title="Detalle de la solicitud"
      description="Información completa de la solicitud de equipo."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Código de solicitud"
            value={solicitud.codigoSolicitud}
          />

          <DetailItem
            label="Estado"
            value={requestLabel(solicitud.estado)}
          />

          <DetailItem
            label="Elemento"
            value={solicitud.elemento?.nombre ?? '—'}
          />

          <DetailItem
            label="Código del elemento"
            value={solicitud.elemento?.codigo ?? '—'}
          />

          <DetailItem
            label="Cantidad"
            value={String(solicitud.cantidad)}
          />

          <DetailItem
            label="Ficha"
            value={solicitud.ficha || '—'}
          />

          <DetailItem
            label="Obra"
            value={solicitud.obra?.nombre ?? '—'}
          />

          <DetailItem
            label="Lugar"
            value={solicitud.obra?.lugar ?? '—'}
          />

          <DetailItem
            label="Solicitante"
            value={personName(solicitud.usuario)}
          />

          <DetailItem
            label="Correo"
            value={solicitud.usuario?.email ?? '—'}
          />

          <DetailItem
            label="Fecha de solicitud"
            value={formatDate(solicitud.fecha)}
          />

          <DetailItem
            label="Fecha de entrega"
            value={formatDate(solicitud.fechaEntrega)}
          />
        </div>

        {solicitud.observacion ? (
          <div className="rounded-2xl border border-sena-line bg-sena-soft/50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-sena-strong">
              Observación
            </p>

            <p className="mt-2 text-sm leading-6 text-sena-dark">
              {solicitud.observacion}
            </p>
          </div>
        ) : null}

        {solicitud.estado === 'devuelto' ? (
          <div className="rounded-2xl border border-sena-line bg-sena-soft/50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-sena-strong">
              Información de devolución
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Estado del elemento"
                value={formatEstadoElemento(solicitud.estadoElemento)}
              />

              <DetailItem
                label="Fecha de devolución"
                value={formatDate(solicitud.fechaDevolucion ?? null)}
              />
            </div>

            {solicitud.observacion ? (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sena-strong">
                  Causa / novedad de devolución
                </p>

                <p className="mt-2 text-sm leading-6 text-sena-dark">
                  {solicitud.observacion}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-sena-strong">
        {label}
      </p>

      <p className="mt-1 text-sm text-sena-dark">
        {value}
      </p>
    </div>
  )
}

function formatEstadoElemento(
  estado: SolicitudItemApi['estadoElemento'],
) {
  if (estado === 'bueno') return 'Bueno'
  if (estado === 'danado') return 'Dañado'
  if (estado === 'perdido') return 'Perdido'
  if (estado === 'en_reparacion') return 'En reparación'

  return '—'
}

function DevolucionModal({
  saving,
  onClose,
  onSubmit,
}: {
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
      description="Indica el estado en que se devuelve el elemento y registra cualquier novedad."
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
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

        {localError ? (
          <p className="text-sm font-semibold text-red-600">
            {localError}
          </p>
        ) : null}

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

function ReturnRequestsTable({
  loading,
  requests,
  saving,
  onView,
  onReturn,
}: {
  loading: boolean
  requests: SolicitudItemApi[]
  saving: boolean
  onView: (id: number) => void
  onReturn: (id: number) => void
}) {
  return (
    <TableCard>
      {loading ? (
        <TableLoading label="Cargando equipos pendientes de devolución..." />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-262.5 text-sm">
            <thead>
              <tr className="border-b border-sena-hairline bg-sena-soft/85">
                <TableHeader>Solicitud</TableHeader>
                <TableHeader>Elemento</TableHeader>
                <TableHeader>Obra</TableHeader>
                <TableHeader>Cantidad</TableHeader>
                <TableHeader>Solicitante</TableHeader>
                <TableHeader>Fecha entrega</TableHeader>
                <TableHeader align="center">Acción</TableHeader>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <TableEmpty colSpan={7}>
                  No hay equipos pendientes de devolución.
                </TableEmpty>
              ) : (
                requests.map((row) => (
                  <TableRow key={row.id}>
                    <td className="font-semibold">{row.codigoSolicitud}</td>
                    <td>
                      <div className="font-medium">
                        {row.elemento?.nombre ?? '—'}
                      </div>
                      <div className="text-xs text-sena-text-soft">
                        {row.elemento?.codigo ?? '—'}
                      </div>
                    </td>
                    <td>{row.obra?.nombre ?? '—'}</td>
                    <td>{row.cantidad}</td>
                    <td>{personName(row.usuario)}</td>
                    <td>{formatDate(row.fechaEntrega)}</td>
                    <td>
                      <RowActions>
                        <ActionButton
                          title="Ver solicitud"
                          onClick={() => onView(row.id)}
                        >
                          <EyeIcon className="size-5" />
                        </ActionButton>
                        <ActionButton
                          title="Devolver"
                          onClick={() => onReturn(row.id)}
                          disabled={saving}
                        >
                          <span aria-hidden="true">↔</span>
                        </ActionButton>
                      </RowActions>
                    </td>
                  </TableRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading ? (
        <div className="border-t border-sena-hairline px-6 py-4 text-sm text-sena-strong">
          Mostrando {requests.length} equipos pendientes de devolución
        </div>
      ) : null}
    </TableCard>
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

        <div className="grid gap-5 md:grid-cols-2">
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
            <select
              value={idElemento}
              onChange={(event) =>
                setIdElemento(
                  event.target.value,
                )
              }
              className={inputClass}
              required
            >
              <option value="">
                Selecciona un elemento
              </option>

              {elementos.map(
                (elemento) => (
                  <option
                    key={elemento.id}
                    value={elemento.id}
                  >
                    {elemento.nombre} —{' '}
                    {elemento.codigo} —
                    disponible:{' '}
                    {availableOf(
                      elemento,
                    )}
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field
            label="Cantidad"
            required
            hint={
              selectedElement
                ? `Disponible: ${available}`
                : undefined
            }
          >
            <input
              type="number"
              min="1"
              max={
                available || undefined
              }
              step="1"
              value={cantidad}
              onChange={(event) =>
                setCantidad(
                  event.target.value,
                )
              }
              className={inputClass}
              required
            />
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