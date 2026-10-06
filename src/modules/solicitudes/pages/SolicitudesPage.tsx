import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

import { ApiError } from '@/shared/lib/api'

import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import Toast from '@/shared/components/ui/Toast'

import {
  ErrorBanner,
  FilterCard,
  PageHeader,
  SearchInput,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TableRow,
} from '@/shared/components/DataTable'

import { StatusPill } from '@/shared/components/ResourceBoard'
import { InventoryIcon } from '@/shared/components/icons/AppIcons'

import { useAuth } from '@/modules/auth/context/auth'

import {
  getElementos,
  getObras,
  getSolicitudes,
  createSolicitud,
  entregarSolicitud,
} from '@/modules/solicitudes/data/solicitudes'

import type {
  CrearSolicitudPayload,
  ObraApi,
  SolicitudItemApi,
  SolicitudKind,
} from '@/modules/solicitudes/types'

import type { ElementoApi } from '@/modules/inventario/types/elemento'

const KIND_LABEL: Record<SolicitudKind, string> = {
  equipo: 'Equipo',
  material: 'Material',
}

const KIND_DESCRIPTION: Record<SolicitudKind, string> = {
  equipo:
    'Herramientas, maquinaria y equipos de carácter devolutivo.',
  material:
    'Materiales de consumo que se descuentan cuando bodega los entrega.',
}

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

export default function SolicitudesPage() {
  const { user, isAdmin } = useAuth()

  const permissions = user?.permissions

  const canCreateEquipo = allows(permissions, 'solicitud_equipo.crear', isAdmin)
  const canDeliverEquipo = allows(permissions, 'solicitud_equipo.entregar', isAdmin)
  const canCreateMaterial = allows(permissions, 'solicitud_material.crear', isAdmin)
  const canDeliverMaterial = allows(permissions, 'solicitud_material.entregar', isAdmin)

  const canCreate = canCreateEquipo || canCreateMaterial
  const canDeliver = canDeliverEquipo || canDeliverMaterial

  const [view, setView] = useState<'solicitar' | 'entregar'>(
    canCreate ? 'solicitar' : 'entregar',
  )

  /*
   * Si puede crear equipo comienza mostrando Equipo.
   * Si no, muestra Material.
   */
  const [kind, setKind] = useState<SolicitudKind>(
    canCreateEquipo || canDeliverEquipo ? 'equipo' : 'material',
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
    loadCreateData,
    loadPending,
  ])

  /*
   * Evita que el usuario quede en un tipo de solicitud
   * que no tiene permitido.
   */
  useEffect(() => {
    if (view === 'solicitar') {
      if (
        kind === 'equipo' &&
        !canCreateEquipo &&
        canCreateMaterial
      ) {
        setKind('material')
      }

      if (
        kind === 'material' &&
        !canCreateMaterial &&
        canCreateEquipo
      ) {
        setKind('equipo')
      }
    } else {
      if (
        kind === 'equipo' &&
        !canDeliverEquipo &&
        canDeliverMaterial
      ) {
        setKind('material')
      }

      if (
        kind === 'material' &&
        !canDeliverMaterial &&
        canDeliverEquipo
      ) {
        setKind('equipo')
      }
    }
  }, [
    view,
    kind,
    canCreateEquipo,
    canCreateMaterial,
    canDeliverEquipo,
    canDeliverMaterial,
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

  const canCreateCurrent =
    kind === 'equipo'
      ? canCreateEquipo
      : canCreateMaterial

  return (
    <AppLayout title="Solicitudes de equipo y materiales">
      <PageHeader
        icon={<InventoryIcon />}
        title="Solicitudes de equipo y materiales"
        description={
          view === 'solicitar'
            ? 'Solicita herramientas, equipos o materiales para una obra. La cantidad no baja hasta que bodega entregue.'
            : 'Administra las solicitudes pendientes y entrega los elementos desde bodega.'
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

      {canCreate && canDeliver ? (
        <FilterCard>
          <div className="flex flex-wrap gap-2">
            {(
              ['solicitar', 'entregar'] as const
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setView(item)
                  setSearch('')
                  setError('')
                }}
                className={
                  item === view
                    ? 'h-13 rounded-2xl bg-sena px-5 text-sm font-semibold text-white shadow-brand'
                    : 'h-13 rounded-2xl border border-sena-line bg-glass-strong px-5 text-sm font-semibold text-sena-dark'
                }
              >
                {item === 'solicitar'
                  ? 'Solicitar'
                  : 'Entregar'}
              </button>
            ))}
          </div>
        </FilterCard>
      ) : null}

      {/*
       * Selector Equipo / Material
       */}
      <FilterCard>
        <div className="flex flex-wrap gap-2">
          {(
            ['equipo', 'material'] as const
          ).map((item) => {
            const allowed =
              view === 'solicitar'
                ? item === 'equipo'
                  ? canCreateEquipo
                  : canCreateMaterial
                : item === 'equipo'
                  ? canDeliverEquipo
                  : canDeliverMaterial

            if (!allowed) {
              return null
            }

            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setKind(item)
                  setSearch('')
                  setError('')
                }}
                className={
                  item === kind
                    ? 'rounded-2xl bg-sena px-5 py-3 text-sm font-semibold text-white shadow-brand'
                    : 'rounded-2xl border border-sena-line bg-glass-strong px-5 py-3 text-sm font-semibold text-sena-dark'
                }
              >
                {KIND_LABEL[item]}
              </button>
            )
          })}
        </div>

        {view === 'solicitar' ? (
          <p className="px-1 pb-1 text-sm text-sena-strong">
            {KIND_DESCRIPTION[kind]}
          </p>
        ) : null}

        {view === 'entregar' || canCreateCurrent ? (
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.length === 0 ? (
                        <TableEmpty colSpan={7}>
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
      ) : (
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
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              onClick={() =>
                                setDeliveryId(row.id)
                              }
                              disabled={saving}
                            >
                              Entregar
                            </Button>
                          </div>
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
      )}

      {/*
       * MODAL PARA CREAR SOLICITUD
       */}
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