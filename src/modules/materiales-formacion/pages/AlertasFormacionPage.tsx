import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { ErrorBanner, PageHeader, TableCard, TableLoading } from '@/shared/components/DataTable'
import { AlertIcon, HomeIcon } from '@/shared/components/icons/AppIcons'
import { ApiError } from '@/shared/lib/api'
import { cn } from '@/shared/lib/cn'
import { getVigencias } from '@/modules/vigencias/data/vigencia'
import { api } from '@/shared/lib/api'

type TipoAlertaFormacion = 'se_pasa' | 'cerca'

type AlertaFormacion = {
  programaId: number
  nombre: string
  codigo: string | null
  anio: number
  asignado: number
  pedido: number
  tipo: TipoAlertaFormacion
}

const ESTILO: Record<TipoAlertaFormacion, { label: string; chip: string; barra: string; texto: string }> = {
  se_pasa: {
    label: 'Se pasa',
    chip: 'bg-sena-danger-soft text-sena-danger-text ring-sena-danger-line',
    barra: 'bg-sena-danger-text',
    texto: 'text-sena-danger-text',
  },
  cerca: {
    label: 'Cerca del tope',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    barra: 'bg-amber-400',
    texto: 'text-amber-700',
  },
}

function pesos(valor: number) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

function getAlertasFormacion(anio: number) {
  return api<AlertaFormacion[]>(`/presupuesto-formacion/alertas?anio=${anio}`)
}

export default function AlertasFormacionPage() {
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [alertas, setAlertas] = useState<AlertaFormacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nivel, setNivel] = useState<'todas' | TipoAlertaFormacion>('todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    document.title = 'Alertas de formación | SENA'
    getVigencias()
      .then((lista) => {
        const activa = lista.find((item) => item.activa)
        if (activa) setAnio(activa.anio)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    getAlertasFormacion(anio)
      .then((lista) => {
        if (!cancelado) setAlertas(lista)
      })
      .catch((caught) => {
        if (!cancelado) {
          setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar las alertas.')
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [anio])

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return alertas.filter((alerta) => {
      const coincideNivel = nivel === 'todas' || alerta.tipo === nivel
      const coincideTexto =
        !texto || `${alerta.nombre} ${alerta.codigo ?? ''}`.toLowerCase().includes(texto)
      return coincideNivel && coincideTexto
    })
  }, [alertas, nivel, busqueda])

  const sePasan = alertas.filter((alerta) => alerta.tipo === 'se_pasa').length
  const cerca = alertas.filter((alerta) => alerta.tipo === 'cerca').length

  return (
    <AppLayout title="Alertas">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-sena-text-soft">
        <HomeIcon className="size-4" />
        <Link to="/formacion/solicitudes" className="hover:text-sena-strong">
          Materiales de formación
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-sena-strong">Alertas</span>
      </div>

      <PageHeader
        icon={<AlertIcon />}
        title="Alertas"
        description="Áreas cuyos pedidos de materiales, sumados, se acercan o se pasan del presupuesto que asignaste."
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      <div className="flex flex-col gap-6">
        <section aria-label="Resumen de alertas" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Resumen
            label="Se pasan"
            ayuda="La suma supera lo asignado al área"
            count={sePasan}
            barra="bg-sena-danger-text"
            numero="text-sena-danger-text"
            onClick={() => setNivel('se_pasa')}
          />
          <Resumen
            label="Cerca del tope"
            ayuda="Van en el 80 % o más del área"
            count={cerca}
            barra="bg-amber-400"
            numero="text-amber-700"
            onClick={() => setNivel('cerca')}
          />
          <Resumen
            label="En alerta"
            ayuda={`Vigencia ${anio}`}
            count={alertas.length}
            barra="bg-sena"
            numero="text-sena-ok-text"
            onClick={() => setNivel('todas')}
          />
        </section>

        <TableCard>
          <div className="border-b border-sena-hairline p-4 sm:p-6">
            <input
              className="h-10 w-full max-w-md rounded-xl border border-sena-line bg-white px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/15"
              placeholder="Buscar área"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
          {loading ? (
            <TableLoading label="Cargando alertas…" />
          ) : filtradas.length ? (
            <ul className="divide-y divide-sena-line-soft px-2 sm:px-4">
              {filtradas.map((alerta) => (
                <li key={alerta.programaId}>
                  <AlertaFila alerta={alerta} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid place-items-center px-6 py-16 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-sena-active-soft text-sena-ok-text">
                <AlertIcon className="size-6" />
              </span>
              <p className="mt-3 text-sm font-semibold text-sena-text">Las áreas están dentro del presupuesto</p>
              <p className="mt-1 text-xs text-sena-text-soft">Ningún pedido sumado se pasa ni se acerca al tope.</p>
            </div>
          )}
        </TableCard>
      </div>
    </AppLayout>
  )
}

function AlertaFila({ alerta }: { alerta: AlertaFormacion }) {
  const estilo = ESTILO[alerta.tipo]
  const porcentaje = alerta.asignado > 0 ? Math.min(100, Math.round((alerta.pedido / alerta.asignado) * 100)) : 100
  const exceso = Math.max(0, alerta.pedido - alerta.asignado)

  return (
    <Link
      to="/formacion/solicitudes"
      className="group flex items-center gap-3 rounded-xl px-3 py-4 transition hover:bg-sena-surface sm:gap-4"
    >
      <span aria-hidden="true" className={cn('hidden size-10 shrink-0 place-items-center rounded-xl ring-1 sm:grid', estilo.chip)}>
        <AlertIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-sena-text">{alerta.nombre}</p>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', estilo.chip)}>
            {estilo.label}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-sena-text-soft">
          {alerta.codigo ? `${alerta.codigo} · ` : ''}
          Sumando los pedidos van {pesos(alerta.pedido)}. El tope del área es {pesos(alerta.asignado)}.
        </p>
        <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-sena-muted">
          <div className={cn('h-full rounded-full', estilo.barra)} style={{ width: `${Math.max(porcentaje, 4)}%` }} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-sena-text tabular-nums">{pesos(alerta.pedido)}</p>
        <p className={cn('text-xs font-semibold', estilo.texto)}>
          {exceso > 0 ? `Se pasa por ${pesos(exceso)}` : `Quedan ${pesos(alerta.asignado - alerta.pedido)}`}
        </p>
      </div>
      <span aria-hidden="true" className="shrink-0 text-lg text-sena-text-soft">›</span>
    </Link>
  )
}

function Resumen({
  label,
  ayuda,
  count,
  barra,
  numero,
  onClick,
}: {
  label: string
  ayuda: string
  count: number
  barra: string
  numero: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-sena-line bg-white p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1.5', barra)} />
      <span className="min-w-0">
        <span className="block text-xs font-medium text-sena-text-soft">{label}</span>
        <strong className={cn('block text-2xl leading-tight tabular-nums', numero)}>{count}</strong>
        <span className="block truncate text-[11px] text-sena-text-soft">{ayuda}</span>
      </span>
    </button>
  )
}
