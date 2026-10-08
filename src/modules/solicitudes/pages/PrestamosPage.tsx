import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/shared/lib/api'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import Toast from '@/shared/components/ui/Toast'
import {
  ActionButton,
  ErrorBanner,
  PageHeader,
  SearchInput,
  TableCard,
  TableLoading,
} from '@/shared/components/DataTable'
import {
  AlertIcon,
  CalendarIcon,
  EyeIcon,
  InventoryIcon,
  ReturnIcon,
  UserIcon,
} from '@/shared/components/icons/AppIcons'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/modules/auth/context/auth'
import { useNotifications } from '@/modules/notificaciones/context/notifications'

import BarraVista from '@/modules/solicitudes/components/BarraVista'
import CampoPlazo from '@/modules/solicitudes/components/CampoPlazo'
import FacturaDetail from '@/modules/solicitudes/components/FacturaDetail'
import PlazoPill from '@/modules/solicitudes/components/PlazoPill'
import { ajustarPlazo, getPrestamos, type VistaPrestamos } from '@/modules/solicitudes/data/solicitudes'
import {
  formatDay,
  formatFechaDia,
  personName,
  plazoInicial,
} from '@/modules/solicitudes/lib/presentacion'

import type { FacturaApi } from '@/modules/solicitudes/types'

const VISTAS: { id: VistaPrestamos; label: string }[] = [
  { id: 'afuera', label: 'Con equipo afuera' },
  { id: 'vencidos', label: 'Vencidos' },
  { id: 'devueltos', label: 'Devueltos' },
  { id: 'todos', label: 'Todos' },
]

const VACIO: Record<VistaPrestamos, string> = {
  afuera: 'Nadie tiene equipo afuera.',
  vencidos: 'No hay préstamos vencidos ni que venzan hoy.',
  devueltos: 'Todavía no hay préstamos devueltos por completo.',
  todos: 'Todavía no se ha prestado equipo.',
}

type Persona = {
  id: number
  nombre: string
  email: string
  pedidos: FacturaApi[]
  afuera: number
  vencidos: number
  vencenHoy: number
}

function afueraDe(factura: FacturaApi) {
  return factura.detalle.reduce((total, fila) => total + (fila.cantidadAfuera ?? 0), 0)
}

function iniciales(nombre: string) {
  return (
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('') || '—'
  )
}

/* Primera vez que salió algo del pedido. */
function entregadoEl(factura: FacturaApi) {
  return (
    factura.detalle
      .map((fila) => fila.fechaEntrega)
      .filter((fecha): fecha is string => Boolean(fecha))
      .sort()[0] ?? null
  )
}

function textoDe(factura: FacturaApi) {
  return [
    factura.codigoSolicitud,
    personName(factura.usuario),
    factura.usuario?.email ?? '',
    factura.obra?.nombre ?? '',
    ...factura.detalle.map((fila) => `${fila.elemento?.nombre ?? ''} ${fila.elemento?.codigo ?? ''}`),
  ]
    .join(' ')
    .toLowerCase()
}

/*
 * Entregas y devoluciones (bodega): quién tiene qué afuera, qué volvió y qué
 * está vencido, agrupado por persona. Sirve para decidir antes de volver a
 * prestarle a alguien que no ha devuelto.
 */
export default function PrestamosPage() {
  const { user, isAdmin } = useAuth()
  const permisos = user?.permissions ?? []
  const puede =
    !isAdmin &&
    (permisos.includes('solicitud_equipo.devolver') || permisos.includes('solicitud_equipo.entregar'))
  const puedeRecibir = !isAdmin && permisos.includes('solicitud_equipo.devolver')
  const puedeAjustar = !isAdmin && permisos.includes('solicitud_equipo.entregar')

  if (!puede) {
    return <Navigate to="/inventario/solicitudes" replace />
  }

  return <Prestamos puedeRecibir={puedeRecibir} puedeAjustar={puedeAjustar} />
}

function Prestamos({ puedeRecibir, puedeAjustar }: { puedeRecibir: boolean; puedeAjustar: boolean }) {
  const { lastArrival } = useNotifications()
  const [searchParams] = useSearchParams()
  const pedida = searchParams.get('vista')
  const [vista, setVista] = useState<VistaPrestamos>(() =>
    VISTAS.some((row) => row.id === pedida) ? (pedida as VistaPrestamos) : 'afuera',
  )
  const [search, setSearch] = useState(() => searchParams.get('buscar') ?? '')
  const [facturas, setFacturas] = useState<FacturaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [detalle, setDetalle] = useState<FacturaApi | null>(null)
  const [plazoDe, setPlazoDe] = useState<FacturaApi | null>(null)

  // Se vuelve a pedir al cambiar de vista, al guardar un plazo y con cada aviso
  // nuevo (entrega, devolución o vencimiento): cualquiera puede cambiar la lista.
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let vigente = true

    getPrestamos(vista)
      .then((rows) => {
        if (!vigente) return
        setFacturas(rows)
        setError('')
      })
      .catch((cause: unknown) => {
        if (!vigente) return
        setError(cause instanceof ApiError ? cause.message : 'No se pudieron cargar los préstamos.')
      })
      .finally(() => {
        if (vigente) setLoading(false)
      })

    return () => {
      vigente = false
    }
  }, [vista, recarga, lastArrival])

  const personas = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const grupos = new Map<number, Persona>()

    for (const factura of facturas) {
      if (needle && !textoDe(factura).includes(needle)) continue

      const id = factura.usuario?.id ?? factura.idUsuario
      const grupo = grupos.get(id) ?? {
        id,
        nombre: personName(factura.usuario) || 'Sin nombre',
        email: factura.usuario?.email ?? '',
        pedidos: [],
        afuera: 0,
        vencidos: 0,
        vencenHoy: 0,
      }

      grupo.pedidos.push(factura)
      grupo.afuera += afueraDe(factura)
      grupo.vencidos += factura.plazo === 'vencido' ? 1 : 0
      grupo.vencenHoy += factura.plazo === 'vence_hoy' ? 1 : 0
      grupos.set(id, grupo)
    }

    // Primero quien tiene algo vencido, luego quien tiene más afuera.
    return [...grupos.values()].sort(
      (a, b) =>
        b.vencidos - a.vencidos ||
        b.vencenHoy - a.vencenHoy ||
        b.afuera - a.afuera ||
        a.nombre.localeCompare(b.nombre, 'es'),
    )
  }, [facturas, search])

  const resumen = useMemo(
    () => ({
      personas: personas.filter((row) => row.afuera > 0).length,
      unidades: personas.reduce((total, row) => total + row.afuera, 0),
      vencidos: personas.reduce((total, row) => total + row.vencidos + row.vencenHoy, 0),
    }),
    [personas],
  )

  const guardarPlazo = async (codigo: string, fecha: string) => {
    const factura = await ajustarPlazo(codigo, fecha)
    setPlazoDe(null)
    setToast(
      `Solicitud ${factura.codigoSolicitud}: debe volver a más tardar el ${formatFechaDia(factura.fechaDevolucionLimite)}.`,
    )
    setRecarga((n) => n + 1)
  }

  return (
    <AppLayout title="Entregas y devoluciones">
      <PageHeader
        icon={<CalendarIcon />}
        title="Entregas y devoluciones"
        description="Quién tiene equipo afuera, qué ya volvió y qué está vencido. Antes de prestarle otra vez a alguien, revisa si tiene algo sin devolver."
      />

      {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

      <BarraVista
        pestanas={VISTAS}
        activa={vista}
        onCambiar={(id) => {
          setLoading(true)
          setVista(id)
        }}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por persona, código, obra o elemento..."
        />
      </BarraVista>

      {!loading && vista !== 'devueltos' ? (
        <section aria-label="Resumen" className="mb-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
          <Resumen icono={<UserIcon />} valor={resumen.personas} etiqueta="Personas con equipo afuera" />
          <Resumen icono={<InventoryIcon />} valor={resumen.unidades} etiqueta="Unidades afuera" />
          <Resumen
            icono={<AlertIcon />}
            valor={resumen.vencidos}
            etiqueta="Pedidos vencidos o que vencen hoy"
            alerta={resumen.vencidos > 0}
          />
        </section>
      ) : null}

      {loading ? (
        <TableCard>
          <TableLoading label="Cargando préstamos..." />
        </TableCard>
      ) : personas.length === 0 ? (
        <TableCard>
          <TableLoading label={search.trim() ? 'No se encontraron préstamos.' : VACIO[vista]} />
        </TableCard>
      ) : (
        <div className="space-y-6">
          {personas.map((persona) => (
            <TableCard key={persona.id}>
              <header className="flex flex-col gap-4 border-b border-sena-hairline bg-white/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    aria-hidden="true"
                    className={
                      persona.vencidos > 0
                        ? 'grid size-11 shrink-0 place-items-center rounded-full bg-sena-danger-soft text-sm font-bold text-sena-danger-text ring-1 ring-sena-danger-line'
                        : 'grid size-11 shrink-0 place-items-center rounded-full bg-sena-soft text-sm font-bold text-sena-dark ring-1 ring-sena-line'
                    }
                  >
                    {iniciales(persona.nombre)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-sena-text">{persona.nombre}</h2>
                    <p className="mt-0.5 truncate text-xs text-sena-text-soft">
                      {persona.email ? `${persona.email} · ` : ''}
                      {persona.pedidos.length === 1 ? '1 pedido' : `${persona.pedidos.length} pedidos`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
                  {persona.vencidos > 0 ? (
                    <Insignia tono="danger">
                      {persona.vencidos === 1 ? '1 vencido' : `${persona.vencidos} vencidos`}
                    </Insignia>
                  ) : null}
                  {persona.vencenHoy > 0 ? (
                    <Insignia tono="warn">
                      {persona.vencenHoy === 1 ? '1 vence hoy' : `${persona.vencenHoy} vencen hoy`}
                    </Insignia>
                  ) : null}
                  <Insignia>
                    {persona.afuera > 0
                      ? `${persona.afuera} ${persona.afuera === 1 ? 'unidad afuera' : 'unidades afuera'}`
                      : 'Todo devuelto'}
                  </Insignia>
                </div>
              </header>

              <ul className="divide-y divide-sena-hairline">
                {persona.pedidos.map((factura) => (
                  <Pedido
                    key={factura.codigoSolicitud}
                    factura={factura}
                    puedeRecibir={puedeRecibir}
                    puedeAjustar={puedeAjustar}
                    onVer={() => setDetalle(factura)}
                    onPlazo={() => setPlazoDe(factura)}
                  />
                ))}
              </ul>
            </TableCard>
          ))}
        </div>
      )}

      {detalle ? <FacturaDetail factura={detalle} onClose={() => setDetalle(null)} /> : null}

      {plazoDe ? (
        <PlazoModal factura={plazoDe} onClose={() => setPlazoDe(null)} onSave={guardarPlazo} />
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}
    </AppLayout>
  )
}

function Resumen({
  icono,
  valor,
  etiqueta,
  alerta = false,
}: {
  icono: ReactNode
  valor: number
  etiqueta: string
  alerta?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[22px] border px-6 py-5',
        alerta
          ? 'border-sena-danger-line bg-sena-danger-soft/70'
          : 'border-glass-line bg-glass-strong shadow-hairline backdrop-blur-glass-sm',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-2xl [&>svg]:size-5',
          alerta ? 'bg-white/70 text-sena-danger-text' : 'bg-sena-soft text-sena',
        )}
      >
        {icono}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            'text-2xl leading-tight font-bold tabular-nums',
            alerta ? 'text-sena-danger-text' : 'text-sena-text',
          )}
        >
          {valor}
        </p>
        <p className="mt-0.5 text-sm text-sena-text-soft">{etiqueta}</p>
      </div>
    </div>
  )
}

function Insignia({ children, tono }: { children: ReactNode; tono?: 'danger' | 'warn' }) {
  return (
    <span
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-semibold tabular-nums',
        tono === 'danger' && 'border-sena-danger-line bg-sena-danger-soft text-sena-danger-text',
        tono === 'warn' && 'border-sena-warn-line bg-sena-warn-soft text-sena-warn-text',
        !tono && 'border-sena-line bg-white/70 text-sena-dark',
      )}
    >
      {children}
    </span>
  )
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-bold tracking-[0.1em] text-sena-text-soft uppercase">{termino}</dt>
      <dd className="mt-1 text-sm font-medium text-sena-text">{valor}</dd>
    </div>
  )
}

function Pedido({
  factura,
  puedeRecibir,
  puedeAjustar,
  onVer,
  onPlazo,
}: {
  factura: FacturaApi
  puedeRecibir: boolean
  puedeAjustar: boolean
  onVer: () => void
  onPlazo: () => void
}) {
  const afuera = afueraDe(factura)
  const entregado = entregadoEl(factura)

  return (
    <li className="px-6 py-6 sm:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <p className="text-base font-semibold text-sena-text">
            {factura.codigoSolicitud}
            {factura.obra ? (
              <span className="font-normal text-sena-text-soft"> · {factura.obra.nombre}</span>
            ) : null}
          </p>

          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
            <Dato termino="Entregado" valor={entregado ? formatDay(entregado) : 'Sin entregar'} />
            {factura.fechaInicio ? <Dato termino="Inicio" valor={formatFechaDia(factura.fechaInicio)} /> : null}
            {factura.fechaDevolucionLimite ? (
              <Dato termino="Debe volver" valor={formatFechaDia(factura.fechaDevolucionLimite)} />
            ) : factura.fechaDevolucionPropuesta ? (
              <Dato termino="Propuso devolver" valor={formatFechaDia(factura.fechaDevolucionPropuesta)} />
            ) : null}
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
          {factura.plazo ? <PlazoPill plazo={factura.plazo} limite={factura.fechaDevolucionLimite} /> : null}
          <div className="flex items-center gap-1 rounded-xl border border-sena-line bg-white/70 p-1">
            <ActionButton title="Ver solicitud" onClick={onVer}>
              <EyeIcon className="size-5" />
            </ActionButton>
            {afuera > 0 && puedeAjustar ? (
              <ActionButton title="Cambiar la fecha límite" onClick={onPlazo}>
                <CalendarIcon className="size-5" />
              </ActionButton>
            ) : null}
            {afuera > 0 && puedeRecibir ? (
              <Link
                to={`/inventario/solicitudes/equipo?vista=devolver&buscar=${encodeURIComponent(factura.codigoSolicitud)}`}
                title="Recibir devolución"
                aria-label="Recibir devolución"
                className="grid size-10 place-items-center rounded-lg text-sena-dark transition duration-150 hover:text-sena focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena"
              >
                <ReturnIcon className="size-5" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2.5">
        {factura.detalle
          .filter((fila) => fila.cantidadEntregada > 0)
          .map((fila) => {
            const fuera = fila.cantidadAfuera ?? 0
            const devuelta = fila.cantidadDevuelta ?? 0

            return (
              <li
                key={fila.id}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs',
                  fuera > 0
                    ? 'border-sena-line bg-white/85'
                    : 'border-sena-hairline bg-sena-muted/45 text-sena-text-soft',
                )}
              >
                <span className="font-semibold text-sena-text">{fila.elemento?.nombre ?? '—'}</span>
                <span className="rounded-md bg-sena-veil px-1.5 py-0.5 font-semibold text-sena-strong tabular-nums">
                  {fuera > 0 ? `${fuera} afuera` : 'devuelto'}
                </span>
                {devuelta > 0 && fuera > 0 ? (
                  <span className="tabular-nums text-sena-text-soft">{devuelta} devueltos</span>
                ) : null}
              </li>
            )
          })}
      </ul>
    </li>
  )
}

function PlazoModal({
  factura,
  onClose,
  onSave,
}: {
  factura: FacturaApi
  onClose: () => void
  onSave: (codigo: string, fecha: string) => Promise<void>
}) {
  const [fecha, setFecha] = useState(() =>
    plazoInicial(factura.fechaDevolucionLimite, factura.fechaDevolucionPropuesta),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    if (!fecha) {
      setError('Elige la nueva fecha límite.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await onSave(factura.codigoSolicitud, fecha)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo cambiar el plazo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Cambiar la fecha límite"
      description={`Solicitud ${factura.codigoSolicitud} de ${personName(factura.usuario)}.`}
      onClose={onClose}
    >
      <div className="space-y-5">
        {error ? <ErrorBanner message={error} onClose={() => setError('')} /> : null}

        {factura.fechaDevolucionLimite ? (
          <p className="rounded-2xl bg-sena-soft px-4 py-3 text-sm leading-6 text-sena-dark">
            Hoy debe volver el <strong>{formatFechaDia(factura.fechaDevolucionLimite)}</strong>. La
            fecha nueva aplica a todo lo que sigue afuera de este pedido.
          </p>
        ) : null}

        <CampoPlazo
          id="plazo-nuevo"
          value={fecha}
          onChange={setFecha}
          propuesta={factura.fechaDevolucionPropuesta}
          invalido={Boolean(error) && !fecha}
          label="Nueva fecha límite"
        />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => void guardar()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar fecha'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
