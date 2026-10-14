import { Link } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import {
  PageHeader,
  TableCard,
  TableHeader,
  TableRow,
} from '@/shared/components/DataTable'
import { ReportIcon } from '@/shared/components/icons/AppIcons'
import { useAuth } from '@/modules/auth/context/auth'
import { canGenerateReports } from '@/modules/inventario/navigation'
import FieldSelector from '../components/FieldSelector'
import { generarReporteElementos, type CampoReporte, type ReporteFormato } from '../lib/export'

type ReporteItem = {
  name: string
  module: string
  updated: string
  to?: string
  hasExport?: boolean
}

export default function ReportsPage() {
  const { isAdmin, user } = useAuth()
  const canReport = canGenerateReports(isAdmin, user?.permissions)

  const handleExport = async (formato: ReporteFormato, campos: CampoReporte[]) => {
    const bodegaIds = user?.bodegaIds
    return generarReporteElementos({ bodegaIds, formato, campos: campos.length > 0 ? campos : undefined })
  }

  const reportes: ReporteItem[] = [
    { 
      name: 'Materiales de mi bodega', 
      module: 'Inventario', 
      updated: 'Hoy',
      hasExport: canReport && (user?.bodegaIds?.length ?? 0) > 0,
    },
    { name: 'Inventario completo', module: 'Inventario', updated: 'Hoy', to: '/inventario/elementos' },
    { name: 'Residuos del mes', module: 'Ambiental', updated: 'Ayer' },
    { name: 'Actividades en curso', module: 'Actividades', updated: 'Hoy' },
  ]

  return (
    <AppLayout title="Reportes">
      <PageHeader
        icon={<ReportIcon />}
        title="Reportes"
        description="Genera y descarga reportes de materiales filtrados por tus bodegas asignadas."
      />

      <TableCard>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[640px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-sena-hairline bg-sena-soft/85">
                <TableHeader width="w-[40%]">Reporte</TableHeader>
                <TableHeader width="w-[28%]">Módulo</TableHeader>
                <TableHeader width="w-[16%]">Actualizado</TableHeader>
                <TableHeader align="center" width="w-[16%]">Acciones</TableHeader>
              </tr>
            </thead>

            <tbody>
              {reportes.map((report) => (
                <TableRow key={report.name}>
                  <td className="truncate font-semibold text-sena-text">{report.name}</td>
                  <td className="truncate text-sena-strong">{report.module}</td>
                  <td className="truncate text-sena-strong">{report.updated}</td>
                  <td className="text-center">
                    {report.hasExport ? (
                      <FieldSelector
                        onExport={handleExport}
                        nombreReporte="materiales_bodega"
                      />
                    ) : report.to ? (
                      <Link
                        to={report.to}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sena/25 bg-white px-3 py-2 text-xs font-semibold text-sena-dark hover:bg-sena/5"
                      >
                        Ver
                      </Link>
                    ) : (
                      <span className="text-xs text-sena-text/50">No disponible</span>
                    )}
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
    </AppLayout>
  )
}