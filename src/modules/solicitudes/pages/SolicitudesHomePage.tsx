import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiError } from '@/shared/lib/api'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
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
import { EyeIcon, InventoryIcon } from '@/shared/components/icons/AppIcons'
import { filterSelectClass, usePagination } from '@/shared/lib/table'

import { useAuth } from '@/modules/auth/context/auth'
import { useNotifications } from '@/modules/notificaciones/context/notifications'

import FacturaDetail from '@/modules/solicitudes/components/FacturaDetail'
import FacturaModal from '@/modules/solicitudes/components/FacturaModal'
import SolicitanteModal from '@/modules/solicitudes/components/SolicitanteModal'
import {
  createFactura,
  getElementos,
  getFacturas,
  getObras,
  registrarEnBodega,
} from '@/modules/solicitudes/data/solicitudes'
import {
  CARACTER_LABEL,
  FACTURA_LABEL,
  facturaTone,
  formatDay,
  personName,
} from '@/modules/solicitudes/lib/presentacion'

import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type {
  CrearFacturaPayload,
  FacturaApi,
  FacturaEstado,
  FacturaTipo,
  ObraApi,
  SolicitanteApi,
} from '@/modules/solicitudes/types'

const OPTIONS = [
  {
    code: 'equipo',
    title: 'Equipo devolutivo',
    description: 'Herramientas, maquinaria y equipos que se prestan y después se devuelven.',
    to: '/inventario/solicitudes/equipo',
    permissions: ['solicitud_equipo.ver', 'solicitud_equipo.crear', 'solicitud_equipo.entregar', 'solicitud_equipo.devolver'],
  },
  {
    code: 'material',
    title: 'Material de consumo',
    description: 'Materiales que se gastan en la obra, como pintura, cemento o lija.',
    to: '/inventario/solicitudes/material',
    permissions: ['solicitud_material.ver', 'solicitud_material.crear', 'solicitud_material.entregar'],
  },
] as const

type EstadoFiltro = FacturaEstado | 'todas'

export default function SolicitudesHomePage() {
  const { user, isAdmin } = useAuth()
  const { lastArrival } = useNotifications()
  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions])

  const options = OPTIONS.filter((option) =>
    option.permissions.some((code) => permissions.includes(code)),
  )
  const canPedirEquipo = !isAdmin && permissions.includes('solicitud_equipo.crear')
  const canPedirMaterial = !isAdmin && permissions.includes('solicitud_material.crear')
  const canRequest = canPedirEquipo || canPedirMaterial
  const canEntregarEquipo = !isAdmin && permissions.includes('solicitud_equipo.entregar')
  const canEntregarMaterial = !isAdmin && permissions.includes('solicitud_material.entregar')
  const tiposMostrador: FacturaTipo[] = [
    ...(canEntregarMaterial ? (['consumo'] as const) : []),
    ...(canEntregarEquipo ? (['devolutivo'] as const) : []),
  ]
  const canVer =
    !isAdmin &&
    (permissions.includes('solicitud_equipo.ver') || permissions.includes('solicitud_material.ver'))

  const [facturas, setFacturas] = useState<FacturaApi[]>([])
  const [loading, setLoading] = useState(canVer)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearchValue] = useState('')
  const [estado, setEstado] = useState<EstadoFiltro>('todas')
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState<FacturaApi | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [obras, setObras] = useState<ObraApi[]>([])
  const [elementos, setElementos] = useState<ElementoApi[]>([])

  const [mostrador, setMostrador] = useState<'buscar' | 'armar' | null>(null)
  const [solicitante, setSolicitante] = useState<{
    persona: SolicitanteApi
    tipos: FacturaTipo[]
  } | null>(null)

  const lastLoad = useRef(0)

  const setSearch = (value: string) => {
    setSearchValue(value)
    setPage(1)
  }

  const loadFacturas = useCallback(async () => {
    if (!canVer) return
    const ticket = ++lastLoad.current
    setLoading(true)
    setError('')

    try {
      const rows = await getFacturas(estado === 'todas' ? undefined : estado)
      if (ticket !== lastLoad.current) return
      setFacturas(rows)
    } catch (cause) {
      if (ticket !== lastLoad.current) return
      setError(cause instanceof ApiError ? cause.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      if (ticket === lastLoad.current) setLoading(false)
    }
  }, [canVer, estado])

  useEffect(() => {
    void loadFacturas()
  }, [loadFacturas])

  useEffect(() => {
    if (lastArrival?.recurso === 'solicitud_material' || lastArrival?.recurso === 'solicitud_equipo') {
      void loadFacturas()
    }
    // Solo reacciona a un aviso nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastArrival])

  /*
   * Obras y elementos se piden al abrir el formulario, así la existencia que
   * ve bodega en el mostrador es la de ese momento.
   */
  const cargarFormulario = async () => {
    setPreparando(true)
    setError('')

    try {
      const [obraRows, elementoRows] = await Promise.all([getObras(), getElementos()])
      setObras(obraRows.filter((obra) => obra.estado))
      setElementos(elementoRows.filter((elemento) => elemento.estado))
      return true
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'No se pudieron cargar las obras y los elementos.',
      )
      return false
    } finally {
      setPreparando(false)
    }
  }

  const openCreate = async () => {
    if (await cargarFormulario()) setModalOpen(true)
  }

  const abrirMostrador = async () => {
    setSolicitante(null)
    if (await cargarFormulario()) setMostrador('buscar')
  }

  const cerrarMostrador = () => {
    setMostrador(null)
    setSolicitante(null)
  }

  const registrarMostrador = async (payload: Omit<CrearFacturaPayload, 'codigoSolicitud'>) => {
    if (!solicitante) return

    const factura = await registrarEnBodega({
      ...payload,
      codigoSolicitud: `SOL-${Date.now()}`,
      numeroDocumento: solicitante.persona.numeroDocumento,
    })
    const { cantidadEntregada, cantidadPendiente } = factura.totales

    cerrarMostrador()
    setToast(
      `Solicitud ${factura.codigoSolicitud} registrada a nombre de ${personName(factura.usuario)}. ${
        cantidadEntregada > 0
          ? `Se entregaron ${cantidadEntregada}`
          : 'No había existencia para entregar'
      }${cantidadPendiente > 0 ? ` y quedan ${cantidadPendiente} pendientes.` : '.'}`,
    )
    await loadFacturas()
  }

  const submit = async (payload: Omit<CrearFacturaPayload, 'codigoSolicitud'>) => {
    const factura = await createFactura({ ...payload, codigoSolicitud: `SOL-${Date.now()}` })
    setModalOpen(false)
    setToast(
      `Solicitud ${factura.codigoSolicitud} registrada con ${factura.totales.lineas} ${
        factura.totales.lineas === 1 ? 'elemento' : 'elementos'
      }. Quedó pendiente de entrega.`,
    )
    await loadFacturas()
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return facturas

    return facturas.filter((row) =>
      [
        row.codigoSolicitud,
        row.ficha ?? '',
        row.obra?.nombre ?? '',
        personName(row.usuario),
        ...row.detalle.map((fila) => `${fila.elemento?.nombre ?? ''} ${fila.elemento?.codigo ?? ''}`),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [facturas, search])

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(filtered, page)

  const cards = options.length ? (
    <section aria-labelledby={canVer ? 'solicitudes-por-tipo' : undefined} className="space-y-3">
      {canVer ? (
        <div>
          <h2 id="solicitudes-por-tipo" className="text-base font-bold text-sena-dark">
            Por tipo
          </h2>
          <p className="mt-1 text-sm text-sena-text-soft">
            {canRequest
              ? 'Cada elemento de tus solicitudes, separado en equipo y material.'
              : 'Entrega y recibe fila por fila: el equipo devolutivo y el material de consumo se manejan por separado.'}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {options.map((option) => (
          <article
            key={option.code}
            className="group flex flex-col rounded-[20px] border border-white/70 bg-white/85 p-6 shadow-surface backdrop-blur-glass transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <h3 className="text-base font-bold text-sena-dark">{option.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-sena-text-soft">{option.description}</p>
            <Link
              to={option.to}
              className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-[14px] border border-white/70 bg-sena-veil/85 px-5 text-sm font-semibold text-sena-strong backdrop-blur-glass-sm transition duration-150 group-hover:border-transparent group-hover:bg-sena group-hover:text-white group-hover:shadow-brand"
            >
              Abrir
              <span aria-hidden="true" className="grid size-6 place-items-center rounded-lg">
                →
              </span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  ) : null

  const tabla = canVer ? (
    <>
      <FilterCard>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, obra, ficha o elemento..."
        />
        <FilterGroup label="Estado">
          <select
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value as EstadoFiltro)
              setPage(1)
            }}
            className={`${filterSelectClass} lg:w-52`}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">{FACTURA_LABEL.pendiente}</option>
            <option value="parcial">{FACTURA_LABEL.parcial}</option>
            <option value="entregado">{FACTURA_LABEL.entregado}</option>
            <option value="cerrado">{FACTURA_LABEL.cerrado}</option>
          </select>
        </FilterGroup>
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando solicitudes..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width="w-[22%]">Solicitud</TableHeader>
                    <TableHeader width="w-[30%]">{canRequest ? 'Obra' : 'Solicitante'}</TableHeader>
                    <TableHeader align="center" width="w-[16%]">
                      Elementos
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
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={5}>
                      {search.trim()
                        ? 'No se encontraron solicitudes.'
                        : canRequest
                          ? 'Todavía no has hecho solicitudes. Usa "Nueva solicitud" para armar la primera.'
                          : 'Todavía no hay solicitudes.'}
                    </TableEmpty>
                  ) : (
                    pageRows.map((row) => (
                      <TableRow key={row.codigoSolicitud}>
                        <td className="px-5 py-4">
                          <p className="truncate font-semibold text-sena-text">{row.codigoSolicitud}</p>
                          <p className="mt-0.5 truncate text-xs text-sena-text/45">
                            {CARACTER_LABEL[row.tipo]} · {row.ficha ? `Ficha ${row.ficha}` : 'Sin ficha'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {canRequest ? (
                            <p className="truncate text-sena-text">{row.obra?.nombre ?? '—'}</p>
                          ) : (
                            <>
                              <p className="truncate text-sena-text">{personName(row.usuario)}</p>
                              <p className="mt-0.5 truncate text-xs text-sena-text/45">
                                {row.obra ? `para ${row.obra.nombre}` : '—'}
                                {row.registradaEnBodega ? ' · en mostrador' : ''}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <p className="font-semibold tabular-nums text-sena-text">{row.totales.lineas}</p>
                          <p className="mt-0.5 text-xs text-sena-text/45 tabular-nums">
                            {row.totales.pendientes
                              ? `${row.totales.pendientes} por entregar`
                              : 'todo entregado'}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={facturaTone(row.estado)}>{FACTURA_LABEL[row.estado]}</StatusPill>
                          <p className="mt-1 text-[11px] text-sena-text/45">{formatDay(row.fecha)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <RowActions>
                            <ActionButton title="Ver solicitud" onClick={() => setDetalle(row)}>
                              <EyeIcon className="size-[18px]" />
                            </ActionButton>
                          </RowActions>
                        </td>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
    </>
  ) : null

  return (
    <AppLayout title="Solicitudes">
      <PageHeader
        icon={<InventoryIcon />}
        title="Solicitudes"
        description={
          canRequest
            ? 'Arma una solicitud con varios elementos para la obra. Cada solicitud es de consumo o de devolutivos.'
            : tiposMostrador.length
              ? 'Revisa las solicitudes de los instructores. Si alguien llega a la bodega sin entrar a la aplicación, regístrale la solicitud desde el mostrador.'
              : 'Revisa las solicitudes de los instructores. Cada una puede traer varios elementos.'
        }
        action={
          canRequest || tiposMostrador.length ? (
            <div className="flex flex-wrap gap-3">
              {tiposMostrador.length ? (
                <Button
                  variant={canRequest ? 'secondary' : 'primary'}
                  onClick={() => void abrirMostrador()}
                  disabled={preparando}
                >
                  {preparando ? 'Cargando...' : 'Registrar en mostrador'}
                </Button>
              ) : null}
              {canRequest ? (
                <Button onClick={() => void openCreate()} disabled={preparando}>
                  {preparando ? 'Cargando...' : 'Nueva solicitud'}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

      {options.length || canVer ? (
        canRequest ? (
          <>
            {tabla}
            {cards}
          </>
        ) : (
          <>
            {cards}
            {tabla}
          </>
        )
      ) : (
        <p className="rounded-[20px] border border-white/70 bg-white/85 px-5 py-6 text-sm text-sena-text-soft shadow-surface backdrop-blur-glass">
          Tu perfil no tiene solicitudes de equipo ni de material.
        </p>
      )}

      {modalOpen ? (
        <FacturaModal
          obras={obras}
          elementos={elementos}
          tipos={[
            ...(canPedirMaterial ? (['consumo'] as const) : []),
            ...(canPedirEquipo ? (['devolutivo'] as const) : []),
          ]}
          onClose={() => setModalOpen(false)}
          onSubmit={submit}
        />
      ) : null}

      {mostrador === 'buscar' ? (
        <SolicitanteModal
          tipos={tiposMostrador}
          idPropio={user?.id}
          inicial={solicitante?.persona.numeroDocumento}
          onClose={cerrarMostrador}
          onConfirm={(persona, tipos) => {
            setSolicitante({ persona, tipos })
            setMostrador('armar')
          }}
        />
      ) : null}

      {mostrador === 'armar' && solicitante ? (
        <FacturaModal
          obras={obras}
          elementos={elementos}
          tipos={solicitante.tipos}
          solicitante={solicitante.persona}
          onCambiarSolicitante={() => setMostrador('buscar')}
          onClose={cerrarMostrador}
          onSubmit={registrarMostrador}
        />
      ) : null}

      {detalle ? <FacturaDetail factura={detalle} onClose={() => setDetalle(null)} /> : null}

      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}
    </AppLayout>
  )
}
