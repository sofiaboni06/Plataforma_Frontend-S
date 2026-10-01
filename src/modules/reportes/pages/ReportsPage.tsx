import AppLayout from '@/shared/components/layout/AppLayout'
import {
  PageHeader,
  TableCard,
  TableHeader,
  TableRow,
} from '@/shared/components/DataTable'
import { ReportIcon } from '@/shared/components/icons/AppIcons'

const REPORTS = [
  { name: 'Inventario disponible', module: 'Inventario', updated: 'Hoy' },
  { name: 'Residuos del mes', module: 'Ambiental', updated: 'Ayer' },
  { name: 'Actividades en curso', module: 'Actividades', updated: 'Hoy' },
]

export default function ReportsPage() {
  return (
    <AppLayout title="Reportes">
      <PageHeader
        icon={<ReportIcon />}
        title="Reportes"
        description="Visualiza estadísticas e informes del sistema. El listado se conecta cuando exista `GET /api/v1/reportes`."
      />

      <TableCard>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[640px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-sena-hairline bg-sena-soft/85">
                <TableHeader width="w-[44%]">Reporte</TableHeader>
                <TableHeader width="w-[32%]">Módulo</TableHeader>
                <TableHeader align="right">Actualizado</TableHeader>
              </tr>
            </thead>

            <tbody>
              {REPORTS.map((report) => (
                <TableRow key={report.name}>
                  <td className="truncate font-semibold text-sena-text">{report.name}</td>
                  <td className="truncate text-sena-strong">{report.module}</td>
                  <td className="truncate text-right text-sena-strong">{report.updated}</td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
    </AppLayout>
  )
}