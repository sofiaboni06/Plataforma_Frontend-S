import { useMemo, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import ResourceBoard, { StatusPill } from '../components/modules/ResourceBoard'
import { INVENTORY_ROWS } from '../data/demoBoards'

const TABS = ['Productos', 'Entradas', 'Salidas', 'Movimientos']

export default function InventoryPage() {
  const [tab, setTab] = useState(TABS[0])
  const [search, setSearch] = useState('')
  const rows = useMemo(
    () =>
      INVENTORY_ROWS.filter((row) =>
        `${row.id} ${row.name} ${row.category}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )

  return (
    <AppLayout title="Inventario">
      <ResourceBoard
        title="Inventario"
        subtitle="Gestiona los elementos, entradas y salidas del inventario."
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar producto..."
        addLabel="Nuevo producto"
        columns={[
          { key: 'id', label: 'ID', render: (row) => row.id },
          { key: 'name', label: 'Nombre', render: (row) => row.name },
          { key: 'category', label: 'Categoría', render: (row) => row.category },
          { key: 'stock', label: 'Stock', render: (row) => row.stock },
          {
            key: 'status',
            label: 'Estado',
            render: (row) => <StatusPill tone={row.status === 'Disponible' ? 'ok' : 'danger'}>{row.status}</StatusPill>,
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
        footer={`Mostrando 1 - ${rows.length} de ${INVENTORY_ROWS.length} registros`}
      />
    </AppLayout>
  )
}
