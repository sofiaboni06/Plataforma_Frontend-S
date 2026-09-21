import { useMemo, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import ResourceBoard, { StatusPill } from '../components/modules/ResourceBoard'
import { WASTE_ROWS } from '../data/demoBoards'

const TABS = ['Residuos', 'Consumos', 'Reportes', 'Configuración']

export default function EnvironmentalPage() {
  const [tab, setTab] = useState(TABS[0])
  const [search, setSearch] = useState('')
  const rows = useMemo(
    () =>
      WASTE_ROWS.filter((row) =>
        `${row.date} ${row.type} ${row.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )

  return (
    <AppLayout title="Gestión Ambiental">
      <ResourceBoard
        title="Gestión Ambiental"
        subtitle="Registra y controla los procesos ambientales del centro."
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar registro..."
        addLabel="Nuevo registro"
        columns={[
          { key: 'date', label: 'Fecha', render: (row) => row.date },
          { key: 'type', label: 'Tipo', render: (row) => row.type },
          { key: 'quantity', label: 'Cantidad', render: (row) => row.quantity },
          {
            key: 'status',
            label: 'Estado',
            render: (row) => (
              <StatusPill tone={row.status === 'Reutilizable' ? 'ok' : 'danger'}>{row.status}</StatusPill>
            ),
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
        footer={`Mostrando 1 - ${rows.length} de ${WASTE_ROWS.length} registros`}
      />
    </AppLayout>
  )
}
