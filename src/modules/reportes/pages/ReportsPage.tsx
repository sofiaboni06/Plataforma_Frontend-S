import AppLayout from '@/shared/components/layout/AppLayout'

const REPORTS = [
  { name: 'Inventario disponible', module: 'Inventario', updated: 'Hoy' },
  { name: 'Residuos del mes', module: 'Ambiental', updated: 'Ayer' },
  { name: 'Actividades en curso', module: 'Actividades', updated: 'Hoy' },
]

export default function ReportsPage() {
  return (
    <AppLayout title="Reportes">
      <div className="rounded-2xl bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-sena-text">Reportes</h1>
        <p className="mt-1 text-sm text-sena-text/60">
          Visualiza estadísticas e informes del sistema. El listado se conecta cuando exista `GET /api/v1/reportes`.
        </p>
        <div className="mt-6 divide-y divide-sena-dark/10 rounded-xl ring-1 ring-sena-dark/10">
          {REPORTS.map((report) => (
            <div key={report.name} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-sena-text">{report.name}</p>
                <p className="text-sm text-sena-text/50">{report.module}</p>
              </div>
              <span className="text-sm text-sena-text/45">{report.updated}</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
