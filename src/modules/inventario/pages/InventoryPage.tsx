import { useCallback, useEffect, useMemo, useState, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { ErrorBanner } from '@/shared/components/DataTable'
import { ApiError } from '@/shared/lib/api'
import { getBodegas } from '@/modules/inventario/data/bodega'
import { getAllCategorias, getSubcategorias } from '@/modules/inventario/data/categoria'
import { getAllItems } from '@/modules/inventario/data/item'
import { getElementos } from '@/modules/inventario/data/elemento'
import { useInventoryAccess } from '@/modules/inventario/useInventoryAccess'
import type { ItemApi } from '@/modules/inventario/types/item'
import type { ElementoApi } from '@/modules/inventario/types/elemento'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'
import type { BodegaApi } from '@/modules/inventario/types/bodega'

/* =====================================================================
 * Vista previa local (solo desarrollo).
 * Se activa con VITE_INVENTORY_PREVIEW=true en .env.local (git-ignorado).
 * La guarda `import.meta.env.DEV` impide que jamás se active en producción.
 * Los datos DEMO están aislados y marcados; fuera de este modo todo viene
 * de la API real y un error de conexión jamás se sustituye por cifras.
 * ===================================================================== */
const PREVIEW =
  import.meta.env.DEV === true && import.meta.env.VITE_INVENTORY_PREVIEW === 'true'

const number = new Intl.NumberFormat('es-CO')

function pct(part: number, total: number) {
  if (!total) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

/* ---------- Iconos vectoriales locales (misma familia: trazo 1.8, 24px) ---------- */
type P = SVGProps<SVGSVGElement>
function Base({ children, ...props }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}
const IBox = (p: P) => (
  <Base {...p}>
    <path d="M3.8 8.2 12 4.2l8.2 4" />
    <path d="M3.8 8.2v7.6L12 20l8.2-4.2V8.2" />
    <path d="M12 12.2V20" />
    <path d="m7.5 10.2 4.5 2.2 4.5-2.2" />
  </Base>
)
const ICheck = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="m8.5 12.2 2.4 2.4 4.6-5" />
  </Base>
)
const IClip = (p: P) => (
  <Base {...p}>
    <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
    <path d="M9 4.5V3.2A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 3.2v1.3M9 11h6M9 15h4" />
  </Base>
)
const IWrench = (p: P) => (
  <Base {...p}>
    <path d="M14.5 6.5a3.5 3.5 0 0 0-4.6 4.2L4 16.6 7.4 20l5.9-5.9a3.5 3.5 0 0 0 4.2-4.6L14.8 12l-2.8-2.8z" />
  </Base>
)
const IGrid = (p: P) => (
  <Base {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Base>
)
const IMove = (p: P) => (
  <Base {...p}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </Base>
)
const ISearch = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-3.5-3.5" />
  </Base>
)
const IReport = (p: P) => (
  <Base {...p}>
    <path d="M8 3.8h6.2L20 9.6V19a1.8 1.8 0 0 1-1.8 1.8H8A1.8 1.8 0 0 1 6.2 19V5.6A1.8 1.8 0 0 1 8 3.8Z" />
    <path d="M14.2 3.8V9h5.6M9.2 13.2h5.6M9.2 16.6h3.6" />
  </Base>
)
const IPlus = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)
const ICal = (p: P) => (
  <Base {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
    <path d="M8 3.8v3.4M16 3.8v3.4M4 10.5h16" />
  </Base>
)
const IChart = (p: P) => (
  <Base {...p}>
    <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" />
  </Base>
)
const IDonut = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.2" />
  </Base>
)
const IPie = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 12V4.2A7.8 7.8 0 0 1 19.8 12Z" />
  </Base>
)
const IHBar = (p: P) => (
  <Base {...p}>
    <path d="M4 7h11M4 12h16M4 17h8" />
  </Base>
)
const IVBar = (p: P) => (
  <Base {...p}>
    <path d="M4 20h16M7 20v-5M12 20V6M17 20v-9" />
  </Base>
)

/* ---------- Conjunto DEMO aislado (vista previa). Cifras solo visuales ---------- */
const DEMO = {
  indicators: [
    { label: 'Total de bienes', value: 12548, delta: '↑ 3.2% vs. mes anterior' },
    { label: 'Bienes disponibles', value: 8742, delta: '↑ 1.8% vs. mes anterior' },
    { label: 'En asignación', value: 2361, delta: '↓ 0.6% vs. mes anterior' },
    { label: 'En mantenimiento', value: 445, delta: '↓ 2.1% vs. mes anterior' },
  ],
  states: [
    { label: 'Disponible', value: 8742, color: '#00a651' },
    { label: 'En asignación', value: 2361, color: '#f7931e' },
    { label: 'En mantenimiento', value: 445, color: '#e53935' },
    { label: 'Dados de baja', value: 1000, color: '#9aa5a1' },
  ],
  bars: [
    { label: 'Equipos tecnológicos', value: 4210 },
    { label: 'Mobiliario', value: 3142 },
    { label: 'Herramientas', value: 2351 },
    { label: 'Material de papelería', value: 1942 },
    { label: 'Otros', value: 903 },
  ],
  movements: [
    { fecha: '15 Abr 2025', tipo: 'Entrada', bien: 'Computador portátil', ubicacion: 'Bodega Principal', responsable: 'Alex Torres', estado: 'Completado' },
    { fecha: '12 Abr 2025', tipo: 'Salida', bien: 'Proyector Epson', ubicacion: 'Aula 102', responsable: 'Luis Pérez', estado: 'Completado' },
    { fecha: '10 Abr 2025', tipo: 'Traslado', bien: 'Escritorio', ubicacion: 'Bodega → Aula 5', responsable: 'Laura Gómez', estado: 'Completado' },
    { fecha: '07 Abr 2025', tipo: 'Mantenimiento', bien: 'Impresora multifuncional', ubicacion: 'Taller de mantenimiento', responsable: 'Carlos Ruiz', estado: 'En proceso' },
    { fecha: '01 Abr 2025', tipo: 'Baja', bien: 'Silla ergonómica', ubicacion: 'Bodega Principal', responsable: 'Diana Castro', estado: 'Completado' },
  ],
}

const STATE_PILL: Record<string, string> = {
  Completado: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'En proceso': 'bg-amber-50 text-amber-700 ring-amber-200',
  Pendiente: 'bg-slate-100 text-slate-600 ring-slate-200',
  Activo: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Inactivo: 'bg-slate-100 text-slate-600 ring-slate-200',
}

type CategoryGroup = { id: string; nombre: string; elementos: number; unidades: number }

/* Agrupa un elemento en su categoría real.
 * Vía 1: el ítem enlazado (idItem → subcategoría → idCategoria).
 * Vía 2: la subcategoría propia del elemento (idSubcategoria → catálogo).
 * Sin relación resoluble: un único cubo compartido "Sin categoría"
 * (nunca un cubo por elemento y nunca el nombre de una subcategoría
 * presentado como categoría). Cada elemento se cuenta una sola vez. */
function categoryOfElemento(
  item: ElementoApi,
  itemById: Map<number, ItemApi>,
  subById: Map<number, SubcategoryApi>,
  categories: CategoryApi[],
) {
  const linked = item.idItem != null ? itemById.get(item.idItem) : undefined
  const idCategoria =
    linked?.subcategoria?.idCategoria ??
    subById.get(item.idSubcategoria)?.idCategoria ??
    0
  if (!idCategoria) return { id: 'sin-categoria', nombre: 'Sin categoría' }
  const nombre =
    categories.find((c) => c.id === idCategoria)?.nombre ??
    linked?.subcategoria?.categoria?.nombre ??
    `Categoría ${idCategoria}`
  return { id: String(idCategoria), nombre }
}

export default function InventoryPage() {
  const { screens, permit } = useInventoryAccess()
  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [items, setItems] = useState<ItemApi[]>([])
  const [categories, setCategories] = useState<CategoryApi[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryApi[]>([])
  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [loading, setLoading] = useState(!PREVIEW)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [chart, setChart] = useState<'dona' | 'torta' | 'hbar' | 'vbar'>('dona')

  const CHART_OPTS = [
    { key: 'dona', label: 'Dona', title: 'Gráfica de dona', icon: IDonut },
    { key: 'torta', label: 'Torta', title: 'Gráfica de torta', icon: IPie },
    { key: 'hbar', label: 'Barras', title: 'Barras horizontales', icon: IHBar },
    { key: 'vbar', label: 'Columnas', title: 'Barras verticales', icon: IVBar },
  ] as const

  const load = useCallback(async () => {
    if (PREVIEW) return
    setLoading(true)
    setError(null)
    try {
      const [elementoData, itemData, categoryData, subcategoryData, bodegaData] = await Promise.all([
        getElementos(),
        getAllItems(),
        getAllCategorias().catch((caught: unknown) => {
          if (caught instanceof ApiError && caught.status === 403) return []
          throw caught
        }),
        getSubcategorias().catch((caught: unknown) => {
          if (caught instanceof ApiError && caught.status === 403) return []
          throw caught
        }),
        getBodegas().catch((caught: unknown) => {
          if (caught instanceof ApiError && (caught.status === 403 || caught.status === 404)) return []
          throw caught
        }),
      ])
      setElementos(elementoData)
      setItems(itemData)
      setCategories(categoryData)
      setSubcategories(subcategoryData)
      setBodegas(bodegaData)
    } catch {
      // Mensaje integrado y genérico: nunca SQL ni tecnicismos crudos.
      setError('No se pudo conectar con el inventario. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Inventario | SENA'
    void load()
  }, [load, attempt])

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const subById = useMemo(() => new Map(subcategories.map((s) => [s.id, s])), [subcategories])

  /* Métricas reales con semántica explícita:
   * - total / activos / inactivos: cantidad de REGISTROS (elementos).
   * - unidades: suma de UNIDADES FÍSICAS (campo cantidad).
   * - groups: por grupo, elementos (registros) y unidades (Σ cantidad). */
  const real = useMemo(() => {
    const total = elementos.length
    const unidades = elementos.reduce(
      (s, r) => s + (Number.isFinite(r.cantidad) ? r.cantidad : 0),
      0,
    )
    const activos = elementos.filter((r) => r.estado).length
    const map = new Map<string, CategoryGroup>()
    for (const row of elementos) {
      const { id, nombre } = categoryOfElemento(row, itemById, subById, categories)
      const cur = map.get(id) ?? { id, nombre, elementos: 0, unidades: 0 }
      cur.elementos += 1
      cur.unidades += Number.isFinite(row.cantidad) ? row.cantidad : 0
      map.set(id, cur)
    }
    const groups = [...map.values()].sort((a, b) => b.unidades - a.unidades)
    return { total, unidades, activos, inactivos: total - activos, groups }
  }, [elementos, itemById, subById, categories])

  /* ---- Datos que alimentan las gráficas (demo coherente o API real) ---- */
  const total = PREVIEW ? 12548 : real.total
  /* Denominador de los % por categoría: unidades físicas, no registros.
   * En demo ambas cifras coinciden (12.548), así que se conserva la coherencia. */
  const unitTotal = PREVIEW ? 12548 : real.unidades
  /* Fallo de carga real: los datos están ausentes, no en cero.
   * Con error nunca se muestran cantidades ni estados vacíos de éxito. */
  const failed = error != null && !PREVIEW
  const states = useMemo(
    () =>
      PREVIEW
        ? DEMO.states
        : [
            { label: 'Activos', value: real.activos, color: '#00a651' },
            { label: 'Inactivos', value: real.inactivos, color: '#9aa5a1' },
          ],
    [real.activos, real.inactivos],
  )
  const bars = PREVIEW ? DEMO.bars : real.groups.slice(0, 5).map((g) => ({ label: g.nombre, value: g.unidades }))
  const catCards = PREVIEW
    ? DEMO.bars.map((b) => ({ nombre: b.label, cantidad: b.value }))
    : real.groups.slice(0, 5).map((g) => ({ nombre: g.nombre, cantidad: g.unidades }))
  const maxBar = bars[0]?.value ?? 0

  const donut = useMemo(() => {
    const R = 52
    const C = 2 * Math.PI * R
    const { segs } = states.reduce<{
      segs: Array<(typeof states)[number] & { dash: number; offset: number }>
      start: number
    }>(
      (acc, s) => {
        const frac = total ? s.value / total : 0
        return {
          segs: [...acc.segs, { ...s, dash: C * frac, offset: -acc.start * C }],
          start: acc.start + frac,
        }
      },
      { segs: [], start: 0 },
    )
    return { R, C, segs }
  }, [states, total])

  const byTo = useMemo(() => new Map(screens.map((s) => [s.to, s])), [screens])
  const canCreateElemento = PREVIEW ? true : permit('elemento.crear', 'elementos', 'create')
  const canViewElementos = PREVIEW ? true : byTo.has('/inventario/elementos')
  const quickLinks = [
    {
      icon: <IPlus className="size-5" />,
      title: 'Registrar bien',
      desc: canCreateElemento ? 'Crear un elemento del stock' : 'Sin permiso de creación',
      to: '/inventario/elementos' as const,
      enabled: canCreateElemento && canViewElementos,
    },
    {
      icon: <IMove className="size-5" />,
      title: 'Registrar movimiento',
      desc: 'Sin ruta real disponible',
      to: null,
      enabled: false,
    },
    {
      icon: <ISearch className="size-5" />,
      title: 'Consultar inventario',
      desc: 'Elementos e ítems del centro',
      to: '/inventario/elementos' as const,
      enabled: canViewElementos,
    },
    {
      icon: <IReport className="size-5" />,
      title: 'Generar reporte',
      desc: 'Informes del sistema',
      to: '/reportes' as const,
      enabled: true,
    },
  ]

  const indicators = PREVIEW
    ? DEMO.indicators.map((d, i) => ({ ...d, icon: [IBox, ICheck, IClip, IWrench][i] }))
    : [
        { label: 'Total de bienes', value: real.total, icon: IBox, sub: `${real.groups.length} categorías` },
        { label: 'Bienes disponibles', value: real.activos, icon: ICheck, sub: pct(real.activos, real.total) },
        { label: 'En asignación', value: null as number | null, icon: IClip, sub: 'Sin dato en la API' },
        { label: 'En mantenimiento', value: null as number | null, icon: IWrench, sub: 'Sin dato en la API' },
      ]

  return (
    <AppLayout title="Inventario">
      {PREVIEW ? (
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
          Vista previa — datos de demostración, no reales
        </p>
      ) : null}

      {/* ============ BANNER ============ */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#002e1f] via-[#005c3b] to-[#008a4c] text-white shadow-surface">
        {/* Composición CSS de respaldo: no existe foto de bodega en public/img */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute inset-y-0 right-0 w-[46%] bg-gradient-to-l from-black/35 via-black/10 to-transparent" />
          <span className="absolute top-6 right-[30%] hidden h-40 w-10 rotate-12 rounded-lg bg-white/[0.07] sm:block" />
          <span className="absolute top-2 right-[24%] hidden h-48 w-10 rotate-12 rounded-lg bg-white/[0.05] sm:block" />
          <span className="absolute top-10 right-[18%] hidden h-36 w-10 rotate-12 rounded-lg bg-white/[0.08] sm:block" />
          <span className="absolute -top-16 -left-10 size-64 rounded-full bg-[#00a651]/25 blur-3xl" />
          <span className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-black/25 blur-3xl" />
        </span>

        <div className="relative flex flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-white/80">Bienvenido al módulo de</p>
            <h1 className="mt-0.5 text-3xl font-bold tracking-tight">Inventario</h1>
            <p className="mt-2 max-w-md text-[0.8125rem] leading-5 text-white/80">
              Aquí puedes gestionar y hacer seguimiento de los bienes, insumos y equipos del SENA.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
              {indicators.map((kpi) => {
                const Icon = kpi.icon
                return (
                  <div
                    key={kpi.label}
                    className="rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-white/20 backdrop-blur-sm"
                  >
                    <dt className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-white/80">
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{kpi.label}</span>
                    </dt>
                    <dd className="mt-1 text-lg font-bold">
                      {loading ? '…' : (failed || kpi.value == null ? '—' : number.format(kpi.value))}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
          <p className="shrink-0 text-right font-serif text-lg leading-snug text-white/90 italic lg:max-w-[11rem]">
            Tú también haces parte del SENA
          </p>
        </div>
      </section>

      {error && !PREVIEW ? (
        <div className="mt-4 flex flex-col gap-3 rounded-[20px] border border-glass-line bg-glass/75 px-5 py-4 shadow-hairline backdrop-blur-glass sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-sena-text">{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="shrink-0 rounded-xl bg-sena px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-sena-bright"
          >
            Reintentar
          </button>
        </div>
      ) : null}
      {error && !PREVIEW ? <div className="sr-only"><ErrorBanner message={error} /></div> : null}

      {/* ============ RESUMEN GENERAL ============ */}
      <section className="mt-4 rounded-[24px] border border-glass-line bg-glass/75 px-5 py-5 shadow-hairline backdrop-blur-glass sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-sena-dark">
            <span className="grid size-7 place-items-center rounded-full bg-sena-soft text-sena-dark">
              <IGrid className="size-4" />
            </span>
            Resumen general del inventario
          </h2>
          <span className="hidden items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[0.6875rem] font-medium text-sena-text-soft ring-1 ring-white/70 sm:inline-flex">
            <ICal className="size-3.5" /> Últimos 30 días
            {!PREVIEW && bodegas.length > 0 ? ` · ${bodegas.length} bodegas` : ''}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {(PREVIEW
            ? DEMO.indicators.map((d, i) => ({
                label: d.label,
                value: number.format(d.value),
                sub: d.delta,
                subTone: d.delta.startsWith('↑') ? 'text-emerald-600' : 'text-red-500',
                icon: [IBox, ICheck, IGrid, IWrench][i],
              }))
            : [
                { label: 'Total de bienes', value: loading ? '…' : failed ? '—' : number.format(real.total), sub: failed ? 'Sin datos por error de conexión' : `${real.groups.length} categorías con stock`, subTone: failed ? 'text-sena-text-soft' : 'text-sena-strong', icon: IBox },
                { label: 'Bienes disponibles', value: loading ? '…' : failed ? '—' : number.format(real.activos), sub: failed ? 'Sin datos por error de conexión' : `${pct(real.activos, real.total)} del total`, subTone: failed ? 'text-sena-text-soft' : 'text-emerald-600', icon: ICheck },
                { label: 'En asignación', value: '—', sub: 'Sin dato en la API actual', subTone: 'text-sena-text-soft', icon: IClip },
                { label: 'En mantenimiento', value: '—', sub: 'Sin dato en la API actual', subTone: 'text-sena-text-soft', icon: IWrench },
              ]
          ).map((kpi) => {
            const Icon = kpi.icon
            return (
              <article key={kpi.label} className="rounded-2xl border border-white/70 bg-white/85 px-4 py-4 shadow-hairline">
                <p className="flex items-center gap-2 text-xs font-medium text-sena-text-soft">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sena-soft text-sena-dark">
                    <Icon className="size-4" />
                  </span>
                  <span className="truncate">{kpi.label}</span>
                </p>
                <p className="mt-2 text-[1.375rem] leading-none font-bold text-sena-dark">{kpi.value}</p>
                <p className={`mt-1.5 text-[0.6875rem] font-medium ${kpi.subTone}`}>{kpi.sub}</p>
              </article>
            )
          })}
        </div>
      </section>

      {/* ============ ESTADO + BARRAS + ACCESOS ============ */}
      <section className="mt-4 rounded-[24px] border border-glass-line bg-glass/75 px-5 py-5 shadow-hairline backdrop-blur-glass sm:px-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-sena-dark">
          <span className="grid size-7 place-items-center rounded-full bg-sena-soft text-sena-dark">
            <IChart className="size-4" />
          </span>
          Estado del inventario
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1.25fr_0.95fr]">
          {/* Gráfica de estado: dona / torta / barras (mismo conjunto de datos) */}
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-hairline">
            {loading && !PREVIEW ? (
              <p className="py-12 text-center text-sm text-sena-text-soft">Cargando…</p>
            ) : failed ? (
              <p className="rounded-xl bg-sena-danger-soft px-4 py-12 text-center text-sm text-sena-danger-text">
                No se pudieron cargar los datos del inventario. Usa el botón Reintentar.
              </p>
            ) : total === 0 ? (
              <p className="rounded-xl bg-sena-muted/60 px-4 py-12 text-center text-sm text-sena-text-soft">
                Sin elementos registrados.
              </p>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Contenedor independiente de la gráfica: la centra en su propio espacio */}
                <div className="grid shrink-0 place-items-center sm:mx-auto">
                  {chart === 'dona' ? (
                    <div className="relative size-[168px]">
                      <svg viewBox="0 0 132 132" className="size-full" role="img" aria-label={`Total de bienes ${total}`}>
                        <circle cx="66" cy="66" r={donut.R} fill="none" stroke="#e6f0ea" strokeWidth="17" />
                        {donut.segs.map((s) => (
                          <circle
                            key={s.label}
                            cx="66"
                            cy="66"
                            r={donut.R}
                            fill="none"
                            stroke={s.color}
                            strokeWidth="17"
                            strokeDasharray={`${s.dash} ${donut.C}`}
                            strokeDashoffset={s.offset}
                            transform="rotate(-90 66 66)"
                            strokeLinecap="butt"
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center">
                          <p className="text-xl leading-none font-bold text-sena-dark">{number.format(total)}</p>
                          <p className="mt-1.5 text-[0.625rem] leading-tight font-medium text-sena-text-soft">
                            Total de bienes
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : chart === 'torta' ? (
                    <div className="flex w-[168px] flex-col items-center gap-2.5">
                      <p className="rounded-full bg-sena-soft px-3 py-1 text-[0.6875rem] font-bold text-sena-dark">
                        Total de bienes: {number.format(total)}
                      </p>
                      <svg viewBox="0 0 132 132" className="size-[132px]" role="img" aria-label={`Distribución del total de bienes ${total}`}>
                        {donut.segs.map((s) => (
                          <circle
                            key={s.label}
                            cx="66"
                            cy="66"
                            r={donut.R / 2}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={donut.R}
                            strokeDasharray={`${s.dash / 2} ${donut.C / 2}`}
                            strokeDashoffset={s.offset / 2}
                            transform="rotate(-90 66 66)"
                            strokeLinecap="butt"
                          />
                        ))}
                      </svg>
                    </div>
                  ) : chart === 'hbar' ? (
                    <ul className="w-full min-w-[168px] max-w-[220px] space-y-2.5" aria-label="Estados por barra horizontal">
                      {states.map((s) => {
                        const max = Math.max(...states.map((x) => x.value), 0)
                        return (
                          <li key={s.label}>
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                              <span className="truncate text-sena-text">{s.label}</span>
                              <strong className="shrink-0 text-sena-dark">{number.format(s.value)}</strong>
                            </div>
                            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#e6f0ea]" role="img" aria-label={`${s.label}: ${s.value}`}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  background: s.color,
                                  width: `${max ? Math.max(3, (s.value / max) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="flex h-[168px] w-full min-w-[168px] max-w-[220px] items-end justify-around gap-2" role="img" aria-label={`Comparación de estados, total ${total}`}>
                      {states.map((s) => {
                        const max = Math.max(...states.map((x) => x.value), 0)
                        return (
                          <div key={s.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                            <span className="text-[0.6875rem] font-bold text-sena-dark">{number.format(s.value)}</span>
                            <div
                              className="w-full max-w-10 rounded-t-lg"
                              style={{
                                background: s.color,
                                height: `${max ? Math.max(4, (s.value / max) * 100) : 0}%`,
                              }}
                            />
                            <span className="w-full truncate text-center text-[0.625rem] leading-tight text-sena-text-soft" title={s.label}>
                              {s.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <ul className="min-w-0 flex-1 space-y-2 text-xs">
                  {states.map((s) => (
                    <li key={s.label} className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 truncate text-sena-text">{s.label}</span>
                      <strong className="text-sena-dark">{number.format(s.value)}</strong>
                      <span className="w-11 shrink-0 text-right text-sena-text-soft">{pct(s.value, total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <div
                role="group"
                aria-label="Tipo de gráfica"
                className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/70 bg-white/70 p-1 shadow-hairline"
              >
                {CHART_OPTS.map((opt) => {
                  const Icon = opt.icon
                  const active = chart === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      title={opt.title}
                      aria-label={opt.title}
                      aria-pressed={active}
                      onClick={() => setChart(opt.key)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.6875rem] font-semibold transition duration-150 sm:px-3 ${
                        active
                          ? 'bg-sena text-white shadow-brand-sm'
                          : 'text-sena-dark hover:bg-white'
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="hidden md:inline">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Barras */}
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-hairline">
            <h3 className="text-xs font-bold text-sena-dark">Por tipo de bien</h3>
            {loading && !PREVIEW ? (
              <p className="py-12 text-center text-sm text-sena-text-soft">Cargando…</p>
            ) : failed ? (
              <p className="mt-3 rounded-xl bg-sena-danger-soft px-4 py-12 text-center text-sm text-sena-danger-text">
                No se pudieron cargar los datos. Usa el botón Reintentar.
              </p>
            ) : bars.length === 0 ? (
              <p className="mt-3 rounded-xl bg-sena-muted/60 px-4 py-12 text-center text-sm text-sena-text-soft">
                Sin categorías con stock.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {bars.map((b) => (
                  <li key={b.label} className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
                    <span className="truncate text-xs text-sena-text">{b.label}</span>
                    <span className="text-xs font-semibold text-sena-dark">
                      {number.format(b.value)} <span className="font-normal text-sena-text-soft">{pct(b.value, unitTotal)}</span>
                    </span>
                    <div className="col-span-2 h-2 overflow-hidden rounded-full bg-[#e6f0ea]" role="img" aria-label={`${b.label}: ${b.value}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#005c3b] to-[#00c25e]"
                        style={{ width: `${maxBar ? Math.max(3, (b.value / maxBar) * 100) : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Accesos rápidos */}
          <nav aria-label="Accesos rápidos" className="rounded-2xl bg-gradient-to-b from-[#005c3b] to-[#013a26] p-4 text-white shadow-surface">
            <h3 className="flex items-center gap-1.5 text-xs font-bold">
              <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-[#2ee59d]" /> Accesos rápidos
            </h3>
            <ul className="mt-3 space-y-2">
              {quickLinks.map((q) =>
                q.enabled && q.to ? (
                  <li key={q.title}>
                    <Link
                      to={q.to}
                      className="group flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15 transition hover:bg-white/15"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/15">{q.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{q.title}</span>
                        <span className="block truncate text-[0.6875rem] text-white/65">{q.desc}</span>
                      </span>
                      <span aria-hidden="true" className="text-white/60 transition group-hover:translate-x-0.5">→</span>
                    </Link>
                  </li>
                ) : (
                  <li key={q.title} aria-disabled="true" title="No disponible con las rutas actuales">
                    <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10 opacity-70">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10">{q.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{q.title}</span>
                        <span className="block truncate text-[0.6875rem] text-white/55">{q.desc}</span>
                      </span>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </nav>
        </div>
      </section>

      {/* ============ CATEGORÍAS (5) ============ */}
      <section className="mt-4 rounded-[24px] border border-glass-line bg-glass/75 px-5 py-5 shadow-hairline backdrop-blur-glass sm:px-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-sena-dark">
          <span className="grid size-7 place-items-center rounded-full bg-sena-soft text-sena-dark">
            <IBox className="size-4" />
          </span>
          Inventario por categorías
        </h2>
        {loading && !PREVIEW ? (
          <p className="py-8 text-center text-sm text-sena-text-soft">Cargando categorías…</p>
        ) : failed ? (
          <p className="mt-4 rounded-2xl bg-sena-danger-soft px-4 py-8 text-center text-sm text-sena-danger-text">
            No se pudieron cargar las categorías. Usa el botón Reintentar.
          </p>
        ) : catCards.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white/70 px-4 py-8 text-center text-sm text-sena-text-soft">
            No hay categorías con elementos.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {catCards.slice(0, 5).map((c) => (
              <article key={c.nombre} className="flex min-h-[9.5rem] flex-col rounded-2xl border border-white/70 bg-white/85 px-4 py-4 shadow-hairline">
                <span className="grid size-9 place-items-center rounded-xl bg-sena-soft text-sena-dark">
                  <IBox className="size-5" />
                </span>
                <h3 className="mt-2.5 line-clamp-2 min-h-8 text-xs font-semibold text-sena-text">{c.nombre}</h3>
                <p className="mt-1 text-xl font-bold text-sena-dark">{number.format(c.cantidad)}</p>
                <Link
                  to="/inventario/elementos"
                  className="mt-auto inline-flex items-center gap-1 pt-2 text-[0.6875rem] font-semibold text-sena-strong hover:text-sena-dark"
                >
                  Ver detalles <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ============ MOVIMIENTOS ============ */}
      <section className="mt-4 overflow-hidden rounded-[24px] border border-glass-line bg-glass/75 shadow-hairline backdrop-blur-glass">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-sena-dark">
            <span className="grid size-7 place-items-center rounded-full bg-sena-soft text-sena-dark">
              <IMove className="size-4" />
            </span>
            Últimos movimientos
          </h2>
          {PREVIEW ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[0.6875rem] font-semibold text-amber-700 ring-1 ring-amber-200">
              Demostración
            </span>
          ) : null}
        </div>
        <div className="overflow-x-auto px-3 pt-2 pb-3 sm:px-4">
          <table className="data-table w-full min-w-[820px] table-fixed text-sm">
            <thead>
              <tr>
                {['Fecha', 'Movimiento', 'Bien / Producto', 'Ubicación', 'Responsable', 'Estado'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-[0.6875rem] font-bold tracking-[0.12em] text-sena-dark uppercase ${i === 5 ? 'text-center' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PREVIEW ? (
                DEMO.movements.map((m) => (
                  <tr key={`${m.fecha}-${m.bien}`} className="border-t border-sena-hairline/70 bg-white/55 transition-colors hover:bg-sena-veil">
                    <td className="px-5 py-3 text-xs whitespace-nowrap text-sena-text-soft">{m.fecha}</td>
                    <td className="px-5 py-3 text-[0.8125rem] text-sena-text">{m.tipo}</td>
                    <td className="px-5 py-3 text-[0.8125rem] font-medium text-sena-text">{m.bien}</td>
                    <td className="px-5 py-3 text-xs text-sena-text-soft">{m.ubicacion}</td>
                    <td className="px-5 py-3 text-[0.8125rem] text-sena-text">{m.responsable}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[0.6875rem] font-semibold ring-1 ${STATE_PILL[m.estado] ?? STATE_PILL.Pendiente}`}>
                        {m.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-sena-text-soft">
                    {loading
                      ? 'Cargando movimientos…'
                      : 'No hay movimientos para mostrar: aún no existe un servicio real de movimientos.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!PREVIEW ? (
        <p className="mt-3 text-xs text-sena-text-soft">
          Fuente: API real del centro. «En asignación» y «En mantenimiento» requieren columnas que el backend aún no expone.
        </p>
      ) : null}
    </AppLayout>
  )
}
