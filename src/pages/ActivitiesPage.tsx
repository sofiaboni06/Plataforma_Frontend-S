import { useMemo, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import ResourceBoard, { StatusPill } from '../components/modules/ResourceBoard'
import { ACTIVITY_ROWS } from '../data/demoBoards'

const TABS = ['Todos', 'En curso', 'Realizados']

export default function ActivitiesPage() {
  const [tab, setTab] = useState(TABS[0])
  const [search, setSearch] = useState('')
  const rows = useMemo(() => {
    const byTab =
      tab === 'En curso'
        ? ACTIVITY_ROWS.filter((row) => row.status === 'En curso')
        : tab === 'Realizados'
          ? ACTIVITY_ROWS.filter((row) => row.status === 'Finalizada')
          : ACTIVITY_ROWS

    return byTab.filter((row) =>
      `${row.title} ${row.owner}`.toLowerCase().includes(search.toLowerCase()),
    )
  }, [search, tab])

  return (
    <AppLayout title="Actividades">
      <ResourceBoard
        title="Actividades"
        subtitle="Consulta y gestiona las actividades del curso."
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Busca actividad"
        addLabel="Crear nueva actividad"
        columns={[
          { key: 'title', label: 'Título', render: (row) => row.title },
          { key: 'date', label: 'Fecha', render: (row) => row.date },
          { key: 'owner', label: 'Responsable', render: (row) => row.owner },
          {
            key: 'status',
            label: 'Estado',
            render: (row) => (
              <StatusPill tone={row.status === 'Finalizada' ? 'ok' : 'warn'}>{row.status}</StatusPill>
            ),
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
        footer={`Mostrando ${rows.length} actividades`}
      />
    </AppLayout>
  )
}
