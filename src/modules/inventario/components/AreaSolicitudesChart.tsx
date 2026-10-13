import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, createHorizontalChart } from 'recharts'
import type { PuntoDiario } from '@/modules/inventario/lib/tablero'

/* Basado en el ejemplo "Simple Area Chart" de Recharts, tipado con createHorizontalChart. */
const Typed = createHorizontalChart<PuntoDiario, string, number>()({
  AreaChart,
  Area,
  XAxis,
  YAxis,
})

const SERIES = {
  solicitudes: { nombre: 'Solicitudes creadas', color: 'var(--color-sena)' },
  entregas: { nombre: 'Unidades entregadas', color: 'var(--color-sena-orange)' },
} as const

export default function AreaSolicitudesChart({ data }: { data: PuntoDiario[] }) {
  const id = useId().replace(/:/g, '')
  const gradSolicitudes = `grad-solicitudes-${id}`
  const gradEntregas = `grad-entregas-${id}`

  return (
    <Typed.AreaChart
      style={{ width: '100%', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id={gradSolicitudes} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={SERIES.solicitudes.color} stopOpacity={0.8} />
          <stop offset="95%" stopColor={SERIES.solicitudes.color} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={gradEntregas} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={SERIES.entregas.color} stopOpacity={0.8} />
          <stop offset="95%" stopColor={SERIES.entregas.color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-sena-line)" />
      <Typed.XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={8} minTickGap={24} />
      <Typed.YAxis width="auto" allowDecimals={false} tick={{ fontSize: 11 }} />
      <Tooltip />
      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
      <Typed.Area
        type="monotone"
        dataKey="solicitudes"
        name={SERIES.solicitudes.nombre}
        stroke={SERIES.solicitudes.color}
        fillOpacity={1}
        fill={`url(#${gradSolicitudes})`}
        activeDot={{ r: 5 }}
        animationBegin={200}
        animationDuration={1300}
      />
      <Typed.Area
        type="monotone"
        dataKey="entregas"
        name={SERIES.entregas.nombre}
        stroke={SERIES.entregas.color}
        fillOpacity={1}
        fill={`url(#${gradEntregas})`}
        activeDot={{ r: 5 }}
        animationBegin={200}
        animationDuration={1300}
      />
    </Typed.AreaChart>
  )
}
