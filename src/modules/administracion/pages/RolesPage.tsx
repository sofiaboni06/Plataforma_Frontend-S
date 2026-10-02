import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import TextField from '@/shared/components/ui/TextField'
import { EyeIcon, PlusIcon } from '@/shared/components/icons/AppIcons'
import Modal from '@/shared/components/ui/Modal'
import {
  ActionButton,
  DetailFields,
  ErrorBanner,
  FilterCard,
  PageHeader,
  SearchInput,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  RowActions,
  TablePagination,
  TableRow,
  tableClass,
} from '@/shared/components/DataTable'
import { ApiError, api } from '@/shared/lib/api'
import type { Role } from '@/shared/types/profile'

const PAGE_SIZE = 8

export default function RolesPage() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState<Role[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState<Role | null>(null)

  const loadRoles = async () => {
    const list = await api<Role[]>('/roles')
    setRoles(list)
    return list
  }

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Perfiles | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        await loadRoles()
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar los perfiles.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return roles
    return roles.filter((role) =>
      `${role.id} ${role.name} ${role.description}`.toLowerCase().includes(query),
    )
  }, [roles, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await api<Role>('/roles', {
        method: 'POST',
        body: JSON.stringify({ name, description: description || undefined }),
      })
      setName('')
      setDescription('')
      setShowCreate(false)
      setSearch('')
      await loadRoles()
      navigate(`/perfiles/${created.id}/modulos`)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo crear el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageRows.length

  return (
    <AppLayout title="Perfiles">
      <PageHeader
        title="Perfiles"
        description="Tipos de usuario de la plataforma. Busque en la tabla, cree uno nuevo y asígnele módulos."
        action={
          <Button
            type="button"
            icon={<PlusIcon className="size-4" />}
            onClick={() => setShowCreate((open) => !open)}
          >
            Nuevo perfil
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      {showCreate ? (
        <form
          className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sena-dark/8 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={handleCreateRole}
        >
          <TextField
            id="roleName"
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Aprendiz"
            required
          />
          <TextField
            id="roleDescription"
            label="Descripción"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Opcional"
          />
          <div className="flex items-end">
            <Button type="submit" disabled={saving || !name.trim()}>
              Crear
            </Button>
          </div>
        </form>
      ) : null}

      <FilterCard>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar perfil..." />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando perfiles…" />
        ) : (
          <>
            <div className="overflow-hidden">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width="w-[52%]">Perfil</TableHeader>
                    <TableHeader align="center" width="w-[18%]">
                      Estado
                    </TableHeader>
                    <TableHeader align="center" width="w-[30%]">
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={3}>No hay perfiles que coincidan con la búsqueda.</TableEmpty>
                  ) : (
                    pageRows.map((role) => (
                      <TableRow key={role.id}>
                        <td className="px-5 py-4">
                          <p className="truncate font-semibold text-sena-text">{role.name}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={role.active ? 'ok' : 'danger'}>
                            {role.active ? 'Activo' : 'Inactivo'}
                          </StatusPill>
                        </td>
                        <td className="px-3 py-4">
                          <RowActions>
                            <ActionButton title="Ver perfil" onClick={() => setViewing(role)}>
                              <EyeIcon className="size-[18px]" />
                            </ActionButton>
                            <button
                              type="button"
                              className="text-sm font-semibold text-sena hover:underline"
                              onClick={() => navigate(`/perfiles/${role.id}/modulos`)}
                            >
                              Módulos
                            </button>
                          </RowActions>
                        </td>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              from={from}
              to={to}
              total={filtered.length}
              noun="perfiles"
            />
          </>
        )}
      </TableCard>

      {viewing ? (
        <Modal title={viewing.name} description="Descripción e identificador del perfil." onClose={() => setViewing(null)}>
          <DetailFields
            items={[
              { label: 'ID', value: String(viewing.id) },
              { label: 'Descripción', value: viewing.description || '—' },
              { label: 'Estado', value: viewing.active ? 'Activo' : 'Inactivo' },
            ]}
          />
          <div className="mt-6 flex justify-end gap-2 border-t border-sena-dark/8 pt-5">
            <Button type="button" variant="secondary" onClick={() => setViewing(null)}>
              Cerrar
            </Button>
            <Button type="button" onClick={() => navigate(`/perfiles/${viewing.id}/modulos`)}>
              Asignar módulos
            </Button>
          </div>
        </Modal>
      ) : null}
    </AppLayout>
  )
}
