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
import { getLotes, type LoteVigencia } from '@/modules/presupuesto/data/presupuesto'
import { getVigencias } from '@/modules/vigencias/data/vigencia'
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
type DecisionLinea = { accion: AccionItem; cantidad: string; motivo: string; pedida: string }

function pesos(valor: number) {
  return valor.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })
}

function corteDeArea(solicitudes: SolicitudPrograma[]) {
  const corte = solicitudes.find((solicitud) => solicitud.presupuestoFicha)?.presupuestoFicha
  if (corte) {
    return { suma: corte.pedido, tope: corte.asignado, sePasa: corte.pedido > corte.asignado }
  }
  const suma = solicitudes.reduce((total, solicitud) => total + Number(solicitud.valorAproximado ?? 0), 0)
  return { suma, tope: 0, sePasa: suma > 0 }
}

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
    solicitud.estado === 'anulada' ||
    ((solicitud.estado === 'enviada' || solicitud.estado === 'parcial') &&
      solicitud.items.some((item) => item.estado === 'pendiente'))
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
  const [lotes, setLotes] = useState<LoteVigencia[]>([])
  const [loteId, setLoteId] = useState('')
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
    getVigencias()
      .then((lista) => {
        const activa = lista.find((item) => item.activa)
        return getLotes(activa?.anio ?? new Date().getFullYear())
      })
      .then(setLotes)
      .catch(() => setLotes([]))
  }, [])

  useEffect(() => {
    if (!programaId) {
      setMateriales([])
      return
    }
    void getListaMaestra(Number(programaId), loteId ? Number(loteId) : undefined)
      .then(setMateriales)
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar la lista maestra.')
      })
  }, [programaId, loteId])

  const fichasDelPrograma = fichas.filter((ficha) => {
    if (String(ficha.programaId) !== programaId) return false
    if (!user?.trainingCenterId || !ficha.centroFormacionId) return true
    return ficha.centroFormacionId === user.trainingCenterId
  })
  const [page, setPage] = useState(1)
  const [redAbierta, setRedAbierta] = useState<string | null>(null)
  const [lineaAbierta, setLineaAbierta] = useState<string | null>(null)
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
      setMessage('La solicitud se envió a coordinación. Te avisamos cuando revisen cada material.')
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
      [id]: { ...(current[id] ?? { accion: 'pendiente', cantidad: '0', motivo: '', pedida: '' }), ...patch },
    }))
  }

  const enviarDecision = async (
    items: Array<{
      id: number
      accion: AccionItem
      cantidadSolicitada?: number
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
        items.every((item) => item.accion === 'pendiente')
          ? 'Cantidades actualizadas. La suma del área ya usa estos valores.'
          : 'El instructor ya recibió el aviso: qué se autorizó, qué se ajustó y por qué, y qué sigue pendiente.',
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

  const guardarCantidades = async () => {
    if (!revision) return
    const items = resumenRevision.map((item) => {
      const pedida = Number(decisiones[item.id]?.pedida ?? item.cantidadSolicitada)
      return { id: item.id, accion: 'pendiente' as const, cantidadSolicitada: pedida }
    })
    if (items.some((item) => !Number.isFinite(item.cantidadSolicitada) || item.cantidadSolicitada <= 0)) {
      setError('La cantidad pedida tiene que ser mayor que cero.')
      return
    }
    await enviarDecision(items)
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
    if (revision.estado === 'anulada') return revision.items
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
  const grupoAbierto = gruposCoordinador.find((grupo) => grupo.red === redAbierta) ?? null
  const lineaGrupo = grupoAbierto?.lineas.find((linea) => linea.linea === lineaAbierta) ?? null
  const programaAbierto = useMemo(
    () =>
      gruposCoordinador
        .flatMap((red) => red.lineas.flatMap((linea) => linea.programas))
        .find((programa) => programa.id === programaAbiertoId) ?? null,
    [gruposCoordinador, programaAbiertoId],
  )

  const abrirRed = (red: string) => {
    setRedAbierta(red)
    setLineaAbierta(null)
    setProgramaAbiertoId(null)
  }

  const abrirLinea = (linea: string) => {
    setLineaAbierta(linea)
    setProgramaAbiertoId(null)
  }

  const volverAAreas = () => {
    setRedAbierta(null)
    setLineaAbierta(null)
    setProgramaAbiertoId(null)
  }

  const volverALineas = () => {
    setLineaAbierta(null)
    setProgramaAbiertoId(null)
  }

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
      <td>
        {solicitud.valorAproximado
          ? solicitud.valorAproximado.toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0,
            })
          : '—'}
      </td>
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
      <td>
        {solicitud.valorAproximado
          ? solicitud.valorAproximado.toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0,
            })
          : '—'}
      </td>
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
            ? 'Cada red de conocimiento es un área. Entra a un programa y mira los pedidos. El aviso sale si, sumados, se pasan del tope de esa red.'
            : 'Arma la solicitud con los materiales de la lista maestra. Coordinación de tu red revisa cada línea.'
        }
        context={<InventoryCenterBadge />}
        action={
          puedePedir ? (
            <Button type="button" icon={<PlusIcon className="size-4" />} onClick={abrirCarrito}>
              Nueva solicitud
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
            {corteDeArea(programaAbierto.solicitudes).sePasa ? (
              <p className="mx-6 my-4 rounded-2xl border border-sena-warn-line bg-white px-4 py-3 text-sm text-sena-text">
                Sumando los pedidos de la red {programaAbierto.red} da{' '}
                {pesos(corteDeArea(programaAbierto.solicitudes).suma)}. El tope asignado es{' '}
                {pesos(corteDeArea(programaAbierto.solicitudes).tope)}. Ajusta las cantidades.
              </p>
            ) : null}
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader>Instructor</TableHeader>
                    <TableHeader>Ficha</TableHeader>
                    <TableHeader>Vigencia</TableHeader>
                    <TableHeader>Estado</TableHeader>
                    <TableHeader>Ítems</TableHeader>
                    <TableHeader>Valor aprox.</TableHeader>
                    <TableHeader>Acciones</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {programaAbierto.solicitudes.length === 0 ? (
                    <TableEmpty colSpan={7}>Este programa todavía no tiene solicitudes.</TableEmpty>
                  ) : (
                    programaAbierto.solicitudes.map((solicitud) => filaFichaCoordinador(solicitud))
                  )}
                </tbody>
              </table>
            </div>
          </TableCard>
        ) : lineaGrupo && grupoAbierto ? (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sena-strong">
                  Línea temática
                </p>
                <h2 className="mt-2 text-2xl font-bold text-sena-text">{lineaGrupo.linea}</h2>
                <p className="mt-2 text-sm text-sena-strong">
                  {grupoAbierto.red} · el tope del presupuesto es de esta red
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<ReturnIcon className="size-4" />}
                onClick={volverALineas}
              >
                Volver a líneas
              </Button>
            </div>
            <TableCard>
              <div className="border-b border-sena-hairline px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sena-strong">
                  Programas
                </p>
              </div>
              <ul>
                {lineaGrupo.programas.map((programa) => {
                  const pendientes = programa.solicitudes.filter(pendienteDeRevision).length
                  const sePasa = corteDeArea(programa.solicitudes).sePasa
                  return (
                    <li key={programa.id} className="border-b border-sena-hairline last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setProgramaAbiertoId(programa.id)}
                        className="flex w-full items-start justify-between gap-6 px-6 py-6 text-left transition hover:bg-sena-soft/60"
                      >
                        <span className="grid min-w-0 gap-1.5">
                          <span className="flex items-center gap-2">
                            {sePasa ? (
                              <span className="size-3 shrink-0 rounded-full bg-[#d14343]" aria-hidden="true" />
                            ) : null}
                            <span className="font-semibold text-sena-text">{programa.nombre}</span>
                          </span>
                          <span className="text-sm text-sena-strong">
                            Código {programa.codigo || '—'}
                          </span>
                          <span className="text-sm text-sena-strong">
                            {pendientes > 0
                              ? `${pendientes} pedido${pendientes === 1 ? '' : 's'} por revisar`
                              : 'Sin pedidos por revisar'}
                          </span>
                          {sePasa ? (
                            <span className="mt-2 block max-w-xl rounded-2xl border border-sena-warn-line bg-white px-3 py-2 text-sm text-sena-text">
                              Sumando los pedidos se pasa del tope de esta red.
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 pt-0.5 text-sm font-semibold text-sena-text">
                          Ver pedidos
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </TableCard>
          </div>
        ) : grupoAbierto ? (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sena-strong">
                  Red de conocimiento · área
                </p>
                <h2 className="mt-2 text-2xl font-bold text-sena-text">{grupoAbierto.red}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-sena-strong">
                  El tope del presupuesto es de esta red, en {user?.trainingCenter?.trim() || 'tu centro'}.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<ReturnIcon className="size-4" />}
                onClick={volverAAreas}
              >
                Volver a áreas
              </Button>
            </div>
            <TableCard>
              <div className="border-b border-sena-hairline px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sena-strong">
                  Línea temática
                </p>
              </div>
              <ul>
                {grupoAbierto.lineas.map((linea) => {
                  const programas = linea.programas.length
                  const pendientes = linea.programas.reduce(
                    (total, programa) =>
                      total + programa.solicitudes.filter(pendienteDeRevision).length,
                    0,
                  )
                  return (
                    <li key={`${grupoAbierto.red}-${linea.linea}`} className="border-b border-sena-hairline last:border-b-0">
                      <button
                        type="button"
                        onClick={() => abrirLinea(linea.linea)}
                        className="flex w-full items-start justify-between gap-6 px-6 py-6 text-left transition hover:bg-sena-soft/60"
                      >
                        <span className="grid min-w-0 gap-1.5">
                          <span className="font-semibold text-sena-text">{linea.linea}</span>
                          <span className="text-sm text-sena-strong">
                            {programas === 1 ? '1 programa' : `${programas} programas`}
                            {pendientes > 0
                              ? ` · ${pendientes === 1 ? '1 pedido' : `${pendientes} pedidos`} por revisar`
                              : ''}
                          </span>
                        </span>
                        <span className="shrink-0 pt-0.5 text-sm font-semibold text-sena-text">
                          Ver programas
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </TableCard>
          </div>
        ) : (
          <div className="grid gap-4">
            <section className="rounded-[1.35rem] border border-sena-hairline bg-white px-6 py-5 shadow-card">
              <div className="border-l-[3px] border-sena pl-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sena-text">
                  Red de conocimiento · área
                </p>
                <p className="mt-1.5 text-sm text-sena-strong">
                  El tope del presupuesto es de cada red, en {user?.trainingCenter?.trim() || 'tu centro'}.
                </p>
              </div>
            </section>
            <ul className="grid gap-4">
              {gruposCoordinador.map((grupo) => {
                const lineas = grupo.lineas.length
                const programas = grupo.lineas.reduce((total, linea) => total + linea.programas.length, 0)
                const pendientes = grupo.lineas.reduce(
                  (total, linea) =>
                    total +
                    linea.programas.reduce(
                      (suma, programa) =>
                        suma + programa.solicitudes.filter(pendienteDeRevision).length,
                      0,
                    ),
                  0,
                )
                const sePasa = grupo.lineas.some((linea) =>
                  linea.programas.some((programa) => corteDeArea(programa.solicitudes).sePasa),
                )
                return (
                  <li
                    key={grupo.red}
                    className="rounded-[1.35rem] border border-sena-hairline bg-white px-5 py-5 shadow-card sm:px-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sena-active-soft text-sena">
                          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                            <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
                            <path d="M8 19.5h8M12 15.5v4" strokeLinecap="round" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <p className="text-lg font-bold tracking-tight text-sena-text">{grupo.red}</p>
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-sena-strong">
                            <span className="inline-flex items-center gap-1.5">
                              <svg viewBox="0 0 16 16" className="size-3.5 text-sena" fill="currentColor" aria-hidden="true">
                                <path d="M2 2.5h5v5H2zm7 0h5v5H9zM2 9.5h5v5H2zm7 0h5v5H9z" />
                              </svg>
                              {lineas === 1 ? '1 línea temática' : `${lineas} líneas temáticas`}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <svg viewBox="0 0 16 16" className="size-3.5 text-sena" fill="currentColor" aria-hidden="true">
                                <path d="M3 3h4v4H3zm6 1.2 4 2.3-4 2.3zm-6 3.3h4v4H3zm6 1.2 4 2.3-4 2.3z" />
                              </svg>
                              {programas === 1 ? '1 programa' : `${programas} programas`}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <svg viewBox="0 0 16 16" className="size-3.5 text-sena" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                                <rect x="3.2" y="2.2" width="9.6" height="11.6" rx="1.4" />
                                <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" strokeLinecap="round" />
                              </svg>
                              {pendientes === 1 ? '1 pedido por revisar' : `${pendientes} pedidos por revisar`}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => abrirRed(grupo.red)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sena px-4 py-2 text-sm font-semibold text-sena transition hover:bg-sena-active-soft"
                      >
                        Ver líneas
                        <span aria-hidden="true">›</span>
                      </button>
                    </div>
                    {sePasa ? (
                      <p className="mt-4 flex items-center gap-2 rounded-xl bg-sena-active-soft px-4 py-2.5 text-sm text-sena-ok-text">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full border border-sena-ok-text text-[11px] font-bold" aria-hidden="true">
                          !
                        </span>
                        Sumando los pedidos se pasa del tope de esta red.
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
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
                    <TableHeader>Valor aprox.</TableHeader>
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
          title="Solicitud de materiales"
          description="Elige el programa y la ficha, y agrega cada material con su cantidad. Al enviar, coordinación recibe la solicitud."
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
                setLoteId('')
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

          <div className="mt-4 max-w-xs">
            <SelectField
              id="sol-lote"
              label="Lote"
              value={loteId}
              onChange={(value) => {
                setLoteId(value)
                setMaterialId('')
              }}
              placeholder="Todos los lotes"
              disabled={!programaId}
              required={false}
              options={lotes.map((lote) => ({ value: String(lote.id), label: lote.nombre }))}
            />
          </div>

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
              Agregar a la solicitud
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
                  <TableHeader>Valor aprox.</TableHeader>
                  <TableHeader>Lista maestra</TableHeader>
                  <TableHeader>Quitar</TableHeader>
                </tr>
              </thead>
              <tbody>
                {carrito.length === 0 ? (
                  <TableEmpty colSpan={5}>Todavía no hay materiales. Agrégalos a la solicitud.</TableEmpty>
                ) : (
                  carrito.map((linea) => (
                    <TableRow key={linea.material.id}>
                      <td>
                        <p className="font-semibold">{linea.material.producto}</p>
                        <p className="text-xs text-sena-text/60">{linea.material.codigoUnspsc}</p>
                      </td>
                      <td>{linea.cantidad}</td>
                      <td>
                        {linea.material.caracter === 'consumo' && linea.material.valorUnitario != null
                          ? (linea.cantidad * linea.material.valorUnitario).toLocaleString('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              maximumFractionDigits: 0,
                            })
                          : '—'}
                      </td>
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

          {carrito.length > 0 ? (
            <p className="mt-3 text-sm text-sena-text">
              Valor aproximado del pedido:{' '}
              <strong>
                {carrito
                  .filter((linea) => linea.material.caracter === 'consumo')
                  .reduce((suma, linea) => suma + linea.cantidad * (linea.material.valorUnitario ?? 0), 0)
                  .toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </strong>
              . Promedio por material:{' '}
              <strong>
                {(() => {
                  const conValor = carrito.filter(
                    (linea) => linea.material.caracter === 'consumo' && linea.material.valorUnitario != null,
                  )
                  if (!conValor.length) return '—'
                  const promedio =
                    conValor.reduce((suma, linea) => suma + (linea.material.valorUnitario ?? 0), 0) / conValor.length
                  return promedio.toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  })
                })()}
              </strong>
            </p>
          ) : null}

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
            {corteDeArea(solicitudes.filter((solicitud) => solicitud.programaId === revision.programaId)).sePasa ? (
              <p className="rounded-2xl border border-sena-warn-line bg-white px-4 py-3 text-sm text-sena-text">
                Sumando los pedidos de la red {revision.programa?.redConocimiento?.nombre ?? 'esta red'} da{' '}
                {pesos(corteDeArea(solicitudes.filter((solicitud) => solicitud.programaId === revision.programaId)).suma)}
                . El tope asignado es{' '}
                {pesos(corteDeArea(solicitudes.filter((solicitud) => solicitud.programaId === revision.programaId)).tope)}
                . Ajusta las cantidades.
              </p>
            ) : null}
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
                  pedida: String(item.cantidadSolicitada),
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
                      {item.material?.caracter === 'consumo' && item.material.valorUnitario != null
                        ? ` · ${item.material.valorUnitario.toLocaleString('es-CO')} c/u`
                        : ''}
                    </p>
                    {pideMas ? (
                      <p className="mt-1 text-sm text-sena-warn-text">
                        Pidió más de la lista maestra. Puedes autorizar menos y dejar el resto pendiente.
                      </p>
                    ) : null}
                    <div className="mt-3 max-w-[14rem]">
                      <TextField
                        id={`ped-${item.id}`}
                        label="Cantidad pedida"
                        type="number"
                        min={0.001}
                        step="0.001"
                        value={decision.pedida || String(item.cantidadSolicitada)}
                        onChange={(event) => patchDecision(item.id, { pedida: event.target.value })}
                      />
                    </div>
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
              <Button
                type="button"
                variant="secondary"
                disabled={saving || resumenRevision.length === 0}
                onClick={() => void guardarCantidades()}
              >
                Guardar cantidades
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
                  {item.material?.caracter === 'consumo' && item.material.valorUnitario != null
                    ? ` · ${item.material.valorUnitario.toLocaleString('es-CO')} c/u · total ${(
                        item.cantidadSolicitada * item.material.valorUnitario
                      ).toLocaleString('es-CO')}`
                    : ''}
                  {item.material?.lote ? ` · lote ${item.material.lote.nombre}` : ''}
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
