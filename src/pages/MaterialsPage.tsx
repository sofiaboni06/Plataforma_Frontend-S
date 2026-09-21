import { useMemo, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import ResourceBoard, { StatusPill } from '../components/modules/ResourceBoard'
import { MATERIAL_ROWS } from '../data/demoBoards'

const TABS = ['Materiales', 'Préstamos', 'Devoluciones']

export default function MaterialsPage() {
  const [tab, setTab] = useState(TABS[0])
  const [search, setSearch] = useState('')
  const rows = useMemo(
    () =>
      MATERIAL_ROWS.filter((row) =>
        `${row.id} ${row.name} ${row.category}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )

  return (
    <AppLayout title="Material de Formación">
      <ResourceBoard
        title="Material de Formación"
        subtitle="Administra guías, kits y material de apoyo del centro."
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar material..."
        addLabel="Nuevo material"
        columns={[
          { key: 'id', label: 'ID', render: (row) => row.id },
          { key: 'name', label: 'Nombre', render: (row) => row.name },
          { key: 'category', label: 'Categoría', render: (row) => row.category },
          { key: 'stock', label: 'Stock', render: (row) => row.stock },
          {
            key: 'status',
            label: 'Estado',
            render: (row) => <StatusPill tone="ok">{row.status}</StatusPill>,
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
        footer={`Mostrando ${rows.length} registros`}
      />
    </AppLayout>
  )
}
