import { useState, type ReactNode } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/components/ui/chart'
import type { Punto } from '@/modules/inventario/lib/tablero'

export type TipoGrafica = 'dona' | 'barras' | 'lineas' | 'area'

const TIPOS: Array<{ value: TipoGrafica; label: string }> = [
  { value: 'dona', label: 'Dona' },
  { value: 'barras', label: 'Barras' },
  { value: 'lineas', label: 'Líneas' },
]

type ChartCardProps = {
  titulo: string
  descripcion?: string
  datos: Punto[]
  tipoInicial?: TipoGrafica
  unidad?: string
  acciones?: ReactNode
  children?: ReactNode
  className?: string
  altura?: string
  /* Gráfica fija: sin selector de tipo. */
  fijo?: boolean
  /* Gráfica propia en lugar de la generada (implica `fijo`). */
  grafica?: ReactNode
}

function colorDe(punto: Punto, index: number) {
  return punto.color ?? `var(--chart-${(index % 5) + 1})`
}

/* Tarjeta del tablero: los mismos datos en dona, barras o líneas. */
export default function ChartCard({
  titulo,
  descripcion,
  datos,
  tipoInicial = 'barras',
  unidad = 'Cantidad',
  acciones,
  children,
  className = '',
  altura = 'min-h-80',
  fijo = false,
  grafica,
}: ChartCardProps) {
  const [tipo, setTipo] = useState<TipoGrafica>(tipoInicial)

  const filas = datos.map((punto, index) => ({
    key: `k${index}`,
    nombre: punto.nombre,
    valor: punto.valor,
    fill: colorDe(punto, index),
  }))

  const config: ChartConfig = { valor: { label: unidad, color: 'var(--chart-1)' } }
  filas.forEach((fila) => {
    config[fila.key] = { label: fila.nombre, color: fila.fill }
  })

  const total = datos.reduce((sum, punto) => sum + punto.valor, 0)
  const vacio = datos.length === 0 || total === 0

  return (
    <section className={`flex h-full min-w-0 flex-col rounded-2xl border border-sena-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-sena-line-soft pb-4">
        <div className="min-w-[12rem] flex-1">
          <h3 className="text-base font-semibold text-sena-text xl:text-lg">{titulo}</h3>
          {descripcion ? <p className="mt-1 text-sm leading-relaxed text-sena-text-soft">{descripcion}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {acciones}
          {fijo || grafica ? null : (<>
          <label className="sr-only" htmlFor={`tipo-${titulo}`}>
            Tipo de gráfica
          </label>
          <select
            id={`tipo-${titulo}`}
            value={tipo}
            onChange={(event) => setTipo(event.target.value as TipoGrafica)}
            className="rounded-lg border border-sena-line bg-white px-3 py-1.5 text-sm text-sena-text focus:border-sena focus:outline-none"
          >
            {TIPOS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          </>)}
        </div>
      </header>

      {grafica ? (
        <div className="flex flex-1 items-center">{grafica}</div>
      ) : vacio ? (
        <div className={`grid flex-1 ${altura} place-items-center rounded-xl border border-dashed border-sena-line bg-sena-surface px-6 text-center text-sm text-sena-text-soft`}>
          Aún no hay datos para esta gráfica.
        </div>
      ) : (
        <div className={`relative flex-1 ${altura}`}>
        <ChartContainer config={config} className="absolute inset-0 aspect-auto h-full w-full">
          {tipo === 'dona' ? (
            <PieChart margin={{ top: 8, bottom: 8 }}>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
              <Pie data={filas} dataKey="valor" nameKey="key" cy="45%" innerRadius="50%" outerRadius="75%" strokeWidth={2}>
                {filas.map((fila) => (
                  <Cell key={fila.key} fill={fila.fill} />
                ))}
              </Pie>
              <ChartLegend verticalAlign="bottom" content={<ChartLegendContent nameKey="key" className="flex-wrap gap-x-4 gap-y-1 pt-4" />} />
            </PieChart>
          ) : tipo === 'area' ? (
            <AreaChart data={filas} margin={{ left: 4, right: 16, top: 12, bottom: 8 }}>
              <defs>
                <linearGradient id="relleno-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-valor)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-valor)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="nombre" tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={44} tickMargin={6} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area dataKey="valor" type="monotone" stroke="var(--color-valor)" strokeWidth={2} fill="url(#relleno-area)" />
            </AreaChart>
          ) : tipo === 'barras' ? (
            <BarChart data={filas} margin={{ left: 4, right: 12, top: 12, bottom: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="nombre" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} tickFormatter={corto} tickMargin={10} height={40} />
              <YAxis tickLine={false} axisLine={false} width={44} tickMargin={6} allowDecimals />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="valor" radius={6}>
                {filas.map((fila) => (
                  <Cell key={fila.key} fill={fila.fill} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={filas} margin={{ left: 4, right: 16, top: 12, bottom: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="nombre" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} tickFormatter={corto} tickMargin={10} height={40} />
              <YAxis tickLine={false} axisLine={false} width={44} tickMargin={6} allowDecimals />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="valor" type="monotone" stroke="var(--color-valor)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          )}
        </ChartContainer>
        </div>
      )}

      {children}
    </section>
  )
}

function corto(value: string) {
  return value.length > 12 ? `${value.slice(0, 11)}…` : value
}
