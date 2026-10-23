import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import { DeliverIcon, PlusIcon, ReturnIcon, TrashIcon } from '@/shared/components/icons/AppIcons'
import InventoryCenterBadge from '@/modules/inventario/components/InventoryCenterBadge'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import SelectField from '@/shared/components/ui/SelectField'
import TextField from '@/shared/components/ui/TextField'
import {
  ErrorBanner,
  PageHeader,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TablePagination,
  TableRow,
  tableClass,
} from '@/shared/components/DataTable'
import { ApiError, api } from '@/shared/lib/api'
import { usePagination } from '@/shared/lib/table'
import { getListaMaestra, type ListaMaestraItem } from '@/modules/materiales-formacion/data/listaMaestra'
import {
  createSolicitudPrograma,
  decidirSolicitudPrograma,
  enviarSolicitudPrograma,
  getSolicitudesPrograma,
  type SolicitudPrograma,
} from '@/modules/materiales-formacion/data/solicitudPrograma'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'
import { useAuth } from '@/modules/auth/context/auth'

type Programa = {
  id: number
  codigo: string
  nombre: string
  redConocimiento?: { id: number; nombre: string } | null
  lineaTematica?: { id: number; nombre: string } | null
}
type Ficha = { id: number; programaId: number; numeroFicha: string; centroFormacionId?: number }
type LineaCarrito = { material: ListaMaestraItem; cantidad: number }
type AccionItem = 'entregar' | 'pendiente' | 'rechazar'
type DecisionLinea = { accion: AccionItem; cantidad: string; motivo: string }

type ProgramaGrupo = {
  id: number
  codigo: string
  nombre: string
  red: string
  linea: string
  solicitudes: SolicitudPrograma[]
}
type LineaGrupo = { linea: string; programas: ProgramaGrupo[] }
type RedGrupo = { red: string; lineas: LineaGrupo[] }

const estadoTone: Record<SolicitudPrograma['estado'], 'ok' | 'warn' | 'danger'> = {
  borrador: 'warn',
  enviada: 'warn',
  aprobada: 'ok',
  parcial: 'warn',
  rechazada: 'danger',
  anulada: 'danger',
}

function topeDe(item: SolicitudPrograma['items'][number]) {
  return item.cantidadMaestraReferencia ?? item.material?.cantidadBase ?? null
}

function sugerida(item: SolicitudPrograma['items'][number]) {
  const tope = topeDe(item)
  if (tope === null) return item.cantidadSolicitada
  return Math.min(item.cantidadSolicitada, tope)
}

function pendienteDeRevision(solicitud: SolicitudPrograma) {
  return (
    (solicitud.estado === 'enviada' || solicitud.estado === 'parcial') &&
    solicitud.items.some((item) => item.estado === 'pendiente')
  )
}

function autorizadoDe(item: SolicitudPrograma['items'][number]) {
  return item.cantidadAprobada ?? 0
}

function restanteDe(item: SolicitudPrograma['items'][number]) {
  return Math.max(0, item.cantidadSolicitada - autorizadoDe(item))
}

function nombreInstructor(solicitud: SolicitudPrograma) {
  if (!solicitud.instructor) return 'Instructor'
  return `${solicitud.instructor.nombres} ${solicitud.instructor.apellidos}`.trim()
}

export default function SolicitudMaterialFormacionPage() {
  const { can } = useFormacionAccess()
  const { user } = useAuth()
  const puedePedir = can('solicitudes', 'create')
  const puedeDecidir = can('solicitudes', 'edit')
  const [solicitudes, setSolicitudes] = useState<SolicitudPrograma[]>([])
  const [programas, setProgramas] = useState<Programa[]>([])
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [materiales, setMateriales] = useState<ListaMaestraItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [carritoOpen, setCarritoOpen] = useState(false)
  const [revision, setRevision] = useState<SolicitudPrograma | null>(null)
  const [detalle, setDetalle] = useState<SolicitudPrograma | null>(null)
  const [programaId, setProgramaId] = useState('')
  const [fichaId, setFichaId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [carrito, setCarrito] = useState<LineaCarrito[]>([])
  const [decisiones, setDecisiones] = useState<Record<number, DecisionLinea>>({})
  const [observacionDecision, setObservacionDecision] = useState('')
  const [saving, setSaving] = useState(false)
  const [programaAbiertoId, setProgramaAbiertoId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [rows, ps, fs] = await Promise.all([
        getSolicitudesPrograma(),
        api<Programa[]>('/account/programas'),
        api<Ficha[]>('/fichas'),
      ])
      setSolicitudes(rows)
      setProgramas(ps)
      setFichas(fs)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Solicitar materiales | SENA'
    void load()
  }, [])

  useEffect(() => {
    if (!programaId) {
      setMateriales([])
      return
    }
    void getListaMaestra(Number(programaId))
      .then(setMateriales)
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar la lista maestra.')
      })
  }, [programaId])

  const fichasDelPrograma = fichas.filter((ficha) => {
    if (String(ficha.programaId) !== programaId) return false
    if (!user?.trainingCenterId || !ficha.centroFormacionId) return true
    return ficha.centroFormacionId === user.trainingCenterId
  })
  const [page, setPage] = useState(1)
  const { pageRows, from, to, totalPages, currentPage } = usePagination(solicitudes, page)
  const materialElegido = materiales.find((item) => String(item.id) === materialId)

  const abrirCarrito = () => {
    setCarrito([])
    setProgramaId('')
    setFichaId('')
    setMaterialId('')
    setCantidad('1')
    setCarritoOpen(true)
  }

  const agregarLinea = (event: FormEvent) => {
    event.preventDefault()
    if (!materialElegido) return
    const pedida = Number(cantidad)
    if (!Number.isFinite(pedida) || pedida <= 0) return
    setCarrito((current) => {
      const ya = current.find((linea) => linea.material.id === materialElegido.id)
      if (ya) {
        return current.map((linea) =>
          linea.material.id === materialElegido.id
            ? { ...linea, cantidad: linea.cantidad + pedida }
            : linea,
        )
      }
      return [...current, { material: materialElegido, cantidad: pedida }]
    })
    setMaterialId('')
    setCantidad('1')
  }

  const handleEnviar = async () => {
    if (!programaId || !fichaId || !carrito.length) return
    setSaving(true)
    setError(null)
    try {
      const creada = await createSolicitudPrograma({
        programaId: Number(programaId),
        fichaId: Number(fichaId),
        items: carrito.map((linea) => ({
          listaMaestraId: linea.material.id,
          cantidadSolicitada: linea.cantidad,
        })),
      })
      await enviarSolicitudPrograma(creada.id)
      setCarritoOpen(false)
      setMessage('El carrito se envió a coordinación. Te avisamos cuando revisen cada material.')
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo enviar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  const abrirRevision = (solicitud: SolicitudPrograma) => {
    setRevision(solicitud)
    setObservacionDecision('')
    setDecisiones(
      Object.fromEntries(
        solicitud.items
          .filter((item) => item.estado === 'pendiente')
          .map((item) => [
            item.id,
            {
              accion: 'entregar' as const,
              cantidad: String(restanteDe(item) || sugerida(item)),
              motivo: item.observacionCoordinador ?? '',
            },
          ]),
      ),
    )
  }

  const patchDecision = (id: number, patch: Partial<DecisionLinea>) => {
    setDecisiones((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { accion: 'pendiente', cantidad: '0', motivo: '' }), ...patch },
    }))
  }

  const enviarDecision = async (
    items: Array<{
      id: number
      accion: AccionItem
      cantidadAprobada?: number
      observacionCoordinador?: string
    }>,
  ) => {
    if (!revision) return
    setSaving(true)
    setError(null)
    try {
      await decidirSolicitudPrograma(revision.id, {
        observacionDecision: observacionDecision.trim() || undefined,
        items,
      })
      setRevision(null)
      setMessage(
        'El instructor ya recibió el aviso: qué se autorizó, qué se ajustó y por qué, y qué sigue pendiente.',
      )
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar la decisión.')
    } finally {
      setSaving(false)
    }
  }

  const handleDecidir = async (event: FormEvent) => {
    event.preventDefault()
    if (!revision) return
    const pendientes = revision.items.filter((item) => item.estado === 'pendiente')
    const payload: Array<{
      id: number
      accion: AccionItem
      cantidadAprobada?: number
      observacionCoordinador?: string
    }> = []

    for (const item of pendientes) {
      const decision = decisiones[item.id]
      if (!decision || decision.accion === 'pendiente') continue
      const restante = restanteDe(item)
      const cantidad = Number(decision.cantidad)
      if (decision.accion === 'entregar' && (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > restante)) {
        setError(`Revisa la cantidad de ${item.material?.producto ?? 'material'}.`)
        return
      }
      if (
        (decision.accion === 'rechazar' || (decision.accion === 'entregar' && cantidad < restante)) &&
        !decision.motivo.trim()
      ) {
        setError(`Indica por qué ajustas o no autorizas ${item.material?.producto ?? 'el material'}.`)
        return
      }
      payload.push({
        id: item.id,
        accion: decision.accion,
        cantidadAprobada: decision.accion === 'entregar' ? cantidad : undefined,
        observacionCoordinador: decision.motivo.trim() || undefined,
      })
    }

    if (!payload.length) {
      setError('Elige en cada material si lo autorizas ahora, lo dejas pendiente o no lo autorizas.')
      return
    }
    await enviarDecision(payload)
  }

  const entregarTodo = async () => {
    if (!revision) return
    const pendientes = revision.items.filter((item) => item.estado === 'pendiente')
    await enviarDecision(
      pendientes.map((item) => ({
        id: item.id,
        accion: 'entregar' as const,
        cantidadAprobada: restanteDe(item),
      })),
    )
  }

  const resumenRevision = useMemo(() => {
    if (!revision) return []
    return revision.items.filter((item) => item.estado === 'pendiente')
  }, [revision])

  const gruposCoordinador = useMemo(() => {
    const programasPorId = new Map<number, ProgramaGrupo>()

    const asegurar = (input: {
      id: number
      codigo: string
      nombre: string
      red: string
      linea: string
    }) => {
      const actual = programasPorId.get(input.id)
      if (actual) return actual
      const creado: ProgramaGrupo = {
        id: input.id,
        codigo: input.codigo,
        nombre: input.nombre,
        red: input.red,
        linea: input.linea,
        solicitudes: [],
      }
      programasPorId.set(input.id, creado)
      return creado
    }

    for (const programa of programas) {
      asegurar({
        id: programa.id,
        codigo: programa.codigo,
        nombre: programa.nombre,
        red: programa.redConocimiento?.nombre ?? 'Sin red',
        linea: programa.lineaTematica?.nombre ?? 'Sin línea',
      })
    }

    for (const solicitud of solicitudes) {
      const grupo = asegurar({
        id: solicitud.programaId,
        codigo: solicitud.programa?.codigo ?? '',
        nombre: solicitud.programa?.nombre ?? 'Programa',
        red: solicitud.programa?.redConocimiento?.nombre ?? 'Sin red',
        linea: solicitud.programa?.lineaTematica?.nombre ?? 'Sin línea',
      })
      grupo.solicitudes.push(solicitud)
    }

    const redes = new Map<string, RedGrupo>()
    for (const programa of programasPorId.values()) {
      const red = redes.get(programa.red) ?? { red: programa.red, lineas: [] }
      let linea = red.lineas.find((item) => item.linea === programa.linea)
      if (!linea) {
        linea = { linea: programa.linea, programas: [] }
        red.lineas.push(linea)
      }
      linea.programas.push(programa)
      redes.set(programa.red, red)
    }
    return [...redes.values()]
  }, [programas, solicitudes])

  const vistaCoordinador = puedeDecidir && !puedePedir
  const programaAbierto = useMemo(
    () =>
      gruposCoordinador
        .flatMap((red) => red.lineas.flatMap((linea) => linea.programas))
        .find((programa) => programa.id === programaAbiertoId) ?? null,
    [gruposCoordinador, programaAbiertoId],
  )

  const accionesSolicitud = (solicitud: SolicitudPrograma) => (
    <td className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => setDetalle(solicitud)}>
        Ver
      </Button>
      {puedeDecidir && pendienteDeRevision(solicitud) ? (
        <Button type="button" size="sm" onClick={() => abrirRevision(solicitud)}>
          {solicitud.estado === 'parcial' ? 'Entregar lo pendiente' : 'Revisar pedido'}
        </Button>
      ) : null}
    </td>
  )

  const filaSolicitud = (solicitud: SolicitudPrograma) => (
    <TableRow key={solicitud.id}>
      <td>
        <p className="font-semibold">{solicitud.programa?.nombre ?? '—'}</p>
        <p className="text-xs text-sena-text/60">{solicitud.programa?.codigo}</p>
      </td>
      <td>{solicitud.ficha?.numeroFicha ?? '—'}</td>
      <td>{solicitud.vigencia}</td>
      <td>
        <StatusPill tone={estadoTone[solicitud.estado]}>{solicitud.estado}</StatusPill>
      </td>
      <td>{solicitud.items.length}</td>
      {accionesSolicitud(solicitud)}
    </TableRow>
  )

  const filaFichaCoordinador = (solicitud: SolicitudPrograma) => (
    <TableRow key={solicitud.id}>
      <td>
        <p className="font-semibold">{nombreInstructor(solicitud)}</p>
      </td>
      <td>{solicitud.ficha?.numeroFicha ?? '—'}</td>
      <td>{solicitud.vigencia}</td>
      <td>
        <StatusPill tone={estadoTone[solicitud.estado]}>{solicitud.estado}</StatusPill>
      </td>
      <td>{solicitud.items.length}</td>
      {accionesSolicitud(solicitud)}
    </TableRow>
  )

  return (
    <AppLayout title="Solicitar materiales">
      <PageHeader
        icon={<DeliverIcon />}
        title="Solicitudes de materiales de formación"
        description={
          vistaCoordinador
            ? `En ${user?.trainingCenter ?? 'tu centro'} ves tu red, tu línea y los programas a cargo. El punto rojo marca el programa que tiene solicitudes; cada ficha es un pedido aparte.`
            : 'Arma el pedido como un carrito, producto a producto. Coordinación de tu red aprueba o ajusta cada línea.'
        }
        context={<InventoryCenterBadge />}
        action={
          puedePedir ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={abrirCarrito}>
              Armar carrito
            </Button>
          ) : undefined
        }
      />
      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
      {message ? (
        <p className="mb-4 rounded-2xl border border-sena-ok-line bg-sena-active-soft px-5 py-3.5 text-sm text-sena-ok-text">
          {message}
        </p>
      ) : null}

      {vistaCoordinador ? (
        loading ? (
          <TableCard>
            <TableLoading label="Cargando solicitudes de tu red…" />
          </TableCard>
        ) : gruposCoordinador.length === 0 ? (
          <TableCard>
            <p className="px-6 py-16 text-center text-sm text-sena-text-soft">
              No hay programas de tu red en {user?.trainingCenter ?? 'este centro'}. El administrador
              debe asignártelos en Formación → Asignar programas.
            </p>
          </TableCard>
        ) : programaAbierto ? (
          <TableCard>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sena-hairline px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-sena-text">{programaAbierto.nombre}</h2>
                <p className="mt-1 text-sm text-sena-strong">
                  {programaAbierto.red} · {programaAbierto.linea} · {programaAbierto.codigo}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<ReturnIcon className="size-4" />}
                onClick={() => setProgramaAbiertoId(null)}
              >
                Volver a programas
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader>Instructor</TableHeader>
                    <TableHeader>Ficha</TableHeader>
                    <TableHeader>Vigencia</TableHeader>
                    <TableHeader>Estado</TableHeader>
                    <TableHeader>Ítems</TableHeader>
                    <TableHeader>Acciones</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {programaAbierto.solicitudes.length === 0 ? (
                    <TableEmpty colSpan={6}>Este programa todavía no tiene solicitudes.</TableEmpty>
                  ) : (
                    programaAbierto.solicitudes.map((solicitud) => filaFichaCoordinador(solicitud))
                  )}
                </tbody>
              </table>
            </div>
          </TableCard>
        ) : (
          <div className="grid gap-6">
            {gruposCoordinador.map((grupo) => (
              <section key={grupo.red} className="grid gap-3">
                <div>
                  <h2 className="text-xl font-bold text-sena-text">{grupo.red}</h2>
                </div>
                {grupo.lineas.map((linea) => (
                  <TableCard key={`${grupo.red}-${linea.linea}`}>
                    <div className="border-b border-sena-hairline px-6 py-4">
                      <h3 className="text-lg font-bold text-sena-text">{linea.linea}</h3>
                      <p className="mt-1 text-sm text-sena-strong">
                        Programas de {grupo.red} en {user?.trainingCenter ?? 'tu centro'}
                      </p>
                    </div>
                    <ul>
                      {linea.programas.map((programa) => {
                        const pendientes = programa.solicitudes.filter(pendienteDeRevision).length
                        return (
                          <li key={programa.id} className="border-b border-sena-hairline last:border-b-0">
                            <button
                              type="button"
                              onClick={() => setProgramaAbiertoId(programa.id)}
                              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-sena-soft/60"
                            >
                              <span>
                                <span className="flex items-center gap-2">
                                  {pendientes > 0 ? (
                                    <span
                                      className="size-2.5 shrink-0 rounded-full bg-sena-danger-text"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <span className="size-2.5 shrink-0 rounded-full bg-sena-line" aria-hidden="true" />
                                  )}
                                  <span className="font-semibold text-sena-text">{programa.nombre}</span>
                                </span>
                                <span className="mt-1 block pl-[1.125rem] text-sm text-sena-strong">
                                  {programa.codigo}
                                  {pendientes > 0
                                    ? ` · ${pendientes} solicitud${pendientes === 1 ? '' : 'es'} por revisar`
                                    : ' · sin solicitudes por revisar'}
                                </span>
                              </span>
                              <span className="shrink-0 text-sm font-semibold text-sena-text">
                                Ver fichas
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </TableCard>
                ))}
              </section>
            ))}
          </div>
        )
      ) : (
      <TableCard>
        {loading ? (
          <TableLoading label="Cargando solicitudes…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader>Programa</TableHeader>
                    <TableHeader>Ficha</TableHeader>
                    <TableHeader>Vigencia</TableHeader>
                    <TableHeader>Estado</TableHeader>
                    <TableHeader>Ítems</TableHeader>
                    <TableHeader>Acciones</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={6}>No hay solicitudes de materiales de formación.</TableEmpty>
                  ) : (
                    pageRows.map((solicitud) => filaSolicitud(solicitud))
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
              total={solicitudes.length}
              noun="solicitudes"
            />
          </>
        )}
      </TableCard>
      )}

      {carritoOpen ? (
        <Modal
          title="Carrito de materiales"
          description="Elige el programa y la ficha, y ve sumando un material a la vez. Al enviar, coordinación recibe el pedido."
          onClose={() => setCarritoOpen(false)}
          wide
          spacious
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              id="sol-programa"
              label="Programa"
              value={programaId}
              onChange={(value) => {
                setProgramaId(value)
                setFichaId('')
                setMaterialId('')
                setCarrito([])
              }}
              placeholder="Seleccione"
              options={programas.map((programa) => ({
                value: String(programa.id),
                label: [
                  programa.redConocimiento?.nombre && `Red ${programa.redConocimiento.nombre}`,
                  programa.lineaTematica?.nombre && `Línea ${programa.lineaTematica.nombre}`,
                  programa.nombre,
                ]
                  .filter(Boolean)
                  .join(' · '),
              }))}
            />
            <SelectField
              id="sol-ficha"
              label="Ficha"
              value={fichaId}
              onChange={setFichaId}
              placeholder="Seleccione"
              disabled={!programaId}
              options={fichasDelPrograma.map((ficha) => ({
                value: String(ficha.id),
                label: ficha.numeroFicha,
              }))}
            />
          </div>
          {programas.length === 0 ? (
            <p className="mt-3 rounded-xl border border-sena-warn-line bg-white px-4 py-3 text-sm text-sena-text">
              No tienes programas de formación asignados. El administrador debe asignártelos en
              Formación → Asignar programas.
            </p>
          ) : null}

          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end" onSubmit={agregarLinea}>
            <SelectField
              id="sol-material"
              label="Material de la lista maestra"
              value={materialId}
              onChange={setMaterialId}
              placeholder={programaId ? 'Seleccione un producto' : 'Elija primero el programa'}
              disabled={!programaId}
              required={false}
              options={materiales.map((item) => ({
                value: String(item.id),
                label: `${item.codigoUnspsc} — ${item.producto} (base ${item.cantidadBase})`,
              }))}
            />
            <TextField
              id="sol-cantidad"
              label="Cantidad"
              type="number"
              min={1}
              step="0.001"
              value={cantidad}
              onChange={(event) => setCantidad(event.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={!materialId}>
              Agregar al carrito
            </Button>
          </form>

          {materialElegido ? (
            <p className="mt-2 text-sm text-sena-text/70">
              La lista maestra indica <strong>{materialElegido.cantidadBase}</strong>{' '}
              {materialElegido.unidadMedida ?? 'unidades'} para 30 aprendices.
            </p>
          ) : null}

          <div className="mt-5 overflow-x-auto rounded-2xl border border-sena-hairline">
            <table className={tableClass}>
              <thead>
                <tr className="border-b border-sena-hairline bg-sena-soft/85">
                  <TableHeader>Producto</TableHeader>
                  <TableHeader>Pedida</TableHeader>
                  <TableHeader>Lista maestra</TableHeader>
                  <TableHeader>Quitar</TableHeader>
                </tr>
              </thead>
              <tbody>
                {carrito.length === 0 ? (
                  <TableEmpty colSpan={4}>Todavía no hay productos. Agrégalos uno a uno.</TableEmpty>
                ) : (
                  carrito.map((linea) => (
                    <TableRow key={linea.material.id}>
                      <td>
                        <p className="font-semibold">{linea.material.producto}</p>
                        <p className="text-xs text-sena-text/60">{linea.material.codigoUnspsc}</p>
                      </td>
                      <td>{linea.cantidad}</td>
                      <td>{linea.material.cantidadBase}</td>
                      <td>
                        <button
                          type="button"
                          className="text-sena-danger-text"
                          onClick={() =>
                            setCarrito((current) =>
                              current.filter((item) => item.material.id !== linea.material.id),
                            )
                          }
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </td>
                    </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCarritoOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={saving || !carrito.length || !fichaId} onClick={() => void handleEnviar()}>
              {saving ? 'Enviando…' : 'Enviar a coordinación'}
            </Button>
          </div>
        </Modal>
      ) : null}

      {revision ? (
        <Modal
          title="Autorizar materiales"
          description={`${nombreInstructor(revision)} · ficha ${revision.ficha?.numeroFicha ?? '—'}. Elige material por material: autorizar ahora, dejar pendiente o no autorizar. Si ajustas la cantidad, escribe el porqué. El instructor recibe el aviso.`}
          onClose={() => setRevision(null)}
          wide
          spacious
        >
          <form className="grid gap-4" onSubmit={handleDecidir}>
            {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
            {resumenRevision.length === 0 ? (
              <p className="text-sm text-sena-text/70">No quedan líneas pendientes en este pedido.</p>
            ) : (
              resumenRevision.map((item) => {
                const tope = topeDe(item)
                const restante = restanteDe(item)
                const ya = autorizadoDe(item)
                const decision = decisiones[item.id] ?? {
                  accion: 'pendiente' as const,
                  cantidad: String(restante),
                  motivo: '',
                }
                const pideMas = tope !== null && item.cantidadSolicitada > tope
                return (
                  <div key={item.id} className="rounded-2xl border border-sena-line bg-white/70 px-4 py-4">
                    <p className="font-semibold text-sena-text">{item.material?.producto ?? 'Material'}</p>
                    <p className="text-sm text-sena-strong">
                      Pidió {item.cantidadSolicitada}
                      {item.material?.unidadMedida ? ` ${item.material.unidadMedida}` : ''}
                      {ya > 0 ? ` · ya autorizados ${ya}` : ''}
                      {` · faltan ${restante}`}
                      {tope !== null ? ` · lista maestra ${tope}` : ''}
                    </p>
                    {pideMas ? (
                      <p className="mt-1 text-sm text-sena-warn-text">
                        Pidió más de la lista maestra. Puedes autorizar menos y dejar el resto pendiente.
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          ['entregar', 'Autorizar ahora'],
                          ['pendiente', 'Dejar pendiente'],
                          ['rechazar', 'No autorizar'],
                        ] as const
                      ).map(([accion, etiqueta]) => (
                        <Button
                          key={accion}
                          type="button"
                          size="sm"
                          variant={decision.accion === accion ? 'primary' : 'secondary'}
                          onClick={() => patchDecision(item.id, { accion })}
                        >
                          {etiqueta}
                        </Button>
                      ))}
                    </div>
                    {decision.accion === 'entregar' ? (
                      <div className="mt-3 max-w-[14rem]">
                        <TextField
                          id={`dec-${item.id}`}
                          label="Cantidad ahora"
                          type="number"
                          min={0.001}
                          max={restante}
                          step="0.001"
                          value={decision.cantidad}
                          onChange={(event) => patchDecision(item.id, { cantidad: event.target.value })}
                        />
                      </div>
                    ) : null}
                    {decision.accion !== 'pendiente' ? (
                      <div className="mt-3">
                        <TextField
                          id={`mot-${item.id}`}
                          label={
                            decision.accion === 'rechazar'
                              ? 'Por qué no se autoriza'
                              : Number(decision.cantidad) < restante
                                ? 'Por qué se ajusta la cantidad'
                                : 'Nota para el instructor (opcional)'
                          }
                          value={decision.motivo}
                          onChange={(event) => patchDecision(item.id, { motivo: event.target.value })}
                        />
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
            <TextField
              id="obs-decision"
              label="Nota general (opcional)"
              value={observacionDecision}
              onChange={(event) => setObservacionDecision(event.target.value)}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setRevision(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={saving || resumenRevision.length === 0}
                onClick={() => void entregarTodo()}
              >
                Autorizar todo lo pendiente
              </Button>
              <Button type="submit" disabled={saving || resumenRevision.length === 0}>
                {saving ? 'Guardando…' : 'Guardar selección'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {detalle ? (
        <Modal
          title="Detalle del pedido"
          description={`${nombreInstructor(detalle)} · ${detalle.programa?.nombre ?? ''} · ficha ${detalle.ficha?.numeroFicha ?? ''}`}
          onClose={() => setDetalle(null)}
          wide
        >
          <ul className="grid gap-3">
            {detalle.items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-sena-hairline px-4 py-3 text-sm">
                <p className="font-semibold">{item.material?.producto ?? 'Material'}</p>
                <p className="text-sena-text/70">
                  Pidió {item.cantidadSolicitada}
                  {autorizadoDe(item) > 0 ? ` · autorizado ${autorizadoDe(item)}` : ''}
                  {item.estado === 'pendiente' ? ` · faltan ${restanteDe(item)}` : ''}
                  {topeDe(item) !== null ? ` · lista maestra ${topeDe(item)}` : ''}
                </p>
                {item.observacionCoordinador ? (
                  <p className="mt-1 text-sena-strong">Motivo: {item.observacionCoordinador}</p>
                ) : null}
                <StatusPill
                  tone={
                    item.estado === 'aprobado' ? 'ok' : item.estado === 'rechazado' ? 'danger' : 'warn'
                  }
                >
                  {item.estado}
                </StatusPill>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}
    </AppLayout>
  )
}
